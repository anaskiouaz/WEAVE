import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // En dev on autorise tout
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('🟢 Nouveau client connecté:', socket.id);

        // Quand le frontend dit "Je rentre dans la conv 123"
        socket.on('join_conversation', (conversationId) => {
            // Le nom de la salle est simple : l'ID de la conv
            // IMPORTANT : Convertir en string pour éviter les bugs
            const room = String(conversationId);
            socket.join(room);
            console.log(`Socket ${socket.id} rejoint la salle : ${room}`);
        });

        // Quand le frontend dit "Je sors"
        socket.on('leave_conversation', (conversationId) => {
            const room = String(conversationId);
            socket.leave(room);
            console.log(`Socket ${socket.id} quitte la salle : ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('🔴 Client déconnecté:', socket.id);
        });
    });

    return io;
};

// Fonction pour récupérer l'instance IO partout (notamment dans le contrôleur)
export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io n'a pas été initialisé dans server.js !");
    }
    return io;
};