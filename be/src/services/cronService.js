import cron from 'node-cron';
import db from '../config/db.js';
import admin from '../config/firebase.js';
import { notifyCircle } from '../utils/notifications.js'; // ✅ On réutilise l'intelligence de notif
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const initCronJobs = () => {
    console.log("🕰️ Service de rappels (Cron) activé - Vérification chaque minute");

    // =========================================================================
    // JOB 1 : RAPPELS (30 MIN AVANT)
    // =========================================================================
    cron.schedule('* * * * *', async () => {
        try {
            // 1. Calcul de l'heure cible (Maintenant + 30 min)
            const targetDate = new Date();
            targetDate.setMinutes(targetDate.getMinutes() + 30);

            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD

            const hours = String(targetDate.getHours()).padStart(2, '0');
            const minutes = String(targetDate.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            // 2. Récupérer les tâches concernées
            const query = `
                SELECT * FROM tasks 
                WHERE date = $1 
                AND LEFT(CAST(time AS TEXT), 5) = $2 
                AND reminder_sent = FALSE
            `;
            
            const result = await db.query(query, [dateStr, timeStr]);

            if (result.rows.length > 0) {
                console.log(`⏰ ${result.rows.length} tâche(s) démarrent dans 30 min (${timeStr})`);

                for (const task of result.rows) {
                    
                    // CAS A : Tâche déjà assignée à quelqu'un -> Rappel personnel
                    if (task.assigned_to && task.assigned_to.length > 0) {
                        // Récupérer les tokens des volontaires
                        const volunteers = await db.query(
                            `SELECT fcm_token, name FROM users WHERE id = ANY($1) AND fcm_token IS NOT NULL`,
                            [task.assigned_to]
                        );

                        const tokens = volunteers.rows.map(v => v.fcm_token);
                        
                        if (tokens.length > 0) {
                            const message = {
                                notification: {
                                    title: '⏰ C\'est bientôt !',
                                    body: `Votre intervention "${task.title}" commence dans 30 min.`
                                },
                                data: { 
                                    taskId: task.id.toString(), 
                                    type: 'reminder',
                                    click_action: 'FLUTTER_NOTIFICATION_CLICK'
                                },
                                tokens: tokens
                            };
                            await admin.messaging().sendEachForMulticast(message);
                            console.log(`   ✅ Rappel envoyé aux volontaires pour "${task.title}"`);
                        }
                    } 
                    
                    // CAS B : Tâche non pourvue -> Appel à l'aide intelligent (disponibilité)
                    else {
                        console.log(`   ⚠️ Tâche "${task.title}" non pourvue : Envoi alerte aux dispos.`);
                        
                        // On utilise notifyCircle qui filtre déjà par Dispo & Compétence !
                        await notifyCircle(
                            task.circle_id,
                            "🚨 Besoin d'aide urgent",
                            `L'activité "${task.title}" commence dans 30 min et personne n'est inscrit !`,
                            { taskId: task.id.toString(), type: 'urgent_reminder' },
                            null, // Pas d'exclus
                            task.time, // Heure pour filtrer les dispos
                            task.date, // Date pour filtrer les dispos
                            null       // Skill (optionnel, on peut le rajouter si vous avez un champ skill)
                        );
                    }

                    // 3. Marquer comme envoyé pour ne pas spammer
                    await db.query('UPDATE tasks SET reminder_sent = TRUE WHERE id = $1', [task.id]);
                }
            }

        } catch (err) {
            console.error("❌ Erreur Cron Rappels:", err.message);
        }
    });

    // =========================================================================
    // JOB 2 : JOURNALISATION AUTOMATIQUE (TÂCHES PASSÉES)
    // =========================================================================
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().substring(0, 5);

            // Tâches passées non encore journalisées (logique simplifiée)
            // Note: Idéalement, on ajouterait un flag 'audit_logged' dans la table tasks pour éviter de re-scanner
            // Ici on se base sur les logs existants pour ne pas dupliquer
            
            const tasksRes = await db.query(`
                SELECT id, circle_id, title, date, time, assigned_to
                FROM tasks
                WHERE (date < $1 OR (date = $1 AND LEFT(CAST(time AS TEXT), 5) <= $2))
                AND assigned_to IS NOT NULL
                AND array_length(assigned_to, 1) > 0
            `, [dateStr, timeStr]);

            for (const task of tasksRes.rows) {
                for (const userId of task.assigned_to) {
                    // Vérifier si déjà loggué
                    const exists = await db.query(
                        `SELECT 1 FROM audit_logs 
                         WHERE user_id = $1 
                         AND action = 'TASK_PASSED' 
                         AND details LIKE $2 
                         LIMIT 1`,
                        [userId, `%task:${task.id}%`]
                    );

                    if (exists.rows.length === 0) {
                        // Récupérer nom user
                        const u = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
                        const userName = u.rows[0]?.name || 'Utilisateur';

                        await logAudit(
                            userId, 
                            AUDIT_ACTIONS.TASK_PASSED, 
                            `${userName} a terminé la tâche "${task.title}" (task:${task.id})`, 
                            task.circle_id
                        );
                        console.log(`   📝 Audit auto: Tâche ${task.id} passée pour ${userName}`);
                    }
                }
            }
        } catch (err) {
            console.error('❌ Erreur Cron Audit:', err.message);
        }
    });
};

export default initCronJobs;