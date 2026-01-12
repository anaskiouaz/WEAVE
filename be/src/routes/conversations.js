import express from 'express';
import { 
    creerConversation, 
    getMesConversations, 
    getMembresCercle,
    getMessages,
    deleteConversation // <--- 1. IMPORT DE LA NOUVELLE FONCTION
} from '../controllers/conversationController.js'; 

const router = express.Router();

router.post('/', creerConversation);
router.get('/', getMesConversations);
router.get('/membres', getMembresCercle);
router.get('/:id/messages', getMessages);

// 2. AJOUT DE LA ROUTE DELETE
router.delete('/:id', deleteConversation); 

export default router;