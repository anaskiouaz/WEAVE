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

// =============================================
// EXPORT DES DONNÉES PERSONNELLES (RGPD)
// =============================================
router.get('/me/export', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Helper function pour requêtes sécurisées
    const safeQuery = async (query, params) => {
      try {
        const result = await db.query(query, params);
        return result.rows;
      } catch (err) {
        console.warn('Export query failed:', err.message);
        return [];
      }
    };

    // 1. Données utilisateur (obligatoire)
    const userResult = await db.query(
      `SELECT id, name, email, phone, address, role_global, onboarding_role, 
              notifications_enabled, created_at, privacy_consent
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const userData = userResult.rows[0];
    
    // 2. Rôles dans les cercles
    const roles = await safeQuery(
      `SELECT ur.role, ur.created_at, cc.name as circle_name
       FROM user_roles ur
       JOIN care_circles cc ON ur.circle_id = cc.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    
    // 3. Disponibilités
    const availability = await safeQuery(
      `SELECT day_of_week, start_time, end_time, cc.name as circle_name
       FROM user_availability ua
       JOIN care_circles cc ON ua.circle_id = cc.id
       WHERE ua.user_id = $1`,
      [userId]
    );
    
    // 4. Messages envoyés
    const messages = await safeQuery(
      `SELECT m.contenu, m.date_envoi, c.nom as conversation_name
       FROM message m
       JOIN conversation c ON m.conversation_id = c.id
       WHERE m.auteur_id = $1
       ORDER BY m.date_envoi DESC`,
      [userId]
    );
    
    // 5. Souvenirs/Journal créés
    const journal = await safeQuery(
      `SELECT text_content, mood, created_at, cc.name as circle_name
       FROM journal_entries je
       JOIN care_circles cc ON je.circle_id = cc.id
       WHERE je.author_id = $1
       ORDER BY je.created_at DESC`,
      [userId]
    );
    
    // 6. Tâches où l'utilisateur s'est inscrit
    const tasks = await safeQuery(
      `SELECT t.title, t.description, t.date, t.time, ts.signed_up_at, cc.name as circle_name
       FROM task_signups ts
       JOIN tasks t ON ts.task_id = t.id
       JOIN care_circles cc ON t.circle_id = cc.id
       WHERE ts.user_id = $1
       ORDER BY ts.signed_up_at DESC`,
      [userId]
    );
    
    // 7. Évaluations reçues
    const ratingsReceived = await safeQuery(
      `SELECT rating, comment, created_at, u.name as from_user
       FROM helper_ratings hr
       JOIN users u ON hr.rater_user_id = u.id
       WHERE hr.rated_user_id = $1`,
      [userId]
    );
    
    // 8. Évaluations données
    const ratingsGiven = await safeQuery(
      `SELECT rating, comment, created_at, u.name as to_user
       FROM helper_ratings hr
       JOIN users u ON hr.rated_user_id = u.id
       WHERE hr.rater_user_id = $1`,
      [userId]
    );
    
    // Construire l'export complet
    const exportData = {
      export_date: new Date().toISOString(),
      export_version: '1.0',
      user: {
        ...userData,
        password_hash: '[MASQUÉ POUR SÉCURITÉ]'
      },
      circles_membership: roles,
      availability: availability,
      messages_sent: messages,
      journal_entries: journal,
      task_signups: tasks,
      ratings: {
        received: ratingsReceived,
        given: ratingsGiven
      }
    };
    
    // Log de l'export (non-bloquant)
    try {
      await logAudit(userId, 'DATA_EXPORT', `Export des données personnelles de ${userData.name}`);
    } catch (e) { console.warn('Audit log failed:', e.message); }
    
    // Envoyer comme fichier JSON téléchargeable
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="weave-export-${userId}-${Date.now()}.json"`);
    res.json(exportData);
    
  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données', details: error.message });
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

    // Vérifier si l'utilisateur est le bénéficiaire (senior) d'un cercle
    const seniorCircles = await db.query(
      'SELECT id FROM care_circles WHERE senior_id = $1',
      [id]
    );
    
    if (seniorCircles.rows.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer ce compte car il est le bénéficiaire d\'un ou plusieurs cercles. Supprimez d\'abord les cercles concernés.' 
      });
    }

    // Transférer created_by vers un admin du cercle pour les cercles créés par cet utilisateur
    const createdCircles = await db.query(
      'SELECT id FROM care_circles WHERE created_by = $1',
      [id]
    );
    
    for (const circle of createdCircles.rows) {
      // Trouver un admin du cercle pour le remplacer comme créateur
      const newCreator = await db.query(
        `SELECT user_id FROM user_roles WHERE circle_id = $1 AND role = 'ADMIN' AND user_id != $2 LIMIT 1`,
        [circle.id, id]
      );
      
      if (newCreator.rows.length > 0) {
        await db.query(
          'UPDATE care_circles SET created_by = $1 WHERE id = $2',
          [newCreator.rows[0].user_id, circle.id]
        );
      } else {
        // Si aucun admin disponible, trouver n'importe quel membre non-PC
        const anyMember = await db.query(
          `SELECT user_id FROM user_roles WHERE circle_id = $1 AND role != 'PC' AND user_id != $2 LIMIT 1`,
          [circle.id, id]
        );
        
        if (anyMember.rows.length > 0) {
          await db.query(
            'UPDATE care_circles SET created_by = $1 WHERE id = $2',
            [anyMember.rows[0].user_id, circle.id]
          );
        }
      }
    }

    // Messages authored by user (in conversations)
    await db.query('DELETE FROM message WHERE auteur_id = $1', [id]);

    // Participants in conversations
    await db.query('DELETE FROM participant_conversation WHERE utilisateur_id = $1', [id]);

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

    // Task signups
    await db.query('DELETE FROM task_signups WHERE user_id = $1', [id]);

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
