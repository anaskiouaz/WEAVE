import { useEffect } from 'react';
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

  // Auto-scroll vers le bas quand les messages changent
  useEffect(() => {
    if (activeConversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversation]);

  // Variantes d'animation simplifiées et optimisées
  const slideVariants = {
    hidden: { x: '100%' }, 
    visible: { x: '0%' },
    exit: { x: '100%' }
  };

  // Configuration de la transition : 'tween' évite l'effet de rebond (double animation)
  const transitionConfig = { 
    type: 'tween', 
    ease: [0.25, 0.1, 0.25, 1], // Courbe de Bézier style iOS (easeOut)
    duration: 0.3 
  };

  return (
    <div className="relative h-screen bg-gray-50 overflow-hidden">
      
      {/* ========================================================= */}
      {/* COUCHE 1 : LISTE DES CONVERSATIONS (Toujours en fond)     */}
      {/* ========================================================= */}
      <div className="flex flex-col h-full w-full absolute inset-0">
        <div className="bg-white/90 backdrop-blur-md border-b px-4 py-3 shadow-sm flex justify-between items-center z-10 shrink-0">
          <h1 className="text-xl font-bold text-blue-600">Discussions</h1>
          <div className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-bold">
            {conversations.filter(c => c.unread_count > 0).length} non lus
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
              <p>Aucune discussion</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className="flex items-center gap-4 p-4 border-b border-gray-100 bg-white active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${conv.type === 'GROUPE' ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                  {conv.nom ? conv.nom.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`truncate font-semibold text-base ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                      {conv.nom || "Discussion"}
                    </h3>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                       {conv.date_dernier_message ? new Date(conv.date_dernier_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`truncate text-sm ${conv.unread_count > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                       {conv.sender_name && conv.type === 'GROUPE' ? `${conv.sender_name}: ` : ''}
                       {conv.dernier_message || "Démarrer la discussion"}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
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
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* ========================================================= */}
      {/* COUCHE 2 : CHAT ACTIF (Animé)                             */}
      {/* ========================================================= */}
      <AnimatePresence>
        {activeConversation && (
          <motion.div 
            key="chat-view"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitionConfig}
            style={{ willChange: 'transform' }} // Optimisation GPU cruciale
            className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-full w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 bg-white border-b shadow-sm shrink-0 z-10">
              <div className="flex items-center gap-1">
                <button onClick={onBackToList} className="p-2 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full active:scale-90 transition-transform">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${activeConversation.type === 'GROUPE' ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                    {activeConversation.nom?.charAt(0) || '?'}
                  </div>
                  <div className="leading-tight">
                    <h3 className="font-bold text-gray-900 text-sm max-w-[150px] truncate">
                      {activeConversation.nom}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {activeConversation.type === 'GROUPE' ? 'Groupe' : 'Privé'}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowInfo(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <Settings className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]/10">
              {messages.map((msg, idx) => {
                const isMe = msg.auteur_id === user?.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl shadow-sm relative ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}>
                      {!isMe && activeConversation.type === 'GROUPE' && (
                         <p className="text-[10px] font-bold text-orange-600 mb-0.5">{msg.sender_name}</p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.contenu}</p>
                      <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                         {new Date(msg.date_envoi).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input */}
            <form onSubmit={onSendMessage} className="p-3 bg-white border-t flex items-center gap-2 pb-[max(12px,env(safe-area-inset-bottom))] shrink-0">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Message..." 
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()} 
                className="p-2.5 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALE PARAMÈTRES --- */}
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
              className="w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <h2 className="font-bold text-gray-800">Infos discussion</h2>
                <button onClick={() => setShowInfo(false)}><X className="w-6 h-6 text-gray-500"/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                 <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 mb-3">
                      {activeConversation.nom?.charAt(0)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center">{activeConversation.nom}</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-700 text-sm uppercase">Membres ({currentParticipants.length})</h4>
                      {activeConversation.type === 'GROUPE' && (
                        <button 
                          onClick={() => setIsAddingMember(!isAddingMember)} 
                          className="flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded"
                        >
                          <UserPlus className="w-3 h-3"/> {isAddingMember ? 'Fermer' : 'Ajouter'}
                        </button>
                      )}
                    </div>

                    {isAddingMember && (
                      <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-gray-500 mb-2">Ajouter un participant :</p>
                        <div className="space-y-2">
                           {availableMembers.filter(am => !currentParticipants.find(cp => cp.id === am.id)).map(m => (
                             <button key={m.id} onClick={() => onAddMember(m.id)} className="w-full flex items-center gap-2 p-2 bg-white border rounded hover:border-blue-300 text-left">
                               <Plus size={14} className="text-blue-500"/> <span className="text-sm">{m.name}</span>
                             </button>
                           ))}
                           {availableMembers.filter(am => !currentParticipants.find(cp => cp.id === am.id)).length === 0 && (
                              <p className="text-xs text-gray-400 italic text-center">Tous les membres sont déjà là.</p>
                           )}
                        </div>
                      </div>
                    )}

                    <ul className="space-y-3">
                      {currentParticipants.map(p => (
                        <li key={p.id} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                          <span className="text-sm font-medium text-gray-700">{p.name} {p.id === user.id && '(Moi)'}</span>
                          {(user.role_global === 'ADMIN' || user.role_global === 'SUPERADMIN' || user.onboarding_role === 'ADMIN') && p.id !== user.id && (
                            <button onClick={() => onRemoveMember(p.id)} className="text-gray-300 hover:text-red-500 p-1">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
              </div>

              <div className="p-4 border-t bg-gray-50">
                <button 
                  onClick={onDeleteConversation} 
                  className="w-full flex items-center justify-center gap-2 text-red-600 bg-white border border-red-200 p-3 rounded-xl font-bold hover:bg-red-50"
                >
                  <Trash2 size={18} />
                  Quitter / Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALE CRÉATION --- */}
      <AnimatePresence>
        {showNewConvModal && (
          <motion.div 
            key="new-conv-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={transitionConfig}
            style={{ willChange: 'transform' }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
              <button onClick={() => setShowNewConvModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <span className="font-bold text-gray-800">Nouvelle discussion</span>
              <button 
                onClick={onCreateConversation}
                disabled={selectedMembers.length === 0}
                className="text-blue-600 font-bold disabled:opacity-50"
              >
                Créer
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
               {selectedMembers.length > 1 && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nom du groupe</label>
                  <input 
                    type="text" 
                    value={newConvName}
                    onChange={e => setNewConvName(e.target.value)}
                    placeholder="Ex: Famille..."
                    className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Membres</label>
              <div className="space-y-2">
                {availableMembers.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => toggleMemberSelection(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMembers.includes(m.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100'
                    }`}
                  >
                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                       selectedMembers.includes(m.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                     }`}>
                        {selectedMembers.includes(m.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                     </div>
                     <span className="font-medium text-gray-800">{m.name}</span>
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