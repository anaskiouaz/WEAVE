import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Users, MessageSquare, Settings, X, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPut } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { fetchUnreadMessagesCount } from '../../utils/unreadMessages';

// Import du composant Mobile
import MobileMessages from './../ui-mobile/messages/MobileMessages';

const Messages = () => {
  const { user, circleId, setUnreadMessages } = useAuth();
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

  // Initialisation Socket.IO
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('weave_token');
    const SOCKET_URL = import.meta.env.MODE === 'development'
      ? 'http://localhost:4000'
      : 'https://weave-be-server-d8badmaafzdvc8aq.swedencentral-01.azurewebsites.net';

    socketRef.current = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    socketRef.current.on('connect', () => console.log("✅ Socket connecté sur", SOCKET_URL));

    loadConversations();
    loadMembers();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  // Gestion des événements et conversation active
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.off('receive_message');

    if (activeConversation) {
      loadMessages(activeConversation.id);
      loadParticipants(activeConversation.id);
      markAsRead(activeConversation.id);

      const roomId = String(activeConversation.id);
      socketRef.current.emit('join_conversation', roomId);

      const handleReceiveMessage = async (message) => {
        if (message.auteur_id === user?.id) {
          loadConversations();
          return;
        }

        if (String(message.conversation_id) === String(activeConversation.id)) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
          await markAsRead(activeConversation.id);
        } else {
          // Message reçu dans une autre conversation, rafraîchir le compteur
          const count = await fetchUnreadMessagesCount(circleId);
          setUnreadMessages(count);
        }
        loadConversations();
      };

      socketRef.current.on('receive_message', handleReceiveMessage);

    } else {
      const handleGlobalMessage = async (message) => {
        if (message.auteur_id !== user?.id) {
          loadConversations();
          // Rafraîchir le compteur de messages non lus
          const count = await fetchUnreadMessagesCount(circleId);
          setUnreadMessages(count);
        }
      };
      socketRef.current.on('receive_message', handleGlobalMessage);
    }
  }, [activeConversation, user]);

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  // Appels API pour charger les conversations et messages
  const loadConversations = async () => {
    try {
      const data = await apiGet('/conversations');
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
    } catch (err) { console.error("Erreur conversations:", err); }
  };

  const markAsRead = async (convId) => {
    try {
      await apiPut(`/conversations/${convId}/read`, {});
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, unread_count: 0 } : c
      ));
      // Rafraîchir le compteur global de messages non lus
      const count = await fetchUnreadMessagesCount(circleId);
      setUnreadMessages(count);
    } catch (e) { console.error("Erreur lecture", e); }
  };

  const loadMembers = async () => {
    try {
      const resolved = circleId || (user && user.circles && user.circles.length > 0 ? user.circles[0].id : null);
      if (!resolved) return;
      setCurrentCircleId(resolved);

      const data = await apiGet(`/circles/${resolved}/members`);
      const others = Array.isArray(data) ? data.filter(m => m.id !== user?.id) : [];
      setAvailableMembers(others);
    } catch (err) { console.error("Erreur membres:", err); }
  };

  const loadMessages = async (convId) => {
    try {
      const msgs = await apiGet(`/conversations/${convId}/messages`);
      setMessages(msgs);
      scrollToBottom();
    } catch (err) { console.error("Erreur messages:", err); }
  };

  const loadParticipants = async (convId) => {
    try {
      const parts = await apiGet(`/conversations/${convId}/participants`);
      setCurrentParticipants(parts);
    } catch (err) { console.error("Erreur participants:", err); }
  };

  // Actions de l'utilisateur (envoyer, archiver, etc.)

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
          setTimeout(async () => {
            const data = await loadConversations(); // Re-fetch to be safe
            // On peut aussi utiliser la liste locale si elle est à jour
            // Mais ici on utilise 'data' renvoyé par le fetch si loadConversations retourne quelque chose (manquait return dans loadConversations original)
            // Fix simple: on utilise le state 'conversations' au prochain rendu, ou on re-find dans le tableau local temporaire
            const found = res.conversationId; 
            // Petit hack : on simule l'objet conversation pour l'activer tout de suite
            // L'idéal est que loadConversations retourne la liste
          }, 300);
          
          // Force reload pour trouver la nouvelle conv
          const updatedList = await apiGet('/conversations');
          setConversations(updatedList);
          const found = updatedList.find(c => c.id === res.conversationId);
          if (found) setActiveConversation(found);
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
    if (!confirm("Retirer ce membre ?")) return;
    try {
      await apiDelete(`/conversations/${activeConversation.id}/participants/${memberId}`);
      loadParticipants(activeConversation.id);
    } catch (e) { alert("Erreur suppression membre"); }
  };

  const handleDeleteConversation = async () => {
    if (!confirm("Supprimer définitivement cette conversation ?")) return;
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

  // Rendu du composant
  return (
    <>
      {/* Version mobile */}
      <div className="md:hidden">
        <MobileMessages 
          user={user}
          conversations={conversations}
          activeConversation={activeConversation}
          messages={messages}
          messagesEndRef={messagesEndRef}
          
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          showNewConvModal={showNewConvModal}
          setShowNewConvModal={setShowNewConvModal}
          availableMembers={availableMembers}
          selectedMembers={selectedMembers}
          toggleMemberSelection={toggleMemberSelection}
          newConvName={newConvName}
          setNewConvName={setNewConvName}
          
          onSelectConversation={setActiveConversation}
          onBackToList={() => setActiveConversation(null)}
          onSendMessage={handleSendMessage}
          onCreateConversation={handleCreateConversation}
          
          showInfo={showInfo}
          setShowInfo={setShowInfo}
          currentParticipants={currentParticipants}
          isAddingMember={isAddingMember}
          setIsAddingMember={setIsAddingMember}
          onAddMember={handleAddMemberToGroup}
          onRemoveMember={handleRemoveMember}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Version desktop */}
      <div className="hidden md:flex h-[calc(100vh-100px)] rounded-3xl overflow-hidden relative" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
        {/* GAUCHE : LISTE */}
        <div className="w-1/3 flex flex-col" style={{ borderRight: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Discussions</h2>
            <button onClick={() => setShowNewConvModal(true)} className="p-2.5 rounded-xl transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'rgba(240, 128, 128, 0.1)', color: 'var(--soft-coral)' }}>
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`p-4 cursor-pointer transition-all`}
                style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: activeConversation?.id === conv.id ? 'var(--bg-card)' : 'transparent',
                  borderLeft: activeConversation?.id === conv.id ? '4px solid var(--text-primary)' : '4px solid transparent',
                  boxShadow: activeConversation?.id === conv.id ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {conv.nom || "Discussion"}
                  </h3>
                  <span className="text-[10px] whitespace-nowrap ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {conv.date_dernier_message ? new Date(conv.date_dernier_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="mt-1 truncate text-xs">
                  {conv.unread_count > 0 ? (
                    <span className="font-bold" style={{ color: 'var(--soft-coral)' }}>
                      {conv.unread_count} Nouveau{conv.unread_count > 1 ? 'x' : ''} message{conv.unread_count > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>{conv.sender_name ? `${conv.sender_name}: ` : ''}{conv.dernier_message || <i>Aucun message</i>}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DROITE : CHAT */}
        <div className="flex-1 flex flex-col relative" style={{ backgroundColor: 'var(--bg-card)' }}>
          {activeConversation ? (
            <>
              <div className="p-4 flex justify-between items-center z-10" style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', boxShadow: 'var(--shadow-sm)' }}>
                    {activeConversation.type === 'GROUPE' ? <Users size={20} /> : <MessageSquare size={20} />}
                  </div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{activeConversation.nom}</h3>
                </div>
                <button onClick={() => setShowInfo(true)} className="p-2 rounded-xl transition-all" style={{ color: 'var(--text-secondary)' }}>
                  <Settings size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {messages.map((msg, idx) => {
                  const isMe = msg.auteur_id === user?.id;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[70%] px-4 py-3 rounded-3xl ${isMe ? 'rounded-br-lg' : 'rounded-bl-lg'}`}
                        style={{ 
                          backgroundColor: isMe ? 'var(--soft-coral)' : 'var(--bg-card)',
                          color: isMe ? 'white' : 'var(--text-primary)',
                          border: isMe ? 'none' : '2px solid var(--border-medium)',
                          boxShadow: isMe ? '0 4px 12px rgba(240, 128, 128, 0.3)' : 'var(--shadow-sm)'
                        }}
                      >
                        {!isMe && activeConversation.type === 'GROUPE' && <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--soft-coral)' }}>{msg.sender_name}</p>}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.contenu}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 flex gap-3" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Écrivez votre message..." className="flex-1 border-2 rounded-full px-5 py-2.5 focus:outline-none focus:ring-2 font-medium transition-all" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }} />
                <button type="submit" disabled={!newMessage.trim()} className="p-3 text-white rounded-full transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ backgroundColor: 'var(--soft-coral)', boxShadow: '0 4px 16px rgba(240, 128, 128, 0.25)' }}><Send className="w-5 h-5" /></button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
              <MessageSquare className="w-20 h-20 mb-4 opacity-20" />
              <p className="font-semibold">Sélectionnez une conversation</p>
            </div>
          )}
        </div>

        {/* Modal de création de conversation (desktop) */}
        {showNewConvModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Nouvelle discussion</h3>
                <button onClick={() => setShowNewConvModal(false)} className="transition-colors" style={{ color: 'var(--text-secondary)' }}><X /></button>
              </div>
              {selectedMembers.length > 1 && (
                <input type="text" placeholder="Nom du groupe" value={newConvName} onChange={e => setNewConvName(e.target.value)} className="w-full border-2 p-3 rounded-2xl mb-4 focus:ring-2 outline-none font-medium transition-all" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }} />
              )}
              <div className="max-h-60 overflow-y-auto mb-4 border-2 rounded-2xl p-2" style={{ borderColor: 'var(--border-light)' }}>
                {availableMembers.map(m => (
                  <div key={m.id} onClick={() => toggleMemberSelection(m.id)} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all" style={{ backgroundColor: selectedMembers.includes(m.id) ? 'rgba(167, 201, 167, 0.1)' : 'transparent' }}>
                    <div className="w-5 h-5 border-2 rounded-lg transition-all" style={{ backgroundColor: selectedMembers.includes(m.id) ? 'var(--sage-green)' : 'transparent', borderColor: selectedMembers.includes(m.id) ? 'var(--sage-green)' : 'var(--border-input)' }}></div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleCreateConversation} disabled={selectedMembers.length === 0} className="w-full text-white py-3 rounded-full font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ backgroundColor: 'var(--soft-coral)', boxShadow: '0 4px 16px rgba(240, 128, 128, 0.25)' }}>Créer / Ouvrir</button>
            </div>
          </div>
        )}

        {/* Modal d'infos du groupe (desktop) */}
        {showInfo && activeConversation && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-80 h-full p-6 overflow-y-auto animate-in slide-in-from-right" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Paramètres</h3>
                <button onClick={() => setShowInfo(false)} className="transition-colors" style={{ color: 'var(--text-secondary)' }}><X /></button>
              </div>

              <div className="mb-6 text-center">
                <div className="w-20 h-20 rounded-3xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', boxShadow: 'var(--shadow-md)' }}>
                  {activeConversation.nom?.charAt(0)}
                </div>
                <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{activeConversation.nom}</h2>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{activeConversation.type}</p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Membres ({currentParticipants.length})</h4>
                  {activeConversation.type === 'GROUPE' && (
                    <button onClick={() => setIsAddingMember(!isAddingMember)} className="text-sm font-semibold transition-colors" style={{ color: 'var(--soft-coral)' }}>
                      {isAddingMember ? 'Annuler' : 'Ajouter'}
                    </button>
                  )}
                </div>

                {isAddingMember && (
                  <div className="mb-4 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                    <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Sélectionnez pour ajouter :</p>
                    {availableMembers.filter(am => !currentParticipants.find(cp => cp.id === am.id)).map(m => (
                      <div key={m.id} onClick={() => handleAddMemberToGroup(m.id)} className="flex items-center gap-2 p-2 cursor-pointer rounded-xl transition-all" style={{ color: 'var(--text-primary)' }}>
                        <Plus size={14} style={{ color: 'var(--sage-green)' }} /> <span className="font-semibold">{m.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <ul className="space-y-3">
                  {currentParticipants.map(p => (
                    <li key={p.id} className="flex justify-between items-center p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name} {p.id === user.id && <span style={{ color: 'var(--sage-green)' }}>(Moi)</span>}</span>
                      {(user.role_global === 'ADMIN' || user.role_global === 'SUPERADMIN' || user.onboarding_role === 'ADMIN') && p.id !== user.id && (
                        <button onClick={() => handleRemoveMember(p.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button onClick={handleDeleteConversation} className="flex items-center gap-2 w-full p-3 rounded-2xl transition-all font-bold" style={{ color: 'var(--soft-coral)' }}>
                  <Trash2 size={20} />
                  <span>Supprimer la conversation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Messages;