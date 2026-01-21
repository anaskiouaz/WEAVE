import db from '../config/db.js';
import admin from '../config/firebase.js';
import { Router } from 'express';
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const router = Router();

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
          t.id,
          t.circle_id,
          t.date,
          t.time,
          t.title,
          t.task_type,
          t.helper_name,
          t.assigned_to,
          t.required_helpers,
          t.completed,
          u.name AS senior_name
         FROM tasks t
         LEFT JOIN care_circles c ON c.id = t.circle_id
         LEFT JOIN users u ON c.senior_id = u.id
         ORDER BY t.date ASC, t.time ASC`
        );

        res.json({ status: 'ok', data: result.rows, count: result.rows.length });
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Create a task
router.post('/', async (req, res) => {
    try {
        const { date, time, title, task_type, helper_name, circle_id, required_helpers } = req.body;

        if (!date || !time || !title || !task_type) {
            return res.status(400).json({ status: 'error', message: 'Missing required fields' });
        }

        let resolvedCircle = null;
        if (circle_id) {
            const specificCircle = await db.query(`SELECT c.id, u.name AS senior_name FROM care_circles c LEFT JOIN users u ON c.senior_id = u.id WHERE c.id = $1`, [circle_id]);
            if (!specificCircle.rows.length) return res.status(400).json({ status: 'error', message: 'Care circle not found' });
            resolvedCircle = specificCircle.rows[0];
        } else {
            const defaultCircle = await db.query(`SELECT c.id, u.name AS senior_name FROM care_circles c LEFT JOIN users u ON c.senior_id = u.id ORDER BY c.created_at ASC LIMIT 1`);
            if (!defaultCircle.rows.length) return res.status(400).json({ status: 'error', message: 'No care circle available' });
            resolvedCircle = defaultCircle.rows[0];
        }

        const helperName = helper_name || 'À pourvoir';
        const quota = required_helpers ? parseInt(required_helpers, 10) : 1;

        const result = await db.query(
            `INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name, completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false)
           RETURNING id, circle_id, title, task_type, date, time, required_helpers, helper_name, assigned_to, completed`,
            [resolvedCircle.id, title, task_type, date, time, quota, helperName]
        );

        res.status(201).json({ status: 'ok', message: 'Task created', data: { ...result.rows[0], senior_name: resolvedCircle.senior_name } });
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Volunteer for a task
router.post('/:id/volunteer', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'User not found' });
        const userName = userRes.rows[0].name;

        const taskRes = await db.query('SELECT helper_name, assigned_to, required_helpers, title, circle_id FROM tasks WHERE id = $1', [id]);
        if (taskRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });

        const currentTask = taskRes.rows[0];
        const currentVolunteersCount = currentTask.assigned_to ? currentTask.assigned_to.length : 0;

        if (currentTask.required_helpers && currentVolunteersCount >= currentTask.required_helpers) {
            return res.status(400).json({ status: 'error', message: 'Task is full (quota reached)' });
        }

        if (currentTask.assigned_to && currentTask.assigned_to.includes(userId)) {
            return res.status(400).json({ status: 'error', message: 'You are already volunteered' });
        }

        let newHelperName = currentTask.helper_name;
        if (newHelperName === 'À pourvoir' || !newHelperName) newHelperName = userName;
        else newHelperName = `${newHelperName}, ${userName}`;

        const updateRes = await db.query(
            `UPDATE tasks SET assigned_to = array_append(assigned_to, $1), helper_name = $2 WHERE id = $3 RETURNING *`,
            [userId, newHelperName, id]
        );

        const task = updateRes.rows[0];
        await logAudit(userId, AUDIT_ACTIONS.TASK_VOLUNTEERED, `${userName} s'est engagé(e) sur \"${task.title}\"`, task.circle_id);

        res.json({ status: 'ok', message: 'Volunteer added', data: task });
    } catch (err) {
        console.error('Error volunteering:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Unvolunteer (withdraw) from a task
router.post('/:id/unvolunteer', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        // Remove user from assigned_to
        const removeRes = await db.query(`UPDATE tasks SET assigned_to = array_remove(assigned_to, $1) WHERE id = $2 RETURNING *`, [userId, id]);
        if (removeRes.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });

        let task = removeRes.rows[0];

        // Recompute helper_name based on remaining assigned_to
        const assigned = task.assigned_to || [];
        if (assigned.length === 0) {
            await db.query(`UPDATE tasks SET helper_name = $1 WHERE id = $2`, ['À pourvoir', id]);
            task.helper_name = 'À pourvoir';
        } else {
            // Fetch names of remaining users
            const namesRes = await db.query(`SELECT name FROM users WHERE id = ANY($1::uuid[])`, [assigned]);
            const names = namesRes.rows.map(r => r.name);
            const newHelperName = names.join(', ');
            await db.query(`UPDATE tasks SET helper_name = $1 WHERE id = $2`, [newHelperName, id]);
            task.helper_name = newHelperName;
        }

        await logAudit(userId, AUDIT_ACTIONS.TASK_WITHDRAWN, `Utilisateur retiré de la tâche \"${task.title}\"`, task.circle_id);

        res.json({ status: 'ok', message: 'Unvolunteered', data: task });
    } catch (err) {
        console.error('Error unvolunteering:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Delete a task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ status: 'ok', message: 'Task deleted' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;
 
// Validate a task: increment interventions for assigned users via audit logs (one-time only)
router.post('/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const { validatedBy } = req.body;

        const taskRes = await db.query(
            `SELECT id, title, circle_id, assigned_to, completed FROM tasks WHERE id = $1`,
            [id]
        );
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const task = taskRes.rows[0];

        // Prevent double validation
        if (task.completed) {
            return res.status(400).json({ status: 'error', message: 'Task already validated' });
        }

        const assigned = Array.isArray(task.assigned_to) ? task.assigned_to : [];

        // Log one TASK_PASSED per assigned helper to increment their personal counter
        await Promise.all(
            assigned.map(uid =>
                logAudit(uid, AUDIT_ACTIONS.TASK_PASSED, `Intervention validée: "${task.title}"`, task.circle_id)
            )
        );

        // Optionally audit the validation action itself
        if (validatedBy) {
            await logAudit(validatedBy, 'TASK_VALIDATED', `Tâche validée: "${task.title}"`, task.circle_id);
        }

        // Mark task as completed to prevent re-validation
        await db.query(`UPDATE tasks SET completed = true WHERE id = $1`, [id]);

        res.json({ status: 'ok', message: 'Task validated', data: { id: task.id, validated_count: assigned.length } });
    } catch (err) {
        console.error('Error validating task:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Unvalidate a task: revert completion flag
router.post('/:id/unvalidate', async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelledBy } = req.body;

        const taskRes = await db.query(
            `SELECT id, title, circle_id, completed FROM tasks WHERE id = $1`,
            [id]
        );

        if (taskRes.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const task = taskRes.rows[0];

        if (!task.completed) {
            return res.status(400).json({ status: 'error', message: 'Task not validated yet' });
        }

        // Get assigned users before marking as incomplete
        const assigned = Array.isArray(task.assigned_to) ? task.assigned_to : [];

        await db.query(`UPDATE tasks SET completed = false WHERE id = $1`, [id]);

        // Remove TASK_PASSED audits for each assigned helper to decrement their counter
        if (assigned.length > 0) {
            for (const uid of assigned) {
                // Find and delete the most recent TASK_PASSED audit for this user on this task
                const auditRes = await db.query(
                    `SELECT id FROM audit_logs WHERE user_id = $1 AND action = $2 AND details ILIKE $3 AND circle_id = $4 ORDER BY created_at DESC LIMIT 1`,
                    [uid, 'TASK_PASSED', `%${task.title}%`, task.circle_id]
                );
                if (auditRes.rows.length > 0) {
                    await db.query(`DELETE FROM audit_logs WHERE id = $1`, [auditRes.rows[0].id]);
                }
            }
        }

        if (cancelledBy) {
            await logAudit(cancelledBy, 'TASK_UNVALIDATED', `Validation annulée: "${task.title}"`, task.circle_id);
        }

        res.json({ status: 'ok', message: 'Task validation cancelled', data: { id: task.id } });
    } catch (err) {
        console.error('Error unvalidating task:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});