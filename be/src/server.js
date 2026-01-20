import http from 'http';
import { Server } from 'socket.io'; 
import app from './app.js';
import { pool } from './config/db.js';

const PORT = process.env.PORT || 4000;

// 1. Créer le serveur HTTP
const server = http.createServer(app);

// 2. Créer le serveur Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// 3. Attacher Socket.io à l'application
// C'est ce qui permet de faire req.app.get('io') dans les routes
app.set('io', io);

// --- Gestion des Connexions Socket ---
io.on('connection', (socket) => {
  console.log(`🔌 Socket connecté: ${socket.id}`);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`👤 User ${socket.id} rejoint la salle ${conversationId}`);
  });

  socket.on('disconnect', () => {
    // console.log(`❌ Socket déconnecté`);
  });
});

// 4. Démarrer le serveur
server.listen(PORT, async () => {
  try {
    // Test simple de la DB au démarrage
    await pool.query('SELECT 1');
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📦 Base de données connectée.`);
  } catch (err) {
    console.error('❌ Erreur connexion DB:', err);
  }
});