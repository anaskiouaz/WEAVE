import http from 'http';
import { Server } from 'socket.io'; 
import app from './app.js';
import { pool } from './config/db.js';
import initCronJobs from './services/cronService.js';

const PORT = process.env.PORT || 4000;

// 1. Créer le serveur HTTP
const server = http.createServer(app);

// Liste des origines autorisées (Doit être identique à app.js)
const allowedOrigins = [
  "https://weave-steel.vercel.app",
  "http://localhost:5173",
  "http://localhost:4000",
  "capacitor://localhost"
];

// 2. Créer le serveur Socket.io CORRIGÉ
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // On utilise la liste explicite, PAS "*"
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  },
  transports: ['websocket', 'polling'] // Force la stabilité
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connecté: ${socket.id}`);
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`👤 User ${socket.id} rejoint la salle ${conversationId}`);
  });
  socket.on('disconnect', () => {});
});

server.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📦 Base de données connectée.`);
    initCronJobs();
  } catch (err) {
    console.error('❌ Erreur connexion DB:', err);
  }
});