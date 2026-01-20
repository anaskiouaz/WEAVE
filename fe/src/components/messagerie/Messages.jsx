import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Users, MessageSquare, Settings, X, Trash2, UserPlus } from 'lucide-react'; 
import { apiGet, apiPost, apiDelete, apiPut } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // États modale Création
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newConvName, setNewConvName] = useState('');
  
  // États modale Info (Gestion groupe)
  const [showInfo, setShowInfo] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [currentCircleId, setCurrentCircleId] = useState(null);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  // --- 1. INITIALISATION SOCKET ---
  useEffect(() => {
    // On ne connecte que si on a un user
    if (!user) return;

    const token = localStorage.getItem('weave_token');
    socketRef.current = io('http://localhost:4000', { 
      path: '/socket.io',
      transports: ['websocket', 'polling'], 
      auth: { token } 
    });

    socketRef.current.on('connect', () => console.log("✅ Socket connecté !"));

    loadConversations();
    loadMembers();

    return () => { 
        if (socketRef.current) socketRef.current.disconnect(); 
    };
  }, [user]);

  // --- 2. GESTION ÉVÉNEMENTS & CONV ACTIVE ---
  useEffect(() => {
    // SÉCURITÉ : Si le socket n'est pas prêt, on arrête
    if (!socketRef.current) return;

    // On nettoie l'ancien listener pour éviter les doublons quand on change de conv
    socketRef.current.off('receive_message');

    if (activeConversation) {
      loadMessages(activeConversation.id);
      loadParticipants(activeConversation.id);
      markAsRead(activeConversation.id);

      // IMPORTANT : Conversion explicite en String pour matcher le backend
      const roomId = String(activeConversation.id);
      console.log("🔗 Rejoindre la salle Socket :", roomId);
      socketRef.current.emit('join_conversation', roomId);

      const handleReceiveMessage = (message) => {
        console.log("📩 Message Socket reçu :", message);

        // 1. Si c'est MON message, on ignore (on l'a déjà affiché localement via handleSendMessage)
        if (message.auteur_id === user?.id) {
             loadConversations(); 
             return;
        }

        // 2. Si je suis SUR la conversation active (comparaison String vs String)
        if (String(message.conversation_id) === String(activeConversation.id)) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
          markAsRead(activeConversation.id); 
        } 
        
        // 3. Dans tous les cas, on recharge la liste (pour les compteurs non lus)
        loadConversations(); 
      };

      socketRef.current.on('receive_message', handleReceiveMessage);

    } else {
        // Mode "Global" (aucune conv ouverte)
        const handleGlobalMessage = (message) => {
             if (message.auteur_id !== user?.id) {
                 console.log("🔔 Notif globale reçue");
                 loadConversations();
             }
        };
        socketRef.current.on('receive_message', handleGlobalMessage);
    }
  }, [activeConversation, user]); 

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  // --- API CALLS ---

  const loadConversations = async () => {
    try {
      const data = await apiGet('/conversations');
      setConversations(data);
    } catch (err) { console.error("Erreur chargement conversations:", err); }
  };

  const markAsRead = async (convId) => {
      try {
          await apiPut(`/conversations/${convId}/read`, {});
          setConversations(prev => prev.map(c => 
              c.id === convId ? { ...c, unread_count: 0 } : c
          ));
      } catch (e) { console.error("Erreur lecture", e); }
  };

  const loadMembers = async () => {
    try {
      let targetCircleId = null;
      if (user && user.circles && user.circles.length > 0) targetCircleId = user.circles[0].id;
      else targetCircleId = localStorage.getItem('circle_id');

      if (!targetCircleId) return;
      setCurrentCircleId(targetCircleId);

      const data = await apiGet(`/circles/${targetCircleId}/members`);
      const others = Array.isArray(data) ? data.filter(m => m.id !== user?.id) : [];
      setAvailableMembers(others);
    } catch (err) { console.error("Erreur chargement membres:", err); }
  };

  const loadMessages = async (convId) => {
    try {
      const msgs = await apiGet(`/conversations/${convId}/messages`);
      setMessages(msgs);
    } catch (err) { console.error("Erreur chargement messages:", err); }
  };

  const loadParticipants = async (convId) => {
      try {
          const parts = await apiGet(`/conversations/${convId}/participants`);
          setCurrentParticipants(parts);
      } catch (err) { console.error("Erreur participants:", err); }
  };

  // --- ACTIONS ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const tempMsg = { id: Date.now(), contenu: newMessage, auteur_id: user.id, date_envoi: new Date().toISOString() };
      setMessages(prev => [...prev, tempMsg]);
      scrollToBottom();
      setNewMessage('');
      
      await apiPost(`/conversations/${activeConversation.id}/messages`, { content: newMessage });
      await markAsRead(activeConversation.id);
      loadConversations(); 
    } catch (err) { console.error("Erreur envoi:", err); }
  };

  const handleCreateConversation = async () => {
    if (selectedMembers.length === 0) return;
    const isGroup = selectedMembers.length > 1;
    const type = isGroup ? 'GROUPE' : 'PRIVE';
    const nomFinal = newConvName || (isGroup ? "Nouveau Groupe" : "Discussion");

    try {
      const res = await apiPost('/conversations', {
        type,
        nom: nomFinal,
        userIds: selectedMembers, 
        cercleId: currentCircleId
      });
      
      if (res.success) {
        await loadConversations();
        setShowNewConvModal(false);
        setSelectedMembers([]);
        setNewConvName('');
        
        if (res.existing || res.conversationId) {
            setTimeout(() => {
                const existing = conversations.find(c => c.id === res.conversationId);
                if (existing) setActiveConversation(existing);
                else loadConversations().then(data => {
                     const found = data.find(c => c.id === res.conversationId);
                     if(found) setActiveConversation(found);
                });
            }, 300);
        }
      }
    } catch (err) { alert("Erreur: " + err.message); }
  };

  const handleAddMemberToGroup = async (memberId) => {
      try {
          await apiPost(`/conversations/${activeConversation.id}/participants`, { userId: memberId });
          loadParticipants(activeConversation.id);
          setIsAddingMember(false);
      } catch (e) { alert("Erreur ajout membre"); }
  };

  const handleRemoveMember = async (memberId) => {
      if(!confirm("Retirer ce membre ?")) return;
      try {
          await apiDelete(`/conversations/${activeConversation.id}/participants/${memberId}`);
          loadParticipants(activeConversation.id);
      } catch (e) { alert("Erreur suppression membre"); }
  };

  const handleDeleteConversation = async () => {
      if(!confirm("Supprimer définitivement cette conversation ?")) return;
      try {
          await apiDelete(`/conversations/${activeConversation.id}`);
          setActiveConversation(null);
          loadConversations();
          setShowInfo(false);
      } catch (e) { alert("Erreur suppression conversation"); }
  };

  const toggleMemberSelection = (id) => {
    if (selectedMembers.includes(id)) setSelectedMembers(prev => prev.filter(m => m !== id));
    else setSelectedMembers(prev => [...prev, id]);
  };

  // --- RENDER ---
  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative">
      
      {/* GAUCHE : LISTE */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="font-bold text-lg text-gray-700">Discussions</h2>
          <button onClick={() => setShowNewConvModal(true)} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                activeConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
              }`}
            >
              <div className="flex justify-between items-start">
                  <h3 className={`font-semibold truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                      {conv.nom || "Discussion"}
                  </h3>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                     {conv.date_dernier_message ? new Date(conv.date_dernier_message).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                  </span>
              </div>
              
              <div className="mt-1 truncate text-xs">
                 {conv.unread_count > 0 ? (
                     <span className="text-blue-600 font-bold">
                        {conv.unread_count} Nouveau{conv.unread_count > 1 ? 'x' : ''} message{conv.unread_count > 1 ? 's' : ''}
                     </span>
                 ) : (
                     <span className="text-gray-500">{conv.dernier_message || <i>Aucun message</i>}</span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DROITE : CHAT */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeConversation ? (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                  {activeConversation.type === 'GROUPE' ? <Users size={20} /> : <MessageSquare size={20} />}
                </div>
                <h3 className="font-bold text-gray-800">{activeConversation.nom}</h3>
              </div>
              <button onClick={() => setShowInfo(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                <Settings size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, idx) => {
                const isMe = msg.auteur_id === user?.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                      {!isMe && activeConversation.type === 'GROUPE' && <p className="text-[10px] font-bold mb-1 text-orange-500">{msg.sender_name}</p>}
                      <p className="text-sm leading-relaxed">{msg.contenu}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Écrivez votre message..." className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"><Send className="w-5 h-5" /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageSquare className="w-20 h-20 mb-4 opacity-20" />
            <p>Sélectionnez une conversation</p>
          </div>
        )}
      </div>

      {/* --- MODALE CRÉATION --- */}
      {showNewConvModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">Nouvelle discussion</h3>
                <button onClick={() => setShowNewConvModal(false)}><X/></button>
            </div>
            {selectedMembers.length > 1 && (
              <input type="text" placeholder="Nom du groupe" value={newConvName} onChange={e => setNewConvName(e.target.value)} className="w-full border p-2 rounded mb-4" />
            )}
            <div className="max-h-60 overflow-y-auto mb-4 border rounded p-2">
                {availableMembers.map(m => (
                    <div key={m.id} onClick={() => toggleMemberSelection(m.id)} className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 ${selectedMembers.includes(m.id) ? 'bg-blue-50' : ''}`}>
                        <div className={`w-4 h-4 border rounded ${selectedMembers.includes(m.id) ? 'bg-blue-500' : ''}`}></div>
                        <span>{m.name}</span>
                    </div>
                ))}
            </div>
            <button onClick={handleCreateConversation} disabled={selectedMembers.length === 0} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Créer / Ouvrir</button>
          </div>
        </div>
      )}

      {/* --- MODALE INFO GROUPE (SETTINGS) --- */}
      {showInfo && activeConversation && (
        <div className="absolute inset-0 bg-black/50 z-50 flex justify-end">
            <div className="w-80 bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Paramètres</h3>
                    <button onClick={() => setShowInfo(false)}><X/></button>
                </div>

                <div className="mb-6 text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold text-gray-500">
                        {activeConversation.nom?.charAt(0)}
                    </div>
                    <h2 className="font-bold text-xl">{activeConversation.nom}</h2>
                    <p className="text-sm text-gray-500">{activeConversation.type}</p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-700">Membres ({currentParticipants.length})</h4>
                        {activeConversation.type === 'GROUPE' && (
                            <button onClick={() => setIsAddingMember(!isAddingMember)} className="text-blue-600 text-sm hover:underline">
                                {isAddingMember ? 'Annuler' : 'Ajouter'}
                            </button>
                        )}
                    </div>
                    
                    {isAddingMember && (
                        <div className="mb-4 bg-gray-50 p-2 rounded border">
                            <p className="text-xs text-gray-500 mb-2">Sélectionnez pour ajouter :</p>
                            {availableMembers.filter(am => !currentParticipants.find(cp => cp.id === am.id)).map(m => (
                                <div key={m.id} onClick={() => handleAddMemberToGroup(m.id)} className="flex items-center gap-2 p-1 hover:bg-white cursor-pointer rounded">
                                    <Plus size={14}/> <span>{m.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <ul className="space-y-3">
                        {currentParticipants.map(p => (
                            <li key={p.id} className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">{p.name} {p.id === user.id && '(Moi)'}</span>
                                {(user.role_global === 'ADMIN' || user.role_global === 'SUPERADMIN' || user.onboarding_role === 'ADMIN') && p.id !== user.id && (
                                    <button onClick={() => handleRemoveMember(p.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} /> 
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t pt-6 mt-6">
                    <button onClick={handleDeleteConversation} className="flex items-center gap-2 text-red-600 hover:bg-red-50 w-full p-3 rounded-lg transition">
                        <Trash2 size={20} />
                        <span className="font-bold">Supprimer la conversation</span>
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Messages;