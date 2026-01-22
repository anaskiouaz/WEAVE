import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Enregistre un nouvel utilisateur avec validation d'email unique
router.post('/register', async (req, res) => {
  const { name, email, password, onboarding_role, phone, birth_date } = req.body;

  try {
    // Vérifie que l'email n'existe pas déjà
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Cet email est déjà utilisé par un autre compte." });
    }

    // Hache le mot de passe avec bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insère le nouvel utilisateur en base de données avec rôle USER par défaut
    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, onboarding_role, role_global, phone, birth_date) 
       VALUES ($1, $2, $3, $4, 'USER', $5, $6) 
       RETURNING id, name, email, onboarding_role, role_global`,
      [name, email, passwordHash, onboarding_role, phone, birth_date]
    );

    res.status(201).json({ success: true, user: newUser.rows[0] });

  } catch (error) {
    console.error('ERREUR REGISTER:', error);
    res.status(500).json({ success: false, error: "Erreur lors de l'inscription." });
  }
});

// Authentifie un utilisateur et retourne un token JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Recherche l'utilisateur par email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Aucun compte associé à cet email." });
    }

    const user = result.rows[0];

    // Valide le mot de passe contre le hash stocké
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Mot de passe incorrect." });
    }

    // Récupère les cercles de soin associés à l'utilisateur
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

    // Génère un token JWT d'authentification
    // On utilise role_global s'il existe, sinon onboarding_role
    const activeRole = user.role_global || user.onboarding_role;

    const token = jwt.sign(
        { id: user.id, role: activeRole }, 
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

router.get('/check-role', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const circleId = req.query.circle_id;
    if (!userId) return res.status(401).json({ success: false, error: 'Token invalide.' });
    if (!circleId) return res.status(400).json({ success: false, error: 'Paramètre circle_id manquant.' });

    const q = 'SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2 LIMIT 1';
    const result = await db.query(q, [userId, circleId]);
    if (result.rows.length === 0) {
      return res.json({ success: true, role: null });
    }
    return res.json({ success: true, role: result.rows[0].role });
  } catch (err) {
    console.error('ERREUR /auth/check-role:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Token invalide.' });

        // SQL HYBRIDE : On demande TOUS les champs (les tiens + ceux de tes collègues)
        const userRes = await db.query(
            'SELECT id, name, email, onboarding_role, role_global, profile_photo, phone, birth_date FROM users WHERE id = $1', 
            [userId]
        );
        
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
        const user = userRes.rows[0];

        const circlesResult = await db.query(`
            SELECT cc.id, cc.invite_code, u.name AS senior_name, ur.role
            FROM care_circles cc
            JOIN user_roles ur ON cc.id = ur.circle_id
            JOIN users u ON cc.senior_id = u.id
            WHERE ur.user_id = $1
        `, [userId]);

        const circles = circlesResult.rows;
        let mainCircleId = null;
        if (circles.length > 0) mainCircleId = circles[0].id;

        // RÉPONSE : On garde TA structure JSON qui renvoie circle_id à la racine
        res.json({ 
            success: true, 
            user: { ...user, circles },
            circle_id: mainCircleId 
        });

    } catch (error) {
        console.error('ERREUR /me:', error);
        res.status(500).json({ success: false, error: "Erreur récupération session." });
    }
});

export default router;