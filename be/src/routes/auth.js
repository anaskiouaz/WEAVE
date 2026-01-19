import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = Router();

// --- INSCRIPTION (REGISTER) ---
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone, birth_date } = req.body;

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
    // Note: Adapte les colonnes selon ton schéma de base de données réel (ex: onboarding_role vs role)
    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, birth_date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role`,
      [name, email, passwordHash, role, phone, birth_date]
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
  
  console.log('--- Tentative de connexion ---');
  console.log('Email reçu:', email);

  try {
    // 1. Chercher l'utilisateur
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('Échec: Email introuvable.');
      // Message spécifique pour le frontend
      return res.status(404).json({ success: false, error: "Aucun compte associé à cet email." });
    }

    const user = result.rows[0];

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.log('Échec: Mot de passe incorrect.');
      // Message spécifique
      return res.status(401).json({ success: false, error: "Mot de passe incorrect." });
    }

    console.log('Succès: Mot de passe validé pour', user.name);

    // 3. Récupérer les cercles (Logique existante)
    const circlesResult = await db.query(`
      SELECT cc.id, u.name AS senior_name, ur.role
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
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    delete user.password_hash; // On ne renvoie pas le hash

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