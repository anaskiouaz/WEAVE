import { Router } from 'express';
import db from '../config/db.js';
import { encrypt } from '../utils/crypto.js';
import checkRole from '../middleware/checkRole.js';
import { logAudit } from '../utils/audit.js'; // <--- NOUVEL IMPORT

const router = Router();

// 1. Route pour RÉCUPÉRER les utilisateurs
// Protection : SUPERADMIN uniquement
// Audit : On note qui a consulté la liste
router.get('/', checkRole('SUPERADMIN'), async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];

    // 📝 On enregistre l'action dans le journal
    await logAudit(currentUserId, 'ACCESS_ALL_USERS', 'Consultation de la liste complète des utilisateurs');

    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. NOUVELLE ROUTE : Consulter les Journaux d'Audit
// Protection : SUPERADMIN uniquement
router.get('/audit-logs', checkRole('SUPERADMIN'), async (req, res) => {
    try {
        const { userId } = req.query; // Permet de filtrer ?userId=...
        
        let query = `
            SELECT audit_logs.*, users.name as user_name 
            FROM audit_logs 
            LEFT JOIN users ON audit_logs.user_id = users.id
        `;
        
        const params = [];

        // Si on veut filtrer pour un utilisateur précis
        if (userId) {
            query += ` WHERE audit_logs.user_id = $1`;
            params.push(userId);
        }

        query += ` ORDER BY audit_logs.created_at DESC LIMIT 50`;

        const result = await db.query(query, params);
        res.json({ success: true, logs: result.rows });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Route pour l'INSCRIPTION (Crypto + Consentement)
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

    // Optionnel : On pourrait aussi auditer les inscriptions
    // await logAudit(result.rows[0].id, 'USER_REGISTERED', 'Nouvelle inscription');

    res.status(201).json({
      success: true,
      message: finalConsent ? "Utilisateur créé avec données sécurisées." : "Utilisateur créé (données médicales ignorées).",
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Route pour CHANGER LE CONSENTEMENT
router.patch('/:id/consent', async (req, res) => {
    try {
        const { id } = req.params;
        const { consent } = req.body;

        if (consent === false) {
            await db.query(
                `UPDATE users SET privacy_consent = FALSE, medical_info = NULL WHERE id = $1`,
                [id]
            );
            
            // 📝 On note que l'utilisateur a retiré son consentement
            await logAudit(id, 'CONSENT_REVOKED', 'Retrait du consentement et suppression des données');

            res.json({ success: true, message: "Consentement retiré. Données effacées." });
        
        } else {
            await db.query(
                `UPDATE users SET privacy_consent = TRUE WHERE id = $1`,
                [id]
            );
            
            // 📝 On note le nouveau consentement
            await logAudit(id, 'CONSENT_GIVEN', 'Consentement accordé');

            res.json({ success: true, message: "Consentement enregistré." });
        }

    } catch (error) {
        console.error('Erreur mise à jour consentement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;