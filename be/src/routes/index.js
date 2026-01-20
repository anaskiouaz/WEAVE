import { Router } from 'express';

// Import des routes individuelles
import authRoutes from './auth.js';
import circlesRoutes from './circles.js';
import conversationsRoutes from './conversations.js';
import dashboardRoutes from './dashboard.js';
import uploadRoutes from './upload.js';
import profileModule from './profile_module.js';
// Ajoute ici d'autres routes si tu en as (ex: tasks.js)

const router = Router();

// Montage des routes
router.use('/auth', authRoutes);
router.use('/circles', circlesRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);
router.use('/module/profile', profileModule);

export default router;