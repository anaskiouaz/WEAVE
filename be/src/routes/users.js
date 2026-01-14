import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { encrypt } from '../utils/crypto.js'; // <-- On réimporte le chiffrement

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role_global, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    console.error('❌ Erreur GET users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users (Inscription avec Chiffrement)
router.post('/', async (req, res) => {
  // On récupère aussi medical_info maintenant
  const { name, email, password, phone, birth_date, onboarding_role, medical_info } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Champs obligatoires manquants" });
  }

  try {
    // 1. Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 2. Chiffrement des données médicales (si elles existent)
    let encryptedMedical = null;
    if (medical_info) {
        try {
            encryptedMedical = encrypt(medical_info);
        } catch (e) {
            console.error("Erreur chiffrement:", e);
            // On continue sans planter, mais on loggue l'erreur
        }
    }

    // 3. Insertion en base de données
    const query = `
      INSERT INTO users (name, email, password_hash, phone, birth_date, onboarding_role, medical_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role_global, onboarding_role, created_at
    `;

    const result = await db.query(query, [
        name, 
        email, 
        passwordHash, 
        phone, 
        birth_date, 
        onboarding_role, 
        encryptedMedical // On insère la version chiffrée
    ]);

    res.status(201).json({ success: true, user: result.rows[0] });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: "Cet email est déjà utilisé." });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
