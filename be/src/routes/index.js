import { Router } from 'express';

// --- IMPORTS DES ROUTEURS (Default Exports) ---
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';
import incidentsRouter from './incidents.js';
import tasksRouter from './tasks.js'; // ✅ On garde uniquement celui-ci
import conversationRouter from './conversations.js'; 
import uploadRouter from './upload.js'; // (Optionnel: si tu veux inclure l'upload ici, sinon via app.js)

// --- IMPORTS DES CONTRÔLEURS (Named Exports) ---
// On garde ceux-là car souvenirs.js est (probablement) encore un fichier de contrôleurs
import { 
    getJournalEntries, 
    createJournalEntry, 
    addCommentToEntry, 
    deleteCommentFromEntry, 
    deleteJournalEntry
} from './souvenirs.js'; 

const router = Router();

// --- MONTAGE DES ROUTEURS ---
// Ces routes sont gérées entièrement dans leurs fichiers respectifs
router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);
router.use('/incidents', incidentsRouter);
router.use('/tasks', tasksRouter); // ✅ C'est ici que ça se passe maintenant
router.use('/conversations', conversationRouter);

// --- ROUTES SOUVENIRS ---
// Définies manuellement ici car souvenirs.js n'est pas encore un routeur
router.get('/souvenirs', getJournalEntries);
router.post('/souvenirs', createJournalEntry);
router.post('/souvenirs/:id/comments', addCommentToEntry);
router.delete('/souvenirs/:id/comments/:commentId', deleteCommentFromEntry);
router.delete('/souvenirs/:id', deleteJournalEntry);

export default router;