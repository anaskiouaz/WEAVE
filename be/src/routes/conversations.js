import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// ============================================================
// 1. RÉCUPÉRER MES CONVERSATIONS
// ============================================================
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT 
        c.id, c.type, c.date_creation,
        CASE WHEN c.type = 'PRIVE' THEN (SELECT u.name FROM participant_conversation pc JOIN users u ON pc.utilisateur_id = u.id WHERE pc.conversation_id = c.id AND u.id != $1 LIMIT 1) ELSE c.nom END as nom,
        CASE WHEN c.type = 'PRIVE' THEN (SELECT u.profile_photo FROM participant_conversation pc JOIN users u ON pc.utilisateur_id = u.id WHERE pc.conversation_id = c.id AND u.id != $1 LIMIT 1) ELSE NULL END as photo,
        (SELECT contenu FROM message WHERE conversation_id = c.id ORDER BY date_envoi DESC LIMIT 1) as dernier_message,
        (SELECT date_envoi FROM message WHERE conversation_id = c.id ORDER BY date_envoi DESC LIMIT 1) as date_dernier_message,
        (SELECT COUNT(*)::int FROM message m WHERE m.conversation_id = c.id AND m.date_envoi > pc_me.date_lecture AND m.auteur_id != $1) as unread_count
      FROM conversation c
      JOIN participant_conversation pc_me ON c.id = pc_me.conversation_id
      WHERE pc_me.utilisateur_id = $1
      ORDER BY date_dernier_message DESC NULLS LAST
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur SQL GET /conversations:', error);
    res.status(500).json({ error: 'Erreur récupération conversations' });
  }
});

// ============================================================
// 2. ENVOYER UN MESSAGE (C'EST ICI QUE ÇA SE JOUE)
// ============================================================
router.post('/:id/messages', async (req, res) => {
  const { id } = req.params; // L'ID de la conversation
  const { content } = req.body;
  const authorId = req.user.id;

  try {
    // A. Sauvegarder en DB
    const insertResult = await pool.query(
      'INSERT INTO message (conversation_id, auteur_id, contenu) VALUES ($1, $2, $3) RETURNING *',
      [id, authorId, content]
    );
    const savedMessage = insertResult.rows[0];

    // B. Récupérer infos auteur
    const userResult = await pool.query('SELECT name, profile_photo FROM users WHERE id = $1', [authorId]);
    const authorInfo = userResult.rows[0];

    const fullMessage = {
        ...savedMessage,
        sender_name: authorInfo.name,
        profile_photo: authorInfo.profile_photo
    };

    // C. SOCKET.IO - LA PARTIE CRITIQUE
    // On récupère l'instance stockée dans server.js
    const io = req.app.get('io');

    if (io) {
        // IMPORTANT : On force l'ID en String pour être sûr que ça matche
        const roomId = String(id);
        
        // On envoie le message à tout le monde dans la salle
        io.to(roomId).emit('receive_message', fullMessage);
        
        console.log(`📡 [SOCKET] Message envoyé dans la salle "${roomId}" :`, content);
    } else {
        console.error("⚠️ [SOCKET] Instance non trouvée dans req.app.get('io') !");
    }

    res.status(201).json(fullMessage);

  } catch (error) {
    console.error('Erreur POST message:', error);
    res.status(500).json({ error: "Erreur envoi" });
  }
});

// ============================================================
// 3. AUTRES ROUTES (Lecture, Participants, Création...)
// ============================================================
router.post('/', async (req, res) => {
    // ... (Garde ton code de création ici, ou je peux te le remettre si besoin, 
    // mais pour l'instantanéité c'est surtout le POST messages qui compte)
    // Pour simplifier je remets la version courte standard :
    const { userIds, type, nom, cercleId } = req.body; 
    const creatorId = req.user.id;
    const participants = [...new Set([creatorId, ...userIds])];
    try {
        if (type === 'PRIVE' && participants.length === 2) {
            const otherUserId = participants.find(id => id !== creatorId);
            const check = await pool.query(`SELECT c.id FROM conversation c JOIN participant_conversation pc1 ON c.id = pc1.conversation_id JOIN participant_conversation pc2 ON c.id = pc2.conversation_id WHERE c.type = 'PRIVE' AND pc1.utilisateur_id = $1 AND pc2.utilisateur_id = $2 LIMIT 1`, [creatorId, otherUserId]);
            if (check.rows.length > 0) return res.status(200).json({ success: true, conversationId: check.rows[0].id, existing: true });
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const resC = await client.query('INSERT INTO conversation (type, nom, cercle_id) VALUES ($1, $2, $3) RETURNING id', [type || 'PRIVE', nom, cercleId]);
            const convId = resC.rows[0].id;
            for (const uid of participants) await client.query('INSERT INTO participant_conversation (conversation_id, utilisateur_id) VALUES ($1, $2)', [convId, uid]);
            await client.query('COMMIT');
            res.status(201).json({ success: true, conversationId: convId, existing: false });
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    } catch (e) { res.status(500).json({error: e.message}); }
});

router.put('/:id/read', async (req, res) => {
    try { await pool.query('UPDATE participant_conversation SET date_lecture = NOW() WHERE conversation_id = $1 AND utilisateur_id = $2', [req.params.id, req.user.id]); res.json({success:true}); } catch(e) { res.status(500).json({error:e.message}); }
});

router.get('/:id/messages', async (req, res) => {
    try { const r = await pool.query(`SELECT m.*, u.name as sender_name, u.profile_photo FROM message m LEFT JOIN users u ON m.auteur_id = u.id WHERE m.conversation_id = $1 ORDER BY m.date_envoi ASC`, [req.params.id]); res.json(r.rows); } catch(e) { res.status(500).json({error:e.message}); }
});

router.get('/:id/participants', async (req, res) => {
    try { const r = await pool.query(`SELECT u.id, u.name, u.profile_photo, u.role_global FROM participant_conversation pc JOIN users u ON pc.utilisateur_id = u.id WHERE pc.conversation_id = $1`, [req.params.id]); res.json(r.rows); } catch(e) { res.status(500).json({error:e.message}); }
});

router.post('/:id/participants', async (req, res) => {
    try { await pool.query('INSERT INTO participant_conversation (conversation_id, utilisateur_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, req.body.userId]); res.json({success:true}); } catch(e) { res.status(500).json({error:e.message}); }
});

router.delete('/:id/participants/:userId', async (req, res) => {
    try { await pool.query('DELETE FROM participant_conversation WHERE conversation_id = $1 AND utilisateur_id = $2', [req.params.id, req.params.userId]); res.json({success:true}); } catch(e) { res.status(500).json({error:e.message}); }
});

router.delete('/:id', async (req, res) => {
    try { await pool.query('DELETE FROM conversation WHERE id = $1', [req.params.id]); res.json({success:true}); } catch(e) { res.status(500).json({error:e.message}); }
});

export default router;