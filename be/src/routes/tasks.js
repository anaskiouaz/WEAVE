import db from '../config/db.js';
import admin from '../config/firebase.js';

export async function getTasks(req, res) {
  try {
    const result = await db.query(
      `SELECT t.*, c.senior_name 
       FROM tasks t
       LEFT JOIN care_circles c ON c.id = t.circle_id
       ORDER BY t.date ASC, t.time ASC`
    );
    
    res.json({ status: 'ok', data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function createTask(req, res) {
  try {
    const { date, time, title, task_type, helper_name, circle_id, required_helpers } = req.body;
    
    if (!date || !time || !title || !task_type) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // 1. Récupération du cercle (simplifié)
    let resolvedCircle = null;
    if (circle_id) {
      const specific = await db.query(`SELECT id, senior_name FROM care_circles WHERE id = $1`, [circle_id]);
      if (specific.rows.length) resolvedCircle = specific.rows[0];
    }
    
    if (!resolvedCircle) {
      const def = await db.query(`SELECT id, senior_name FROM care_circles LIMIT 1`);
      if (!def.rows.length) return res.status(400).json({ status: 'error', message: 'No care circle available' });
      resolvedCircle = def.rows[0];
    }

    const helperName = helper_name || 'À pourvoir';
    const quota = required_helpers ? parseInt(required_helpers, 10) : 1;
    
    // 2. Insertion en base
    const result = await db.query(
      `INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [resolvedCircle.id, title, task_type, date, time, quota, helperName]
    );

    const newTask = result.rows[0];

    // 3. Envoi de la notification générale
    // --- ENVOI NOTIFICATION (Debug Version) ---
    try {
        const recipients = await db.query(`SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''`);
        
        // On enlève les doublons
        const tokens = [...new Set(recipients.rows.map(r => r.fcm_token))];

        console.log(`🔍 Analyse notif: ${tokens.length} token(s) trouvé(s) en base.`); // <--- LIGNE DE DEBUG

        if (tokens.length > 0) {
            await admin.messaging().sendMulticast({
                tokens: tokens,
                notification: {
                    title: 'Nouvelle tâche',
                    body: `La tâche ${title} a été créée`,
                },
                data: { taskId: newTask.id.toString() }
            });
            console.log(`🔔 Notification envoyée à ${tokens.length} appareils.`);
        } else {
            console.log('⚠️ Aucune notification envoyée : Aucun téléphone enregistré dans la base de données.');
        }
    } catch (notifError) {
        console.error('⚠️ Erreur notif:', notifError.message);
    }
    // --------------------------

    res.status(201).json({
      status: 'ok',
      message: 'Task created',
      data: { ...newTask, senior_name: resolvedCircle.senior_name },
    });

  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ status: 'ok', message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}