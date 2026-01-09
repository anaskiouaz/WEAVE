import db from '../config/db.js';

/**
 * Middleware de sécurité (Le Vigile)
 * Il vérifie si l'utilisateur qui fait la demande a le bon grade.
 */
const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        // 1. On regarde qui frappe à la porte (Via l'ID dans l'en-tête pour l'instant)
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Accès refusé : Identifiez-vous (Header x-user-id manquant)." 
            });
        }

        try {
            // 2. On vérifie son rôle dans la base de données
            const result = await db.query('SELECT role_global FROM users WHERE id = $1', [userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Utilisateur inconnu au bataillon." });
            }

            const userRole = result.rows[0].role_global;

            // 3. Est-ce qu'il est assez gradé ?
            // Si on demande "SUPERADMIN", il faut être "SUPERADMIN".
            // (Tu pourras ajouter une logique plus complexe ici plus tard, genre ADMIN > USER)
            if (userRole === requiredRole) {
                next(); // ✅ C'est bon, le vigile ouvre la barrière
            } else {
                res.status(403).json({ 
                    success: false, 
                    message: `⛔ Accès interdit ! Cette zone est réservée aux '${requiredRole}'. Vous êtes '${userRole}'.` 
                });
            }

        } catch (error) {
            console.error('Erreur du vigile:', error);
            res.status(500).json({ success: false, error: "Erreur serveur lors de la vérification." });
        }
    };
};

export default checkRole;