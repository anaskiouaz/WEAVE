import { Router } from 'express';
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);

export default router;
//teset