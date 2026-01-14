import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
    // Configuration de base pour accepter les connexions du Frontend
    io = new Server(httpServer, {
        cors: {
            origin: "*", // En production, il faudra mettre la vraie URL du site
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('🟢 Nouveau client connecté au socket:', socket.id);

        // Quand le frontend dit "Je rejoins la conversation 123"
        socket.on('join_conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} a rejoint la salle ${conversationId}`);
        });

        socket.on('disconnect', () => {
            console.log('🔴 Client déconnecté:', socket.id);
        });
    });

    return io;
};

// Fonction pour récupérer l'instance io n'importe où dans le code
export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io n'a pas été initialisé !");
    }
    return io;
};