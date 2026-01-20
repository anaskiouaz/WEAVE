import http from 'http';
import app from './app.js'; // On importe l'app configurée juste au-dessus
import { initSocket } from './services/socketService.js';
import initCronJobs from './services/cronService.js';
import { initFirebase } from './config/firebase.js'; // Si tu utilises firebase

const PORT = process.env.PORT || 4000;

// 1. Initialisation des services externes
initFirebase();
initCronJobs();

// 2. Création du serveur HTTP
const server = http.createServer(app);

// 3. Attachement de Socket.io
initSocket(server);

// 4. Lancement
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ SERVEUR DÉMARRÉ sur le port ${PORT}`);
    console.log(`📡 Socket.io prêt`);
});