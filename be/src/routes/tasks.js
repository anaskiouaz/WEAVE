import db from '../config/db.js';
import admin from '../config/firebase.js';
import { Router } from 'express';
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const router = Router();


router.post('/:id/volunteer', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        // 1. Récupérer le nom de l'utilisateur
        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'User not found' });
        const userName = userRes.rows[0].name;

        // 2. Récupérer la tâche actuelle (AVEC required_helpers)
        // --- MODIF : On ajoute required_helpers dans le SELECT ---
        const taskRes = await db.query('SELECT helper_name, assigned_to, required_helpers FROM tasks WHERE id = $1', [id]);
        
        if (taskRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });

        const currentTask = taskRes.rows[0];
        
        // --- MODIF : Vérification du Quota ---
        // On compte combien il y a déjà d'inscrits (0 si null)
        const currentVolunteersCount = currentTask.assigned_to ? currentTask.assigned_to.length : 0;
        
        if (currentVolunteersCount >= currentTask.required_helpers) {
             return res.status(400).json({ status: 'error', message: 'Task is full (quota reached)' });
        }

        // Vérification si déjà inscrit
        if (currentTask.assigned_to && currentTask.assigned_to.includes(userId)) {
             return res.status(400).json({ status: 'error', message: 'You are already volunteered' });
        }

        // 3. Logique pour le texte affiché
        let newHelperName = currentTask.helper_name;
        if (newHelperName === 'À pourvoir' || !newHelperName) {
            newHelperName = userName;
        } else {
            newHelperName = `${newHelperName}, ${userName}`;
        }

        // 4. Update DB
        const updateRes = await db.query(
            `UPDATE tasks 
             SET assigned_to = array_append(assigned_to, $1),
                 helper_name = $2
             WHERE id = $3
             RETURNING *, circle_id`,
            [userId, newHelperName, id]
        );

        // 📝 Log de l'action
        const task = updateRes.rows[0];
        await logAudit(
            userId,
            AUDIT_ACTIONS.TASK_VOLUNTEERED,
            `${userName} s'est engagé(e) sur "${task.title}"`,
            task.circle_id
        );

        res.json({
            status: 'ok',
            message: 'Volunteer added',
            data: updateRes.rows[0]
        });

    } catch (err) {
        console.error('Error volunteering:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});


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
          t.assigned_to,  -- AJOUTÉ ICI : On récupère la liste des IDs
          t.required_helpers,
          u.name AS senior_name
         FROM tasks t
         LEFT JOIN care_circles c ON c.id = t.circle_id
         LEFT JOIN users u ON c.senior_id = u.id
         ORDER BY t.date ASC, t.time ASC`
        );

        res.json({
            status: 'ok',
            data: result.rows,
            count: result.rows.length,
        });
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({
            status: 'error',
            message: err.message,
        });
    }
});

// ... (La route POST '/' reste identique, je ne la copie pas pour gagner de la place) ...
router.post('/', async (req, res) => {
    // Ton code existant pour la création de tâche...
    // Assure-toi juste que ton INSERT inclut bien assigned_to DEFAULT '{}' si besoin, 
    // mais ta table le gère déjà par défaut.
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
        
        // Note: assigned_to prendra la valeur par défaut '{}' définie dans la DB
        const result = await db.query(
          `INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, circle_id, title, task_type, date, time, required_helpers, helper_name, assigned_to`,
          [resolvedCircle.id, title, task_type, date, time, quota, helperName]
        );

        // ... Ta logique de notification Firebase reste ici ...
        
        res.status(201).json({
          status: 'ok',
          message: 'Task created',
          data: { ...result.rows[0], senior_name: resolvedCircle.senior_name },
        });
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- NOUVELLE ROUTE : SE PORTER VOLONTAIRE ---
router.post('/:id/volunteer', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // On reçoit l'ID de l'utilisateur

        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'User ID is required' });
        }

        // 1. Récupérer le nom de l'utilisateur
        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const userName = userRes.rows[0].name;

        // 2. Récupérer la tâche actuelle pour voir le helper_name actuel
        const taskRes = await db.query('SELECT helper_name, assigned_to FROM tasks WHERE id = $1', [id]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        const currentTask = taskRes.rows[0];
        
        // Vérification si déjà inscrit (Optionnel mais recommandé)
        if (currentTask.assigned_to && currentTask.assigned_to.includes(userId)) {
             return res.status(400).json({ status: 'error', message: 'You are already volunteered' });
        }

        // 3. Logique pour le texte affiché (helper_name)
        let newHelperName = currentTask.helper_name;
        if (newHelperName === 'À pourvoir' || !newHelperName) {
            newHelperName = userName;
        } else {
            // Si quelqu'un est déjà dessus, on ajoute le nom à la suite
            newHelperName = `${newHelperName}, ${userName}`;
        }

        // 4. Mise à jour de la base de données
        // array_append : ajoute l'ID au tableau existant
        const updateRes = await db.query(
            `UPDATE tasks 
             SET assigned_to = array_append(assigned_to, $1),
                 helper_name = $2
             WHERE id = $3
             RETURNING *, circle_id`,
            [userId, newHelperName, id]
        );

        // 📝 Log de l'action
        const task = updateRes.rows[0];
        await logAudit(
            userId,
            AUDIT_ACTIONS.TASK_VOLUNTEERED,
            `${userName} s'est engagé(e) sur "${task.title}"`,
            task.circle_id
        );

        res.json({
            status: 'ok',
            message: 'Volunteer added',
            data: updateRes.rows[0]
        });

    } catch (err) {
        console.error('Error volunteering:', err);
        res.status(500).json({
            status: 'error',
            message: err.message,
        });
    }
});


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