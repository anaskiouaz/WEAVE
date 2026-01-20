import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Import du Hub de routes (celui qu'on vient de corriger)
import routes from './routes/index.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Middlewares Globaux ---
app.use(helmet({
  crossOriginResourcePolicy: false, // Autorise l'affichage des images
}));
app.use(morgan('dev'));
app.use(express.json());

// --- CORS (Important pour le Frontend) ---
app.use(cors({
  origin: true, // Accepte tout (Frontend)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true,
}));

// --- Middleware OPTIONS (Fix pour Firefox/Chrome) ---
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).json({});
  }
  next();
});

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
  res.status(500).json({ message: 'Erreur interne serveur', error: err.message });
});

export default app;