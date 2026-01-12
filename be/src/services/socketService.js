import { Server } from 'socket.io';
import db from '../config/db.js';

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            // On récupère les origines autorisées ou on met le frontend par défaut
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:5173"],
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connecté: ${socket.id}`);

        socket.on('join_conversations', (conversationIds) => {
            if (Array.isArray(conversationIds)) {
                conversationIds.forEach(id => {
                    socket.join(`conversation_${id}`);
                    console.log(`Socket ${socket.id} a rejoint la room conversation_${id}`);
                });
            }
        });

        socket.on('send_message', async (data) => {
            console.log('📩 Message reçu via socket:', data);
            try {
                // Sauvegarde BDD
                await db.query(
                    "INSERT INTO message (conversation_id, auteur_id, contenu) VALUES ($1, $2, $3)",
                    [data.conversationId, data.auteurId, data.contenu]
                );

                // Diffusion
                socket.to(`conversation_${data.conversationId}`).emit('receive_message', data);
            } catch (err) {
                console.error("Erreur socket message:", err);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket déconnecté');
        });
    });

    return io;
};