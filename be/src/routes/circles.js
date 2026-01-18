import { Router } from 'express';
import db from '../config/db.js'; 
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. RÉCUPÉRER MES CERCLES
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT 
                c.id, c.invite_code, ur.role,
                COALESCE(u.name, 'Cercle sans nom') as name,
                u.name as senior_name
            FROM care_circles c
            JOIN user_roles ur ON c.id = ur.circle_id
            LEFT JOIN users u ON c.senior_id = u.id
            WHERE ur.user_id = $1
            ORDER BY c.created_at DESC
        `;
        const { rows } = await db.query(query, [userId]);
        res.json(rows);
    } catch (err) {
        console.error("Erreur cercles:", err);
        res.status(500).json({ error: "Impossible de charger les cercles" });
    }
});

// 2. CRÉER UN CERCLE (Correction ici)
router.post('/', authenticateToken, async (req, res) => {
    const client = await db.connect(); 
    try {
        await client.query('BEGIN');
        
        const userId = req.user.id;
        const { senior_info } = req.body;

        if (!senior_info || !senior_info.name) {
            throw new Error("Le nom du bénéficiaire est obligatoire");
        }

        const seniorEmailVal = senior_info.email || `senior_${Date.now()}@weave.local`;

        // 1. Création du Senior (Role USER)
        const seniorRes = await client.query(
            `INSERT INTO users (name, email, role_global) VALUES ($1, $2, 'USER') RETURNING id`,
            [senior_info.name, seniorEmailVal]
        );
        const seniorId = seniorRes.rows[0].id;

        const inviteCode = 'W-' + Math.random().toString(36).substring(2, 7).toUpperCase();

        // ✅ CORRECTION ICI : On ajoute "created_by"
        const circleRes = await client.query(
            `INSERT INTO care_circles (senior_id, created_by, invite_code) VALUES ($1, $2, $3) RETURNING id`,
            [seniorId, userId, inviteCode]
        );
        const circleId = circleRes.rows[0].id;

        // 3. Le créateur devient ADMIN
        await client.query(
            `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'ADMIN')`,
            [userId, circleId]
        );

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            circle_id: circleId, 
            circle_name: senior_info.name 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Erreur Création Cercle:", err);
        res.status(500).json({ error: "Erreur lors de la création : " + err.message });
    } finally {
        client.release();
    }
});

// 3. REJOINDRE
router.post('/join', authenticateToken, async (req, res) => {
    try {
        const { invite_code } = req.body;
        const userId = req.user.id;

        const circleRes = await db.query(`SELECT id, senior_id FROM care_circles WHERE invite_code = $1`, [invite_code]);
        if (circleRes.rows.length === 0) return res.status(404).json({ error: "Code invalide" });
        
        const circle = circleRes.rows[0];
        
        const check = await db.query(`SELECT 1 FROM user_roles WHERE user_id = $1 AND circle_id = $2`, [userId, circle.id]);
        if (check.rows.length > 0) return res.status(400).json({ error: "Vous êtes déjà membre" });

        await db.query(
            `INSERT INTO user_roles (user_id, circle_id, role) VALUES ($1, $2, 'HELPER')`,
            [userId, circle.id]
        );

        const seniorRes = await db.query(`SELECT name FROM users WHERE id = $1`, [circle.senior_id]);
        res.json({ success: true, circle_id: circle.id, circle_name: seniorRes.rows[0]?.name });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 4. MEMBRES
router.get('/:id/members', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const check = await db.query('SELECT 1 FROM user_roles WHERE user_id = $1 AND circle_id = $2', [req.user.id, id]);
        if (check.rows.length === 0) return res.status(403).json({ error: "Accès refusé" });

        const query = `
            SELECT u.id, u.name, u.email, ur.role
            FROM user_roles ur
            JOIN users u ON ur.user_id = u.id
            WHERE ur.circle_id = $1
            ORDER BY ur.role ASC, u.name ASC
        `;
        const { rows } = await db.query(query, [id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 5. SUPPRIMER UN MEMBRE DU CERCLE
router.delete('/:circleId/members/:userIdToRemove', authenticateToken, async (req, res) => {
    const { circleId, userIdToRemove } = req.params;
    const requesterId = req.user.id;

    try {
        // 1. Vérifier que celui qui demande est bien ADMIN du cercle
        const adminCheck = await db.query(
            'SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2',
            [requesterId, circleId]
        );
        
        if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
            return res.status(403).json({ error: "Seul un admin peut supprimer des membres." });
        }

        // 2. On ne peut pas se supprimer soi-même via ce bouton (il faut quitter le cercle)
        if (requesterId === userIdToRemove) {
            return res.status(400).json({ error: "Vous ne pouvez pas vous bannir vous-même." });
        }

        // 3. Suppression
        await db.query(
            'DELETE FROM user_roles WHERE circle_id = $1 AND user_id = $2',
            [circleId, userIdToRemove]
        );

        res.json({ success: true, message: "Membre retiré du cercle." });

    } catch (err) {
        console.error("Erreur suppression membre:", err);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// 6. SUPPRIMER LE CERCLE DÉFINITIVEMENT
router.delete('/:circleId', authenticateToken, async (req, res) => {
    const { circleId } = req.params;
    const requesterId = req.user.id;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Vérif Admin
        const adminCheck = await client.query(
            'SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2',
            [requesterId, circleId]
        );
        
        if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
            return res.status(403).json({ error: "Seul un admin peut supprimer le cercle." });
        }

        // 2. Suppressions en cascade
        // D'abord les rôles
        await client.query('DELETE FROM user_roles WHERE circle_id = $1', [circleId]);
        // Puis les logs (si tu veux nettoyer)
        // await client.query('DELETE FROM audit_logs WHERE ...'); 
        
        // Enfin le cercle lui-même
        await client.query('DELETE FROM care_circles WHERE id = $1', [circleId]);

        await client.query('COMMIT');
        res.json({ success: true, message: "Cercle supprimé définitivement." });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erreur suppression cercle:", err);
        res.status(500).json({ error: "Erreur serveur." });
    } finally {
        client.release();
    }
});


export default router;