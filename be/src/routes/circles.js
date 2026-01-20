import express from 'express';
import { pool } from '../config/db.js'; // On privilégie pool comme dans la branche dev
import { authenticateToken } from './../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const router = express.Router();

const generateInviteCode = () => {
  return 'W-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

// ============================================================
// 1. RÉCUPÉRER LES MEMBRES (Fonctionnalité Admin - TA PARTIE)
// ============================================================
router.get('/:circleId/members', authenticateToken, async (req, res) => {
  const { circleId } = req.params;

  try {
    // Note: On utilise pool.query ici pour la cohérence
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, ur.role, u.created_at
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.circle_id = $1
      ORDER BY ur.role ASC, u.name ASC
    `, [circleId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération membres:', error);
    res.status(500).json({ error: "Impossible de récupérer les membres." });
  }
});

// ============================================================
// 2. LISTER MES CERCLES (Fonctionnalité Dev - NOUVEAU)
// ============================================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                c.id, 
                u.name, 
                ur.role
            FROM care_circles c
            JOIN user_roles ur ON c.id = ur.circle_id
            JOIN users u ON c.senior_id = u.id
            WHERE ur.user_id = $1
            ORDER BY c.created_at DESC
        `;

        const { rows } = await pool.query(query, [userId]);
        res.json(rows); 
    } catch (err) {
        console.error("Erreur liste cercles:", err);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des cercles." });
    }
});

// ============================================================
// 3. CRÉER UN CERCLE
// ============================================================
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect(); 
  
  try {
    const { senior_info } = req.body;
    const creatorId = req.user.id; 
    
    if (!senior_info || !senior_info.name) {
      return res.status(400).json({ error: "Le nom du bénéficiaire est requis." });
    }

    await client.query('BEGIN');

    // A. CRÉER LE COMPTE SENIOR
    const fakeEmail = `senior.${Date.now()}@weave.local`;
    const emailToUse = senior_info.email || fakeEmail;
    // On utilise le mot de passe par défaut de la branche dev
    const dummyPassword = await bcrypt.hash("WeaveSeniorInit!", 10);

    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, birth_date, phone, medical_info, onboarding_role, role_global) 
       VALUES ($1, $2, $3, $4, $5, $6, 'PC', 'USER') 
       RETURNING id`,
      [
        senior_info.name,
        emailToUse,
        dummyPassword,
        senior_info.birth_date || null,
        senior_info.phone || null,
        senior_info.medical_info || null
      ]
    );
    const seniorId = userRes.rows[0].id;

    // B. CRÉER LE CERCLE
    let inviteCode = generateInviteCode();
    const circleRes = await client.query(
      `INSERT INTO care_circles (senior_id, created_by, invite_code) 
       VALUES ($1, $2, $3) RETURNING id, invite_code`, 
      [seniorId, creatorId, inviteCode]
    );
    const newCircle = circleRes.rows[0];

    // C. ASSIGNER LES RÔLES
    // Admin (Créateur)
    await client.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'ADMIN')`,
      [creatorId, newCircle.id]
    );

    // Senior (PC)
    await client.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'PC')`,
      [seniorId, newCircle.id]
    );

    await client.query('COMMIT');

    // IMPORTANT : On renvoie les clés standardisées pour le Frontend (Version Dev)
    res.status(201).json({ 
        success: true, 
        circle_id: newCircle.id,
        circle_name: senior_info.name, 
        invite_code: newCircle.invite_code
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erreur création cercle:", err);
    if (err.code === '23505') {
        return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà." });
    }
    res.status(500).json({ error: "Erreur lors de la création du cercle." });
  } finally {
    client.release();
  }
});

// ============================================================
// 4. REJOINDRE UN CERCLE
// ============================================================
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = req.user.id;

    // 1. Trouver le cercle + le nom du senior associé
    // (Version Dev : plus robuste car elle renvoie le nom directement)
    const circleRes = await pool.query(
      `SELECT c.id, u.name as senior_name 
       FROM care_circles c
       JOIN users u ON c.senior_id = u.id
       WHERE c.invite_code = $1`, 
      [invite_code.toUpperCase().trim()]
    );

    if (circleRes.rows.length === 0) {
      return res.status(404).json({ error: "Code d'invitation invalide." });
    }

    const circle = circleRes.rows[0];

    // 2. Vérifier si déjà membre
    const roleCheck = await pool.query(
      `SELECT * FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
      [userId, circle.id]
    );

    if (roleCheck.rows.length > 0) {
      return res.status(400).json({ error: "Vous faites déjà partie de ce cercle." });
    }

    // 3. Ajouter l'utilisateur
    await pool.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'HELPER')`,
      [userId, circle.id]
    );

    // Récupérer le nom de l'utilisateur pour le log
    const userRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [userId]);
    const userName = userRes.rows[0]?.name || 'Utilisateur';

    // 📝 Log de l'action
    await logAudit(
      userId, 
      AUDIT_ACTIONS.MEMBER_JOINED, 
      `${userName} a rejoint le cercle`, 
      circle.id
    );

    // Retour standardisé
    res.json({ 
        success: true, 
        circle_id: circle.id,
        circle_name: circle.senior_name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ============================================================
// 5. RÉCUPÉRER MON CERCLE ACTIF
// ============================================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT c.id as circle_id, s.name as circle_nom
      FROM care_circles c
      JOIN user_roles ur ON c.id = ur.circle_id
      JOIN users s ON c.senior_id = s.id
      WHERE ur.user_id = $1
      LIMIT 1
    `;
    
    const { rows } = await pool.query(query, [userId]);

    if (rows.length > 0) {
      res.json({ 
        circle_id: rows[0].circle_id, 
        circle_nom: rows[0].circle_nom 
      });
    } else {
      res.json({ circle_id: null, circle_nom: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération cercle" });
  }
});

