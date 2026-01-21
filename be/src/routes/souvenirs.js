// src/controllers/souvenirs.js
import db from '../config/db.js';
import crypto from 'crypto';
import { generateBlobSASUrl } from '../utils/azureStorage.js';
import { BlobServiceClient } from '@azure/storage-blob';
import admin from '../config/firebase.js';
import { notifyCircle } from '../utils/notifications.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';
import { Router } from 'express';

// Configuration Azure pour la suppression
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'images';
let blobServiceClient;

if (connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
}

// Fonction utilitaire pour supprimer un blob d'Azure
async function deleteBlobFromAzure(blobName) {
  if (!blobServiceClient || !blobName) {
    return; // Ne pas échouer si Azure n'est pas configuré ou pas de blob
  }

  // Ne supprimer que les blobs (pas les URLs externes)
  if (blobName.startsWith('http://') || blobName.startsWith('https://')) {
    console.log('Skipping deletion of external URL:', blobName);
    return;
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const deleteResponse = await blockBlobClient.deleteIfExists();
    if (deleteResponse.succeeded) {
      console.log('✅ Blob supprimé d\'Azure:', blobName);
    } else {
      console.log('⚠️ Blob n\'existait pas ou déjà supprimé:', blobName);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du blob Azure:', blobName, error);
    // Ne pas échouer la suppression du souvenir si la suppression du blob échoue
  }
}

// Récupérer les souvenirs
export async function getJournalEntries(req, res) {
  try {
    const { circle_id } = req.query;
    if (!circle_id) return res.status(400).json({ status: 'error', message: 'circle_id is required' });

    const result = await db.query(
      `SELECT 
         j.*, 
         u.name as author_name
       FROM journal_entries j
       LEFT JOIN users u ON j.author_id = u.id
       WHERE j.circle_id = $1
       ORDER BY j.created_at DESC`,
      [circle_id]
    );

    // Generate SAS URLs for photos
    const entriesWithSAS = result.rows.map(entry => {
      if (entry.photo_data) {
        // Check if it's already a full URL (from existing data or external URLs)
        if (entry.photo_data.startsWith('http://') || entry.photo_data.startsWith('https://')) {
          // Keep the URL as is
          return entry;
        } else {
          // Generate SAS URL for blob name
          const sasUrl = generateBlobSASUrl(entry.photo_data);
          return {
            ...entry,
            photo_data: sasUrl || entry.photo_data // Fallback to blob name if SAS fails
          };
        }
      }
      return entry;
    });

    res.json({ status: 'ok', data: entriesWithSAS, count: entriesWithSAS.length });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// Créer un souvenir
export async function createJournalEntry(req, res) {
  try {
    const { circle_id, author_id, text_content, mood, photo_data } = req.body;

    if (!author_id || !text_content) {
      return res.status(400).json({ status: 'error', message: 'Author and content required' });
    }

    let resolvedCircleId = circle_id;

    // Résolution Cercle par défaut si manquant
    if (!resolvedCircleId) {
       const defaultCircle = await db.query(`SELECT id FROM care_circles ORDER BY created_at ASC LIMIT 1`);
       resolvedCircleId = defaultCircle.rows[0]?.id;
    }
    
    if (!resolvedCircleId) return res.status(400).json({ status: 'error', message: 'No circle found' });

    // Insertion
    const result = await db.query(
      `INSERT INTO journal_entries (circle_id, author_id, mood, text_content, photo_data, comments)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, // On retourne tout pour récupérer l'ID et la date
      [resolvedCircleId, author_id, mood || null, text_content, photo_data || null, '[]']
    );

    // DÉFINITION DE LA VARIABLE MANQUANTE
    const newSouvenir = result.rows[0];

    // Info Auteur
    const authorResult = await db.query(`SELECT name FROM users WHERE id = $1`, [author_id]);
    const authorName = authorResult.rows[0]?.name || 'Inconnu';

    // Log Audit
    await logAudit(author_id, AUDIT_ACTIONS.SOUVENIR_CREATED, `${authorName} a ajouté un souvenir`, resolvedCircleId);

    // Réponse Client
    res.status(201).json({
      status: 'ok',
      message: 'Journal entry created',
      data: { ...newSouvenir, author_name: authorName },
    });

    // Notifications
    const previewText = text_content.length > 50 ? text_content.substring(0, 50) + '...' : text_content;
    
    await notifyCircle(
        resolvedCircleId,
        `📸 Souvenir de ${authorName}`, 
        `${previewText} (Humeur : ${mood}/10)`,
        { 
            type: 'souvenir_created', 
            souvenirId: newSouvenir.id.toString(),
            circleId: resolvedCircleId.toString()
        },
        author_id // Exclure l'auteur
    );

  } catch (err) {
    console.error('Error creating journal entry:', err);
    if (!res.headersSent) res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function addCommentToEntry(req, res) {
  try {
    const { id } = req.params; // ID du souvenir
    const { author_name, content } = req.body;

    if (!content || !author_name) {
      return res.status(400).json({ status: 'error', message: 'Author and content required' });
    }

    const newMessage = {
      id: crypto.randomUUID(),
      author: author_name,
      content: content,
      created_at: new Date().toISOString()
    };

    // On utilise l'opérateur || pour ajouter l'objet au tableau JSONB existant
    const result = await db.query(
      `UPDATE journal_entries 
       SET comments = comments || $1::jsonb 
       WHERE id = $2 
       RETURNING comments, circle_id`,
      [JSON.stringify([newMessage]), id]
    );

    // 📝 Log de l'action
    const circleId = result.rows[0]?.circle_id;
    const truncatedContent = content.length > 100 ? content.substring(0, 100) + '...' : content;
    await logAudit(
      null, // On n'a pas l'ID utilisateur ici, juste le nom
      AUDIT_ACTIONS.COMMENT_ADDED,
      `${author_name} a commenté : "${truncatedContent}"`,
      circleId
    );

    res.json({ status: 'ok', data: result.rows[0].comments });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function deleteCommentFromEntry(req, res) {
  try {
    const { id, commentId } = req.params; // ID du souvenir et ID du commentaire
    const { author_name } = req.body; // Nom de l'auteur qui fait la demande de suppression

    if (!id || !commentId || !author_name) {
      return res.status(400).json({ status: 'error', message: 'Souvenir ID, comment ID, and author_name required' });
    }

    // Récupérer les commentaires actuels
    const result = await db.query(
      'SELECT comments FROM journal_entries WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Souvenir not found' });
    }

    let comments = result.rows[0].comments || [];

    // Trouver le commentaire à supprimer
    const commentIndex = comments.findIndex(comment => comment.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    const comment = comments[commentIndex];

    // Vérifier que l'auteur de la demande est bien l'auteur du commentaire
    if (comment.author !== author_name && memoryAuthor !== author_name) {
      return res.status(403).json({ status: 'error', message: 'You can only delete your own comments' });
    }

    // Supprimer le commentaire du tableau
    comments.splice(commentIndex, 1);

    // Mettre à jour la base de données
    await db.query(
      'UPDATE journal_entries SET comments = $1::jsonb WHERE id = $2',
      [JSON.stringify(comments), id]
    );

    // Récupérer le circle_id pour le log
    const souvenirInfo = await db.query('SELECT circle_id FROM journal_entries WHERE id = $1', [id]);
    const circleId = souvenirInfo.rows[0]?.circle_id;

    // 📝 Log de l'action
    const truncatedContent = comment.content?.length > 100 ? comment.content.substring(0, 100) + '...' : comment.content;
    await logAudit(
      null,
      AUDIT_ACTIONS.COMMENT_DELETED,
      `${author_name} a supprimé : "${truncatedContent}"`,
      circleId
    );

    res.json({ status: 'ok', data: comments });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// Supprimer un souvenir
export async function deleteJournalEntry(req, res) {
  try {
    const { id } = req.params;
    const { author_id } = req.body; // Pour vérifier que c'est bien l'auteur qui supprime

    if (!id || !author_id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID du souvenir et author_id requis'
      });
    }

    // Récupérer les informations du souvenir avant suppression (pour l'image et le log)
    const souvenirResult = await db.query(
      'SELECT id, author_id, photo_data, circle_id FROM journal_entries WHERE id = $1',
      [id]
    );

    if (souvenirResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Souvenir non trouvé'
      });
    }

    const souvenir = souvenirResult.rows[0];

    if (souvenir.author_id !== author_id) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous ne pouvez supprimer que vos propres souvenirs'
      });
    }

    // Supprimer l'image d'Azure si elle existe
    if (souvenir.photo_data) {
      console.log('🗑️ Suppression de l\'image associée au souvenir:', id);
      await deleteBlobFromAzure(souvenir.photo_data);
    }

    // Supprimer le souvenir de la base de données
    await db.query('DELETE FROM journal_entries WHERE id = $1', [id]);

    // Récupérer le nom de l'auteur pour le log
    const authorResult = await db.query('SELECT name FROM users WHERE id = $1', [author_id]);
    const authorName = authorResult.rows[0]?.name || 'Utilisateur';

    // 📝 Log de l'action
    await logAudit(
      author_id,
      AUDIT_ACTIONS.SOUVENIR_DELETED,
      `${authorName} a supprimé un souvenir`,
      souvenir.circle_id
    );

    console.log('✅ Souvenir supprimé avec succès:', id);
    res.json({
      status: 'ok',
      message: 'Souvenir supprimé avec succès'
    });

  } catch (err) {
    console.error('Error deleting journal entry:', err);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
}

// --- Router Express pour exposer les endpoints ---
const router = Router();

router.get('/', getJournalEntries);
router.post('/', createJournalEntry);
router.post('/:id/comments', addCommentToEntry);
router.delete('/:id/comments/:commentId', deleteCommentFromEntry);
router.delete('/:id', deleteJournalEntry);

export default router;