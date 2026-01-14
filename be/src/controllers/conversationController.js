import db from '../config/db.js';
import { getIo } from '../services/socketService.js';

// --- CONSTANTES CORRIGÉES ---
// Ces IDs doivent correspondre à ceux insérés par ton script SQL !
const CURRENT_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Alice (Admin)
const CERCLE_ID = '11111111-1111-1111-1111-111111111111';       // ID du cercle créé en SQL

// 1. Récupérer les membres du cercle (Pour la liste "Nouveau Groupe")
export const getMembresCercle = async (req, res) => {
    try {
        // On sélectionne tous les membres du cercle SAUF soi-même
        const result = await db.query(`
            SELECT u.id, u.name as nom, ur.role
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1 AND u.id != $2
        `, [CERCLE_ID, CURRENT_USER_ID]);

        console.log("Membres trouvés :", result.rows); // Debug pour voir qui est trouvé
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur get membres:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 2. Créer une conversation
export const creerConversation = async (req, res) => {
    const { type, nom, participants } = req.body;
    
    console.log("📥 Création conversation:", { type, nom, participants });

    try {
        // --- Règle 1 - Unicité du chat PRIVE ---
        if (type === 'PRIVE') {
            const targetUserId = participants[0]; // L'autre personne

            const existingPrive = await db.query(`
                SELECT c.id 
                FROM conversation c
                JOIN participant_conversation pc1 ON c.id = pc1.conversation_id
                JOIN participant_conversation pc2 ON c.id = pc2.conversation_id
                WHERE c.type = 'PRIVE' 
                AND c.cercle_id = $1
                AND pc1.utilisateur_id = $2
                AND pc2.utilisateur_id = $3
            `, [CERCLE_ID, CURRENT_USER_ID, targetUserId]);

            if (existingPrive.rows.length > 0) {
                return res.status(200).json({ 
                    success: true, 
                    conversationId: existingPrive.rows[0].id,
                    message: "Conversation existante ouverte" 
                });
            }
        }

        // --- Règle 2 - Unicité du NOM DE GROUPE ---
        if (type === 'GROUPE') {
            const existingNom = await db.query(
                "SELECT id FROM conversation WHERE cercle_id = $1 AND type = 'GROUPE' AND nom = $2",
                [CERCLE_ID, nom]
            );

            if (existingNom.rows.length > 0) {
                return res.status(409).json({ error: "Ce nom de groupe est déjà utilisé." });
            }
        }

        // --- CRÉATION ---
        const result = await db.query(
            "INSERT INTO conversation (type, nom, cercle_id) VALUES ($1, $2, $3) RETURNING id",
            [type, nom, CERCLE_ID]
        );
        const convId = result.rows[0].id;

        // Ajout des participants (Soi-même + les sélectionnés)
        const tousLesMembres = [...new Set([...participants, CURRENT_USER_ID])];

        for (const userId of tousLesMembres) {
            await db.query(
                "INSERT INTO participant_conversation (conversation_id, utilisateur_id) VALUES ($1, $2)",
                [convId, userId]
            );
        }

        res.status(201).json({ success: true, conversationId: convId });

    } catch (error) {
        console.error("Erreur création:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Récupérer mes conversations
export const getMesConversations = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.id, 
                c.type, 
                c.cercle_id, 
                c.date_creation,
                CASE 
                    WHEN c.type = 'GROUPE' THEN c.nom
                    ELSE u_other.name -- Si c'est PRIVE, on prend le nom de l'autre
                END AS nom
            FROM conversation c
            JOIN participant_conversation pc_me ON c.id = pc_me.conversation_id
            -- On cherche l'autre participant (pour les privés)
            LEFT JOIN participant_conversation pc_other 
                ON c.id = pc_other.conversation_id AND pc_other.utilisateur_id != $1
            LEFT JOIN users u_other 
                ON pc_other.utilisateur_id = u_other.id
            WHERE pc_me.utilisateur_id = $1
            ORDER BY c.date_creation DESC
        `, [CURRENT_USER_ID]);

        res.json(result.rows);
    } catch (error) {
        console.error("Erreur get convs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 4. Récupérer les messages
export const getMessages = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérification des droits
        const verif = await db.query(
            "SELECT * FROM participant_conversation WHERE conversation_id = $1 AND utilisateur_id = $2",
            [id, CURRENT_USER_ID]
        );

        if (verif.rows.length === 0) {
            return res.status(403).json({ error: "Accès interdit à cette conversation" });
        }

        // Récupération des messages
        const result = await db.query(`
            SELECT m.id, m.contenu, m.date_envoi, m.auteur_id, u.name as nom_auteur
            FROM message m
            JOIN users u ON m.auteur_id = u.id
            WHERE m.conversation_id = $1
            ORDER BY m.date_envoi ASC
        `, [id]);

        res.json(result.rows);
    } catch (error) {
        console.error("Erreur get messages:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 5. Supprimer conversation (CORRIGÉ: Async/Await)
export const deleteConversation = async (req, res) => {
    const conversationId = req.params.id;
    
    try {
        // 1. Supprimer les messages (Table 'message' au singulier selon ton SQL)
        await db.query("DELETE FROM message WHERE conversation_id = $1", [conversationId]);

        // 2. Supprimer les participants
        await db.query("DELETE FROM participant_conversation WHERE conversation_id = $1", [conversationId]);

        // 3. Supprimer la conversation (Table 'conversation' au singulier)
        await db.query("DELETE FROM conversation WHERE id = $1", [conversationId]);

        res.status(200).json({ message: "Conversation supprimée avec succès" });
    } catch (error) {
        console.error("Erreur suppression conversation :", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression" });
    }
};

// 6. Envoyer un message
export const envoyerMessage = async (req, res) => {
    const conversationId = req.params.id;
    const { contenu } = req.body;
    
    // ID fixe (Alice) pour tes tests
    const authorId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 

    if (!contenu || contenu.trim() === "") {
        return res.status(400).json({ error: "Message vide" });
    }

    try {
        // 1. Sauvegarde en DB
        const insertResult = await db.query(
            "INSERT INTO message (conversation_id, auteur_id, contenu) VALUES ($1, $2, $3) RETURNING id, date_envoi",
            [conversationId, authorId, contenu]
        );
        const newMessage = insertResult.rows[0];
        
        // 2. Récupération du nom
        const userResult = await db.query("SELECT name FROM users WHERE id = $1", [authorId]);
        const authorName = userResult.rows[0].name;

        const messageComplet = {
            id: newMessage.id,
            contenu: contenu,
            date_envoi: newMessage.date_envoi,
            auteur_id: authorId,
            nom_auteur: authorName,
            conversation_id: conversationId
        };

        // 3. ENVOI EN LIVE (SOCKET)
        try {
            const io = getIo();
            // On envoie seulement aux gens connectés sur CETTE conversation
            io.to(conversationId).emit('receive_message', messageComplet);
            console.log(`📡 Message envoyé en live dans la salle ${conversationId}`);
        } catch (e) {
            console.error("Erreur socket (pas grave):", e.message);
        }

        res.status(201).json(messageComplet);

    } catch (error) {
        console.error("Erreur envoi:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};