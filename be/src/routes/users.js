import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// GET /users - Récupère tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /users/device-token - Enregistre le token du téléphone
router.post('/device-token', async (req, res) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({ error: 'User ID and Token required' });
  }

  try {
    await db.query(
      'UPDATE users SET fcm_token = $1 WHERE id = $2',
      [token, userId]
    );
    res.json({ success: true, message: 'Token mis à jour' });
  } catch (error) {
    console.error('Erreur save token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
