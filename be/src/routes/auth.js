import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = Router();

// --- INSCRIPTION (REGISTER) ---
router.post('/register', async (req, res) => {
  // On récupère bien 'onboarding_role'
  const { name, email, password, onboarding_role, phone, birth_date } = req.body;

  try {
    // 1. Vérifier si l'email existe déjà
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Cet email est déjà utilisé par un autre compte." });
    }

    // 2. Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insérer le nouvel utilisateur
    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, onboarding_role, phone, birth_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, onboarding_role`,
      [name, email, passwordHash, onboarding_role, phone, birth_date]
    );

    res.status(201).json({ success: true, user: newUser.rows[0] });

  } catch (error) {
    console.error('ERREUR REGISTER:', error);
    res.status(500).json({ success: false, error: "Erreur lors de l'inscription." });
  }
});

// --- CONNEXION (LOGIN) ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // 1. Chercher l'utilisateur
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Aucun compte associé à cet email." });
    }

    const user = result.rows[0];

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Mot de passe incorrect." });
    }

    // 3. Récupérer les cercles (AVEC LE CODE D'INVITATION)
    // C'est ici la modification importante : cc.invite_code
    const circlesResult = await db.query(`
      SELECT cc.id, cc.invite_code, u.name AS senior_name, ur.role
      FROM care_circles cc
      JOIN user_roles ur ON cc.id = ur.circle_id
      JOIN users u ON cc.senior_id = u.id
      WHERE ur.user_id = $1
    `, [user.id]);

    const circles = circlesResult.rows;
    let mainCircleId = null;
    let mainCircleNom = null;

    if (circles.length > 0) {
        mainCircleId = circles[0].id;           
        mainCircleNom = circles[0].senior_name; 
    }

    // Génération du token
    const token = jwt.sign(
        { id: user.id, role: user.onboarding_role }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '30d' }
    );
    
    delete user.password_hash; 

    res.json({ 
        success: true, 
        token, 
        user: { ...user, circles }, 
        circle_id: mainCircleId,    
        circle_nom: mainCircleNom   
    });

  } catch (error) {
    console.error('ERREUR LOGIN:', error);
    res.status(500).json({ success: false, error: "Erreur serveur lors de la connexion." });
  }
});

export default router;