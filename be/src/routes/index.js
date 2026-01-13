import { Router } from 'express';

// Imports des routeurs
import healthRouter from './health.js';
import usersRouter from './users.js';
import testDbRouter from './testDb.js';
import incidentsRouter from './incidents.js';
import dashboardRouter from './dashboard.js'; // <--- AJOUT ICI

// Import des contrôleurs (fonctions)
import { getTasks, createTask, deleteTask } from './tasks.js';
// import { getJournalEntries... } from './souvenirs.js'; // Laisser commenté si pas encore créé

const router = Router();

// Routes modulaires
router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/test-db', testDbRouter);
router.use('/incidents', incidentsRouter);
router.use('/dashboard', dashboardRouter); // <--- AJOUT ICI

// --- ROUTES TASKS ---
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

export default router;