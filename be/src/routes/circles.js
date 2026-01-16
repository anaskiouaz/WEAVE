import express from 'express';
import { pool } from '../config/db.js'; // On privilégie pool partout pour la cohérence
import { authenticateToken } from './../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

const generateInviteCode = () => {
  return 'W-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

// ============================================================
// 1. LISTER MES CERCLES (Pour la vue "Liste" du Frontend)
// ============================================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // On récupère ID du cercle, NOM du senior (bénéficiaire) et le RÔLE de l'utilisateur
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
        
        // Le frontend attend un tableau d'objets { id, name, role }
        res.json(rows); 
    } catch (err) {
        console.error("Erreur liste cercles:", err);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des cercles." });
    }
});

// ============================================================
// 2. CRÉER UN CERCLE
// ============================================================
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect(); // Transaction nécessaire
  
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
       VALUES ($1, $2, $3) RETURNING id, invite_code`, // On retourne juste ce dont on a besoin
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

    // IMPORTANT : On renvoie les clés standardisées pour le Frontend
    res.status(201).json({ 
        success: true, 
        circle_id: newCircle.id,
        circle_name: senior_info.name, // Le nom du cercle est le nom du senior
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
// 3. REJOINDRE UN CERCLE
// ============================================================
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = req.user.id;

    // 1. Trouver le cercle + le nom du senior associé (via JOIN)
    const circleRes = await pool.query(
      `SELECT c.id, u.name as senior_name 
       FROM care_circles c
       JOIN users u ON c.senior_id = u.id
       WHERE c.invite_code = $1`, 
      [invite_code]
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

    // IMPORTANT : Retour standardisé pour le Frontend
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
// 4. RÉCUPÉRER MON CERCLE ACTIF (Pour le context refresh)
// ============================================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // On prend le dernier cercle rejoint ou créé
    const query = `
      SELECT c.id as circle_id, s.name as circle_nom
      FROM care_circles c
      JOIN user_roles ur ON c.id = ur.circle_id
      JOIN users s ON c.senior_id = s.id
      WHERE ur.user_id = $1
      ORDER BY ur.joined_at DESC 
      LIMIT 1
    `;
    
    // Note: Assure-toi que ta table user_roles a une colonne joined_at ou created_at. 
    // Sinon retire "ORDER BY..." et prends juste le premier trouvé.
    
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