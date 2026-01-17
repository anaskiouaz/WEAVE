import { Router } from 'express';
import db from '../config/db.js';

const router = Router();
const getUserId = (req) => req.headers['x-user-id'];

// ============================================================
// 1. LIRE LE PROFIL (Tout est maintenant dans la table users)
// ============================================================
// GET profil + disponibilités (par cercle si circle_id fourni)
router.get('/', async (req, res) => {
    const userId = getUserId(req);
    const circleId = req.query.circle_id;
    if (!userId) return res.status(400).json({ success: false, error: 'ID manquant' });

    try {
        const userResult = await db.query(
            'SELECT id, name, email, phone, address, skills, created_at FROM users WHERE id = $1',
            [userId]
        );
        if (userResult.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
        const user = userResult.rows[0];

        let availabilityResult;
        if (circleId) {
            availabilityResult = await db.query(
                'SELECT id, circle_id, day_of_week, slots FROM user_availability WHERE user_id = $1 AND circle_id = $2',
                [userId, circleId]
            );
        } else {
            availabilityResult = await db.query(
                'SELECT id, circle_id, day_of_week, slots FROM user_availability WHERE user_id = $1',
                [userId]
            );
        }

        res.json({
            success: true,
            user: user,
            availability: availabilityResult.rows || []
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
// PUT disponibilités : écrase toutes les dispos pour ce user et ce cercle
router.put('/availability', async (req, res) => {
    const userId = getUserId(req);
    const { circle_id, availability } = req.body; // availability = [{ day_of_week, slots }...]
    if (!userId || !circle_id || !Array.isArray(availability)) {
        return res.status(400).json({ success: false, error: 'userId, circle_id et availability requis' });
    }

    try {
        // Supprimer les anciennes dispos pour ce user/cercle
        await db.query('DELETE FROM user_availability WHERE user_id = $1 AND circle_id = $2', [userId, circle_id]);

        // Insérer les nouvelles dispos
        for (const dispo of availability) {
            if (!dispo.day_of_week || !dispo.slots) continue;
            await db.query(
                'INSERT INTO user_availability (user_id, circle_id, day_of_week, slots) VALUES ($1, $2, $3, $4)',
                [userId, circle_id, dispo.day_of_week, JSON.stringify(dispo.slots)]
            );
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

export default router;