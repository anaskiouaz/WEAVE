import { useState } from 'react';
import { 
  Plus, X, Image as ImageIcon, Camera as CameraIcon, 
  Send, Heart, MessageCircle, Trash2, Calendar, Smile 
} from 'lucide-react';

export default function MobileMemories({ 
  memories, 
  user, 
  loading, 
  // Props pour le formulaire d'ajout
  newText, setNewText,
  newMood, setNewMood,
  newPhotoUrl, 
  isPublishing,
  onTakePhoto, 
  onSelectFile, 
  onDeletePhoto,
  onSubmitMemory,
  // Props pour les actions
  onDeleteMemory,
  onSendComment,
  onDeleteComment
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

  const handleLocalSendComment = (memoryId) => {
    onSendComment(memoryId, commentText);
    setCommentText("");
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const FILES_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
    if (photo.startsWith('http')) return photo;
    return `${FILES_BASE_URL}/uploads/${photo}`;
  };

  return (
    // AJUSTEMENT 1 : Gros padding-bottom (pb-28) pour que le scroll aille plus bas que la nav bar
    <div className="min-h-screen pb-28 relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* --- HEADER FIXE --- */}
      <div className="sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
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
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Souvenirs</h1>
        </div>
        <div className="text-xs px-2 py-1 rounded-full" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)' }}>
          {memories.length} moments
        </div>
      </div>

      {/* --- LISTE DES SOUVENIRS --- */}
      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><span className="animate-spin text-blue-600">Chargement...</span></div>
        ) : memories.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>Aucun souvenir pour l'instant.</p>
            <p className="text-sm mt-2">Appuie sur le + pour commencer !</p>
          </div>
        ) : (
          memories.map((memory) => (
            <div key={memory.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
              {/* En-tête Carte */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {memory.author_name ? memory.author_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{memory.author_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(memory.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                {user && memory.author_id === user.id && (
                  <button onClick={() => onDeleteMemory(memory.id)} className="text-gray-300 hover:text-red-500 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Contenu Texte */}
              {memory.text_content && (
                <div className="px-3 pb-2">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {memory.text_content}
                  </p>
                </div>
              )}

              {/* Photo */}
              {memory.photo_data && (
                <div className="w-full" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <img 
                    src={getPhotoUrl(memory.photo_data)} 
                    alt="Souvenir" 
                    className="w-full h-auto object-cover max-h-[400px]"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Actions Barre */}
              <div className="px-3 py-2 flex items-center gap-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Heart className="w-4 h-4" style={{ color: memory.mood > 5 ? 'var(--soft-coral)' : 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{memory.mood}/10</span>
                </div>
                <button 
                  onClick={() => setActiveCommentId(activeCommentId === memory.id ? null : memory.id)}
                  className={`flex items-center gap-1 text-xs font-medium transition-colors ${activeCommentId === memory.id ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{memory.comments?.length || 0}</span>
                </button>
              </div>

              {/* Section Commentaires */}
              {activeCommentId === memory.id && (
                <div className="px-3 py-3" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
                  <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                    {memory.comments?.map((comment, idx) => (
                      <div key={idx} className="flex gap-2 text-xs">
                        <span className="font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>{comment.author}:</span>
                        <span className="break-words flex-1" style={{ color: 'var(--text-secondary)' }}>{comment.content}</span>
                        {user && (comment.author === user.name || memory.author_name === user.name) && (
                          <button onClick={() => onDeleteComment(memory.id, comment.id, comment.author, memory.author_name)}>
                             <X className="w-3 h-3 text-gray-300 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 px-3 py-2 rounded-full text-sm"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                    />
                    <button 
                      onClick={() => handleLocalSendComment(memory.id)}
                      disabled={!commentText.trim()}
                      className="p-2 rounded-full disabled:opacity-50"
                      style={{ backgroundColor: 'var(--soft-coral)', color: '#fff' }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* --- FAB (Bouton +) --- */}
      {/* AJUSTEMENT 2 : bottom-24 remonte le bouton au-dessus de la nav bar (qui fait ~60px) */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all z-40"
        style={{ backgroundColor: 'var(--soft-coral)', color: '#fff' }}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* --- MODAL D'AJOUT --- */}
      {isAddModalOpen && (
        // AJUSTEMENT 3 : z-[100] force le modal à être AU-DESSUS de la nav bar (souvent z-50)
        <div className="fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
          
          {/* Header Modal */}
          <div className="px-4 py-3 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
            <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full">
              <X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
            </button>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Nouveau souvenir</span>
            <button 
              onClick={() => { onSubmitMemory(); setIsAddModalOpen(false); }}
              disabled={isPublishing || !newText.trim()}
              className="font-bold disabled:opacity-50"
              style={{ color: 'var(--soft-coral)' }}
            >
              Publier
            </button>
          </div>

          {/* Corps Modal */}
          <div className="flex-1 p-4 flex flex-col overflow-y-auto">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Racontez votre souvenir..."
              className="w-full flex-1 text-lg resize-none outline-none placeholder:text-gray-400"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px' }}
              autoFocus
            />

            {newPhotoUrl && (
              <div className="relative mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
                <img src={newPhotoUrl} alt="Preview" className="w-full max-h-60 object-cover" />
                <button 
                  onClick={onDeletePhoto}
                  className="absolute top-2 right-2 p-1 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Toolbar Bas de Modal (Les 3 boutons) */}
          {/* AJUSTEMENT 4 : pb-safe ou un bon padding en bas pour décoller du bord */}
          <div className="p-4 flex items-center justify-between pb-8" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-4">
              
              {/* 1. Camera */}
              <button onClick={onTakePhoto} className="p-2 border rounded-full shadow-sm active:scale-95 transition-transform" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>
                <CameraIcon className="w-6 h-6" />
              </button>
              
              {/* 2. Galerie */}
              <label className="p-2 border rounded-full shadow-sm cursor-pointer active:scale-95 transition-transform" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>
                <ImageIcon className="w-6 h-6" />
                <input name="image" capture="environment" type="file" accept="image/*" onChange={(e) => onSelectFile && onSelectFile(e)} className="hidden" />
              </label>

              {/* 3. Humeur */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                <Smile className="w-5 h-5 text-yellow-500" />
                <select 
                  value={newMood} 
                  onChange={(e) => setNewMood(parseInt(e.target.value))}
                  className="bg-transparent text-sm font-medium outline-none pr-1"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}/10</option>)}
                </select>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}