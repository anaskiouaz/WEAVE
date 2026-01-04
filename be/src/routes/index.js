import { Router } from 'express';
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';
import { getTasks, createTask, deleteTask } from './tasks.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);

// Tasks routes
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

export default router;
//teset