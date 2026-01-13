import db from '../config/db.js';

// --- RÉCUPÉRER LES TÂCHES ---
// ... (imports)

// GET /api/tasks?circleId=...
export async function getTasks(req, res) {
  try {
    const { circleId } = req.query;
    
    // Construction de la requête de base
    let queryText = `
      SELECT 
         t.id, t.circle_id, t.date, t.time, t.title, 
         t.task_type, t.helper_name, t.required_helpers, c.senior_name
       FROM tasks t
       LEFT JOIN care_circles c ON c.id = t.circle_id
    `;
    
    const queryParams = [];

    // Si un circleId est fourni, on filtre
    if (circleId) {
        queryText += ` WHERE t.circle_id = $1`;
        queryParams.push(circleId);
    }

    queryText += ` ORDER BY t.date ASC, t.time ASC`;

    const result = await db.query(queryText, queryParams);
    
    res.json({
      status: 'ok',
      data: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// ... (reste du fichier createTask, deleteTask inchangé)

// --- CRÉER UNE TÂCHE ---
export async function createTask(req, res) {
  try {
    const { date, time, title, task_type, helper_name, circle_id, required_helpers } = req.body;
    
    if (!date || !time || !title || !task_type) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    let resolvedCircle = null;

    // Logique de sélection du cercle
    if (circle_id) {
      const specificCircle = await db.query(
        `SELECT id, senior_name FROM care_circles WHERE id = $1`,
        [circle_id]
      );

      if (!specificCircle.rows.length) {
        return res.status(400).json({ status: 'error', message: 'Care circle not found' });
      }
      resolvedCircle = specificCircle.rows[0];
    } else {
      // Fallback: prend le premier cercle dispo (utile pour le dév)
      const defaultCircle = await db.query(
        `SELECT id, senior_name FROM care_circles ORDER BY created_at ASC LIMIT 1`
      );

      if (!defaultCircle.rows.length) {
        // S'il n'y a aucun cercle, on crée un cercle par défaut pour éviter le blocage
        const newCircle = await db.query(
            `INSERT INTO care_circles (senior_name, created_by) 
             VALUES ('Mon Cercle Principal', (SELECT id FROM users LIMIT 1)) 
             RETURNING id, senior_name`
        );
        resolvedCircle = newCircle.rows[0];
      } else {
        resolvedCircle = defaultCircle.rows[0];
      }
    }

    const helperName = helper_name || 'À pourvoir';
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
        quota,
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
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// --- SUPPRIMER UNE TÂCHE ---
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