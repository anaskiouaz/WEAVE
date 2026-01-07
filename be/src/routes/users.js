import { Router } from 'express';
import db from '../config/db.js';
import { encrypt } from '../utils/crypto.js'; // <-- Import de notre outil

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error('❌ Erreur GET users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users (Inscription)
router.post('/', async (req, res) => {
  try {
    const { name, email, role, medical_info } = req.body;

    // 🔒 ÉTAPE CLÉ : On chiffre les infos médicales avant d'enregistrer
    const encryptedMedicalInfo = encrypt(medical_info);

    const query = `
      INSERT INTO users (name, email, role, medical_info) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    
    const result = await db.query(query, [name, email, role, encryptedMedicalInfo]);

    res.status(201).json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur POST users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;