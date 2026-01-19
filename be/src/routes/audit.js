import { Router } from 'express';
// ✅ CORRECTION ICI : On importe 'db' par défaut, sans accolades !
import db from '../config/db.js'; 
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Route pour récupérer les logs d'un cercle spécifique
router.get('/:circleId', authenticateToken, async (req, res) => {
    const { circleId } = req.params;
    const userId = req.user.id;

    try {
        // 1. SÉCURITÉ : Vérifier que le demandeur est bien ADMIN de ce cercle
        const authCheck = await db.query(
            `SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2`,
            [userId, circleId]
        );

        const role = authCheck.rows[0]?.role;
        const isGlobalAdmin = req.user.role_global === 'ADMIN';

        if (role !== 'ADMIN' && !isGlobalAdmin) {
            return res.status(403).json({ error: "Accès interdit aux logs de ce cercle" });
        }

        // 2. RÉCUPÉRATION FILTRÉE
        const query = `
            SELECT a.id, a.action, a.details, a.created_at, u.name as user_name
            FROM audit_logs a
            JOIN users u ON a.user_id = u.id::text 
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1
            ORDER BY a.created_at DESC
            LIMIT 50
        `;

        const { rows } = await db.query(query, [circleId]);
        res.json(rows);

    } catch (err) {
        console.error("Erreur logs:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default router;