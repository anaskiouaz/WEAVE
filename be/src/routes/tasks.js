import { Router } from 'express';
import db from '../config/db.js';
import admin from '../config/firebase.js';

// Imports pour l'Audit et la Sécurité
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audits.js';

const router = Router();

// --- 1. RÉCUPÉRER LES TÂCHES (CORRIGÉ POUR LA DATE) ---
router.get('/', authenticateToken, async (req, res) => {
    try {
        // MODIFICATION ICI : On utilise to_char(t.date, 'YYYY-MM-DD')
        // Cela force la date à rester une chaine de caractères fixe (ex: "2024-12-24")
        // sans conversion de fuseau horaire.
        const result = await db.query(
            `SELECT 
          t.id,
          t.circle_id,
          to_char(t.date, 'YYYY-MM-DD') as date, 
          t.time,
          t.title,
          t.task_type,
          t.helper_name,
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

// --- 2. CRÉER UNE TÂCHE ---
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, time, title, task_type, helper_name, circle_id, required_helpers } = req.body;

    if (!date || !time || !title || !task_type) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    let resolvedCircle = null;

    if (circle_id) {
      const specificCircle = await db.query(
        `SELECT c.id, u.name AS senior_name FROM care_circles c LEFT JOIN users u ON c.senior_id = u.id WHERE c.id = $1`,
        [circle_id]
      );     
      if (!specificCircle.rows.length) {
        return res.status(400).json({ status: 'error', message: 'Care circle not found' });
      }
      resolvedCircle = specificCircle.rows[0];
    } else {
      const defaultCircle = await db.query(
        `SELECT c.id, u.name AS senior_name FROM care_circles c LEFT JOIN users u ON c.senior_id = u.id ORDER BY c.created_at ASC LIMIT 1`
      );
      if (!defaultCircle.rows.length) {
        return res.status(400).json({ status: 'error', message: 'No care circle available.' });
      }
      resolvedCircle = defaultCircle.rows[0];
    }

    const helperName = helper_name || 'À pourvoir';
    const quota = required_helpers ? parseInt(required_helpers, 10) : 1;
    
    // Insertion
    const result = await db.query(
      `INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, circle_id, title, task_type, date, time, required_helpers, helper_name`,
      [resolvedCircle.id, title, task_type, date, time, quota, helperName]
    );

    // Audit Log
    await logAudit(
        userId, 
        'TASK_CREATE', 
        `Nouvelle tâche : "${title}" le ${date} à ${time}`
    );

    // Notifications Firebase
    const userTokens = await db.query("SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''");
    const tokens = [...new Set(userTokens.rows.map(r => r.fcm_token))];

    if (tokens.length > 0) {
        try {
            const message = {
                notification: {
                    title: `Nouvelle activité : ${time}`,
                    body: `Tâche ajoutée : ${title}`
                },
                data: { taskId: result.rows[0].id.toString(), type: 'task_created' },
                tokens: tokens
            };
            admin.messaging().sendEachForMulticast(message).catch(e => console.error("Erreur Firebase async:", e));
        } catch (e) {
            console.error('Erreur prépa Firebase:', e);
        }
    }

    res.status(201).json({
      status: 'ok',
      message: 'Task created',
      data: {
        ...result.rows[0],
        senior_name: resolvedCircle.senior_name,
      },
    });

    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- 3. SUPPRIMER UNE TÂCHE ---
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const check = await db.query('SELECT title FROM tasks WHERE id = $1', [id]);
    let taskTitle = "Tâche inconnue";
    
    if (check.rows.length > 0) {
        taskTitle = check.rows[0].title;
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    
    // Audit Log
    await logAudit(
        userId, 
        'TASK_DELETE', 
        `Suppression de la tâche : "${taskTitle}"`
    );

    res.json({ status: 'ok', message: 'Task deleted' });

    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;