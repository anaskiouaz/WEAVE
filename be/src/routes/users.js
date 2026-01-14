import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { encrypt } from '../utils/crypto.js';
import checkRole from '../middleware/checkRole.js'; // Peut ne pas exister, pas grave
import { logAudit } from '../utils/audits.js';


const router = Router();

// 1. GET ALL USERS
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] || 'ANONYMOUS';
    if (typeof logAudit === 'function') await logAudit(currentUserId, 'ACCESS_ALL_USERS', 'Consultation liste');
    
    const result = await db.query('SELECT id, name, email, role_global, onboarding_role, created_at, privacy_consent FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    console.error('❌ Erreur GET users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. AUDIT LOGS
router.get('/audit-logs', async (req, res) => {
    try {
        const { userId } = req.query; 
        let query = `SELECT audit_logs.*, users.name as user_name FROM audit_logs LEFT JOIN users ON audit_logs.user_id = users.id`;
        const params = [];
        if (userId) { query += ` WHERE audit_logs.user_id = $1`; params.push(userId); }
        query += ` ORDER BY audit_logs.created_at DESC LIMIT 50`;
        const result = await db.query(query, params);
        res.json({ success: true, logs: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. INSCRIPTION (FUSIONNÉE)
router.post('/', async (req, res) => {
  const { name, email, password, phone, birth_date, onboarding_role, medical_info, consent } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, error: "Champs manquants" });

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let finalMedicalInfo = null;
    let finalConsent = consent === true;
    if (medical_info) {
        try { finalMedicalInfo = encrypt(medical_info); } catch (e) { console.error(e); }
    }

    const query = `
      INSERT INTO users (name, email, password_hash, phone, birth_date, onboarding_role, medical_info, privacy_consent) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, name, email, role_global, onboarding_role, created_at
    `;
    const result = await db.query(query, [name, email, passwordHash, phone, birth_date, onboarding_role, finalMedicalInfo, finalConsent]);
    
    if (typeof logAudit === 'function') await logAudit(result.rows[0].id, 'USER_REGISTERED', 'Nouvelle inscription');
    res.status(201).json({ success: true, user: result.rows[0] });

  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, error: "Email déjà utilisé." });
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. CONSENTEMENT
router.patch('/:id/consent', async (req, res) => {
    try {
        const { id } = req.params;
        const { consent } = req.body;
        if (consent === false) {
            await db.query(`UPDATE users SET privacy_consent = FALSE, medical_info = NULL WHERE id = $1`, [id]);
            res.json({ success: true, message: "Données effacées." });
        } else {
            await db.query(`UPDATE users SET privacy_consent = TRUE WHERE id = $1`, [id]);
            res.json({ success: true, message: "Consentement enregistré." });
        }
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

export default router;
