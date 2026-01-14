import http from 'http';
import app from './app.js';
import { initSocket } from './services/socketService.js'; // <--- IMPORT IMPORTANT

const PORT = process.env.PORT || 3000;

// 1. On crée un serveur HTTP "natif" qui englobe ton app Express
const server = http.createServer(app);

// 2. On attache Socket.io à ce serveur
initSocket(server);

// 3. On lance le serveur (Note: on utilise 'server.listen' et plus 'app.listen')
server.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur le port ${PORT}`);
    console.log(`📡 Socket.io est prêt`);
});