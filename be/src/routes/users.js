import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { encrypt } from '../utils/crypto.js';
import { logAudit } from '../utils/audits.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Récupère les informations du profil utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => { // <--- AJOUT du middleware
    try {
        // req.user est maintenant garanti par authenticateToken
        const result = await db.query(
            'SELECT id, name, email, role_global, fcm_token, notifications_enabled, picture, bio FROM users WHERE id = $1', 
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur GET /me:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Met à jour les préférences utilisateur (notifications)
router.put('/me', authenticateToken, async (req, res) => { // <--- AJOUT du middleware
    try {
        const userId = req.user.id;
        const { notifications_enabled } = req.body;

        if (notifications_enabled !== undefined) {
            await db.query('UPDATE users SET notifications_enabled = $1 WHERE id = $2', [notifications_enabled, userId]);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error("Erreur PUT /me:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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

// Enregistre les actions utilisateur dans les journaux d'audit
router.post('/audit-logs', async (req, res) => {
    try {
        const { userId, action, details, circleId } = req.body;
        try {
            if (typeof logAudit === 'function') await logAudit(userId || null, action || 'UNKNOWN', details || '', circleId || null);
        } catch (err) {
            console.error('Erreur enregistrement audit depuis endpoint:', err);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. CONSENTEMENT (PATCH)
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

// Supprime un utilisateur et toutes ses données associées (sécurisé)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Only allow owner or ADMIN to delete
    if (!req.user || (String(req.user.id) !== String(id) && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Log the deletion attempt (by the requester)
    try { await logAudit(req.user.id || null, 'USER_DELETE_REQUEST', `Suppression du compte ${id}`); } catch (e) { console.warn('Audit log failed', e); }

    // Transactional deletion of related records
    await db.query('BEGIN');

    // Ratings (as rater or rated)
    await db.query('DELETE FROM helper_ratings WHERE rated_user_id = $1 OR rater_user_id = $1', [id]);

    // User roles (memberships)
    await db.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

    // Availability
    await db.query('DELETE FROM user_availability WHERE user_id = $1', [id]);

    // Audit logs authored by user
    await db.query('DELETE FROM audit_logs WHERE user_id = $1', [id]);

    // Journal entries / souvenirs authored by user
    await db.query('DELETE FROM journal_entries WHERE author_id = $1', [id]);

    // Any other tables that reference users should be cleaned here as needed.

    // Finally delete the user row
    const delRes = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (delRes.rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await db.query('COMMIT');

    try { await logAudit(req.user.id || null, 'USER_DELETED', `Compte ${id} supprimé`); } catch (e) { console.warn('Audit log failed', e); }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    try { await db.query('ROLLBACK'); } catch (e) { console.error('Rollback failed', e); }
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- ENREGISTREMENT DU TOKEN ---
router.post('/device-token', async (req, res) => {
    const { userId, token } = req.body;
    
    console.log(`📲 Réception token (User: ${userId || 'Anonyme'}) : ${token.substring(0, 10)}...`);

    try {
        if (userId) {
            // Cas 1 : Utilisateur connecté
            await db.query(
                'UPDATE users SET fcm_token = $1 WHERE id = $2',
                [token, userId]
            );
            console.log("Token mis à jour pour l'utilisateur ID:", userId);
        } else {
            // Cas 2 : Utilisateur Anonyme
            const fakeEmail = `device_${token.substring(0, 8)}@weave.local`;
            const fakeName = `Mobile ${token.substring(0, 4)}`;
            
            // CORRECTIONS APPORTÉES ICI :
            // 1. Suppression de "updated_at = NOW()" (car la colonne n'existe pas)
            // 2. Remplacement de "role" par "role_global" (nom réel de la colonne)
            // 3. Remplacement de 'helper' par 'HELPER' (l'ENUM Postgres est sensible à la casse)
            
            await db.query(`
                INSERT INTO users (name, email, password_hash, role_global, fcm_token)
                VALUES ($1, $2, 'no_pass', 'HELPER', $3)
                ON CONFLICT (email) 
                DO UPDATE SET fcm_token = $3
                RETURNING id;
            `, [fakeName, fakeEmail, token]);
            
            console.log("Token enregistré pour un appareil anonyme (Upsert OK)");
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Erreur enregistrement token:", err);
        res.status(200).json({ success: false, error: err.message });
    }
});

// 5. RATINGS: Get a member rating summary (per circle) and current rater rating
router.get('/:id/rating', async (req, res) => {
  try {
    const ratedUserId = req.params.id;
    const { circleId, raterId } = req.query;
    if (!ratedUserId || !circleId) return res.status(400).json({ success: false, error: 'Missing rated user or circleId' });

    const avgRes = await db.query(
      `SELECT ROUND(AVG(rating)::numeric,2) AS average_rating, COUNT(*) AS total_ratings
       FROM helper_ratings WHERE rated_user_id = $1 AND circle_id = $2`,
      [ratedUserId, circleId]
    );
    const avg = avgRes.rows[0] || { average_rating: null, total_ratings: 0 };

    let my = null;
    if (raterId) {
      const myRes = await db.query(
        `SELECT rating, comment FROM helper_ratings WHERE rated_user_id = $1 AND rater_user_id = $2 AND circle_id = $3 LIMIT 1`,
        [ratedUserId, raterId, circleId]
      );
      my = myRes.rows[0] || null;
    }

    // Also return skills of the rated user
    const skillsRes = await db.query(`SELECT skills FROM users WHERE id = $1`, [ratedUserId]);

    res.json({ success: true, average: Number(avg.average_rating) || 0, total: Number(avg.total_ratings) || 0, my, skills: skillsRes.rows[0]?.skills || [] });
  } catch (error) {
    console.error('GET rating error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. RATINGS: Upsert (create/update) a rating
router.post('/:id/rating', async (req, res) => {
  try {
    const ratedUserId = req.params.id;
    const { raterId, circleId, rating } = req.body;
    if (!ratedUserId || !raterId || !circleId || !rating) return res.status(400).json({ success: false, error: 'Missing fields' });

    // Prevent self-rating
    if (ratedUserId === raterId) return res.status(400).json({ success: false, error: 'Cannot rate yourself' });

    // Ensure rater belongs to the circle
    const raterMembership = await db.query(
      `SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2 LIMIT 1`,
      [raterId, circleId]
    );
    if (raterMembership.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Rater must belong to the circle' });
    }
    // Only admins and helpers can rate
    const raterRole = raterMembership.rows[0]?.role;
    if (raterRole !== 'ADMIN' && raterRole !== 'HELPER') {
      return res.status(403).json({ success: false, error: 'Only admins and helpers can rate' });
    }

    // Ensure rated user also belongs to the same circle
    const ratedMembership = await db.query(
      `SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2 LIMIT 1`,
      [ratedUserId, circleId]
    );
    if (ratedMembership.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Rated user must belong to the circle' });
    }

    // Prevent rating beneficiary (PC role)
    const ratedRole = ratedMembership.rows[0]?.role;
    if (ratedRole === 'PC') {
      return res.status(400).json({ success: false, error: 'Cannot rate beneficiary' });
    }
    // Rated must be admin or helper
    if (ratedRole !== 'ADMIN' && ratedRole !== 'HELPER') {
      return res.status(400).json({ success: false, error: 'You can only rate admins or helpers' });
    }

    const upsert = await db.query(
      `INSERT INTO helper_ratings (rated_user_id, rater_user_id, circle_id, rating, comment)
       VALUES ($1,$2,$3,$4,NULL)
       ON CONFLICT (rated_user_id, rater_user_id, circle_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = NULL, updated_at = NOW()
       RETURNING id, rating`,
      [ratedUserId, raterId, circleId, Math.max(1, Math.min(5, parseInt(rating,10)))]
    );

    res.json({ success: true, data: upsert.rows[0] });
  } catch (error) {
    console.error('POST rating error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
