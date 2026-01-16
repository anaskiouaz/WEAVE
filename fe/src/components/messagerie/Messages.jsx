import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import io from 'socket.io-client';
import axios from 'axios'; // J'utilise axios car tu l'as installé, c'est plus propre que fetch

// Configuration
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || '';

const Messages = () => {
    const currentUser = { 
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
        role: 'ADMIN', 
        name: 'Thomas Durand' 
    }; 
    
    // États
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [membres, setMembres] = useState([]);
    
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [nouveauMessage, setNouveauMessage] = useState(""); // État pour le champ de texte

    // Référence pour le scroll automatique
    const messagesEndRef = useRef(null);

    // --- 1. INITIALISATION DU SOCKET ---
    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);
        
        // Nettoyage à la fermeture
        return () => newSocket.disconnect();
    }, []);

    // --- 2. GESTION DU LIVE (Socket) ---
    useEffect(() => {
        if (!socket || !activeConversation) return;

        socket.emit('join_conversation', activeConversation.id);

        const handleReceiveMessage = (message) => {
            console.log("📩 Message reçu du LIVE :", message);
            
            if (message.conversation_id === activeConversation.id) {
                setMessages((prev) => {
                    // SÉCURITÉ : On vérifie si le message est déjà là (par son ID)
                    // Cela empêche l'affichage en double si on l'a déjà ajouté manuellement
                    if (prev.some(m => m.id === message.id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
                scrollToBottom();
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [activeConversation, socket]);
   


    // --- 3. CHARGEMENT DES DONNÉES ---
    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/conversations`);
            // Anti-doublon
            const uniqueConversations = Array.from(
                new Map(res.data.map(item => [item.id, item])).values()
            );
            setConversations(uniqueConversations);
        } catch (e) { console.error(e); }
    };

    const fetchMembres = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/conversations/membres`);
            setMembres(res.data);
        } catch (e) { console.error(e); }
    };

    // Chargement initial
    useEffect(() => {
        fetchConversations();
        fetchMembres();
    }, []);

    // Charger l'historique d'une conv
    const loadMessages = async (conversation) => {
        setActiveConversation(conversation);
        try {
            const res = await axios.get(`${BACKEND_URL}/api/conversations/${conversation.id}/messages`);
            setMessages(res.data);
            scrollToBottom();
        } catch (e) { console.error("Erreur messages", e); }
    };

    // --- 4. ACTIONS (Envoyer / Supprimer / Créer) ---
    
    const handleEnvoyer = async (e) => {
        e.preventDefault();
        if (!nouveauMessage.trim() || !activeConversation) return;

        try {
            // 1. On envoie le message à l'API
            const res = await axios.post(`${BACKEND_URL}/api/conversations/${activeConversation.id}/messages`, {
                contenu: nouveauMessage
            });

            // 2. CORRECTION : On l'ajoute IMMÉDIATEMENT à l'écran grâce à la réponse de l'API
            // (Comme ça, même si le socket lag ou plante, tu vois ton message)
            const messageConfirme = res.data;
            
            setMessages((prev) => {
                // Petite sécurité anti-doublon (au cas où le socket arrive juste après)
                if (prev.some(m => m.id === messageConfirme.id)) return prev;
                return [...prev, messageConfirme];
            });

            setNouveauMessage("");
            scrollToBottom();

        } catch (error) {
            console.error("Erreur envoi", error);
            alert("Erreur lors de l'envoi du message");
        }
    };

    const handleDeleteConversation = async (conversationId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) return;
        try {
            await axios.delete(`${BACKEND_URL}/api/conversations/${conversationId}`);
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (activeConversation?.id === conversationId) {
                setActiveConversation(null);
                setMessages([]);
            }
        } catch (error) {
            console.error("Erreur suppression", error);
        }
    };

    const handleStartChat = async (type, participants, nomGroupe) => {
        try {
            await axios.post(`${BACKEND_URL}/api/conversations`, { type, nom: nomGroupe, participants });
            fetchConversations();
        } catch (error) {
            alert("Erreur création chat");
        }
    };

    // Utilitaire scroll
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <div className="flex h-screen w-full bg-gray-100">
            <div className="h-full">
                <Sidebar 
                    roleUtilisateur={currentUser.role} 
                    membresDuCercle={membres} 
                    conversations={conversations} 
                    onStartChat={handleStartChat}
                    onSelectConversation={loadMessages}
                    activeId={activeConversation?.id}
                    onDeleteConversation={handleDeleteConversation}
                />
            </div>
            
            {/* ZONE DE CHAT */}
            <div className="flex-1 flex flex-col h-full">
                {activeConversation ? (
                    <>
                        {/* Header du Chat */}
                        <div className="bg-white p-4 border-b shadow-sm flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">
                                {activeConversation.nom || "Discussion"}
                            </h2>
                            <span className="text-sm text-gray-500">
                                {activeConversation.type === 'GROUPE' ? 'Groupe' : 'Privé'}
                            </span>
                        </div>

                        {/* Liste des messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                            {messages.map((msg) => {
                                // 1. On ne met plus 'index' dans les parenthèses du map
                                const isMe = msg.auteur_id === currentUser.id;
                                
                                return (
                                    // 2. ICI : On remplace key={index} par key={msg.id}
                                    // Cela permet à React de ne pas se mélanger les pinceaux entre le message ajouté manuellement et celui du socket
                                    <div key={msg.id || Date.now() + Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div 
                                            className={`max-w-md p-3 rounded-lg shadow-sm ${
                                                isMe 
                                                ? 'bg-blue-600 text-white rounded-br-none' 
                                                : 'bg-white text-gray-800 rounded-bl-none'
                                            }`}
                                        >
                                            {!isMe && (
                                                <p className="text-xs font-bold mb-1 text-gray-500">
                                                    {msg.nom_auteur}
                                                </p>
                                            )}
                                            <p className="break-words">{msg.contenu}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.date_envoi).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Zone de saisie FONCTIONNELLE */}
                        <div className="p-4 bg-white border-t">
                            <form 
                                onSubmit={handleEnvoyer} // 1. Gestion de l'envoi sur Entrée ou clic
                                className="flex gap-2"
                            >
                                <input 
                                    type="text" 
                                    value={nouveauMessage} // 2. Lier la valeur à l'état
                                    onChange={(e) => setNouveauMessage(e.target.value)} // 3. Mettre à jour l'état
                                    placeholder="Écrivez votre message..." 
                                    className="flex-1 border p-2 rounded-full focus:outline-none focus:border-blue-500 px-4"
                                />
                                <button 
                                    type="submit" // 4. Type submit pour déclencher le onSubmit
                                    disabled={!nouveauMessage.trim()}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Envoyer
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <p className="text-2xl mb-2">💬</p>
                            <p>Sélectionnez une conversation pour commencer</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;