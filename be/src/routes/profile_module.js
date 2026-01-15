import { Router } from 'express';
import db from '../config/db.js';

const router = Router();
const getUserId = (req) => req.headers['x-user-id'];

// ============================================================
// 1. LIRE LE PROFIL (Tout est maintenant dans la table users)
// ============================================================
router.get('/', async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, error: 'ID manquant' });

    try {
        // On récupère TOUT d'un coup (y compris availability)
        const result = await db.query(
            'SELECT id, name, email, phone, address, skills, availability, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

        const user = result.rows[0];

        // On renvoie les données. 
        // Note: user.availability est déjà un tableau JSON grâce à PostgreSQL, pas besoin de conversion complexe.
        res.json({ 
            success: true, 
            user: user, 
            availability: user.availability || [] 
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ============================================================
// 2. SAUVEGARDER INFOS (Nom, Tel, Adresse)
// ============================================================
router.put('/info', async (req, res) => {
    const userId = getUserId(req);
    const { name, phone, address } = req.body;
    try {
        await db.query(
            'UPDATE users SET name = $1, phone = $2, address = $3 WHERE id = $4',
            [name, phone, address, userId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============================================================
// 3. SAUVEGARDER COMPÉTENCES
// ============================================================
router.put('/skills', async (req, res) => {
    const userId = getUserId(req);
    const { skills } = req.body;
    try {
        await db.query(
            'UPDATE users SET skills = $1 WHERE id = $2',
            [JSON.stringify(skills || []), userId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============================================================
// 4. SAUVEGARDER DISPONIBILITÉS (Simplifié !)
// ============================================================
router.put('/availability', async (req, res) => {
    const userId = getUserId(req);
    const { availability } = req.body; // C'est directement le tableau JSON envoyé par le front

    console.log("Sauvegarde disponibilités pour", userId, ":", availability);

    try {
        // Plus besoin de supprimer/insérer dans une autre table. On met juste à jour la colonne.
        await db.query(
            'UPDATE users SET availability = $1 WHERE id = $2',
            [JSON.stringify(availability || []), userId]
        );
        res.json({ success: true });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ success: false, error: e.message }); 
    }
});

export default router;