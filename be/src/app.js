console.log(">>> DÉMARRAGE DU SCRIPT APP.JS <<<");

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// --- Imports des Routes ---
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import auditRoutes from './routes/audit.js'; 
import authRoutes from './routes/auth.js'; 
import circlesRoutes from './routes/circles.js';

const app = express();

// --- Configuration CORS ---
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawAllowedOrigins.split(',').map(o => o.trim()).filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost', 'capacitor://localhost', 'http://10.0.2.2'];
  defaultOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
  });
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || allowedOrigins.includes('*')) {
       return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true,
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Weave en ligne');
});

// ✅ ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/circles', circlesRoutes);

// ERREURS
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route introuvable', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ message: 'Erreur serveur interne', error: err.message });
});

export default app;