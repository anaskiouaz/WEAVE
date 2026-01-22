import db from '../config/db.js';
import admin from '../config/firebase.js';

// Fonction utilitaire pour vérifier la disponibilité (pour les tâches)
function normalizeTime(timeStr) {
    if (!timeStr) return null;
    return timeStr.substring(0, 5);
}

function isUserAvailable(taskTime, start, end) {
    if (!start || !end) return true;
    const taskT = normalizeTime(taskTime);
    const startT = normalizeTime(start);
    const endT = normalizeTime(end);
    return taskT >= startT && taskT <= endT;
}

/**
 * Envoie une notification à tout un cercle (Tâches, Souvenirs, etc.)
 * Ajoute automatiquement : " (Cercle de [Nom Senior])" au titre.
 */
export async function notifyCircle(circleId, title, body, data, excludeUserId, taskTime = null) {
    try {
        // 1. Récupérer le nom du Senior pour ce cercle
        const seniorRes = await db.query(
            `SELECT u.name as senior_name 
             FROM care_circles c 
             JOIN users u ON c.senior_id = u.id 
             WHERE c.id = $1`, 
            [circleId]
        );
        const seniorName = seniorRes.rows[0]?.senior_name || 'Cercle';
        
        // 2. Enrichir le titre
        const enrichedTitle = `${title} (Cercle de ${seniorName})`;
        
        console.log(`🔔 [NOTIF] Vers "${seniorName}" | Titre: ${enrichedTitle}`);

        // 3. Récupérer les tokens des membres
        const query = `
            SELECT u.id, u.name, u.fcm_token, u.availability_start, u.availability_end
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1 
            AND u.fcm_token IS NOT NULL 
            AND u.fcm_token != ''
            AND u.id != $2
            UNION
            SELECT u.id, u.name, u.fcm_token, u.availability_start, u.availability_end
            FROM users u
            JOIN care_circles c ON u.id = c.created_by
            WHERE c.id = $1
            AND u.fcm_token IS NOT NULL 
            AND u.fcm_token != ''
            AND u.id != $2
        `;

        const res = await db.query(query, [circleId, excludeUserId || '00000000-0000-0000-0000-000000000000']);
        
        let validTokens = [];

        res.rows.forEach(user => {
            // Filtrage par disponibilité uniquement si une heure de tâche est fournie
            if (taskTime) {
                if (isUserAvailable(taskTime, user.availability_start, user.availability_end)) {
                    validTokens.push(user.fcm_token);
                }
            } else {
                validTokens.push(user.fcm_token);
            }
        });

        const uniqueTokens = [...new Set(validTokens)];

        if (uniqueTokens.length > 0) {
            const message = {
                notification: { title: enrichedTitle, body },
                data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK', circleId: circleId.toString() },
                tokens: uniqueTokens
            };
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`   ✅ Envoyé à ${response.successCount} appareils.`);
        }
    } catch (e) {
        console.error('❌ Erreur notifyCircle:', e);
    }
}