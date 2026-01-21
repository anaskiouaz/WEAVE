import db from '../config/db.js';

/**
 * Enregistre une action dans la table audit_logs
 * @param {string} userId - L'ID de l'utilisateur qui fait l'action
 * @param {string} action - Le code de l'action (ex: 'MEMBER_JOINED', 'SOUVENIR_CREATED')
 * @param {string} details - Une description lisible
 * @param {string} circleId - L'ID du cercle concerné (optionnel)
 */
export const logAudit = async (userId, action, details, circleId = null) => {
    try {
        const safeUserId = userId || null;
        const safeCircleId = circleId || null;

        await db.query(
            `INSERT INTO audit_logs (user_id, action, details, circle_id) VALUES ($1, $2, $3, $4)`,
            [safeUserId, action, details, safeCircleId]
        );
        console.log(`📝 Audit: [${action}] par ${safeUserId || 'Anonyme'} - Cercle: ${safeCircleId || 'N/A'}`);
    } catch (error) {
        console.error("❌ Erreur lors de l'enregistrement de l'audit:", error);
        // On ne plante pas l'appli si le log échoue
    }
};

// Actions disponibles pour les logs
export const AUDIT_ACTIONS = {
    // Membres
    MEMBER_JOINED: 'MEMBER_JOINED',
    MEMBER_REMOVED: 'MEMBER_REMOVED',
    
    // Souvenirs
    SOUVENIR_CREATED: 'SOUVENIR_CREATED',
    SOUVENIR_DELETED: 'SOUVENIR_DELETED',
    
    // Commentaires
    COMMENT_ADDED: 'COMMENT_ADDED',
    COMMENT_DELETED: 'COMMENT_DELETED',
    
    // Tâches/Activités
    TASK_VOLUNTEERED: 'TASK_VOLUNTEERED',
    TASK_WITHDRAWN: 'TASK_WITHDRAWN',
    TASK_PASSED: 'TASK_PASSED',
    
    // Messages
    MESSAGE_SENT: 'MESSAGE_SENT',
    TASKS_CREATED: 'TASKS_CREATED',
    TASKS_DELETED: 'TASKS_DELETED',
};