import db from '../config/db.js';

// --- CONSTANTES : Ce sont les UUIDs définis dans votre SQL ---
const CURRENT_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Thomas Durand
const CERCLE_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44';       // Monique Durand

// 1. Récupérer les membres du cercle (Pour la liste "Nouveau Groupe")
export const getMembresCercle = async (req, res) => {
    try {
        // On sélectionne tous les membres du cercle SAUF soi-même (Thomas)
        const result = await db.query(`
            SELECT u.id, u.name as nom, ur.role
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.circle_id = $1 AND u.id != $2
        `, [CERCLE_ID, CURRENT_USER_ID]);

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
        // --- NOUVEAU : Règle 1 - Unicité du chat PRIVE ---
        if (type === 'PRIVE') {
            const targetUserId = participants[0]; // L'autre personne

            // On cherche si une conversation PRIVE existe déjà entre MOI et LUI dans ce cercle
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
                console.log("⚠️ Conversation privée existante trouvée:", existingPrive.rows[0].id);
                // On renvoie l'ID existant avec un statut succès (200)
                return res.status(200).json({ 
                    success: true, 
                    conversationId: existingPrive.rows[0].id,
                    message: "Conversation existante ouverte" 
                });
            }
        }

        // --- NOUVEAU : Règle 2 - Unicité du NOM DE GROUPE ---
        if (type === 'GROUPE') {
            // On vérifie si un groupe avec ce nom existe déjà dans ce cercle
            const existingNom = await db.query(
                "SELECT id FROM conversation WHERE cercle_id = $1 AND type = 'GROUPE' AND nom = $2",
                [CERCLE_ID, nom]
            );

            if (existingNom.rows.length > 0) {
                // Erreur 409 (Conflit) -> Le Frontend va pouvoir détecter ça
                return res.status(409).json({ error: "Ce nom de groupe est déjà utilisé. Veuillez en choisir un autre." });
            }

            // Vérification des droits (Code existant)
            const verifRole = await db.query(
                "SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2",
                [CURRENT_USER_ID, CERCLE_ID]
            );

            if (verifRole.rows.length === 0 || verifRole.rows[0].role !== 'ADMIN') {
                return res.status(403).json({ error: "Seul l'ADMIN peut créer un groupe." });
            }
        }

        // --- CRÉATION (Si tout est bon) ---
        const result = await db.query(
            "INSERT INTO conversation (type, nom, cercle_id) VALUES ($1, $2, $3) RETURNING id",
            [type, nom, CERCLE_ID]
        );
        const convId = result.rows[0].id;

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
    // ID de Thomas (Celui qui est connecté)
    const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 

    try {
        // C'EST ICI QUE LA MAGIE OPÈRE :
        // On utilise CASE WHEN pour choisir quel nom afficher.
        // On fait une jointure (LEFT JOIN) pour trouver "l'autre" utilisateur (celui qui n'est pas moi).
        
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
        `, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error("Erreur get convs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 4. RÉCUPÉRER LES MESSAGES D'UNE CONVERSATION
export const getMessages = async (req, res) => {
    const { id } = req.params; // L'ID de la conversation vient de l'URL
    const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Thomas (Sécurité)

    try {
        // Vérification : Est-ce que Thomas a le droit de voir ça ?
        const verif = await db.query(
            "SELECT * FROM participant_conversation WHERE conversation_id = $1 AND utilisateur_id = $2",
            [id, userId]
        );

        if (verif.rows.length === 0) {
            return res.status(403).json({ error: "Accès interdit à cette conversation" });
        }

        // Récupération des messages avec le nom de l'auteur
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
export const deleteConversation = (req, res) => {
    const conversationId = req.params.id;
    
    // 1. On supprime d'abord les messages liés à cette conversation
    // (Attention : vérifie que ta table s'appelle bien 'messages')
    const sqlMessages = "DELETE FROM messages WHERE conversation_id = ?";

    db.query(sqlMessages, [conversationId], (err, result) => {
        if (err) {
            console.error("Erreur suppression messages :", err);
            return res.status(500).json({ error: "Erreur serveur lors de la suppression des messages" });
        }

        // 2. On supprime la conversation
        // (Si tu as une table 'participants', il faudrait aussi la nettoyer ici avant de supprimer la conversation)
        const sqlConv = "DELETE FROM conversations WHERE id = ?";

        db.query(sqlConv, [conversationId], (err, result) => {
            if (err) {
                console.error("Erreur suppression conversation :", err);
                return res.status(500).json({ error: "Erreur serveur lors de la suppression de la conversation" });
            }

            res.status(200).json({ message: "Conversation supprimée avec succès" });
        });
    });
};