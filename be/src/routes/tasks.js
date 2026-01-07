import db from '../config/db.js';
import db from '../config/db.js';
import admin from '../config/firebase.js';

export async function createTask(req, res) {
  try {
    const { date, time, title, task_type, helper_name, circle_id, required_helpers } = req.body;
    
    // Validation
    if (!date || !time || !title || !task_type) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // 1. Résolution du cercle (ton code existant)
    let resolvedCircle = null;
    if (circle_id) {
      const specificCircle = await db.query(
        `SELECT id, senior_name FROM care_circles WHERE id = $1`, [circle_id]
      );
      if (!specificCircle.rows.length) {
        return res.status(400).json({ status: 'error', message: 'Care circle not found' });
      }
      resolvedCircle = specificCircle.rows[0];
    } else {
      const defaultCircle = await db.query(
        `SELECT id, senior_name FROM care_circles ORDER BY created_at ASC LIMIT 1`
      );
      if (!defaultCircle.rows.length) {
        return res.status(400).json({ status: 'error', message: 'No care circle available.' });
      }
      resolvedCircle = defaultCircle.rows[0];
    }

    const helperName = helper_name || 'À pourvoir';
    const quota = required_helpers ? parseInt(required_helpers, 10) : 1;

    // 2. Création de la tâche (ton code existant)
    const result = await db.query(
      `INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, circle_id, title, task_type, date, time, required_helpers, helper_name`,
      [resolvedCircle.id, title, task_type, date, time, quota, helperName]
    );

    // --- 3. LOGIQUE DE NOTIFICATION AJOUTÉE ---
    try {
      // A. Récupérer les tokens des utilisateurs de ce cercle qui ont un token
      // (Supposons que ta table users a une colonne circle_id ou un lien via une table de jointure)
      // Si tu n'as pas encore de circle_id dans users, tu peux envoyer à tous ceux qui ont un token pour tester :
      // "SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL"
      
      const usersTokens = await db.query(
        `SELECT fcm_token FROM users 
         WHERE fcm_token IS NOT NULL` 
         // Idéalement : AND circle_id = $1`, [resolvedCircle.id]
      );

      const tokens = usersTokens.rows.map(r => r.fcm_token);

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: 'Nouvelle tâche disponible 🧶',
            body: `${title} pour ${resolvedCircle.senior_name} le ${date} à ${time}`
          },
          tokens: tokens, // Envoi groupé
        };

        // Envoi via Firebase
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(response.successCount + ' notifications envoyées avec succès');
      }
    } catch (notifError) {
      // On ne bloque pas la création de tâche si la notif échoue, on log juste l'erreur
      console.error('⚠️ Erreur envoi notification:', notifError);
    }
    // ------------------------------------------
    
    res.status(201).json({
      status: 'ok',
      message: 'Task created',
      data: { ...result.rows[0], senior_name: resolvedCircle.senior_name },
    });

  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getTasks(req, res) {
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
         t.required_helpers,
         c.senior_name
       FROM tasks t
       LEFT JOIN care_circles c ON c.id = t.circle_id
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
}

export async function createTask(req, res) {
  try {
    // 1. On récupère required_helpers en plus des autres champs
    const { date, time, title, task_type, helper_name, circle_id, required_helpers } = req.body;
    
    if (!date || !time || !title || !task_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }

    let resolvedCircle = null;

    if (circle_id) {
      const specificCircle = await db.query(
        `SELECT id, senior_name FROM care_circles WHERE id = $1`,
        [circle_id]
      );

      if (!specificCircle.rows.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Care circle not found',
        });
      }

      resolvedCircle = specificCircle.rows[0];
    } else {
      const defaultCircle = await db.query(
        `SELECT id, senior_name FROM care_circles ORDER BY created_at ASC LIMIT 1`
      );

      if (!defaultCircle.rows.length) {
        return res.status(400).json({
          status: 'error',
          message: 'No care circle available. Please create one first.',
        });
      }

      resolvedCircle = defaultCircle.rows[0];
    }

    const helperName = helper_name || 'À pourvoir';
    
    // 2. On s'assure que le quota est un entier (par défaut 1 si non fourni)
    const quota = required_helpers ? parseInt(required_helpers, 10) : 1;
    
    const result = await db.query(
      `INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, circle_id, title, task_type, date, time, required_helpers, helper_name`,
      [
        resolvedCircle.id,
        title,
        task_type,
        date,
        time,
        quota, // 3. ICI : on utilise la variable quota au lieu de "1" en dur
        helperName,
      ]
    );
    
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
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
}

export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    
    res.json({
      status: 'ok',
      message: 'Task deleted',
    });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
}
