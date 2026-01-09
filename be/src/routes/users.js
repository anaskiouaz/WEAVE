import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { encrypt } from '../utils/crypto.js'; // crypto 
import checkRole from '../middleware/checkRole.js'; // Le vigile 

const router = Router();

// 1. Route pour RÉCUPÉRER les utilisateurs

router.get('/', checkRole('SUPERADMIN'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Route pour l'INSCRIPTION (Crypto + Consentement)
router.post('/', async (req, res) => {
  try {
    const { name, email, role, medical_info, consent } = req.body;

    let finalMedicalInfo = null;
    let finalConsent = false;

    if (consent === true && medical_info) {
        finalMedicalInfo = encrypt(medical_info);
        finalConsent = true;
    }

    const query = `
      INSERT INTO users (name, email, role_global, medical_info, privacy_consent) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    
    const result = await db.query(query, [name, email, role, finalMedicalInfo, finalConsent]);

    res.status(201).json({
      success: true,
      message: finalConsent ? "Utilisateur créé avec données sécurisées." : "Utilisateur créé (données médicales ignorées).",
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
// GET /users - Récupérer tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role_global, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Route pour CHANGER LE CONSENTEMENT
router.patch('/:id/consent', async (req, res) => {
    try {
        const { id } = req.params;
        const { consent } = req.body;

        if (consent === false) {
            await db.query(
                `UPDATE users SET privacy_consent = FALSE, medical_info = NULL WHERE id = $1`,
                [id]
            );
            res.json({ success: true, message: "Consentement retiré. Données effacées." });
        
        } else {
            await db.query(
                `UPDATE users SET privacy_consent = TRUE WHERE id = $1`,
                [id]
            );
            res.json({ success: true, message: "Consentement enregistré." });
        }

    } catch (error) {
        console.error('Erreur mise à jour consentement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
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