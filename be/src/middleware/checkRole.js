import db from '../config/db.js';

const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        // CORRECTION : On récupère l'ID depuis le Token décodé (req.user), pas les headers
        if (!req.user || !req.user.id) {
             return res.status(401).json({ 
                success: false, 
                message: "Accès refusé : Token invalide ou utilisateur non identifié." 
            });
        }

        const userId = req.user.id;

        try {
            const result = await db.query('SELECT role_global FROM users WHERE id = $1', [userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
            }

            const userRole = result.rows[0].role_global;

            // Comparaison simple (à améliorer si tu as une hiérarchie)
            if (userRole === requiredRole || userRole === 'SUPERADMIN') { // Le Superadmin passe partout
                next();
            } else {
                res.status(403).json({ 
                    success: false, 
                    message: `⛔ Accès interdit ! Requis: '${requiredRole}'. Vous êtes: '${userRole}'.` 
                });
            }

        } catch (error) {
            console.error('Erreur checkRole:', error);
            res.status(500).json({ success: false, error: "Erreur serveur." });
        }
    };
};

export default checkRole;