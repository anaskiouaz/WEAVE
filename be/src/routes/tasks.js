import { Router } from 'express';
import db from '../config/db.js';
import admin from '../config/firebase.js'; 

const router = Router();

// CRÉATION DE TÂCHE (POST)
router.post('/', async (req, res) => {
    // On récupère "time" ici
    const { title, description, assigned_to, due_date, task_type, time } = req.body;
    
    try {
        // On l'ajoute dans la requête SQL
        const result = await db.query(
            'INSERT INTO tasks (title, description, assigned_to, due_date, task_type, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, assigned_to, due_date, task_type, time]
        );
        const newTask = result.rows[0];
        const userTokens = await db.query("SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''");
        const tokens = [...new Set(userTokens.rows.map(r => r.fcm_token))];

        if (tokens.length > 0) {
             try {
                 const message = {
                    notification: {
                        title: `Nouvelle tâche ajoutée pour ${time}`,
                        body: `Tâche ajoutée : ${title}`
                    },
                    data: { taskId: newTask.id.toString(), type: 'task_created' },
                    tokens: tokens
                 };
                 await admin.messaging().sendEachForMulticast(message);
             } catch (e) {
                 console.error('Erreur envoi notif:', e);
             }
        }
        res.status(201).json(newTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, 
                title, 
                description, 
                completed, 
                task_type,
                assigned_to,
                created_at,
                time, -- <--- C'EST CETTE LIGNE QUI MANQUAIT !
                
                -- Gestion des dates pour le calendrier
                COALESCE(due_date, created_at) as start, 
                COALESCE(due_date, created_at) as end,
                COALESCE(due_date, created_at) as date
            FROM tasks 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Erreur récupération tâches:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ message: 'Tâche supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;