import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js'; // ✅ On utilise le nouvel import direct du pool
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Fonction utilitaire pour récupérer les cercles (utilisée au login et au refresh)
const getUserCircles = async (userId) => {
    try {
        const res = await db.query(`
            SELECT ur.circle_id as id, ur.role, c.invite_code, c.senior_id
            FROM user_roles ur
            JOIN care_circles c ON ur.circle_id = c.id
            WHERE ur.user_id = $1
        `, [userId]);
        return res.rows;
    } catch (error) {
        console.error("Erreur récupération cercles:", error);
        return [];
    }
};

// 1. INSCRIPTION (C'est ici que tu avais le problème)
router.post('/register', async (req, res) => {
    console.log("📝 Tentative d'inscription pour :", req.body.email);
    
    try {
        const { name, email, password } = req.body;

        // 1. Vérifier si l'email existe déjà
        const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            console.log("❌ Email déjà existant");
            return res.status(400).json({ success: false, error: "Cet email est déjà utilisé." });
        }

        // 2. Hashage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insertion du nouvel utilisateur
        // Note : on ne met pas de 'created_by' ici car c'est la table USERS, pas CIRCLES
        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role_global) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role_global',
            [name, email, hashedPassword, 'USER']
        );
        
        const newUser = result.rows[0];
        console.log("✅ Utilisateur créé avec succès ID:", newUser.id);

        // 4. Création du token
        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

        res.status(201).json({ 
            success: true, 
            token, 
            user: { ...newUser, circles: [] } 
        });

    } catch (err) {
        console.error("❌ CRASH REGISTER:", err);
        res.status(500).json({ success: false, error: "Erreur serveur lors de l'inscription." });
    }
});

// 2. CONNEXION
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ success: false, error: "Identifiants incorrects" });

        const user = result.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ success: false, error: "Identifiants incorrects" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        
        // On récupère les cercles
        const circles = await getUserCircles(user.id);

        res.json({ 
            success: true,
            token, 
            user: { ...user, circles: circles } 
        });
    } catch (err) {
        console.error("Erreur Login:", err);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
});

// 3. RECHARGEMENT PROFIL (/me)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userRes = await db.query('SELECT id, name, email, role_global FROM users WHERE id = $1', [req.user.id]);
        const user = userRes.rows[0];
        
        if (!user) return res.status(404).json({ success: false, error: "Utilisateur introuvable" });

        const circles = await getUserCircles(req.user.id);

        res.json({
            success: true,
            user: { ...user, circles: circles }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
});

export default router;