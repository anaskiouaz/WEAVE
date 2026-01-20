import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
    creerConversation, 
    getMesConversations, 
    getMembresCercle,
    getMessages,
    envoyerMessage,
    deleteConversation 
} from '../controllers/conversationController.js';

const router = express.Router();

router.use(authenticateToken); // Protection globale

router.get('/', getMesConversations);
router.post('/', creerConversation);
router.get('/membres', getMembresCercle);
router.get('/:id/messages', getMessages); // Renvoie { messages: [], participants: [] }
router.post('/:id/messages', envoyerMessage);
router.delete('/:id', deleteConversation);

export default router;