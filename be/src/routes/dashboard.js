import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// GET /api/dashboard/stats?circleId=...
router.get('/stats', async (req, res) => {
  try {
    const { circleId } = req.query;

    if (!circleId) {
      return res.status(400).json({ status: 'error', message: 'Circle ID required' });
    }

    const [userRes, taskRes, memoryRes, messageRes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM user_roles WHERE circle_id = $1', [circleId]),
      
      // CORRECTION ICI : On compte toutes les tâches futures (>= aujourd'hui)
      // Au lieu de "date_trunc('week')..." qui bloquait les tâches de la semaine prochaine
      db.query(`
        SELECT COUNT(*) FROM tasks 
        WHERE circle_id = $1
          AND date >= CURRENT_DATE
      `, [circleId]),

      db.query('SELECT COUNT(*) FROM journal_entries WHERE circle_id = $1', [circleId]),
      db.query('SELECT COUNT(*) FROM messages WHERE circle_id = $1', [circleId])
    ]);

    // ... (reste de la requête pour la liste des aidants inchangée)
    const helpersListRes = await db.query(`
        SELECT u.id, u.name, u.email, u.phone, ur.role 
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        WHERE ur.circle_id = $1
    `, [circleId]);

    res.json({
      status: 'ok',
      data: {
        activeHelpers: parseInt(userRes.rows[0].count, 10),
        tasksThisWeek: parseInt(taskRes.rows[0].count, 10), // Affiche le total futur maintenant
        memoriesShared: parseInt(memoryRes.rows[0].count, 10), 
        unreadMessages: parseInt(messageRes.rows[0].count, 10),
        helpersList: helpersListRes.rows 
      }
    });

  } catch (error) {
    console.error('Erreur Dashboard Stats:', error);
    res.status(500).json({ status: 'error', message: 'Erreur récupération stats' });
  }
});

export default router;