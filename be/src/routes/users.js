import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const router = express.Router();

// --- INSCRIPTION (SIGNUP) ---
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role || 'helper']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Code erreur PostgreSQL pour doublon
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- CONNEXION (LOGIN) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Utilisateur non trouvé' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) return res.status(400).json({ error: 'Mot de passe incorrect' });

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LISTE DES UTILISATEURS ---
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, role, fcm_token FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ENREGISTREMENT DU TOKEN (C'est ici qu'on corrige !) ---
router.post('/device-token', async (req, res) => {
    const { userId, token } = req.body;
    
    console.log(`📲 Réception token (User: ${userId || 'Anonyme'}) : ${token.substring(0, 10)}...`);

    try {
        if (userId) {
            // Cas 1 : Utilisateur connecté -> On met à jour son profil
            await db.query(
                'UPDATE users SET fcm_token = $1 WHERE id = $2',
                [token, userId]
            );
            console.log("Token mis à jour pour l'utilisateur ID:", userId);
        } else {
            // Cas 2 : Utilisateur Anonyme (App installée mais pas de login)
            // On crée un utilisateur "fantôme" basé sur le token pour pouvoir le contacter
            const fakeEmail = `device_${token.substring(0, 8)}@weave.local`;
            const fakeName = `Mobile ${token.substring(0, 4)}`;
            
            // On essaie d'insérer. Si l'email existe déjà, on met juste à jour le token.
            await db.query(`
                INSERT INTO users (name, email, password_hash, role, fcm_token)
                VALUES ($1, $2, 'no_pass', 'helper', $3)
                ON CONFLICT (email) 
                DO UPDATE SET fcm_token = $3, updated_at = NOW()
                RETURNING id;
            `, [fakeName, fakeEmail, token]);
            
            console.log("Token enregistré pour un appareil anonyme (Upsert OK)");
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Erreur enregistrement token:", err);
        // On ne renvoie pas 500 pour ne pas faire crasher l'app, juste un log
        res.status(200).json({ success: false, error: err.message });
    }
});

export default router;