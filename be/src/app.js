// src/app.js
console.log(">>> DÉMARRAGE DU SCRIPT APP.JS <<<");

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js'; // C'est ici que sont gérées toutes tes routes
import dbTestRouter from './routes/testDb.js';

const app = express();

// --- CONFIGURATION CORS ---
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// On ajoute ton Frontend local par défaut si la variable d'env est vide (pour le dev)
if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:5173');
}

console.log('CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Autoriser les requêtes sans origine (ex: Postman, scripts serveur)
      if (!origin) return callback(null, true);

      if (allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        console.warn(`⛔ CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }

      // Si aucune restriction n'est configurée, on autorise tout (mode dev permissif)
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// --- MIDDLEWARES ---
app.use(helmet());
app.use(morgan('dev'));

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

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ message: 'Erreur serveur interne', error: err.message });
});

export default app;