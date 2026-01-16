import express from 'express';
import { 
    creerConversation, 
    getMesConversations, 
    getMembresCercle,
    getMessages,
    deleteConversation,
    envoyerMessage // <--- 1. IMPORT AJOUTÉ ICI
} from '../controllers/conversationController.js'; 

const router = express.Router();

// Routes existantes
router.post('/', creerConversation);
router.get('/', getMesConversations);
router.get('/membres', getMembresCercle);
router.get('/:id/messages', getMessages);
router.delete('/:id', deleteConversation); 

// --- 2. ROUTE AJOUTÉE ICI ---
// C'est celle qui sera appelée quand tu cliques sur "Envoyer"
router.post('/:id/messages', envoyerMessage);

export default router;