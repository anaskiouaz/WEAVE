console.log(">>> DÉMARRAGE DU SCRIPT APP.JS <<<");

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

// --- Configuration CORS BLINDÉE ---

// 1. Origines venant de l'environnement Azure
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// 2. Origines "en dur" (Filet de sécurité pour la Prod)
const hardcodedOrigins = [
  'https://weave-steel.vercel.app', 
  'https://weave-steel.vercel.app/'
];

// 3. Origines locales (Dev uniquement)
const devOrigins = process.env.NODE_ENV !== 'production' ? [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost',
  'capacitor://localhost',
  'http://10.0.2.2'
] : [];

// Fusion de toutes les listes
const allowedOrigins = [...new Set([...envOrigins, ...hardcodedOrigins, ...devOrigins])];

console.log('✅ CORS - Origines autorisées :', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (Mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || allowedOrigins.includes('*');

    if (isAllowed) {
      return callback(null, true);
    } 
    
    console.error(`🔴 CORS BLOQUÉ : "${origin}" n'est pas dans la liste autorisée.`);
    // En cas de désespoir total, décommentez la ligne suivante pour tout autoriser temporairement :
    // return callback(null, true);
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

// --- MIDDLEWARES ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// --- LOGGING (Avant les routes) ---
app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log(`📦 [${req.method}] ${req.path}`, req.body);
    }
    next();
});

// --- ROUTES ---
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/', (req, res) => {
  res.status(200).send('API Weave en ligne.');
});
app.use('/health', healthRoutes);
app.use('/test-db', dbTestRouter);

// API Routes
app.use('/api/circles', circlesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);

// Routeur global
app.use('/api', routes);

// --- GESTION DES ERREURS ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource introuvable', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('❌ Erreur Serveur :', err);
  const message = process.env.NODE_ENV === 'production' ? 'Erreur interne' : err.message;
  res.status(500).json({ message: 'Erreur serveur interne', error: message });
});

export default app;