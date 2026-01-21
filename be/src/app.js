import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Middlewares Globaux ---
app.use(helmet({
  crossOriginResourcePolicy: false, 
}));
app.use(morgan('dev'));
app.use(express.json());

// --- 1. DÉFINITION DE LA LISTE BLANCHE (CORS) ---
const allowedOrigins = [
  "https://weave-steel.vercel.app", // VOTRE FRONTEND VERCEL
  "http://localhost:5173",          // Vite Local
  "http://localhost:4000",          // Backend Local
  "http://localhost"           // Mobile
];

// --- 2. CONFIGURATION CORS EXPRESS ---
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (ex: Postman, App Mobile native)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("🚫 CORS Bloqué pour l'origine:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true, // OBLIGATOIRE pour les cookies/sessions
}));

// --- Dossier Uploads Public ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- Montage des Routes API ---
app.use('/api', routes);

// --- Gestion des Erreurs ---
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  // Si l'erreur vient de CORS, on renvoie un message propre
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Blocage CORS (Origine non autorisée)' });
  }
  res.status(500).json({ message: 'Erreur interne serveur', error: err.message });
});

export default app;