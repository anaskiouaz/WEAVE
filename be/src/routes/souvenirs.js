import db from '../config/db.js';

// Récupérer tous les souvenirs d'un cercle spécifique
export async function getJournalEntries(req, res) {
  try {
    const { circle_id } = req.query;

    if (!circle_id) {
      return res.status(400).json({ status: 'error', message: 'circle_id is required' });
    }

    const result = await db.query(
      `SELECT 
         j.id,
         j.circle_id,
         j.mood,
         j.text_content,
         j.photo_url,
         j.created_at,
         u.name as author_name
       FROM journal_entries j
       LEFT JOIN users u ON j.author_id = u.id
       WHERE j.circle_id = $1
       ORDER BY j.created_at DESC`,
      [circle_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching journal entries:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// Créer un nouveau souvenir
export async function createJournalEntry(req, res) {
  try {
    const { circle_id, author_id, mood, text_content, photo_url } = req.body;
    
    if (!circle_id || !author_id || !text_content) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO journal_entries (circle_id, author_id, mood, text_content, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [circle_id, author_id, mood, text_content, photo_url]
    );
    
    res.status(201).json({
      status: 'ok',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating journal entry:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}