// src/controllers/souvenirs.js
import db from '../config/db.js';
import crypto from 'crypto';
import { generateBlobSASUrl } from '../utils/azureStorage.js';
import { BlobServiceClient } from '@azure/storage-blob';
import admin from '../config/firebase.js';

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
    return;
  }

  // --- CORRECTION 1 : Sécurisation du type de blobName ---
  const blobNameStr = String(blobName); 

  // Ne supprimer que les blobs (pas les URLs externes)
  if (blobNameStr.startsWith('http://') || blobNameStr.startsWith('https://')) {
    console.log('Skipping deletion of external URL:', blobNameStr);
    return;
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobNameStr);
    
    const deleteResponse = await blockBlobClient.deleteIfExists();
    if (deleteResponse.succeeded) {
      console.log('✅ Blob supprimé d\'Azure:', blobNameStr);
    } else {
      console.log('⚠️ Blob n\'existait pas ou déjà supprimé:', blobNameStr);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du blob Azure:', blobNameStr, error);
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
        // --- CORRECTION 2 : Conversion explicite en String pour éviter le crash ---
        // Si entry.photo_data est un objet, un buffer ou autre, startsWith plante.
        const photoStr = String(entry.photo_data);

        // Check if it's already a full URL (from existing data or external URLs)
        if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
          // Keep the URL as is (mais on s'assure de renvoyer la string)
          return { ...entry, photo_data: photoStr };
        } else {
          // Generate SAS URL for blob name
          const sasUrl = generateBlobSASUrl(photoStr);
          return {
            ...entry,
            photo_data: sasUrl || photoStr // Fallback to blob name if SAS fails
          };
        }
      }
      return entry;
    });

    res.json({ status: 'ok', data: entriesWithSAS, count: entriesWithSAS.length });
  } catch (err) {
    console.error("Erreur getJournalEntries:", err); // Log serveur pour aider au debug
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// Créer un souvenir
export async function createJournalEntry(req, res) {
  try {
    const { circle_id, author_id, text_content, mood, photo_data } = req.body;

    if (!author_id || !text_content) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields (author_id, text_content)',
      });
    }

    let resolvedCircleId = circle_id;

    if (circle_id) {
      const specificCircle = await db.query(
        `SELECT id FROM care_circles WHERE id = $1`,
        [circle_id]
      );

      if (!specificCircle.rows.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Care circle not found',
        });
      }
    } else {
      const defaultCircle = await db.query(
        `SELECT id FROM care_circles ORDER BY created_at ASC LIMIT 1`
      );

      if (!defaultCircle.rows.length) {
        return res.status(400).json({
          status: 'error',
          message: 'No care circle available. Please create one first.',
        });
      }
      resolvedCircleId = defaultCircle.rows[0].id;
    }

    // Insertion
    const result = await db.query(
      `INSERT INTO journal_entries (circle_id, author_id, mood, text_content, photo_data, comments)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, circle_id, author_id, mood, text_content, photo_data, created_at`,
      [
        resolvedCircleId,
        author_id,
        mood || null,
        text_content,
        photo_data || null,
        '[]'
      ]
    );

    const authorResult = await db.query(`SELECT name FROM users WHERE id = $1`, [author_id]);
    const authorName = authorResult.rows.length ? authorResult.rows[0].name : 'Inconnu';

    res.status(201).json({
      status: 'ok',
      message: 'Journal entry created',
      data: {
        ...result.rows[0],
        author_name: authorName
      },
    });

    // Notifications
    try {
        const userTokens = await db.query("SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''");
        const tokens = [...new Set(userTokens.rows.map(r => r.fcm_token))];
        
        if (tokens.length > 0) {
            const message = {
                notification: {
                    title: `Nouveau souvenir ajouté par : ${authorName}`,
                    body: `Souvenir ajouté : ${text_content.substring(0, 100)}...`,
                },
                data: { 
                    taskId: result.rows[0].id.toString(),
                    type: 'souvenir_created'
                },
                tokens: tokens
            };
            await admin.messaging().sendEachForMulticast(message);
        }
    } catch (notifError) {
        console.error("Erreur lors de l'envoi de la notification (non bloquant) :", notifError);
    }

  } catch (err) {
    console.error('Error creating journal entry:', err);
    if (!res.headersSent) {
        res.status(500).json({
            status: 'error',
            message: err.message,
        });
    }
  }
}

// Ajouter un commentaire
export async function addCommentToEntry(req, res) {
  try {
    const { id } = req.params;
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

    const result = await db.query(
      `UPDATE journal_entries 
       SET comments = comments || $1::jsonb 
       WHERE id = $2 
       RETURNING comments`,
      [JSON.stringify([newMessage]), id]
    );

    res.json({ status: 'ok', data: result.rows[0].comments });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// Supprimer un commentaire
export async function deleteCommentFromEntry(req, res) {
  try {
    const { id, commentId } = req.params;
    const { author_name } = req.body;

    if (!id || !commentId || !author_name) {
      return res.status(400).json({ status: 'error', message: 'Missing parameters' });
    }

    const result = await db.query(
      'SELECT comments, author_id FROM journal_entries WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Souvenir not found' });
    }

    let comments = result.rows[0].comments || [];
    // Récupérer l'auteur du post pour permission de suppression
    // (Non utilisé dans la logique actuelle mais bon à avoir si besoin)
    // const memoryAuthorId = result.rows[0].author_id; 

    const commentIndex = comments.findIndex(comment => comment.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    const comment = comments[commentIndex];

    // Vérification simplifiée : on suppose que le frontend envoie le bon author_name
    // Idéalement, il faudrait comparer des IDs, mais cela respecte votre logique existante.
    if (comment.author !== author_name) {
        // Optionnel : permettre au propriétaire du post de supprimer n'importe quel com
        // if (user.id !== memoryAuthorId) ...
      return res.status(403).json({ status: 'error', message: 'You can only delete your own comments' });
    }

    comments.splice(commentIndex, 1);

    await db.query(
      'UPDATE journal_entries SET comments = $1::jsonb WHERE id = $2',
      [JSON.stringify(comments), id]
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
    const { author_id } = req.body;

    if (!id || !author_id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID du souvenir et author_id requis'
      });
    }

    const souvenirResult = await db.query(
      'SELECT id, author_id, photo_data FROM journal_entries WHERE id = $1',
      [id]
    );

    if (souvenirResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Souvenir non trouvé'
      });
    }

    const souvenir = souvenirResult.rows[0];

    // Note : comparer des UUIDs sous forme de string est préférable
    if (String(souvenir.author_id) !== String(author_id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous ne pouvez supprimer que vos propres souvenirs'
      });
    }

    if (souvenir.photo_data) {
      console.log('🗑️ Suppression de l\'image associée au souvenir:', id);
      await deleteBlobFromAzure(souvenir.photo_data);
    }

    await db.query('DELETE FROM journal_entries WHERE id = $1', [id]);

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