// ============================================================
// 6. SUPPRIMER UN MEMBRE DU CERCLE
// ============================================================
router.delete('/:circleId/members/:memberId', authenticateToken, async (req, res) => {
  const { circleId, memberId } = req.params;
  const currentUserId = req.user.id;

  try {
    // 1. Vérifier que l'utilisateur courant est ADMIN du cercle
    const adminCheck = await pool.query(
      `SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
      [currentUserId, circleId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return res.status(403).json({ error: "Vous n'avez pas les permissions pour cette action." });
    }

    // 2. Vérifier que le membre à supprimer est un HELPER (pas le senior/PC)
    const memberCheck = await pool.query(
      `SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
      [memberId, circleId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: "Membre non trouvé dans ce cercle." });
    }

    if (memberCheck.rows[0].role !== 'HELPER') {
      return res.status(400).json({ error: "Vous ne pouvez supprimer que les aidants." });
    }

    // 3. Supprimer le rôle du membre
    await pool.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
      [memberId, circleId]
    );

    // Récupérer le nom du membre supprimé pour le log
    const memberRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [memberId]);
    const memberName = memberRes.rows[0]?.name || 'Utilisateur';

    // 📝 Log de l'action
    await logAudit(
      currentUserId, 
      AUDIT_ACTIONS.MEMBER_REMOVED, 
      `${memberName} a été retiré du cercle`, 
      circleId
    );

    res.json({ success: true, message: "Membre supprimé du cercle avec succès." });

  } catch (error) {
    console.error('Erreur suppression membre:', error);
    res.status(500).json({ error: "Impossible de supprimer le membre." });
  }
});

// ============================================================
// 7. RÉCUPÉRER LES LOGS D'ACTIVITÉ DU CERCLE
// ============================================================
router.get('/:circleId/logs', authenticateToken, async (req, res) => {
  const { circleId } = req.params;
  const { limit = 50 } = req.query;

  try {
    // Vérifier que l'utilisateur fait partie du cercle
    const memberCheck = await pool.query(
      `SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
      [req.user.id, circleId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Vous n'avez pas accès à ce cercle." });
    }

    // Récupérer les logs avec le nom de l'utilisateur
    const result = await pool.query(`
      SELECT 
        al.id,
        al.action,
        al.details,
        al.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris' as created_at,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.circle_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `, [circleId, parseInt(limit)]);

    res.json({
      status: 'ok',
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Erreur récupération logs:', error);
    res.status(500).json({ error: "Impossible de récupérer les logs." });
  }
});

export default router;