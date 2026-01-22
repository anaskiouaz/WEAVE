import db from '../config/db.js';
import admin from '../config/firebase.js';

const DAY_MAPPING = {
    'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi',
    'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche'
};

function getDayNameEn(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' }); 
}

// Vérifie si l'heure est dans les créneaux (compatible String "08:00-12:00" ou JSON)
function isTimeInSlots(timeStr, slots) {
    if (!slots) return false;
    const time = timeStr.substring(0, 5);
    
    if (typeof slots === 'string') {
        const parts = slots.split('-').map(s => s.trim());
        if (parts.length >= 2) {
            const start = parts[0].substring(0, 5);
            const end = parts[1].substring(0, 5);
            if (end < start) return time >= start || time <= end;
            return time >= start && time <= end;
        }
        return false;
    }
    if (Array.isArray(slots)) {
        return slots.some(slot => {
            if (!slot.start || !slot.end) return false;
            const start = slot.start.substring(0, 5);
            const end = slot.end.substring(0, 5);
            if (end < start) return time >= start || time <= end;
            return time >= start && time <= end;
        });
    }
    return false;
}

/**
 * Fonction de notification unifiée et intelligente.
 * - Gère les souvenirs (pas de date/heure) -> Envoie à tout le cercle.
 * - Gère les tâches (date/heure/skill) -> Filtre selon dispo et compétence.
 */
export async function notifyCircle(circleId, title, body, data, excludeUserId, taskTime = null, taskDate = null, requiredSkill = null) {
    try {
        // 1. Récupérer le nom du Senior pour le titre
        const seniorRes = await db.query(
            `SELECT u.name as senior_name 
             FROM care_circles c 
             JOIN users u ON c.senior_id = u.id 
             WHERE c.id = $1`, 
            [circleId]
        );
        const seniorName = seniorRes.rows[0]?.senior_name || 'Cercle';
        const enrichedTitle = `${title} (Cercle de ${seniorName})`;

        console.log(`🔔 [NOTIF] Vers "${seniorName}" | Contexte: ${taskDate ? 'Tâche' : 'Info/Souvenir'}`);

        // 2. Requête puissante qui récupère aussi les dispos et skills (Table user_availability)
        const query = `
            SELECT u.id, u.name, u.fcm_token, u.skills,
                   (
                       SELECT json_agg(ua.*) 
                       FROM user_availability ua 
                       WHERE ua.user_id = u.id AND ua.circle_id = $1
                   ) as availabilities
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1 
            AND u.fcm_token IS NOT NULL 
            AND u.fcm_token != ''
            AND u.id != $2
            UNION ALL
            SELECT u.id, u.name, u.fcm_token, u.skills,
                   (
                       SELECT json_agg(ua.*) 
                       FROM user_availability ua 
                       WHERE ua.user_id = u.id AND ua.circle_id = $1
                   ) as availabilities
            FROM users u
            JOIN care_circles c ON u.id = c.created_by
            WHERE c.id = $1
            AND u.fcm_token IS NOT NULL 
            AND u.fcm_token != ''
            AND u.id != $2
        `;

        const res = await db.query(query, [circleId, excludeUserId || '00000000-0000-0000-0000-000000000000']);
        
        let validTokens = [];
        let processedUserIds = new Set(); 
        
        let taskDayEn = null;
        let taskDayFr = null;
        
        if (taskDate) {
            taskDayEn = getDayNameEn(taskDate);      
            taskDayFr = DAY_MAPPING[taskDayEn];      
        }

        res.rows.forEach(user => {
            // Éviter les doublons (UNION ALL peut en créer si user est admin et membre)
            if (processedUserIds.has(user.id)) return;
            processedUserIds.add(user.id);

            // A. FILTRE COMPÉTENCE (Seulement si requis)
            if (requiredSkill) {
                const userSkills = user.skills || [];
                const hasSkill = userSkills.some(s => s.trim().toLowerCase() === requiredSkill.trim().toLowerCase());
                if (!hasSkill) return; 
            }

            // B. FILTRE DISPONIBILITÉ (Seulement si c'est une tâche avec date/heure)
            if (taskTime && taskDate && user.availabilities) {
                const dailyAvail = user.availabilities.find(a => 
                    a.day_of_week === taskDayEn || a.day_of_week === taskDayFr
                );
                
                if (!dailyAvail) return; // Pas de dispo ce jour-là

                if (!isTimeInSlots(taskTime, dailyAvail.slots)) return; // Pas dispo à cette heure
            }
            
            // Si on arrive ici, c'est bon !
            validTokens.push(user.fcm_token);
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
        } else {
            console.log("   ⚠️ Aucun destinataire valide trouvé.");
        }
    } catch (e) {
        console.error('❌ Erreur notifyCircle:', e);
    }
}

export async function notifyConversation(conversationId, senderId, senderName, messageContent) {
    try {
        // 1. Récupérer les infos de la conversation (pour le titre)
        const convRes = await db.query(
            `SELECT type, nom FROM conversation WHERE id = $1`,
            [conversationId]
        );
        
        if (convRes.rows.length === 0) return;
        const conv = convRes.rows[0];

        // 2. Construire le titre et le corps
        let notifTitle = `Message de ${senderName}`;
        if (conv.type === 'GROUPE') {
            notifTitle = `${conv.nom} (Message de ${senderName})`;
        }

        const notifBody = messageContent.length > 100 
            ? messageContent.substring(0, 100) + '...' 
            : messageContent;

        console.log(`💬 [NOTIF MSG] Conversation ${conversationId} | De: ${senderName}`);

        // 3. Récupérer les tokens des participants (SAUF l'expéditeur)
        const recipientsRes = await db.query(
            `SELECT u.fcm_token 
             FROM participant_conversation pc
             JOIN users u ON pc.utilisateur_id = u.id
             WHERE pc.conversation_id = $1
             AND pc.utilisateur_id != $2
             AND u.fcm_token IS NOT NULL 
             AND u.fcm_token != ''`,
            [conversationId, senderId]
        );

        const tokens = recipientsRes.rows.map(r => r.fcm_token);
        const uniqueTokens = [...new Set(tokens)]; // Anti-doublon

        if (uniqueTokens.length > 0) {
            const message = {
                notification: { 
                    title: notifTitle, 
                    body: notifBody 
                },
                data: { 
                    type: 'new_message', 
                    conversationId: conversationId.toString(),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK' 
                },
                tokens: uniqueTokens
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`   ✅ Message push envoyé à ${response.successCount} participants.`);
        } else {
            console.log("   ⚠️ Aucun destinataire avec token pour ce message.");
        }

    } catch (error) {
        console.error("❌ Erreur notifyConversation:", error);
    }
}