import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Users, MessageSquare, Info, X } from 'lucide-react';
import { apiGet, apiPost } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]); // Membres de la conv active
  const [newMessage, setNewMessage] = useState('');
  
  // États pour la modale de création
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newConvName, setNewConvName] = useState('');
  const [currentCircleId, setCurrentCircleId] = useState(null);
  const [showInfo, setShowInfo] = useState(false); // Modale info participants

  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  // 1. Initialisation Socket & Chargement initial
  useEffect(() => {
    // ON FORCE LE PORT 4000 (L'URL directe de l'API)
    // Cela corrige les erreurs "ws://localhost:5173..."
    socketRef.current = io('http://localhost:4000', { 
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('weave_token') // On envoie le token au socket
      }
    });

    loadConversations();
    loadMembers(); // Pré-charger les membres pour la création

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // 2. Gestion de la salle (Room) quand on change de conversation
  useEffect(() => {
    if (activeConversation) {
      loadMessagesAndParticipants(activeConversation.id);
      
      const roomId = String(activeConversation.id);
      socketRef.current.emit('join_conversation', roomId);

      // Écoute des nouveaux messages en temps réel
      const handleReceiveMessage = (message) => {
        // On vérifie que le message concerne bien la conversation ouverte
        if (String(message.conversation_id) === String(activeConversation.id)) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        }
        // On recharge la liste des convs pour mettre à jour l'aperçu du dernier message
        loadConversations();
      };

      socketRef.current.on('receive_message', handleReceiveMessage);

      // Nettoyage de l'écouteur
      return () => {
        socketRef.current.off('receive_message', handleReceiveMessage);
        socketRef.current.emit('leave_conversation', roomId);
      };
    }
  }, [activeConversation]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // --- APPELS API ---

  const loadConversations = async () => {
    try {
      const data = await apiGet('/conversations');
      setConversations(data);
    } catch (err) {
      console.error("Erreur chargement conversations:", err);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await apiGet('/conversations/membres');
      if (data && data.membres) {
        setAvailableMembers(data.membres);
        setCurrentCircleId(data.circle_id);
      }
    } catch (err) {
      console.error("Erreur chargement membres:", err);
    }
  };

  const loadMessagesAndParticipants = async (convId) => {
    try {
      const data = await apiGet(`/conversations/${convId}/messages`);
      setMessages(data.messages);
      setParticipants(data.participants);
      scrollToBottom();
    } catch (err) {
      console.error("Erreur chargement messages:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      await apiPost(`/conversations/${activeConversation.id}/messages`, {
        contenu: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedMembers.length === 0) return;

    const isGroup = selectedMembers.length > 1;
    const type = isGroup ? 'GROUPE' : 'PRIVE';
    const nomFinal = newConvName || (isGroup ? "Nouveau Groupe" : "Privé");

    try {
      const res = await apiPost('/conversations', {
        type,
        nom: nomFinal,
        participants: selectedMembers,
        cercle_id: currentCircleId
      });
      
      if (res.success) {
        await loadConversations();
        setShowNewConvModal(false);
        setSelectedMembers([]);
        setNewConvName('');
        
        // Si l'API renvoie l'objet complet ou juste l'ID (cas conv existante)
        const newConv = res.conversation || conversations.find(c => c.id === res.conversationId);
        if (newConv) setActiveConversation(newConv);
        else loadConversations(); // Fallback
      }
    } catch (err) {
      console.error("Erreur création:", err);
      alert("Erreur lors de la création : " + err.message);
    }
  };

  const toggleMemberSelection = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(prev => prev.filter(m => m !== id));
    } else {
      setSelectedMembers(prev => [...prev, id]);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      
      {/* GAUCHE : LISTE DES CONVERSATIONS */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="font-bold text-lg text-gray-700">Discussions</h2>
          <button 
            onClick={() => setShowNewConvModal(true)} 
            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
            title="Nouvelle conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-4 text-center text-gray-400 text-sm">Aucune discussion.</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                activeConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-800 truncate pr-2">
                  {conv.titre || conv.nom || "Discussion"}
                </h3>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {conv.date_dernier_message 
                    ? new Date(conv.date_dernier_message).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : ''}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate mt-1">
                {conv.dernier_message || <span className="italic text-gray-400">Nouvelle conversation</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* DROITE : ZONE DE CHAT */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeConversation ? (
          <>
            {/* Header Chat */}
            <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                  {activeConversation.type === 'GROUPE' ? <Users size={20} /> : <MessageSquare size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{activeConversation.titre || activeConversation.nom}</h3>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> En ligne
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(!showInfo)} 
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="Voir les membres"
              >
                <Info size={20} />
              </button>
            </div>

            {/* Liste des Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, idx) => {
                const isMe = msg.auteur_id === user.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                      {!isMe && activeConversation.type === 'GROUPE' && (
                        <p className="text-[10px] font-bold mb-1 text-orange-500">{msg.nom_auteur}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.contenu}</p>
                      <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.date_envoi).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Message */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()} 
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 shadow-md transition-transform active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            {/* Modale Infos Participants (Overlay) */}
            {showInfo && (
              <div className="absolute top-16 right-4 w-64 bg-white shadow-xl border rounded-xl p-4 z-20 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h4 className="font-bold text-gray-700">Membres ({participants.length})</h4>
                  <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                </div>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {participants.map(p => (
                    <li key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                        {p.name ? p.name.charAt(0) : '?'}
                      </div>
                      <span className="truncate">{p.name || 'Utilisateur'}</span>
                      {p.role && <span className="text-[9px] bg-gray-100 px-1 rounded text-gray-500">{p.role}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageSquare className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-lg font-medium">Sélectionnez une conversation</p>
          </div>
        )}
      </div>

      {/* --- MODALE CRÉATION CONVERSATION --- */}
      {showNewConvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Nouvelle discussion</h3>
              <button onClick={() => setShowNewConvModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Nom du groupe (si > 1 personne) */}
            {selectedMembers.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du groupe</label>
                <input
                  type="text"
                  value={newConvName}
                  onChange={(e) => setNewConvName(e.target.value)}
                  placeholder="Ex: Organisation Anniversaire"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Choisir les participants :</p>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2 bg-gray-50">
                {availableMembers.length === 0 && <p className="text-sm text-gray-400 p-2 text-center">Aucun autre membre trouvé dans le cercle.</p>}
                
                {availableMembers.map(member => (
                  <div 
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMembers.includes(member.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      selectedMembers.includes(member.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
                    }`}>
                      {selectedMembers.includes(member.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{member.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateConversation}
              disabled={selectedMembers.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              {selectedMembers.length > 1 ? 'Créer le groupe' : 'Démarrer la discussion'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Messages;