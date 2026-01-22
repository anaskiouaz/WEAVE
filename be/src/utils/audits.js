/*
 * Système de logs d'audit - traçabilité des actions (affiché dans Admin)
 * 
 * Chaque action importante (nouveau membre, souvenir créé...) est enregistrée
 * Les logs sont filtrés par cercle : chaque admin ne voit que son cercle
 */
import db from '../config/db.js';

// Insère un log dans la table audit_logs
// Params : userId (qui), action (quoi), details (description), circleId (où)
export const logAudit = async (userId, action, details, circleId = null) => {
    try {
        await db.query(
            `INSERT INTO audit_logs (user_id, action, details, circle_id) VALUES ($1, $2, $3, $4)`,
            [userId || null, action, details, circleId || null]
        );
        console.log(`📝 Audit: [${action}] par ${userId || 'Anonyme'}`);
    } catch (error) {
        // On ne bloque pas l'app si le log échoue
        console.error("❌ Erreur audit:", error);
    }
};

// Actions disponibles (utilisées dans le backend + affichées dans Admin.jsx)
export const AUDIT_ACTIONS = {
    MEMBER_JOINED: 'MEMBER_JOINED',
    MEMBER_REMOVED: 'MEMBER_REMOVED',
    SOUVENIR_CREATED: 'SOUVENIR_CREATED',
    SOUVENIR_DELETED: 'SOUVENIR_DELETED',
    COMMENT_ADDED: 'COMMENT_ADDED',
    COMMENT_DELETED: 'COMMENT_DELETED',
    TASK_VOLUNTEERED: 'TASK_VOLUNTEERED',
    MESSAGE_SENT: 'MESSAGE_SENT'
};
