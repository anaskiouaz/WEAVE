import { Router } from 'express';
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';
import incidentsRouter from './incidents.js'; // <--- 1. IMPORT AJOUTÉ
import { getTasks, createTask, deleteTask } from './tasks.js';
import { getJournalEntries, createJournalEntry } from './journal.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);
router.use('/incidents', incidentsRouter); // <--- 2. ROUTE ACTIVÉE ICI

// Tasks routes
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

// Journal Entries routes
router.get('/journal-entries', getJournalEntries);
router.post('/journal-entries', createJournalEntry);

export default router;