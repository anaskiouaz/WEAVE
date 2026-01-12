import dotenv from 'dotenv';
dotenv.config();

import http from 'http'; // <--- 1. On importe le module HTTP natif
import app from './app.js';
import { initSocket } from './services/socketService.js'; // <--- 2. On importe ton service socket

const PORT = process.env.PORT || 4000;

// 3. On crée le serveur HTTP manuellement en lui passant ton app Express
const server = http.createServer(app);

// 4. On attache Socket.io à ce serveur
const io = initSocket(server);

// 5. ATTENTION : On lance 'server.listen' et non plus 'app.listen'
server.listen(PORT, () => {
  console.log(`🚀 API + Socket running on port ${PORT}`);
  console.log('Test modification : Socket.io activé');
});