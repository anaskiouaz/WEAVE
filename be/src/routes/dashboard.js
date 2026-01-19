import db from '../config/db.js';
import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { circle_id } = req.query;
        let resolvedCircleId = circle_id;

        // 1. Gestion du cercle par défaut
        if (!resolvedCircleId || resolvedCircleId === 'undefined') {
            const defaultCircle = await db.query(
                `SELECT id FROM care_circles ORDER BY created_at ASC LIMIT 1`
            );
            if (defaultCircle.rows.length > 0) {
                resolvedCircleId = defaultCircle.rows[0].id;
            } else {
                return res.status(400).json({ status: 'error', message: 'Aucun cercle trouvé.' });
            }
        }

        // 2. Requêtes (Correction ici : on utilise 'user_roles' et 'journal_entries')
        const [upcomingTasks, statsData] = await Promise.all([
            // A. Les 3 prochaines tâches
            db.query(
                `SELECT id, title, date, time, task_type, helper_name 
                 FROM tasks 
                 WHERE circle_id = $1 AND date >= CURRENT_DATE 
                 ORDER BY date ASC, time ASC 
                 LIMIT 3`,
                [resolvedCircleId]
            ),
            
            // B. Les Statistiques
            db.query(`
                SELECT 
                    -- Compte les tâches des 7 prochains jours
                    (SELECT COUNT(*) FROM tasks 
                     WHERE circle_id = $1 
                     AND date >= CURRENT_DATE 
                     AND date <= CURRENT_DATE + INTERVAL '7 days') as tasks_week,
                     
                    -- CORRECTION : Ne compte que les HELPER (pas le PC ni l'ADMIN)
                    (SELECT COUNT(DISTINCT user_id) 
                     FROM user_roles 
                     WHERE circle_id = $1 AND role = 'HELPER') as active_helpers,

                    -- Compte des souvenirs (Journal)
                    (SELECT COUNT(*) FROM journal_entries WHERE circle_id = $1) as memories_count

            `, [resolvedCircleId])
        ]);

        const stats = statsData.rows[0];

        console.log('📊 Dashboard Stats calculées:', {
            circle_id: resolvedCircleId,
            active_helpers: stats.active_helpers,
            tasks_week: stats.tasks_week,
            memories_count: stats.memories_count
        });

        res.json({
            status: 'ok',
            data: {
                upcomingTasks: upcomingTasks.rows,
                stats: {
                    active_helpers: parseInt(stats.active_helpers || 0),
                    tasks_this_week: parseInt(stats.tasks_week || 0),
                    memories: parseInt(stats.memories_count || 0), 
                    unread_messages: 3 // Reste en dur pour l'instant (nécessite jointure complexe avec tes tables conversations)
                }
            }
        });

    } catch (err) {
        console.error('Error fetching dashboard:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;