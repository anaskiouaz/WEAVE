import db from '../config/db.js';
import admin from '../config/firebase.js';
import { Router } from 'express';
import { logAudit, AUDIT_ACTIONS } from '../utils/audits.js';

const router = Router();

// --- CORRECTION DISPONIBILITÉS ---
function normalizeTime(timeStr) {
    if (!timeStr) return null;
    // On ne garde que les 5 premiers caractères (HH:MM) pour ignorer les secondes
    return timeStr.substring(0, 5); 
}

function isUserAvailable(taskTime, start, end) {
    // 1. Si l'user n'a pas défini d'horaires, il est dispo par défaut
    if (!start || !end) return true;

    // 2. Normalisation (ex: "14:00:00" devient "14:00")
    const taskT = normalizeTime(taskTime);
    const startT = normalizeTime(start);
    const endT = normalizeTime(end);

    // 3. Comparaison simple de chaînes
    return taskT >= startT && taskT <= endT;
}

// --- NOTIFICATION CIBLÉE ---
async function notifyCircle(circleId, title, body, data, excludeUserId, taskTime = null) {
    console.log(`🔍 [NOTIF] Cercle: ${circleId} | Heure Tâche: ${taskTime || 'N/A'}`);
    
    try {
        const query = `
            SELECT u.id, u.name, u.fcm_token, u.availability_start, u.availability_end
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1 
            AND u.fcm_token IS NOT NULL 
            AND u.fcm_token != ''
            AND u.id != $2
            UNION
            SELECT u.id, u.name, u.fcm_token, u.availability_start, u.availability_end
            FROM users u
            JOIN care_circles c ON u.id = c.created_by
            WHERE c.id = $1
            AND u.fcm_token IS NOT NULL 
            AND u.fcm_token != ''
            AND u.id != $2
        `;

        const res = await db.query(query, [circleId, excludeUserId || '00000000-0000-0000-0000-000000000000']);
        
        let validTokens = [];

        res.rows.forEach(user => {
            if (taskTime) {
                // On utilise la nouvelle fonction de comparaison
                if (isUserAvailable(taskTime, user.availability_start, user.availability_end)) {
                    validTokens.push(user.fcm_token);
                } else {
                    console.log(`   🚫 User ${user.name} filtré (Indisponible à ${taskTime}. Dispo: ${user.availability_start}-${user.availability_end})`);
                }
            } else {
                // Pas d'heure de tâche (message général) -> Tout le monde reçoit
                validTokens.push(user.fcm_token);
            }
        });

        const uniqueTokens = [...new Set(validTokens)];

        if (uniqueTokens.length > 0) {
            const message = {
                notification: { title, body },
                data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                tokens: uniqueTokens
            };
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`   ✅ Envoyé à ${response.successCount} appareils.`);
        } else {
            console.log("   ⚠️ Aucun destinataire disponible.");
        }
    } catch (e) {
        console.error('❌ Erreur notifyCircle:', e);
    }
}

// --- INSCRIPTION (VOLONTAIRE) ---
router.post('/:id/volunteer', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'User not found' });
        const userName = userRes.rows[0].name;

        // On récupère la tâche ET son heure
        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (taskRes.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Task not found' });
        const currentTask = taskRes.rows[0];

        // Vérifs
        const currentVolunteersCount = currentTask.assigned_to ? currentTask.assigned_to.length : 0;
        if (currentTask.required_helpers && currentVolunteersCount >= currentTask.required_helpers) {
            return res.status(400).json({ status: 'error', message: 'Complet' });
        }
        if (currentTask.assigned_to && currentTask.assigned_to.includes(userId)) {
            return res.status(400).json({ status: 'error', message: 'Déjà inscrit' });
        }

        // Mise à jour
        let newHelperName = currentTask.helper_name;
        if (!newHelperName || newHelperName === 'À pourvoir') newHelperName = userName;
        else newHelperName = `${newHelperName}, ${userName}`;

        const updateRes = await db.query(
            `UPDATE tasks SET assigned_to = array_append(assigned_to, $1), helper_name = $2 WHERE id = $3 RETURNING *`,
            [userId, newHelperName, id]
        );
        const updatedTask = updateRes.rows[0];

        // Notification
        const remaining = (updatedTask.required_helpers || 1) - updatedTask.assigned_to.length;
        const statusText = remaining > 0 ? `reste ${remaining} place(s)` : `c'est complet !`;

        await notifyCircle(
            updatedTask.circle_id,
            "Nouveau volontaire 💪",
            `${userName} participe à "${updatedTask.title}". ${statusText}`,
            { taskId: updatedTask.id.toString(), type: 'task_updated' },
            userId,
            updatedTask.time // On passe l'heure pour ne pas spammer ceux qui dorment
        );

        await logAudit(userId, AUDIT_ACTIONS.TASK_VOLUNTEERED, `${userName} inscrit à "${updatedTask.title}"`, updatedTask.circle_id);
        res.json({ status: 'ok', data: updatedTask });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- DÉSINSCRIPTION (C'est ici que tu avais l'erreur 404 ?) ---
// Assure-toi que cette route est bien accessible via DELETE /api/tasks/:id/volunteer
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

        if (!task.assigned_to || !task.assigned_to.includes(userId)) {
            return res.status(400).json({ status: 'error', message: 'Pas inscrit' });
        }

        // Recalcul du nom
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

        // Notification
        const remaining = (updatedTask.required_helpers || 1) - (updatedTask.assigned_to ? updatedTask.assigned_to.length : 0);
        
        await notifyCircle(
            updatedTask.circle_id,
            "Désistement ⚠️",
            `${userName} s'est désinscrit de "${updatedTask.title}". (Reste ${remaining} place${remaining > 1 ? 's' : ''})`,
            { taskId: updatedTask.id.toString(), type: 'task_updated' },
            userId,
            updatedTask.time
        );

        await logAudit(userId, AUDIT_ACTIONS.TASK_UPDATED, `${userName} désinscrit de "${updatedTask.title}"`, updatedTask.circle_id);
        res.json({ status: 'ok', data: updatedTask });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- LISTE ---
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`SELECT t.*, u.name AS senior_name FROM tasks t LEFT JOIN care_circles c ON c.id = t.circle_id LEFT JOIN users u ON c.senior_id = u.id ORDER BY t.date ASC, t.time ASC`);
        res.json({ status: 'ok', data: result.rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- CRÉATION ---
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

        // Notif création avec filtrage
        await notifyCircle(
            resolvedCircleId,
            `Nouvelle activité : ${time}`,
            `Besoin d'aide : ${title}`,
            { taskId: newTask.id.toString(), type: 'task_created' },
            null,
            time 
        );

        res.status(201).json({ status: 'ok', message: 'Task created', data: newTask });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;