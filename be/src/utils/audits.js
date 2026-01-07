import db from '../config/db.js';

/**
 * Enregistre une action dans la table audit_logs
 * @param {string} userId - L'ID de l'utilisateur qui fait l'action
 * @param {string} action - Le code de l'action (ex: 'VIEW_SENSITIVE')
 * @param {string} details - Une description lisible
 */
export const logAudit = async (userId, action, details) => {
    try {
        await db.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [userId, action, details]
        );
        console.log(`📝 Audit: [${action}] par ${userId}`);
    } catch (error) {
        console.error("❌ Erreur lors de l'enregistrement de l'audit:", error);
        // On ne plante pas l'appli si le log échoue, mais on l'affiche
    }
};