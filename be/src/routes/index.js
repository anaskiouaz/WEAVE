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
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

export default router;