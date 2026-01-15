console.log(">>> DÉMARRAGE DU SCRIPT SERVER.JS <<<");

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// --- Imports des Routes ---
import routes from './routes/index.js';
import dbTestRouter from './routes/testDb.js';
import healthRoutes from './routes/health.js';
import usersRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import circlesRoutes from './routes/circles.js';
const app = express();

// --- Configuration CORS ---
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin(origin, callback) {
    // Autoriser les requêtes sans origine (ex: Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }

    // Si aucune ALLOWED_ORIGINS n'est configurée, tout autoriser (Dev mode)
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// --- Middlewares de base ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// --- Servir les fichiers statiques (images uploadées) ---
app.use('/uploads', express.static('uploads'));

// --- 1. LANDING PAGE (Demandé en premier) ---
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>Bienvenue sur l'API</h1>
      <p>Le serveur fonctionne correctement.</p>
      <a href="/api/health">Voir le statut de santé</a>
    </div>
  `);
});

app.use('/api', routes);
// --- 2. Routes API Spécifiques ---
app.use('/api/circles', circlesRoutes);
app.use('/test-db', dbTestRouter);
app.use('/health', healthRoutes); // Ou '/api/health' selon ta préférence
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// --- 3. Routeur Principal (si tu as un index global) ---
// Toutes les routes définies dans routes/index.js seront préfixées par /api

// --- Gestion des Erreurs (DOIT être à la fin) ---

// 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource non trouvée', path: req.path });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

export default app;
