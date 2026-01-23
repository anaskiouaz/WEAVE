import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // AJOUT DE L'URL VERCEL ICI
      origin: [
        "https://weave-steel.vercel.app", // <--- INDISPENSABLE
        "http://localhost:5173", 
        "http://localhost:4000",
        "http://127.0.0.1:5173",
        "http://localhost",
        "capacitor://localhost" 
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization"], 
    },
    transports: ['websocket', 'polling'], 
    path: '/socket.io'
  });

  io.on('connection', (socket) => {
    console.log('📡 [SOCKET] Nouveau client:', socket.id);

    // Tentative d'auth via le handshake
    const token = socket.handshake.auth?.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            socket.userId = decoded.id;
            socket.join(decoded.id);
            console.log(`✅ [SOCKET] User identifié: ${decoded.id}`);
        } catch (err) {
            console.log('⚠️ [SOCKET] Token invalide, connexion anonyme');
        }
    }

    socket.on('join_conversation', (conversationId) => {
      const room = `conversation_${conversationId}`;
      socket.join(room);
      console.log(`➡️ [SOCKET] ${socket.id} rejoint ${room}`);
    });

    socket.on('send_message', async (data) => {
        // 🛡️ Modération du contenu (import dynamique pour éviter les problèmes de cycle)
        const { moderateMessage } = await import('../utils/moderation.js');
        const moderation = moderateMessage(data.contenu || data.content);
        
        const moderatedData = {
            ...data,
            contenu: moderation.content,
            content: moderation.content,
            is_moderated: moderation.isModerated
        };

        if (moderation.isModerated) {
            console.log(`⚠️ [SOCKET] Message modéré dans conversation_${data.conversationId}`);
        }

        // Broadcast à la room
        console.log(`📨 [SOCKET] Message dans conversation_${data.conversationId}`);
        io.to(`conversation_${data.conversationId}`).emit('receive_message', moderatedData);
    });

    socket.on('disconnect', () => {
      // console.log('Client déconnecté');
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io n'est pas initialisé !");
  }
  return io;
};