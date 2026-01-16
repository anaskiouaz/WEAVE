import { Router } from 'express';

// Imports des contrôleurs
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';
import incidentsRouter from './incidents.js';
import tasksRouter from './tasks.js';

// Import des fonctions contrôleurs (Destructuring)
import { getJournalEntries, createJournalEntry , addCommentToEntry, deleteCommentFromEntry, deleteJournalEntry} from './souvenirs.js'; // Le fichier qu'on vient de créer
// --- AJOUT 1 : On importe le routeur des conversations ---
import conversationRouter from './conversations.js'; 

import { getTasks, createTask, deleteTask } from './tasks.js';

const router = Router();

// Routes modulaires
router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);
router.use('/incidents', incidentsRouter);
router.use('/tasks', tasksRouter);

// --- ROUTES SOUVENIRS / JOURNAL (EXPRESS) ---
// Note : Le frontend appelle /api/souvenirs, donc ici on définit la suite
router.get('/souvenirs', getJournalEntries);
router.post('/souvenirs', createJournalEntry);
router.post('/souvenirs/:id/comments', addCommentToEntry);
router.delete('/souvenirs/:id/comments/:commentId', deleteCommentFromEntry);
router.delete('/souvenirs/:id', deleteJournalEntry);

// --- AJOUT 2 : On active la route ---
// Cela va créer l'URL : http://localhost:4000/api/conversations
router.use('/conversations', conversationRouter);

// --- ROUTES SOUVENIRS / JOURNAL (EXPRESS) ---
// Note : Le frontend appelle /api/souvenirs, donc ici on définit la suite
router.get('/souvenirs', getJournalEntries);
router.post('/souvenirs', createJournalEntry);
router.post('/souvenirs/:id/comments', addCommentToEntry);
router.delete('/souvenirs/:id/comments/:commentId', deleteCommentFromEntry);
router.delete('/souvenirs/:id', deleteJournalEntry);

export default router;