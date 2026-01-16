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
import tasksRoutes from './routes/tasks.js';
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

if (process.env.NODE_ENV !== 'production') {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'http://10.0.2.2'
  ];
  defaultOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
  });
}

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin(origin, callback) {
    // Autoriser les requêtes sans origine (Mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(o => origin.startsWith(o)) || allowedOrigins.includes('*')) {
       return callback(null, true);
    }
    
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// --- MIDDLEWARES GLOBAUX ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json()); // Important : Doit être avant les routes et les logs de body

// --- DEBUG LOGGING (Placé AVANT les routes pour voir passer les requêtes) ---
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        console.log(`📦 REÇU [${req.method}] ${req.path} :`, req.body);
    }
    next();
});

// --- Servir les fichiers statiques (images uploadées) ---
app.use('/uploads', express.static('uploads'));

// --- 1. LANDING PAGE ---
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>Bienvenue sur l'API</h1>
      <p>Le serveur fonctionne correctement.</p>
      <a href="/api/health">Voir le statut de santé</a>
    </div>
  `);
});

// --- 2. Routes API ---

// Routes spécifiques
app.use('/api/circles', circlesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);

// Routes utilitaires
app.use('/health', healthRoutes); // Souvent accessible sans /api pour les load balancers
app.use('/test-db', dbTestRouter);

// Routeur Principal (Regroupe le reste)
// Si routes/index.js contient déjà users, auth, etc., les lignes au-dessus sont peut-être redondantes,
// mais je les laisse pour assurer la compatibilité avec ton code existant.
app.use('/api', routes);

// --- 3. GESTION DES ERREURS (DOIT être à la fin) ---

// 404 Not Found (Si aucune route n'a matché avant)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource introuvable', path: req.path });
});

// Global Error Handler (Pour attraper les crashs / next(err))
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  const message = process.env.NODE_ENV === 'production' ? 'Erreur serveur interne' : err.message;
  res.status(500).json({ message, error: err.message }); // 'error' affiché pour le debug, à retirer en prod stricte
});

export default app;