import { useState, useEffect } from 'react';
import { Download, Image, Heart, MessageCircle, Calendar, Loader2, Send, Smile, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Camera, CameraResultType } from '@capacitor/camera';
import CalendarView from './CalendarView';
import { apiGet, apiPost, apiDelete } from '../api/client'; // Import du client API
import { useAuth } from '../context/AuthContext'; // Import du hook d'authentification

export default function Memories() {
  // CONST PHOTO
  const [tempPhoto, setTempPhoto] = useState(null);
  const [newContent, setNewContent] = useState('');

  const { user } = useAuth(); // Récupération de l'utilisateur connecté
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ÉTATS POUR LE NOUVEAU SOUVENIR ---
  const [newText, setNewText] = useState("");
  const [newMood, setNewMood] = useState(5); // Valeur par défaut
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- ÉTATS AJOUTÉS POUR LES COMMENTAIRES ---
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ID du cercle (famille) à récupérer dynamiquement depuis l'utilisateur connecté
  const CIRCLE_ID = user?.circles?.[0]?.id || "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44"; // Fallback au cercle par défaut

  // Récupération des données depuis la base de données
  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      
      const response = await apiGet(`/souvenirs?circle_id=${CIRCLE_ID}`);

      if (response && response.data) {
        setMemories(response.data);
      } else {
        setMemories([]);
      }
    } catch (err) {
      console.error("Erreur chargement souvenirs:", err);
      setError(`Impossible de charger les souvenirs: ${err.message}`);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [CIRCLE_ID]);

  // Nettoyer les URLs d'objet lors du démontage du composant
  useEffect(() => {
    return () => {
      if (newPhotoUrl && newPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(newPhotoUrl);
      }
    };
  }, [newPhotoUrl]);

  // --- FONCTION POUR PUBLIER UN SOUVENIR ---
  const handleAddMemory = async () => {
    if (!newText.trim() || !user) return;

    setIsPublishing(true);
    try {
      let photoBlobName = null;

      // Si un fichier est sélectionné, l'uploader d'abord
      if (newPhotoFile) {
        const formData = new FormData();
        formData.append('image', newPhotoFile);

        // 1. On définit l'URL de base de l'API (Port 4000)
        // Si vous avez configuré Vite, on utilise la variable d'env, sinon le lien en dur
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

        // 2. On fait l'appel vers la bonne route (ex: /api/upload/image)
        const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          body: formData,
          // Note : Ne JAMAIS mettre de header 'Content-Type' manuellement avec FormData
          // Le navigateur le fait tout seul avec le "boundary" correct.
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors de l\'upload de l\'image');
        }

  const uploadData = await uploadResponse.json();
  if (uploadData.status !== 'ok') {
    throw new Error(uploadData.message || 'Erreur upload');
  }

  // 3. On récupère le nom du blob renvoyé par le backend
  photoBlobName = uploadData.data.blobName;
}

      await apiPost('/souvenirs', {
        circle_id: CIRCLE_ID,
        author_id: user.id,
        text_content: newText,
        mood: newMood,
        photo_data: photoBlobName || null
      });

      // Reset du formulaire
      setNewText("");
      setNewPhotoUrl("");
      setNewPhotoFile(null);
      setNewMood(5);

      // Nettoyer l'URL d'objet si elle existe
      if (newPhotoUrl && newPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(newPhotoUrl);
      }

      // Rafraîchir la liste
      await fetchMemories();
    } catch (err) {
      console.error("Erreur lors de la publication:", err);
      alert(`Erreur lors de la publication du souvenir: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

// --- NOUVELLE FONCTION CAPACITOR ---
  const prendrePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true, // Permet de recadrer après la prise
        resultType: CameraResultType.Uri // Récupère un chemin web affichable
      });

      // image.webPath contient l'URL locale de l'image pour l'affichage
      setTempPhoto(image.webPath);
    } catch (error) {
      console.log('Prise de photo annulée ou erreur:', error);
    }
  };

  const clearPhoto = () => {
    setTempPhoto(null);
  };
  
  // --- FONCTION AJOUTÉE POUR ENVOYER UN COMMENTAIRE ---
  const handleSendComment = async (entryId) => {
    if (!commentText.trim()) return;
    
    setIsSending(true);
    try {
      await apiPost(`/souvenirs/${entryId}/comments`, {
        author_name: user?.name || "Utilisateur", // Utilise le nom de l'utilisateur connecté
        content: commentText
      });
      setCommentText("");
      // On rafraîchit la liste pour voir le message apparaître dans le tableau JSONB
      await fetchMemories();
    } catch (err) {
      console.error("Erreur lors de l'envoi du commentaire:", err);
    } finally {
      setIsSending(false);
    }
  };

  // --- FONCTION AJOUTÉE POUR SUPPRIMER UN COMMENTAIRE ---
  const handleDeleteComment = async (memoryId, commentId, commentAuthor, memoryAuthor) => {
    if (!user) return;

    // Vérifier que l'utilisateur est l'auteur du commentaire
    if (commentAuthor !== user.name && memoryAuthor !== user.name) {
      alert("Vous ne pouvez pas supprimer les commentaires des autres.");
      return;
    }

    // Demander confirmation avant suppression
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?");
    if (!confirmDelete) return;

    try {
      await apiDelete(`/souvenirs/${memoryId}/comments/${commentId}`, {
        author_name: user.name
      });

      // Rafraîchir la liste après suppression
      await fetchMemories();
    } catch (err) {
      console.error("Erreur lors de la suppression du commentaire:", err);
      alert("Erreur lors de la suppression du commentaire: " + err.message);
    }
  };

  // --- FONCTION POUR SUPPRIMER UN SOUVENIR ---
  const handleDeleteMemory = async (memoryId) => {
    if (!user) return;

    // Demander confirmation avant suppression
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce souvenir ? Cette action est irréversible.");
    if (!confirmDelete) return;

    try {
      await apiDelete(`/souvenirs/${memoryId}`, {
        author_id: user.id
      });

      // Rafraîchir la liste après suppression
      await fetchMemories();
      alert("Souvenir supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression du souvenir: " + err.message);
    }
  };

  // Fonction d'export PDF avec les données réelles
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Journal de bord - Souvenirs Partagés', 20, 20);
    doc.setFontSize(12);
    let yPosition = 40;

    memories.forEach((memory, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      const dateStr = new Date(memory.created_at).toLocaleDateString('fr-FR');
      const authorStr = memory.author_name || "Auteur inconnu";
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${dateStr} - Par ${authorStr}`, 20, yPosition);
      yPosition += 7;
      doc.setFontSize(11);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(memory.text_content || '', 170);
      doc.text(lines, 20, yPosition);
      yPosition += (lines.length * 7) + 10;
      if (index < memories.length - 1) {
        doc.setDrawColor(200);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
      }
    });
    doc.save(`journal-souvenirs-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-600">Chargement du journal de bord...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal de bord</h1>
            <p className="text-gray-600">Les moments précieux partagés au sein du cercle</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Télécharger PDF
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-100">
            {error}
                </div>
              )}
              
        {/* --- FORMULAIRE D'AJOUT DYNAMISÉ --- */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Partagez une nouvelle ou un souvenir..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              
              {/* Aperçu de l'image sélectionnée */}
              {newPhotoUrl && (
                <div className="mt-3">
                  <img 
                    src={newPhotoUrl} 
                    alt="Aperçu" 
                    className="w-full max-h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Input caché pour la capture d'image */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewPhotoFile(file);
                    setNewPhotoUrl(URL.createObjectURL(file)); // Aperçu temporaire
                  }
                }}
                className="hidden"
                id="photo-input"
                  />

              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-4">
                  <button 
                    onClick={() => document.getElementById('photo-input').click()}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  >
                    <Image className="w-5 h-5" />
                    <span>{newPhotoFile ? "Photo sélectionnée" : "Ajouter une photo"}</span>
                  </button>
                  
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Smile className="w-4 h-4" />
                    <select 
                      value={newMood} 
                      onChange={(e) => setNewMood(parseInt(e.target.value))}
                      className="bg-transparent outline-none cursor-pointer border-b border-gray-300"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Humeur: {n}/10</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAddMemory}
                  disabled={isPublishing || !newText.trim() || !user}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isPublishing ? "Publication..." : "Publier"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Flux des souvenirs réels */}
        <div className="space-y-6">
          {memories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <p className="text-gray-500">Aucun souvenir n'a encore été partagé.</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {memory.author_name ? memory.author_name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{memory.author_name || "Membre du cercle"}</p>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(memory.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{memory.text_content}</p>

                {memory.photo_data && (
                  <div className="mb-4 rounded-lg overflow-hidden border">
                    <img src={memory.photo_data} alt="Souvenir" className="w-full h-auto max-h-96 object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>{memory.mood ? `Humeur: ${memory.mood}/10` : 'Aimer'}</span>
                  </button>
                  {/* BOUTON MODIFIÉ POUR ACTIVER LA SECTION COMMENTAIRE */}
                  <button 
                    onClick={() => setActiveCommentId(activeCommentId === memory.id ? null : memory.id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Commenter ({memory.comments?.length || 0})</span>
                  </button>
                  {/* BOUTON DE SUPPRESSION - UNIQUEMENT POUR L'AUTEUR */}
                  {user && memory.author_id === user.id && (
                    <button 
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Supprimer ce souvenir"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>

                {/* --- SECTION DES COMMENTAIRES AJOUTÉE --- */}
                {activeCommentId === memory.id && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                      {memory.comments && memory.comments.length > 0 ? (
                        memory.comments.map((comment, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-blue-700">{comment.author}</p>
                              {/* Bouton de suppression - seulement si l'utilisateur est l'auteur du commentaire */}
                              {user && (comment.author === user.name || memory.author_name === user.name) && (
                                <button 
                                  onClick={() => handleDeleteComment(memory.id, comment.id, comment.author, memory.author_name)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                  title="Supprimer ce commentaire"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 text-sm py-2">Soyez le premier à commenter ce souvenir.</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment(memory.id)}
                      />
                      <button 
                        onClick={() => handleSendComment(memory.id)}
                        disabled={isSending || !commentText.trim()}
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
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
      </div>
    </div>
  );
}