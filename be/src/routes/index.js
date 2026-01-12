import { Router } from 'express';
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';
import incidentsRouter from './incidents.js';
// --- AJOUT 1 : On importe le routeur des conversations ---
import conversationRouter from './conversations.js'; 

import { getTasks, createTask, deleteTask } from './tasks.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);
router.use('/incidents', incidentsRouter);

// --- AJOUT 2 : On active la route ---
// Cela va créer l'URL : http://localhost:4000/api/conversations
router.use('/conversations', conversationRouter);

// Tasks routes
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

export default router;