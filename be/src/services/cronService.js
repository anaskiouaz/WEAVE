import cron from 'node-cron';
import db from '../config/db.js';
import admin from '../config/firebase.js';
import { notifyCircle } from '../utils/notifications.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const initCronJobs = () => {
    console.log("🕰️ Service de rappels (Cron) activé - Vérification chaque minute");

    // =========================================================================
    // JOB 1 : RAPPELS (30 MIN AVANT)
    // =========================================================================
    cron.schedule('* * * * *', async () => {
        try {
            // 1. Calcul de l'heure cible (Maintenant + 30 min) en forçant le fuseau horaire PARIS
            // On crée une date actuelle
            const now = new Date();
            
            // On ajoute 30 minutes
            const futureDate = new Date(now.getTime() + 30 * 60000);

            // On formate cette date future selon le fuseau horaire de Paris pour extraire les composants
            const formatter = new Intl.DateTimeFormat('fr-FR', {
                timeZone: 'Europe/Paris',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            const parts = formatter.formatToParts(futureDate);
            const getPart = (type) => parts.find(p => p.type === type).value;

            const year = getPart('year');
            const month = getPart('month');
            const day = getPart('day');
            const hours = getPart('hour');
            const minutes = getPart('minute');

            const dateStr = `${year}-${month}-${day}`; // Format YYYY-MM-DD
            const timeStr = `${hours}:${minutes}`;     // Format HH:MM

            // console.log(`🔍 Vérification rappels pour : ${dateStr} à ${timeStr} (Heure Paris)`);

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
                        
                        await notifyCircle(
                            task.circle_id,
                            "🚨 Besoin d'aide urgent",
                            `L'activité "${task.title}" commence dans 30 min et personne n'est inscrit !`,
                            { taskId: task.id.toString(), type: 'urgent_reminder' },
                            null, // Pas d'exclus
                            task.time, // Heure pour filtrer les dispos
                            task.date, // Date pour filtrer les dispos
                            null       // Skill
                        );
                    }

                    // 3. Marquer comme envoyé
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
            // Même logique de date pour l'audit pour être cohérent
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('fr-FR', {
                timeZone: 'Europe/Paris',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            const parts = formatter.formatToParts(now);
            const getPart = (type) => parts.find(p => p.type === type).value;
            
            const dateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
            const timeStr = `${getPart('hour')}:${getPart('minute')}`;

            const tasksRes = await db.query(`
                SELECT id, circle_id, title, date, time, assigned_to
                FROM tasks
                WHERE (date < $1 OR (date = $1 AND LEFT(CAST(time AS TEXT), 5) <= $2))
                AND assigned_to IS NOT NULL
                AND array_length(assigned_to, 1) > 0
            `, [dateStr, timeStr]);

            for (const task of tasksRes.rows) {
                for (const userId of task.assigned_to) {
                    const exists = await db.query(
                        `SELECT 1 FROM audit_logs 
                         WHERE user_id = $1 
                         AND action = 'TASK_PASSED' 
                         AND details LIKE $2 
                         LIMIT 1`,
                        [userId, `%task:${task.id}%`]
                    );

                    if (exists.rows.length === 0) {
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