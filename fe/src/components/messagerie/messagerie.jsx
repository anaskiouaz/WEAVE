import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
// On n'utilise pas encore Socket.io pour l'affichage statique, mais on le garde pour plus tard
import io from 'socket.io-client';

const Messagerie = () => {
    const currentUser = { 
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
        role: 'ADMIN', 
        name: 'Thomas Durand' 
    }; 
    
    const [conversations, setConversations] = useState([]);
    const [membres, setMembres] = useState([]);
    
    // État pour la conversation active et ses messages
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);

    // 1. Charger la liste des convs (AVEC CORRECTIF ANTI-DOUBLON)
    const fetchConversations = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/conversations');
            if (res.ok) {
                const data = await res.json();
                
                // --- FIX : Suppression des doublons basés sur l'ID ---
                // Si ton backend renvoie plusieurs lignes pour le même groupe (à cause des JOINs)
                // ceci ne gardera qu'une seule version de chaque groupe.
                const uniqueConversations = Array.from(
                    new Map(data.map(item => [item.id, item])).values()
                );

                setConversations(uniqueConversations);
            }
        } catch (e) { console.error(e); }
    };

    // 2. Charger les membres
    const fetchMembres = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/conversations/membres');
            if (res.ok) setMembres(await res.json());
        } catch (e) { console.error(e); }
    };

    // 3. Charger les messages d'une conversation spécifique (QUAND ON CLIQUE)
    const loadMessages = async (conversation) => {
        setActiveConversation(conversation);
        try {
            const res = await fetch(`http://localhost:4000/api/conversations/${conversation.id}/messages`);
            if (res.ok) {
                setMessages(await res.json());
            }
        } catch (e) { console.error("Erreur messages", e); }
    };

    // 4. NOUVEAU : Supprimer une conversation
    const handleDeleteConversation = async (conversationId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) return;

        try {
            const response = await fetch(`http://localhost:4000/api/conversations/${conversationId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Mise à jour de la liste locale (plus rapide que de refetch tout)
                setConversations(prev => prev.filter(c => c.id !== conversationId));

                // Si on supprime la conversation qu'on regarde, on ferme la fenêtre
                if (activeConversation && activeConversation.id === conversationId) {
                    setActiveConversation(null);
                    setMessages([]);
                }
            } else {
                alert("Erreur lors de la suppression.");
            }
        } catch (error) {
            console.error("Erreur suppression", error);
            alert("Erreur réseau lors de la suppression.");
        }
    };

    useEffect(() => {
        fetchConversations();
        fetchMembres();
    }, []);

    const handleStartChat = async (type, participants, nomGroupe) => {
        try {
            const response = await fetch('http://localhost:4000/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, nom: nomGroupe, participants })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Succès -> On recharge la liste proprement
                fetchConversations();
            } else {
                alert("Erreur : " + data.error);
            }
        } catch (error) {
            console.error("Erreur réseau", error);
            alert("Erreur de connexion au serveur");
        }
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
                    // On passe la nouvelle fonction ici
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
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.auteur_id === currentUser.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                                            <p>{msg.contenu}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.date_envoi).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Zone de saisie */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Écrivez votre message..." 
                                    className="flex-1 border p-2 rounded-full focus:outline-none focus:border-blue-500 px-4"
                                />
                                <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
                                    Envoyer
                                </button>
                            </div>
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

export default Messagerie;