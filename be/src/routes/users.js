import { Router } from 'express';
import bcrypt from 'bcryptjs';
import bcrypt from 'bcryptjs'; // Assure-toi d'avoir installé bcryptjs ou bcrypt
import db from '../config/db.js';
import { encrypt } from '../utils/crypto.js'; // Vérifie le chemin de ton fichier crypto
import checkRole from '../middleware/checkRole.js'; // Décommente si tu as ce middleware
import { logAudit } from '../utils/audits.js'; 

const router = Router();

// Récupérer les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: result.rows });
  } catch (error) {
// ==================================================================
// 1. GESTION DES UTILISATEURS (ADMIN)
// ==================================================================

// Récupérer tous les utilisateurs (Protégé + Audité)
router.get('/', checkRole('SUPERADMIN'),  async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] || 'ANONYMOUS';

    // 📝 Audit : On note qui a consulté la liste
    await logAudit(currentUserId, 'ACCESS_ALL_USERS', 'Consultation de la liste complète');

    const result = await db.query('SELECT id, name, email, role_global, created_at, privacy_consent FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Consulter les Journaux d'Audit (Réservé Admin)
router.get('/audit-logs',checkRole('SUPERADMIN'), async (req, res) => {
    try {
        const { userId } = req.query; 
        
        let query = `
            SELECT audit_logs.*, users.name as user_name 
            FROM audit_logs 
            LEFT JOIN users ON audit_logs.user_id = users.id
        `;
        const params = [];

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

// ==================================================================
// 2. INSCRIPTION (FUSION : HASH + CRYPTO)
// ==================================================================

router.post('/', async (req, res) => {
  // On récupère TOUS les champs (Backoffice + RGPD)
  const { name, email, password, phone, birth_date, onboarding_role, medical_info, consent } = req.body;

  // Validation simple
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Nom, Email et Mot de passe sont obligatoires." });
  }

  try {
    // ÉTAPE A : Hachage du mot de passe (Sécurité Ami) 🔑
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // ÉTAPE B : Chiffrement RGPD (Ta Sécurité) 🏥
    let finalMedicalInfo = null;
    let finalConsent = false;

    // On ne chiffre que si le consentement est EXPLICITE (true)
    if (consent === true && medical_info) {
        finalMedicalInfo = encrypt(medical_info);
        finalConsent = true;
    }

    // ÉTAPE C : Insertion en Base 💾
    // Attention : Vérifie que ta table 'users' a bien toutes ces colonnes !
    const query = `
      INSERT INTO users (
          name, email, password_hash, phone, birth_date, role_global, 
          medical_info, privacy_consent
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, name, email, role_global, created_at, privacy_consent;
    `;
    
    const result = await db.query(query, [
        name, email, passwordHash, phone, birth_date, onboarding_role, 
        finalMedicalInfo, finalConsent
    ]);

    // Audit optionnel
    // await logAudit(result.rows[0].id, 'USER_REGISTERED', 'Nouvelle inscription');

    res.status(201).json({
      success: true,
      message: finalConsent ? "Compte créé et données médicales sécurisées." : "Compte créé (Sans données médicales).",
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    if (error.code === '23505') {
        return res.status(409).json({ success: false, error: "Cet email est déjà utilisé." });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sauvegarde du Token FCM, test en logs (inutiles maintenant)
router.post('/device-token', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (userId) {
        await db.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [token, userId]);
        console.log(`Token lié à l'utilisateur ${userId}`);
    } else {
        const existing = await db.query('SELECT id FROM users WHERE fcm_token = $1', [token]);
        
        if (existing.rows.length === 0) {
            const fakeEmail = `device_${token.substring(0,8)}@weave.local`;
            await db.query(
                `INSERT INTO users (name, email, fcm_token) VALUES ($1, $2, $3)`,
                ['Appareil Mobile', fakeEmail, token]
            );
            console.log(`Token enregistré pour un appareil anonyme`);
        } else {
            console.log(`Token déjà connu en base (rien à faire)`);
        }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Inscription
router.post('/', async (req, res) => {
  // ... (Garder votre code d'inscription s'il y en a un, sinon supprimer ce bloc)
  res.json({msg: "Inscription non implémentée ici pour l'instant"});
// ==================================================================
// 3. GESTION DU CONSENTEMENT (RGPD)
// ==================================================================

router.patch('/:id/consent', async (req, res) => {
    try {
        const { id } = req.params;
        const { consent } = req.body;

        if (consent === false) {
            // DROIT À L'OUBLI : On efface les données médicales
            await db.query(
                `UPDATE users SET privacy_consent = FALSE, medical_info = NULL WHERE id = $1`,
                [id]
            );
            
            await logAudit(id, 'CONSENT_REVOKED', 'Retrait consentement + Suppression données');
            res.json({ success: true, message: "Consentement retiré. Données médicales effacées." });
        
        } else {
            // Ajout du consentement (Note : ça ne restaure pas les données perdues !)
            await db.query(
                `UPDATE users SET privacy_consent = TRUE WHERE id = $1`,
                [id]
            );
            
            await logAudit(id, 'CONSENT_GIVEN', 'Consentement accordé');
            res.json({ success: true, message: "Consentement enregistré." });
        }

    } catch (error) {
        console.error('Erreur mise à jour consentement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;