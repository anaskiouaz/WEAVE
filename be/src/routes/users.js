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

export default router;
