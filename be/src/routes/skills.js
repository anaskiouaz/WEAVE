import { Router } from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Return all distinct skills across users (flat list of strings)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT UNNEST(skills) AS skill FROM users WHERE skills IS NOT NULL`
    );
    const skills = result.rows
      .map(r => (r.skill || '').trim())
      .filter(s => s.length > 0)
      .sort((a, b) => a.localeCompare(b));
    res.json(skills);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Unable to fetch skills' });
  }
});

export default router;
