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

// En environnement de production, ne pas forcer localhost.
// Si vous avez besoin d'origines locales pour le développement,
// définissez `ALLOWED_ORIGINS` dans votre fichier .env (séparées par des virgules).
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

    // En développement, tu peux commenter la vérification stricte ci-dessous
    // et juste mettre : return callback(null, true); 
    // Mais voici la version sécurisée :
    if (allowedOrigins.some(o => origin.startsWith(o)) || allowedOrigins.includes('*')) {
       return callback(null, true);
    }
    
    console.warn(`CORS blocked origin: ${origin}`);
    // Pour débloquer temporairement si tu galères, décommente la ligne suivante :
    // return callback(null, true); 
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// --- MIDDLEWARES ---
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
app.use('/api/auth', authRoutes); // <--- CORRECTION ICI
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);

// --- 3. Routeur Principal (si tu as un index global) ---
// Toutes les routes définies dans routes/index.js seront préfixées par /api

// --- Gestion des Erreurs (DOIT être à la fin) ---

app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource non trouvée', path: req.path });
// IMPORTANT : Permet de lire le JSON envoyé par le React
app.use(express.json()); 

// --- DEBUG LOGGING ---
// J'ajoute ceci pour que tu voies dans la console ce que le serveur reçoit
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log(`📦 REÇU [${req.method}] ${req.path} :`, req.body);
    }
    next();
});

// --- ROUTES ---
app.use('/test-db', dbTestRouter);

// Toutes les routes API (dont conversations) sont montées ici
app.use('/api', routes); 

// --- GESTION DES ERREURS ---
// 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route introuvable', path: req.path });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ message: 'Erreur serveur interne', error: err.message });
});

});

export default app;