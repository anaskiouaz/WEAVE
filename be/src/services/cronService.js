import cron from 'node-cron';
import db from '../config/db.js';
import admin from 'firebase-admin';

const initCronJobs = () => {
    console.log("Service de rappels (Cron) démarré...");

    // Vérifie chaque minute ("* * * * *")
    cron.schedule('* * * * *', async () => {
        try {
            // Calculer l'heure cible (Maintenant + 30 min)
            const targetDate = new Date();
            targetDate.setMinutes(targetDate.getMinutes() + 30);

            // Date format: YYYY-MM-DD
            const dateStr = targetDate.toISOString().split('T')[0]; 
            
            // Heure format: HH:MM (On force 2 chiffres, ex: "09:05")
            const hours = String(targetDate.getHours()).padStart(2, '0');
            const minutes = String(targetDate.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            // Chercher les tâches qui matchent ET qui n'ont pas encore été notifiées
            const query = `
                SELECT * FROM tasks 
                WHERE due_date = $1 
                AND LEFT(CAST(time AS TEXT), 5) = $2 
                AND reminder_sent = FALSE
            `;
            
            const result = await db.query(query, [dateStr, timeStr]);

            if (result.rows.length > 0) {
                console.log(`${result.rows.length} rappel(s) à envoyer !`);
                
                // Récupérer les tokens des utilisateurs
                const userTokens = await db.query("SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''");
                const tokens = [...new Set(userTokens.rows.map(r => r.fcm_token))];

                if (tokens.length === 0) return;

                // Boucle sur chaque tâche trouvée
                for (const task of result.rows) {
                    const message = {
                        notification: {
                            title: 'Rappel : Tâche dans 30 min !!',
                            body: `N'oubliez pas : ${task.title} à ${task.time}`
                        },
                        data: { taskId: task.id.toString(), type: 'reminder' },
                        tokens: tokens
                    };

                    // Envoi Firebase
                    await admin.messaging().sendEachForMulticast(message);
                    console.log(`Rappel envoyé pour la tâche "${task.title}"`);

                    // Marquer comme "Envoyé" pour ne pas spammer
                    await db.query('UPDATE tasks SET reminder_sent = TRUE WHERE id = $1', [task.id]);
                }
            }

        } catch (err) {
            console.error("Erreur Cron:", err.message);
        }
    });
};

export default initCronJobs;