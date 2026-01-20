import db from '../config/db.js';
import { getIo } from '../services/socketService.js';

// 1. Récupérer les membres du cercle (VERSION DEBUG)
export const getMembresCercle = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`\n🔍 [DEBUG] getMembresCercle appelé par UserID: ${userId}`);

        // A. Trouver le cercle
        const cercleQuery = "SELECT circle_id, role FROM user_roles WHERE user_id = $1 LIMIT 1";
        const cercleResult = await db.query(cercleQuery, [userId]);

        if (cercleResult.rows.length === 0) {
            console.log("❌ [DEBUG] Aucun cercle trouvé pour cet utilisateur !");
            return res.json({ circle_id: null, membres: [] });
        }

        const { circle_id, role } = cercleResult.rows[0];
        console.log(`✅ [DEBUG] Cercle trouvé: ${circle_id} (Rôle: ${role})`);

        // B. Trouver les autres membres
        const membresQuery = `
            SELECT u.id, u.name, ur.role
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1 AND u.id != $2
        `;
        const membresResult = await db.query(membresQuery, [circle_id, userId]);

        console.log(`👥 [DEBUG] ${membresResult.rows.length} autres membres trouvés :`);
        membresResult.rows.forEach(m => console.log(`   - ${m.name} (${m.role})`));

        res.json({ 
            circle_id: circle_id, 
            membres: membresResult.rows 
        });

    } catch (error) {
        console.error("🔥 [ERREUR] getMembresCercle:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 2. Créer une conversation
export const creerConversation = async (req, res) => {
    const { type, nom, participants, cercle_id } = req.body;
    const userId = req.user.id;
    console.log(`\n📥 [DEBUG] Création conversation Type: ${type}, Participants: ${participants.length}`);

    if (!cercle_id) return res.status(400).json({ error: "ID du cercle manquant" });

    try {
        // --- Règle : Eviter doublons PRIVE ---
        if (type === 'PRIVE') {
            const targetUserId = participants[0];
            const existing = await db.query(`
                SELECT c.id FROM conversation c
                JOIN participant_conversation pc1 ON c.id = pc1.conversation_id
                JOIN participant_conversation pc2 ON c.id = pc2.conversation_id
                WHERE c.type = 'PRIVE' AND c.cercle_id = $1
                AND pc1.utilisateur_id = $2 AND pc2.utilisateur_id = $3
            `, [cercle_id, userId, targetUserId]);

            if (existing.rows.length > 0) {
                console.log(`♻️ [DEBUG] Conversation existante réouverte: ${existing.rows[0].id}`);
                return res.status(200).json({ 
                    success: true, 
                    conversationId: existing.rows[0].id,
                    message: "Conversation existante ouverte" 
                });
            }
        }

        // --- Création ---
        const result = await db.query(
            "INSERT INTO conversation (type, nom, cercle_id) VALUES ($1, $2, $3) RETURNING id, nom, type, date_creation",
            [type, nom || 'Nouveau message', cercle_id]
        );
        const conversation = result.rows[0];

        // --- Ajout participants ---
        const tousLesMembres = [...new Set([...participants, userId])];
        for (const pid of tousLesMembres) {
            await db.query(
                "INSERT INTO participant_conversation (conversation_id, utilisateur_id) VALUES ($1, $2)",
                [conversation.id, pid]
            );
        }

        console.log(`✅ [DEBUG] Nouvelle conversation créée: ${conversation.id}`);
        res.status(201).json({ success: true, conversation });

    } catch (error) {
        console.error("🔥 [ERREUR] Création:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Récupérer mes conversations
export const getMesConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT 
                c.id, c.type, c.cercle_id, c.date_creation,
                CASE 
                    WHEN c.type = 'GROUPE' THEN c.nom
                    ELSE u_other.name 
                END AS nom,
                m.contenu as dernier_message,
                m.date_envoi as date_dernier_message
            FROM conversation c
            JOIN participant_conversation pc_me ON c.id = pc_me.conversation_id
            LEFT JOIN participant_conversation pc_other 
                ON c.id = pc_other.conversation_id AND pc_other.utilisateur_id != $1
            LEFT JOIN users u_other 
                ON pc_other.utilisateur_id = u_other.id
            LEFT JOIN message m ON m.conversation_id = c.id AND m.id = (
                SELECT id FROM message WHERE conversation_id = c.id ORDER BY date_envoi DESC LIMIT 1
            )
            WHERE pc_me.utilisateur_id = $1
            GROUP BY c.id, c.type, c.cercle_id, c.date_creation, c.nom, u_other.name, m.contenu, m.date_envoi
            ORDER BY m.date_envoi DESC NULLS LAST, c.date_creation DESC
        `, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error("Erreur get convs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 4. Messages d'une conversation
export const getMessages = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Sécurité
        const verif = await db.query(
            "SELECT 1 FROM participant_conversation WHERE conversation_id = $1 AND utilisateur_id = $2",
            [id, userId]
        );
        if (verif.rows.length === 0) return res.status(403).json({ error: "Accès interdit" });

        // Messages
        const msgs = await db.query(`
            SELECT m.id, m.contenu, m.date_envoi, m.auteur_id, u.name as nom_auteur
            FROM message m
            JOIN users u ON m.auteur_id = u.id
            WHERE m.conversation_id = $1
            ORDER BY m.date_envoi ASC
        `, [id]);

        // Participants (Pour la liste "info")
        const parts = await db.query(`
            SELECT u.id, u.name 
            FROM participant_conversation pc
            JOIN users u ON pc.utilisateur_id = u.id
            WHERE pc.conversation_id = $1
        `, [id]);

        res.json({ messages: msgs.rows, participants: parts.rows });
    } catch (error) {
        console.error("Erreur get messages:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 5. Envoyer message
export const envoyerMessage = async (req, res) => {
    const conversationId = String(req.params.id);
    const { contenu } = req.body;
    const authorId = req.user.id;

    if (!contenu || !contenu.trim()) return res.status(400).json({ error: "Message vide" });

    try {
        const insertResult = await db.query(
            "INSERT INTO message (conversation_id, auteur_id, contenu) VALUES ($1, $2, $3) RETURNING id, date_envoi",
            [conversationId, authorId, contenu]
        );
        const newMessage = insertResult.rows[0];
        
        const userResult = await db.query("SELECT name FROM users WHERE id = $1", [authorId]);
        const authorName = userResult.rows[0].name;

        const messageComplet = {
            id: newMessage.id,
            contenu,
            date_envoi: newMessage.date_envoi,
            auteur_id: authorId,
            nom_auteur: authorName,
            conversation_id: parseInt(conversationId)
        };

        try {
            getIo().to(conversationId).emit('receive_message', messageComplet);
        } catch (e) { console.error("Socket warning:", e.message); }

        res.status(201).json(messageComplet);
    } catch (error) {
        console.error("Erreur envoi:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        await db.query('DELETE FROM conversation WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: "Erreur" }); }
};