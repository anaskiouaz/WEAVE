console.log(">>> DÉMARRAGE AVEC CORS MANUEL (FIX ULTIME) <<<");

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import dbTestRouter from './routes/testDb.js';

const app = express();

// On force les headers sur TOUTES les requêtes, avant tout le reste.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Autoriser l'origine qui appelle (ex: http://localhost) ou mettre *
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // Autoriser les méthodes HTTP standard
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  // Autoriser les headers spécifiques demandés par le client
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  // Autoriser les cookies/sessions
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Répondre immédiatement "OK" aux requêtes de pré-vérification (OPTIONS)
  // C'est souvent là que ça bloquait avant !
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
// --------------------------------

app.use('/test-db', dbTestRouter);

// Core middleware
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  // On s'assure de ne pas renvoyer d'erreur si la réponse a déjà été envoyée
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ message: 'Internal server error' });
});

export default app;