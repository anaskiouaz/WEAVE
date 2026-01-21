import cron from 'node-cron';
import db from '../config/db.js';
import admin from '../config/firebase.js'; // Assure-toi que le chemin est bon
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const initCronJobs = () => {
    console.log("🕰️ Service de rappels (Cron) activé - Vérification chaque minute");

    // Vérifie chaque minute ("* * * * *")
    cron.schedule('* * * * *', async () => {
        try {
            // 1. Calculer l'heure cible (Maintenant + 30 min)
            const targetDate = new Date();
            targetDate.setMinutes(targetDate.getMinutes() + 30);

            // 2. CORRECTION DATE : Utiliser la date LOCALE (comme getHours) et pas UTC
            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`; // Format YYYY-MM-DD Local

            // 3. Heure format HH:MM
            const hours = String(targetDate.getHours()).padStart(2, '0');
            const minutes = String(targetDate.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            // console.log(`🔍 Scan des rappels pour : ${dateStr} à ${timeStr}`);

            // 4. CORRECTION SQL : Remplacer 'due_date' par 'date'
            const query = `
                SELECT * FROM tasks 
                WHERE date = $1 
                AND LEFT(CAST(time AS TEXT), 5) = $2 
                AND reminder_sent = FALSE
            `;
            
            const result = await db.query(query, [dateStr, timeStr]);

            if (result.rows.length > 0) {
                console.log(`⚡ ${result.rows.length} rappel(s) trouvé(s) !`);
                
                // Récupérer les tokens (On envoie à tout le monde pour l'instant)
                const userTokens = await db.query("SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''");
                const tokens = [...new Set(userTokens.rows.map(r => r.fcm_token))];

                if (tokens.length === 0) {
                    console.log("⚠️ Aucun appareil enregistré pour recevoir la notif.");
                    return;
                }

                // Boucle sur chaque tâche trouvée
                for (const task of result.rows) {
                    const message = {
                        notification: {
                            title: '⏰ Rappel : Activité dans 30 min',
                            body: `Préparez-vous pour : ${task.title}`
                        },
                        // On ajoute des data pour pouvoir rediriger l'user au clic
                        data: { 
                            taskId: task.id.toString(), 
                            type: 'reminder',
                            click_action: 'FLUTTER_NOTIFICATION_CLICK'
                        },
                        tokens: tokens
                    };

                    try {
                        const response = await admin.messaging().sendEachForMulticast(message);
                        console.log(`✅ Rappel envoyé (${response.successCount} succès) pour "${task.title}"`);
                        
                        // Marquer comme "Envoyé"
                        await db.query('UPDATE tasks SET reminder_sent = TRUE WHERE id = $1', [task.id]);
                    } catch (sendError) {
                        console.error("❌ Erreur envoi Firebase:", sendError);
                    }
                }
            }

        } catch (err) {
            console.error("❌ Erreur Cron:", err.message);
        }
    });

    // Nouveau job: journaliser les tâches passées pour les aidants inscrits
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hour = String(now.getHours()).padStart(2, '0');
            const minute = String(now.getMinutes()).padStart(2, '0');

            const dateStr = `${year}-${month}-${day}`;
            const timeStr = `${hour}:${minute}`;

            // Sélectionner les tâches dont la date est aujourd'hui et l'heure <= maintenant, ou dates antérieures
            const tasksRes = await db.query(`
                SELECT id, circle_id, title, date, time, assigned_to
                FROM tasks
                WHERE (
                    date < $1
                    OR (date = $1 AND LEFT(CAST(time AS TEXT), 5) <= $2)
                )
                AND assigned_to IS NOT NULL
            `, [dateStr, timeStr]);

            for (const task of tasksRes.rows) {
                const assigned = Array.isArray(task.assigned_to) ? task.assigned_to : [];
                if (assigned.length === 0) continue;

                // Pour chaque aidant inscrit, enregistrer un audit TASK_PASSED une seule fois par tâche
                for (const userId of assigned) {
                    const existsRes = await db.query(
                        `SELECT 1 FROM audit_logs WHERE user_id = $1 AND action = 'TASK_PASSED' AND details LIKE $2 LIMIT 1`,
                        [userId, `%task:${task.id}%`]
                    );
                    if (existsRes.rows.length > 0) continue; // déjà journalisé

                    // Récupérer le nom pour le détail (optionnel)
                    let userName = 'Utilisateur';
                    try {
                        const u = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
                        userName = u.rows[0]?.name || userName;
                    } catch {}

                    const details = `${userName} a passé la tâche "${task.title}" (task:${task.id})`;
                    await logAudit(userId, AUDIT_ACTIONS.TASK_PASSED, details, task.circle_id);
                }
            }
        } catch (err) {
            console.error('❌ Erreur Cron TASK_PASSED:', err.message);
        }
    });
};

export default initCronJobs;