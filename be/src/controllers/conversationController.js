import db from '../config/db.js';
import { getIo } from '../services/socketService.js';
import admin from '../config/firebase.js'; // <--- AJOUT CRUCIAL ICI

// --- FONCTION UTILITAIRE LOCALE (Avec Logs de Debug) ---
async function notifyParticipants(conversationId, excludeUserId, title, body, data) {
    console.log(`🔔 [NOTIF_CHAT] Début envoi pour ConvID: ${conversationId}`);
    try {
        // 1. Récupérer les tokens des autres participants
        const query = `
            SELECT u.fcm_token, u.name 
            FROM participant_conversation pc
            JOIN users u ON pc.utilisateur_id = u.id
            WHERE pc.conversation_id = $1 
            AND pc.utilisateur_id != $2
            AND u.fcm_token IS NOT NULL 
            AND u.fcm_token != ''
        `;
        const res = await db.query(query, [conversationId, excludeUserId]);
        
        // Dédoublonnage
        const tokens = [...new Set(res.rows.map(r => r.fcm_token))];

        console.log(`🔍 [NOTIF_CHAT] Destinataires trouvés: ${res.rows.length} (Tokens uniques: ${tokens.length})`);

        if (tokens.length > 0) {
            const message = {
                notification: { title, body },
                data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                tokens: tokens
            };
            
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`✅ [NOTIF_CHAT] Succès: ${response.successCount} | Échecs: ${response.failureCount}`);
            
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) console.error(`   ❌ Erreur Token ${idx}:`, resp.error);
                });
            }
        } else {
            console.log("⚠️ [NOTIF_CHAT] Aucun token valide trouvé pour envoyer la notif.");
        }
    } catch (e) {
        console.error("🔥 [ERREUR CRITIQUE] notifyParticipants:", e);
    }
}

