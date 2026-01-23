import db from '../config/db.js';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { circle_id } = req.query;
        const userId = req.user.id; // Récupère l'utilisateur connecté
        let resolvedCircleId = circle_id;

        // Détermine le cercle par défaut si aucun n'est spécifié
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

        // Récupère les tâches à venir et les statistiques du cercle
        const [upcomingTasks, statsData] = await Promise.all([
            // Les 3 prochaines tâches
            db.query(
                `SELECT id, title, date, time, task_type, helper_name 
                 FROM tasks 
                 WHERE circle_id = $1 AND date >= CURRENT_DATE 
                 ORDER BY date ASC, time ASC 
                 LIMIT 3`,
                [resolvedCircleId]
            ),
            
            // Les statistiques du cercle
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
                    (SELECT COUNT(*) FROM journal_entries WHERE circle_id = $1) as memories_count,
                    
                    -- Compte les messages non lus pour L'UTILISATEUR CONNECTÉ UNIQUEMENT
                    (SELECT COALESCE(COUNT(*)::int, 0)
                     FROM message m
                     JOIN participant_conversation pc ON m.conversation_id = pc.conversation_id
                     JOIN conversation c ON m.conversation_id = c.id
                     WHERE c.cercle_id = $1 
                     AND pc.utilisateur_id = $2
                     AND m.date_envoi > pc.date_lecture 
                     AND m.auteur_id != $2) as unread_count

            `, [resolvedCircleId, userId])
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
                    unread_messages: parseInt(stats.unread_count || 0)
                }
            }
        });

    } catch (err) {
        console.error('Error fetching dashboard:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;