import { Router } from 'express';
import db from '../config/db.js';
import admin from '../config/firebase.js'; 

const router = Router();

// CRÉATION DE TÂCHE (POST)
router.post('/', async (req, res) => {
    // On récupère les infos (avec le fix de l'heure 'time' inclus)
    const { title, description, assigned_to, due_date, task_type, time } = req.body;
    
    try {
        // Insertion en base de données
        const result = await db.query(
            'INSERT INTO tasks (title, description, assigned_to, due_date, task_type, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, assigned_to, due_date, task_type, time]
        );
        const newTask = result.rows[0];
        console.log("Tâche créée en DB :", newTask.id);

        // On cherche TOUS les tokens existants
        const userTokens = await db.query("SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''");
        
        // On nettoie la liste (pas de doublons)
        const tokens = [...new Set(userTokens.rows.map(r => r.fcm_token))];

        console.log(`Préparation notif. Tokens trouvés en DB : ${tokens.length}`);

        if (tokens.length > 0) {
             try {
                 const message = {
                    notification: {
                        title: `Nouvelle activité :  ${time}`,
                        body: `Tâche ajoutée : ${title}`
                    },
                    data: { taskId: newTask.id.toString(), type: 'task_created' },
                    tokens: tokens
                 };

                 console.log("Envoi à Firebase en cours...");
                 const response = await admin.messaging().sendEachForMulticast(message);
                 console.log(`Bilan Firebase : ${response.successCount} succès, ${response.failureCount} échecs.`);
                 
                 if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(resp.error);
                            console.error(`ERREUR sur le token ${idx} :`, JSON.stringify(resp.error));
                        }
                    });
                 }

             } catch (e) {
                 console.error('CRASH Envoi Firebase:', e);
             }
        } else {
            console.warn("Aucun token trouvé en base. Personne ne recevra la notif.");
        }

        res.status(201).json(newTask);
    } catch (err) {
        console.error("Erreur SQL:", err);
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