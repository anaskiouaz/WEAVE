import express from 'express';
// CORRECTION DES IMPORTS ICI :
import db, { pool } from '../config/db.js'; // db = export default, { pool } = export nommé
import { authenticateToken } from './../middleware/auth.js';
import bcrypt from 'bcryptjs'; 

const router = express.Router();

const generateInviteCode = () => {
  return 'W-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};
// ... le reste de votre code (generateInviteCode, etc.)

// 1. CRÉER UN CERCLE
router.post('/', authenticateToken, async (req, res) => {
  // Maintenant pool.connect() va fonctionner car on utilise la vraie instance pool
  const client = await pool.connect(); 
  
  try {
    const { senior_info } = req.body;
    // On attend un objet senior_info avec name, birth_date, etc.
    const creatorId = req.user.id; 
    
    if (!senior_info || !senior_info.name) {
      return res.status(400).json({ error: "Le nom du bénéficiaire est requis." });
    }

    await client.query('BEGIN');

    // --- ÉTAPE A : CRÉER LE COMPTE UTILISATEUR POUR LE SENIOR ---
    // Note : Comme l'email est UNIQUE NOT NULL, si l'utilisateur ne donne pas d'email,
    // on en génère un fictif unique pour satisfaire la BDD.
    const fakeEmail = `senior.${Date.now()}@weave.local`;
    const emailToUse = senior_info.email || fakeEmail;
    
    // Mot de passe placeholder (le senior ne se connecte pas forcément tout de suite)
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

    // --- ÉTAPE B : CRÉER LE CERCLE ---
    let inviteCode = generateInviteCode();
    
    const circleRes = await client.query(
      `INSERT INTO care_circles (senior_id, created_by, invite_code) 
       VALUES ($1, $2, $3) RETURNING *`,
      [seniorId, creatorId, inviteCode]
    );
    const newCircle = circleRes.rows[0];

    // --- ÉTAPE C : ASSIGNER LES RÔLES ---
    
    // 1. Le créateur devient ADMIN du cercle
    await client.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'ADMIN')`,
      [creatorId, newCircle.id]
    );

    // 2. Le Senior est ajouté au cercle en tant que "PC" (Person Cared For)
    await client.query(
      `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'PC')`,
      [seniorId, newCircle.id]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, circle: newCircle });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erreur création cercle:", err);
    // Gestion spécifique erreur duplication email
    if (err.code === '23505') {
        return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà." });
    }
    res.status(500).json({ error: "Erreur lors de la création du cercle." });
  } finally {
    client.release();
  }
});

// 2. REJOINDRE UN CERCLE (Inchangé, mais vérifié pour ESM)
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = req.user.id;

    const circleRes = await db.query(
      `SELECT * FROM care_circles WHERE invite_code = $1`, 
      [invite_code]
    );

    if (circleRes.rows.length === 0) {
      return res.status(404).json({ error: "Code d'invitation invalide." });
    }

    const circle = circleRes.rows[0];

    // Vérifier si l'utilisateur est déjà dedans
    const roleCheck = await db.query(
      `SELECT * FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
      [userId, circle.id]
    );

    if (roleCheck.rows.length > 0) {
      return res.status(400).json({ error: "Vous faites déjà partie de ce cercle." });
    }

    // Ajouter l'utilisateur comme HELPER
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


// 3. RÉCUPÉRER MON CERCLE (Pour le contexte Frontend)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // On cherche le cercle où l'utilisateur a un rôle
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
      // C'est ici qu'on renvoie les clés exactes attendues par votre AuthProvider
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