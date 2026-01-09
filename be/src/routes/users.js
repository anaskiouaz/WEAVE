import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const router = Router();

// 1. Récupérer les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Inscription
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, birth_date, onboarding_role } = req.body;

    if (password) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const result = await db.query(
          `INSERT INTO users (name, email, password_hash, phone, birth_date, onboarding_role)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, name, email`,
          [name, email, passwordHash, phone, birth_date, onboarding_role]
        );
        return res.status(201).json({ success: true, user: result.rows[0] });
    }

    const result = await db.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', 
        [name, email]
    );
    res.status(201).json({ success: true, user: result.rows[0] });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Sauvegarde du Token (Version Universelle : Connecté ou Pas)
router.post('/device-token', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (userId) {
        // CAS 1 : On sait qui c'est, on met à jour son profil
        await db.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [token, userId]);
        console.log(`📱 Token lié à l'utilisateur ${userId}`);
    } else {
        // CAS 2 : Pas connecté. On regarde si ce token est déjà en base (chez n'importe qui)
        const existing = await db.query('SELECT id FROM users WHERE fcm_token = $1', [token]);
        
        if (existing.rows.length === 0) {
            // Le token est inconnu. On crée un "User Appareil" pour le stocker.
            // On génère un email bidon unique pour éviter les erreurs SQL
            const fakeEmail = `device_${token.substring(0,8)}@weave.local`;
            await db.query(
                `INSERT INTO users (name, email, fcm_token) VALUES ($1, $2, $3)`,
                ['Appareil Mobile', fakeEmail, token]
            );
            console.log(`📱 Token enregistré pour un appareil anonyme`);
        } else {
            console.log(`📱 Token déjà connu en base (rien à faire)`);
        }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;