// 1. Récupérer les membres du cercle
export const getMembresCercle = async (req, res) => {
    try {
        const userId = req.user.id;
        const cercleQuery = "SELECT circle_id, role FROM user_roles WHERE user_id = $1 LIMIT 1";
        const cercleResult = await db.query(cercleQuery, [userId]);

        if (cercleResult.rows.length === 0) return res.json({ circle_id: null, membres: [] });

        const { circle_id } = cercleResult.rows[0];
        const membresQuery = `
            SELECT u.id, u.name, ur.role
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1 AND u.id != $2
        `;
        const membresResult = await db.query(membresQuery, [circle_id, userId]);

        res.json({ circle_id, membres: membresResult.rows });
    } catch (error) {
        console.error("Erreur getMembresCercle:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 2. Créer une conversation
export const creerConversation = async (req, res) => {
    const { type, nom, participants, cercle_id } = req.body;
    const userId = req.user.id;

    if (!cercle_id) return res.status(400).json({ error: "ID du cercle manquant" });

    try {
        // Check doublon PRIVE
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
                return res.status(200).json({ success: true, conversationId: existing.rows[0].id });
            }
        }

        // Création
        const result = await db.query(
            "INSERT INTO conversation (type, nom, cercle_id) VALUES ($1, $2, $3) RETURNING id, nom, type, date_creation",
            [type, nom || 'Nouveau message', cercle_id]
        );
        const conversation = result.rows[0];

        // Ajout participants
        const tousLesMembres = [...new Set([...participants, userId])];
        for (const pid of tousLesMembres) {
            await db.query(
                "INSERT INTO participant_conversation (conversation_id, utilisateur_id) VALUES ($1, $2)",
                [conversation.id, pid]
            );
        }

        // --- NOTIFICATION CRÉATION (AJOUTÉE) ---
        // 1. Récup nom créateur
        const creatorRes = await db.query("SELECT name FROM users WHERE id = $1", [userId]);
        const creatorName = creatorRes.rows[0]?.name || 'Un membre';

        // 2. Récup nom senior du cercle
        const seniorRes = await db.query(
            "SELECT u.name FROM care_circles c JOIN users u ON c.senior_id = u.id WHERE c.id = $1", 
            [cercle_id]
        );
        const seniorName = seniorRes.rows[0]?.name || 'Cercle';

        const notifTitle = type === 'GROUPE' 
            ? `Nouveau groupe : ${nom} (Cercle de ${seniorName})` 
            : `Nouvelle conversation (Cercle de ${seniorName})`;
            
        // On ne bloque pas la réponse HTTP, on lance la notif en "background"
        notifyParticipants(
            conversation.id,
            userId, // Exclure le créateur
            notifTitle,
            `${creatorName} vous a ajouté.`,
            { type: 'conversation_added', conversationId: conversation.id.toString() }
        );

        res.status(201).json({ success: true, conversation });

    } catch (error) {
        console.error("Erreur Création conv:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Récupérer mes conversations
export const getMesConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT c.id, c.type, c.cercle_id, c.date_creation,
                CASE WHEN c.type = 'GROUPE' THEN c.nom ELSE u_other.name END AS nom,
                m.contenu as dernier_message, m.date_envoi as date_dernier_message
            FROM conversation c
            JOIN participant_conversation pc_me ON c.id = pc_me.conversation_id
            LEFT JOIN participant_conversation pc_other ON c.id = pc_other.conversation_id AND pc_other.utilisateur_id != $1
            LEFT JOIN users u_other ON pc_other.utilisateur_id = u_other.id
            LEFT JOIN message m ON m.conversation_id = c.id AND m.id = (
                SELECT id FROM message WHERE conversation_id = c.id ORDER BY date_envoi DESC LIMIT 1
            )
            WHERE pc_me.utilisateur_id = $1
            GROUP BY c.id, c.type, c.cercle_id, c.date_creation, c.nom, u_other.name, m.contenu, m.date_envoi
            ORDER BY m.date_envoi DESC NULLS LAST, c.date_creation DESC
        `, [userId]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: "Erreur serveur" }); }
};

// 4. Messages d'une conversation
export const getMessages = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const verif = await db.query("SELECT 1 FROM participant_conversation WHERE conversation_id = $1 AND utilisateur_id = $2", [id, userId]);
        if (verif.rows.length === 0) return res.status(403).json({ error: "Accès interdit" });

        const msgs = await db.query(`
            SELECT m.id, m.contenu, m.date_envoi, m.auteur_id, u.name as nom_auteur
            FROM message m JOIN users u ON m.auteur_id = u.id
            WHERE m.conversation_id = $1 ORDER BY m.date_envoi ASC
        `, [id]);
        
        const parts = await db.query(`
            SELECT u.id, u.name FROM participant_conversation pc JOIN users u ON pc.utilisateur_id = u.id WHERE pc.conversation_id = $1
        `, [id]);

        res.json({ messages: msgs.rows, participants: parts.rows });
    } catch (error) { res.status(500).json({ error: "Erreur serveur" }); }
};

// 5. Envoyer message
export const envoyerMessage = async (req, res) => {
    const conversationId = String(req.params.id);
    const { contenu } = req.body;
    const authorId = req.user.id;

    if (!contenu || !contenu.trim()) return res.status(400).json({ error: "Message vide" });

    try {
        // A. Insert Message
        const insertResult = await db.query(
            "INSERT INTO message (conversation_id, auteur_id, contenu) VALUES ($1, $2, $3) RETURNING id, date_envoi",
            [conversationId, authorId, contenu]
        );
        const newMessage = insertResult.rows[0];
        
        // B. Get Author Name
        const userResult = await db.query("SELECT name FROM users WHERE id = $1", [authorId]);
        const authorName = userResult.rows[0].name;

        // C. Socket
        const messageComplet = {
            id: newMessage.id,
            contenu,
            date_envoi: newMessage.date_envoi,
            auteur_id: authorId,
            nom_auteur: authorName,
            conversation_id: parseInt(conversationId)
        };
        try { getIo().to(conversationId).emit('receive_message', messageComplet); } catch (e) {}

        // D. Notification Push (Avec contexte Cercle)
        try {
            const contextRes = await db.query(`
                SELECT c.nom, c.type, c.cercle_id, u.name as senior_name
                FROM conversation c
                LEFT JOIN care_circles cc ON c.cercle_id = cc.id
                LEFT JOIN users u ON cc.senior_id = u.id
                WHERE c.id = $1
            `, [conversationId]);
            
            const context = contextRes.rows[0];
            const seniorName = context?.senior_name || 'Inconnu';
            
            // TITRE : "Nom (Cercle de Senior)"
            let titreNotif = `${authorName} (Cercle de ${seniorName})`;
            if (context?.type === 'GROUPE') {
                titreNotif = `${context.nom} : ${authorName} (Cercle de ${seniorName})`;
            }

            const corpsNotif = contenu.length > 50 ? contenu.substring(0, 50) + '...' : contenu;

            notifyParticipants(
                conversationId,
                authorId, // Exclure l'expéditeur
                titreNotif,
                corpsNotif,
                { 
                    type: 'new_message', 
                    conversationId: conversationId,
                    senderId: authorId,
                    circleId: context?.cercle_id?.toString()
                }
            );
        } catch (notifErr) { console.error("Erreur prépa notif message:", notifErr); }

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