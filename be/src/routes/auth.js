import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('--- Tentative de connexion ---');
  console.log('Email reçu:', email);

  try {
    // 1. Chercher l'utilisateur
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('Échec: Email introuvable dans la base de données.');
      return res.status(401).json({ success: false, error: "Email incorrect." });
    }

    const user = result.rows[0];
    console.log('Utilisateur trouvé:', user.name);
    console.log('Hachage en base:', user.password_hash ? 'Présent' : 'MANQUANT !');

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.log('Échec: Le mot de passe ne correspond pas au hachage.');
      return res.status(401).json({ success: false, error: "Mot de passe incorrect." });
    }

    console.log('Succès: Mot de passe validé.');


    // Récupérer les cercles de l'utilisateur avec le nom du senior (JOIN sur users)
    const circlesResult = await db.query(`
      SELECT cc.id, u.name AS senior_name, ur.role
      FROM care_circles cc
      JOIN user_roles ur ON cc.id = ur.circle_id
      JOIN users u ON cc.senior_id = u.id
      WHERE ur.user_id = $1
    `, [user.id]);

    const circles = circlesResult.rows;

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    delete user.password_hash;  
    
    res.json({ success: true, token, user: { ...user, circles } });

  } catch (error) {
    console.error('ERREUR CRITIQUE:', error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

export default router;