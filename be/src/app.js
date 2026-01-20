console.log(">>> CHARGEMENT DE APP.JS <<<");

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// --- Imports des Routes ---
import routes from './routes/index.js';
import dbTestRouter from './routes/testDb.js';
import healthRoutes from './routes/health.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import circlesRoutes from './routes/circles.js';
// Import du routeur conversation que nous avons créé
import conversationRouter from './routes/conversations.js'; 

const app = express();

// --- Configuration CORS ---
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawAllowedOrigins.split(',').map(o => o.trim()).filter(Boolean);

if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:5173');
    allowedOrigins.push('http://localhost:4000');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // En dev, on est permissif si ça bloque
    console.warn(`CORS blocked origin (warning only): ${origin}`);
    return callback(null, true); 
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// --- MIDDLEWARES ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json()); // Une seule fois ici !

// Servir les uploads
app.use('/uploads', express.static('uploads'));

// --- ROUTES ---
app.get('/', (req, res) => {
  res.send('<h1>API Weave en ligne</h1>');
});

// Montage des routes spécifiques
app.use('/api/circles', circlesRoutes);
app.use('/api/test-db', dbTestRouter);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/conversations', conversationRouter); // Notre nouvelle route

// Routeur global (si d'autres routes sont dans index.js)
app.use('/api', routes);

// --- GESTION ERREURS ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route introuvable', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({ message: 'Erreur interne', error: err.message });
});

export default app;