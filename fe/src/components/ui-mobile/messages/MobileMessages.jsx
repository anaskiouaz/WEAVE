import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, ChevronLeft, Send, 
  Users, MessageSquare, Trash2, Settings, UserPlus 
} from 'lucide-react';

export default function MobileMessages({
  user,
  conversations,
  activeConversation,
  messages,
  messagesEndRef,
  newMessage, setNewMessage,
  showNewConvModal, setShowNewConvModal,
  availableMembers,
  selectedMembers, toggleMemberSelection,
  newConvName, setNewConvName,
  onSelectConversation,
  onBackToList,
  onSendMessage,
  onCreateConversation,
  showInfo, setShowInfo,
  currentParticipants,
  isAddingMember, setIsAddingMember,
  onAddMember,
  onRemoveMember,
  onDeleteConversation
}) {

  const listRef = useRef(null);
  const location = useLocation();

  // Auto-scroll vers le bas quand les messages changent
  useEffect(() => {
    if (activeConversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversation]);

  // Scroll to top quand on arrive sur la page
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Variantes d'animation
  const slideVariants = {
    hidden: { x: '100%' }, 
    visible: { x: '0%' },
    exit: { x: '100%' }
  };

  const transitionConfig = { 
    type: 'tween', 
    ease: [0.25, 0.1, 0.25, 1],
    duration: 0.3 
  };

  return (
    <div className="relative h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* LISTE DES CONVERSATIONS */}
      <div className="flex flex-col h-full w-full absolute inset-0">
        <div className="px-4 py-3 flex justify-between items-center z-10 shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-3">
            {user && user.circles && user.circles.length > 0 && (
              (() => {
                const circles = user.circles;
                const storageId = (typeof window !== 'undefined' && localStorage.getItem('circle_id')) || (circles[0]?.id ?? circles[0]?.circle_id) || '';
                const currentId = String(storageId);
                const onChangeCircle = (e) => {
                  try { localStorage.setItem('circle_id', e.target.value); } catch (err) {}
                  window.location.reload();
                };
                return (
                  <select value={currentId} onChange={onChangeCircle} className="text-sm rounded px-2 py-1" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                    {circles.map((c) => (
                      <option key={String(c.id ?? c.circle_id)} value={String(c.id ?? c.circle_id)}>{c.senior_name || c.name || `Cercle ${c.id ?? c.circle_id}`}</option>
                    ))}
                  </select>
                );
              })()
            )}
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Discussions</h1>
          </div>
          <div className="text-xs px-2 py-1 rounded-full font-bold" style={{ backgroundColor: 'var(--bg-notice)', color: 'var(--soft-coral)' }}>
            {conversations.filter(c => c.unread_count > 0).length} non lus
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto pb-24">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20" style={{ color: 'var(--text-secondary)' }}>
              <MessageSquare className="w-12 h-12 mb-2" style={{ opacity: 0.18, color: 'var(--text-secondary)' }} />
              <p>Aucune discussion</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className="flex items-center gap-4 p-4 cursor-pointer"
                style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)' }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0`} style={{ backgroundColor: conv.type === 'GROUPE' ? 'var(--soft-coral)' : 'var(--accent-blue)' }}>
                  {conv.nom ? conv.nom.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="truncate font-semibold text-base" style={{ color: conv.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {conv.nom || "Discussion"}
                    </h3>
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                       {conv.date_dernier_message ? new Date(conv.date_dernier_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="truncate text-sm" style={{ color: conv.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                       {conv.sender_name && conv.type === 'GROUPE' ? `${conv.sender_name}: ` : ''}
                       {conv.dernier_message || "Démarrer la discussion"}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: 'var(--soft-coral)', color: '#fff' }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => setShowNewConvModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all z-20"
        style={{ backgroundColor: 'var(--soft-coral)', color: '#fff' }}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* CHAT ACTIF */}
      <AnimatePresence>
        {activeConversation && (
          <motion.div 
            key="chat-view"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitionConfig}
            style={{ willChange: 'transform', backgroundColor: 'var(--bg-primary)' }}
            className="fixed inset-0 z-50 flex flex-col h-full w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 shrink-0 z-10" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-1">
                <button onClick={onBackToList} className="p-2 -ml-1 rounded-full active:scale-90 transition-transform" style={{ color: 'var(--text-secondary)' }}>
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold`} style={{ backgroundColor: activeConversation.type === 'GROUPE' ? 'var(--soft-coral)' : 'var(--accent-blue)' }}>
                    {activeConversation.nom?.charAt(0) || '?'}
                  </div>
                  <div className="leading-tight">
                    <h3 className="font-bold text-sm max-w-[150px] truncate" style={{ color: 'var(--text-primary)' }}>
                      {activeConversation.nom}
                    </h3>
                    <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {activeConversation.type === 'GROUPE' ? 'Groupe' : 'Privé'}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowInfo(true)} className="p-2 rounded-full" style={{ color: 'var(--text-secondary)' }}>
                <Settings className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {messages.map((msg, idx) => {
                const isMe = msg.auteur_id === user?.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div 
                      className={`max-w-[80%] px-3 py-2 rounded-xl relative ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                      style={{
                        backgroundColor: isMe ? 'var(--soft-coral)' : 'var(--bg-card)',
                        color: isMe ? 'white' : 'var(--text-primary)',
                        border: isMe ? 'none' : '2px solid var(--border-medium)',
                        boxShadow: isMe ? '0 4px 12px rgba(240, 128, 128, 0.3)' : 'var(--shadow-sm)'
                      }}
                    >
                      {!isMe && activeConversation.type === 'GROUPE' && (
                         <p className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--soft-coral)' }}>{msg.sender_name}</p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: isMe ? '#fff' : 'var(--text-primary)' }}>{msg.contenu}</p>
                      <span className="text-[9px] block text-right mt-1" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(var(--text-secondary-rgb),0.9)' }}>
                         {new Date(msg.date_envoi).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input */}
            <form onSubmit={onSendMessage} className="p-3 flex items-center gap-2 pb-[max(12px,env(safe-area-inset-bottom))] shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Message..." 
                className="flex-1 border-0 rounded-full px-4 py-2.5 transition-all text-sm"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()} 
                className="p-2.5 rounded-full disabled:opacity-50 transition-colors shadow-sm"
                style={{ backgroundColor: 'var(--soft-coral)', color: '#fff' }}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALE PARAMÈTRES */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            key="info-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-end"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={transitionConfig}
              className="w-[85%] max-w-sm h-full shadow-2xl flex flex-col"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Infos discussion</h2>
                <button onClick={() => setShowInfo(false)}><X className="w-6 h-6" style={{ color: 'var(--text-secondary)' }}/></button>
              </div>
            
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-3" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                    {activeConversation.nom?.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>{activeConversation.nom}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm uppercase" style={{ color: 'var(--text-primary)' }}>Membres ({currentParticipants.length})</h4>
                    {activeConversation.type === 'GROUPE' && (
                      <button 
                        onClick={() => setIsAddingMember(!isAddingMember)} 
                        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded"
                        style={{ backgroundColor: 'var(--bg-notice)', color: 'var(--soft-coral)' }}
                      >
                        <UserPlus className="w-3 h-3"/> {isAddingMember ? 'Fermer' : 'Ajouter'}
                      </button>
                    )}
                  </div>

                  {isAddingMember && (
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Ajouter un participant :</p>
                      <div className="space-y-2">
                        {availableMembers.filter(am => !currentParticipants.find(cp => cp.id === am.id)).map(m => (
                          <button key={m.id} onClick={() => onAddMember(m.id)} className="w-full flex items-center gap-2 p-2 rounded text-left" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                            <Plus size={14} style={{ color: 'var(--accent-blue)' }}/> <span className="text-sm">{m.name}</span>
                          </button>
                        ))}
                        {availableMembers.filter(am => !currentParticipants.find(cp => cp.id === am.id)).length === 0 && (
                          <p className="text-xs italic text-center" style={{ color: 'var(--text-secondary)' }}>Tous les membres sont déjà là.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <ul className="space-y-3">
                    {currentParticipants.map(p => (
                      <li key={p.id} className="flex justify-between items-center pb-2 last:border-0" style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name} {p.id === user.id && '(Moi)'}</span>
                        {(user.role_global === 'ADMIN' || user.role_global === 'SUPERADMIN' || user.onboarding_role === 'ADMIN') && p.id !== user.id && (
                          <button onClick={() => onRemoveMember(p.id)} className="p-1" style={{ color: 'var(--text-secondary)' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4" style={{ borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
                <button 
                  onClick={onDeleteConversation} 
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold"
                  style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,0,0,0.06)' }}
                >
                  <Trash2 size={18} />
                  Quitter / Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALE CRÉATION */}
      <AnimatePresence>
        {showNewConvModal && (
          <motion.div 
            key="new-conv-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={transitionConfig}
            style={{ willChange: 'transform', backgroundColor: 'var(--bg-primary)'}}
            className="fixed inset-0 z-[60] flex flex-col"
          >
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
              <button onClick={() => setShowNewConvModal(false)} className="p-2 rounded-full">
                <X className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
              </button>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Nouvelle discussion</span>
              <button 
                onClick={onCreateConversation}
                disabled={selectedMembers.length === 0}
                className="font-bold disabled:opacity-50"
                style={{ color: 'var(--soft-coral)' }}
              >
                Créer
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {selectedMembers.length > 1 && (
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Nom du groupe</label>
                  <input 
                    type="text" 
                    value={newConvName}
                    onChange={e => setNewConvName(e.target.value)}
                    placeholder="Ex: Famille..."
                    className="w-full mt-1 p-3 rounded-lg outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              )}

              <label className="text-xs font-bold uppercase mb-2 block" style={{ color: 'var(--text-secondary)' }}>Membres</label>
              <div className="space-y-2">
                {availableMembers.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => toggleMemberSelection(m.id)}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                    style={{ backgroundColor: selectedMembers.includes(m.id) ? 'var(--bg-notice)' : 'var(--bg-card)', borderColor: 'var(--border-light)' }}
                  >
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center" style={{ backgroundColor: selectedMembers.includes(m.id) ? 'var(--accent-blue)' : 'transparent', borderColor: 'var(--border-light)' }}>
                      {selectedMembers.includes(m.id) && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fff' }} />}
                    </div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}