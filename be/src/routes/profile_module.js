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
            'SELECT id, name, email, phone, address, skills, notifications_enabled, fcm_token, profile_photo, created_at FROM users WHERE id = $1',
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
// 2b. SAUVEGARDER PRÉFÉRENCE NOTIFICATIONS
// ============================================================
router.put('/notifications', async (req, res) => {
    const userId = getUserId(req);
    const { notifications_enabled } = req.body;
    console.log(`🔔 Sauvegarde notification pour user ${userId}: ${notifications_enabled}`);
    try {
        await db.query(
            'UPDATE users SET notifications_enabled = $1 WHERE id = $2',
            [notifications_enabled, userId]
        );
        res.json({ success: true });
    } catch (e) { 
        console.error('Erreur sauvegarde notification:', e);
        res.status(500).json({ success: false, error: e.message }); 
    }
});

// ============================================================
// 3. SAUVEGARDER COMPÉTENCES
// ============================================================
router.put('/skills', async (req, res) => {
    const userId = getUserId(req);
    const { skills } = req.body;
    console.log('💡 Sauvegarde skills pour user:', userId, 'Skills:', skills);
    try {
        const result = await db.query(
            'UPDATE users SET skills = $1 WHERE id = $2 RETURNING skills',
            [skills || [], userId]
        );
        console.log('✅ Skills sauvegardées:', result.rows[0]);
        res.json({ success: true });
    } catch (e) { 
        console.error('❌ Erreur sauvegarde skills:', e);
        res.status(500).json({ success: false, error: e.message }); 
    }
});

// ============================================================
// 4. SAUVEGARDER NOTIFICATIONS
// ============================================================
router.put('/notifications', async (req, res) => {
    const userId = getUserId(req);
    const { enabled } = req.body; // Boolean attendu
    
    try {
        await db.query(
            'UPDATE users SET notifications_enabled = $1 WHERE id = $2',
            [enabled, userId]
        );
        res.json({ success: true });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ success: false, error: e.message }); 
    }
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

// ============================================================
// 5. RÉCUPÉRER LES STATISTIQUES (Interventions + Souvenirs)
// ============================================================
router.get('/stats', async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, error: 'ID manquant' });

    try {
        // Compter les interventions (tasks assignées à l'utilisateur)
        const tasksResult = await db.query(
            'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = $1 AND completed = true',
            [userId]
        );
        const interventions = parseInt(tasksResult.rows[0].count) || 0;

        // Compter les souvenirs/moments (journal entries créés par l'utilisateur)
        const journalResult = await db.query(
            'SELECT COUNT(*) as count FROM journal_entries WHERE author_id = $1',
            [userId]
        );
        const moments = parseInt(journalResult.rows[0].count) || 0;

        // Calculer les années/mois/jours depuis la création du compte
        const userResult = await db.query(
            'SELECT created_at FROM users WHERE id = $1',
            [userId]
        );
        
        let yearsActiveText = '0 jour';
        if (userResult.rows[0]) {
            const createdDate = new Date(userResult.rows[0].created_at);
            const now = new Date();
            
            // Calculer la différence en millisecondes
            const diffMs = now - createdDate;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffMonths / 12);
            
            // Formater selon la durée
            if (diffYears >= 1) {
                yearsActiveText = `${diffYears} an${diffYears > 1 ? 's' : ''}`;
            } else if (diffMonths >= 1) {
                yearsActiveText = `${diffMonths} mois`;
            } else {
                yearsActiveText = `${Math.max(1, diffDays)} jour${diffDays > 1 ? 's' : ''}`;
            }
        }

        res.json({
            success: true,
            stats: {
                interventions,
                moments,
                yearsActiveText,
                rating: 4.8  // À faire dynamique plus tard
            }
        });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// 5. UPLOADER PHOTO DE PROFIL
// ============================================================
router.post('/upload-photo', async (req, res) => {
    const userId = getUserId(req);
    const { photoBlobName } = req.body;

    if (!userId || !photoBlobName) {
        return res.status(400).json({ success: false, error: 'User ID et photoBlobName requis' });
    }

    try {
        // Sauvegarder l'URL du blob Azure en base de données
        const result = await db.query(
            'UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING profile_photo',
            [photoBlobName, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log(`✅ Photo de profil sauvegardée pour user ${userId}: ${photoBlobName}`);
        res.json({ 
            success: true, 
            photoUrl: result.rows[0].profile_photo 
        });
    } catch (error) {
        console.error('Erreur sauvegarde photo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;