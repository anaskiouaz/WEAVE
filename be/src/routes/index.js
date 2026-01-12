// src/routes/index.js
import { Router } from 'express';

// Seuls les fichiers qui existent vraiment sont importés
import healthRouter from './health.js';
import usersRouter from './users.js';
import { getTasks, createTask, deleteTask } from './tasks.js';

const router = Router();

// Routes de base
router.use('/health', healthRouter);
router.use('/users', usersRouter);

// Routes Tâches
// Imports des contrôleurs
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';
import incidentsRouter from './incidents.js';

// Import des fonctions contrôleurs (Destructuring)
import { getTasks, createTask, deleteTask } from './tasks.js'; // Vérifie le chemin !
import { getJournalEntries, createJournalEntry , addCommentToEntry} from './souvenirs.js'; // Le fichier qu'on vient de créer

const router = Router();

// Routes modulaires
router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);
router.use('/incidents', incidentsRouter);

// --- ROUTES TASKS (EXPRESS) ---
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

// --- ROUTES SOUVENIRS / JOURNAL (EXPRESS) ---
// Note : Le frontend appelle /api/souvenirs, donc ici on définit la suite
router.get('/souvenirs', getJournalEntries);
router.post('/souvenirs', createJournalEntry);
router.post('/souvenirs/:id/comments', addCommentToEntry);

export default router;