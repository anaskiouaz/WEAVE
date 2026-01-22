import db from '../config/db.js';
import { notifyCircle } from '../utils/notifications.js';
import { Router } from 'express';
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const router = Router();

// --- UTILITAIRES DE DATE & HEURE ---

const DAY_MAPPING = {
    'Monday': 'Lundi',
    'Tuesday': 'Mardi',
    'Wednesday': 'Mercredi',
    'Thursday': 'Jeudi',
    'Friday': 'Vendredi',
    'Saturday': 'Samedi',
    'Sunday': 'Dimanche'
};

// --- ROUTES ---

// Inscription
router.post('/:id/volunteer', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'User not found' });
        const userName = userRes.rows[0].name;

        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (taskRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });
        const currentTask = taskRes.rows[0];

        if (currentTask.assigned_to && currentTask.assigned_to.includes(userId)) {
            return res.status(400).json({ status: 'error', message: 'Déjà inscrit' });
        }

        let newHelperName = currentTask.helper_name;
        if (!newHelperName || newHelperName === 'À pourvoir') newHelperName = userName;
        else newHelperName = `${newHelperName}, ${userName}`;

        const updateRes = await db.query(
            `UPDATE tasks SET assigned_to = array_append(assigned_to, $1), helper_name = $2 WHERE id = $3 RETURNING *`,
            [userId, newHelperName, id]
        );
        const updatedTask = updateRes.rows[0];

        const remaining = (updatedTask.required_helpers || 1) - updatedTask.assigned_to.length;
        const statusText = remaining > 0 ? `reste ${remaining} place(s)` : `c'est complet !`;

        await notifyCircle(
            updatedTask.circle_id,
            "Nouveau volontaire 💪",
            `${userName} participe à "${updatedTask.title}". ${statusText}`,
            { taskId: updatedTask.id.toString(), type: 'task_updated' },
            userId,
            null, null, null // Pas de filtre pour informer tout le monde
        );

        await logAudit(userId, AUDIT_ACTIONS.TASK_VOLUNTEERED, `${userName} inscrit à "${updatedTask.title}"`, updatedTask.circle_id);
        res.json({ status: 'ok', data: updatedTask });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Désinscription
router.delete('/:id/volunteer', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; 

        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });
        
        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        const userName = userRes.rows[0]?.name || 'Quelqu\'un';

        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (taskRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });
        const task = taskRes.rows[0];

        if (!task.assigned_to || !task.assigned_to.includes(userId)) return res.status(400).json({ status: 'error', message: 'Pas inscrit' });

        const newAssignedTo = task.assigned_to.filter(uid => uid !== userId);
        let newHelperName = 'À pourvoir';
        if (newAssignedTo.length > 0) {
            const namesRes = await db.query('SELECT name FROM users WHERE id = ANY($1)', [newAssignedTo]);
            newHelperName = namesRes.rows.map(r => r.name).join(', ');
        }

        const updateRes = await db.query(
            `UPDATE tasks SET assigned_to = array_remove(assigned_to, $1), helper_name = $2 WHERE id = $3 RETURNING *`,
            [userId, newHelperName, id]
        );
        const updatedTask = updateRes.rows[0];

        // Notif désistement : on cible les remplaçants potentiels
        await notifyCircle(
            updatedTask.circle_id,
            "Place libérée ⚠️",
            `${userName} s'est désisté de "${updatedTask.title}". Une place est dispo !`,
            { taskId: updatedTask.id.toString(), type: 'task_updated' },
            userId,
            updatedTask.time, updatedTask.date, updatedTask.task_type
        );

        await logAudit(userId, AUDIT_ACTIONS.TASK_UPDATED, `${userName} désinscrit de "${updatedTask.title}"`, updatedTask.circle_id);
        res.json({ status: 'ok', data: updatedTask });

    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

router.get('/', async (req, res) => {
    try {
        const result = await db.query(`SELECT t.*, u.name AS senior_name FROM tasks t LEFT JOIN care_circles c ON c.id = t.circle_id LEFT JOIN users u ON c.senior_id = u.id ORDER BY t.date ASC, t.time ASC`);
        res.json({ status: 'ok', data: result.rows });
    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { date, time, title, task_type, helper_name, circle_id, required_helpers } = req.body;
        
        let resolvedCircleId = circle_id;
        if (!resolvedCircleId) {
             const def = await db.query('SELECT id FROM care_circles LIMIT 1');
             resolvedCircleId = def.rows[0]?.id;
        }

        const helperName = helper_name || 'À pourvoir';
        const quota = required_helpers || 1;

        const result = await db.query(
            `INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [resolvedCircleId, title, task_type, date, time, quota, helperName]
        );
        const newTask = result.rows[0];

        await notifyCircle(
            resolvedCircleId,
            `Nouvelle activité : ${time}`,
            `Besoin d'aide : ${title}`,
            { taskId: newTask.id.toString(), type: 'task_created' },
            null,
            time, date, task_type
        );

        res.status(201).json({ status: 'ok', message: 'Task created', data: newTask });
    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
        res.json({ status: 'ok' });
    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// Routes validation (inchangées)
router.post('/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const { validatedBy } = req.body;
        const taskRes = await db.query(`SELECT id, title, circle_id, assigned_to, completed FROM tasks WHERE id = $1`, [id]);
        if (taskRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });
        const task = taskRes.rows[0];
        if (task.completed) return res.status(400).json({ status: 'error', message: 'Task already validated' });
        const assigned = Array.isArray(task.assigned_to) ? task.assigned_to : [];
        await Promise.all(assigned.map(uid => logAudit(uid, AUDIT_ACTIONS.TASK_PASSED, `Intervention validée: "${task.title}"`, task.circle_id)));
        if (validatedBy) await logAudit(validatedBy, 'TASK_VALIDATED', `Tâche validée: "${task.title}"`, task.circle_id);
        await db.query(`UPDATE tasks SET completed = true WHERE id = $1`, [id]);
        res.json({ status: 'ok', message: 'Task validated', data: { id: task.id, validated_count: assigned.length } });
    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

router.post('/:id/unvalidate', async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelledBy } = req.body;
        const taskRes = await db.query(`SELECT id, title, circle_id, completed, assigned_to FROM tasks WHERE id = $1`, [id]);
        if (taskRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });
        const task = taskRes.rows[0];
        if (!task.completed) return res.status(400).json({ status: 'error', message: 'Task not validated yet' });
        const assigned = Array.isArray(task.assigned_to) ? task.assigned_to : [];
        await db.query(`UPDATE tasks SET completed = false WHERE id = $1`, [id]);
        if (assigned.length > 0) {
            for (const uid of assigned) {
                const auditRes = await db.query(`SELECT id FROM audit_logs WHERE user_id = $1 AND action = $2 AND details ILIKE $3 AND circle_id = $4 ORDER BY created_at DESC LIMIT 1`, [uid, 'TASK_PASSED', `%${task.title}%`, task.circle_id]);
                if (auditRes.rows.length > 0) await db.query(`DELETE FROM audit_logs WHERE id = $1`, [auditRes.rows[0].id]);
            }
        }
        if (cancelledBy) await logAudit(cancelledBy, 'TASK_UNVALIDATED', `Validation annulée: "${task.title}"`, task.circle_id);
        res.json({ status: 'ok', message: 'Task validation cancelled', data: { id: task.id } });
    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

export default router;