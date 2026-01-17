import express from 'express';
import db, { pool } from '../config/db.js';
import { authenticateToken } from './../middleware/auth.js';
import bcrypt from 'bcryptjs'; 

const router = express.Router();

const generateInviteCode = () => {
  return 'W-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

// --- NOUVELLE ROUTE : RÉCUPÉRER LES MEMBRES D'UN CERCLE ---
router.get('/:circleId/members', authenticateToken, async (req, res) => {
  const { circleId } = req.params;

  try {
    // On récupère les infos utiles : ID, Nom, Email, Téléphone, Rôle
    const result = await db.query(`
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

// 1. CRÉER UN CERCLE
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect(); 
  
  try {
    const { senior_info } = req.body;
    const creatorId = req.user.id; 
    
    if (!senior_info || !senior_info.name) {
      return res.status(400).json({ error: "Le nom du bénéficiaire est requis." });
    }

    await client.query('BEGIN');

    const fakeEmail = `senior.${Date.now()}@weave.local`;
    const emailToUse = senior_info.email || fakeEmail;
    
    const dummyPassword = await bcrypt.hash("WeaveSenior2024!", 10);

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

    let inviteCode = generateInviteCode();
    
    const circleRes = await client.query(
      `INSERT INTO care_circles (senior_id, created_by, invite_code) 
       VALUES ($1, $2, $3) RETURNING *`,
      [seniorId, creatorId, inviteCode]
    );
    const newCircle = circleRes.rows[0];

    // Le créateur devient ADMIN
    await client.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'ADMIN')`,
      [creatorId, newCircle.id]
    );

    // Le Senior est PC
    await client.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'PC')`,
      [seniorId, newCircle.id]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, circle: newCircle });
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

// 2. REJOINDRE UN CERCLE
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = req.user.id;

    // Convertir en majuscule pour éviter les erreurs de saisie
    const code = invite_code.toUpperCase().trim();

    const circleRes = await db.query(
      `SELECT * FROM care_circles WHERE invite_code = $1`, 
      [code]
    );

    if (circleRes.rows.length === 0) {
      return res.status(404).json({ error: "Code d'invitation invalide." });
    }

    const circle = circleRes.rows[0];

    const roleCheck = await db.query(
      `SELECT * FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
      [userId, circle.id]
    );

    if (roleCheck.rows.length > 0) {
      return res.status(400).json({ error: "Vous faites déjà partie de ce cercle." });
    }

    await db.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'HELPER')`,
      [userId, circle.id]
    );

    res.json({ success: true, circle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// 3. RÉCUPÉRER MON CERCLE
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

export default router;