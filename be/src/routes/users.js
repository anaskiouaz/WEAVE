import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const router = Router();

// GET /users - Récupérer tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role_global, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /users - Inscription (C'est ce qui vous manque pour l'erreur 404)
router.post('/', async (req, res) => {
  const { name, email, password, phone, birth_date, onboarding_role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Champs obligatoires manquants" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (name, email, password_hash, phone, birth_date, onboarding_role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role_global, onboarding_role, created_at
    `;
    
    const result = await db.query(query, [name, email, passwordHash, phone, birth_date, onboarding_role]);

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Erreur inscription:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: "Cet email est déjà utilisé." });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;