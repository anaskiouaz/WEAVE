// src/controllers/souvenirs.js
import db from '../config/db.js';

// Récupérer les souvenirs
export async function getJournalEntries(req, res) {
  try {
    const { circle_id } = req.query;
    if (!circle_id) return res.status(400).json({ status: 'error', message: 'circle_id is required' });

    const result = await db.query(
      `SELECT 
         j.id, j.circle_id, j.text_content, j.photo_url, j.mood, j.created_at, j.comments,
         u.name as author_name
       FROM journal_entries j
       LEFT JOIN users u ON j.author_id = u.id
       WHERE j.circle_id = $1
       ORDER BY j.created_at DESC`,
      [circle_id]
    );

    res.json({ status: 'ok', data: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// Créer un souvenir
export async function createJournalEntry(req, res) {
  try {
    // 1. On récupère les champs nécessaires
    const { circle_id, author_id, text_content, mood, photo_url } = req.body;

    // Validation basique
    if (!author_id || !text_content) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields (author_id, text_content)',
      });
    }

    let resolvedCircleId = circle_id;

    // 2. Logique de résolution du Cercle (copiée de ton exemple tasks)
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
      // Si pas de cercle fourni, on prend le premier créé (comportement par défaut)
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

    // 3. Insertion en base de données
    const result = await db.query(
      `INSERT INTO journal_entries (circle_id, author_id, mood, text_content, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, circle_id, author_id, mood, text_content, photo_url, created_at`,
      [
        resolvedCircleId,
        author_id,
        mood || null, // Null si pas d'humeur
        text_content,
        photo_url || null // Null si pas de photo
      ]
    );

    // Petit bonus : On récupère le nom de l'auteur pour le renvoyer au frontend immédiatement
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

  } catch (err) {
    console.error('Error creating journal entry:', err);
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
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
       RETURNING comments`,
      [JSON.stringify([newMessage]), id]
    );

    res.json({ status: 'ok', data: result.rows[0].comments });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}