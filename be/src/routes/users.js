import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';


const router = Router();

// Récupérer les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sauvegarde du Token FCM, test en logs (inutiles maintenant)
router.post('/device-token', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (userId) {
        await db.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [token, userId]);
        console.log(`Token lié à l'utilisateur ${userId}`);
    } else {
        const existing = await db.query('SELECT id FROM users WHERE fcm_token = $1', [token]);
        
        if (existing.rows.length === 0) {
            const fakeEmail = `device_${token.substring(0,8)}@weave.local`;
            await db.query(
                `INSERT INTO users (name, email, fcm_token) VALUES ($1, $2, $3)`,
                ['Appareil Mobile', fakeEmail, token]
            );
            console.log(`Token enregistré pour un appareil anonyme`);
        } else {
            console.log(`Token déjà connu en base (rien à faire)`);
        }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Inscription
router.post('/', async (req, res) => {
  // ... (Garder votre code d'inscription s'il y en a un, sinon supprimer ce bloc)
  res.json({msg: "Inscription non implémentée ici pour l'instant"});
});

export default router;