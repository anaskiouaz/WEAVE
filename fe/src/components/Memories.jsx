import { useState, useEffect } from 'react';
import { Download, Image, Heart, MessageCircle, Calendar, Loader2, Send } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { apiGet, apiPost } from '../api/client'; // Import du client API

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

// --- ÉTATS POUR LE NOUVEAU SOUVENIR ---
  const [newText, setNewText] = useState("");
  const [newMood, setNewMood] = useState(5); // Valeur par défaut
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // --- ÉTATS EXISTANTS POUR LES COMMENTAIRES ---
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ID du cercle (famille) à récupérer (à dynamiser selon l'utilisateur connecté)
  const CIRCLE_ID = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44"; // Exemple d'ID de cercle

  // Récupération des données depuis la base de données
  const fetchMemories = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/souvenirs?circle_id=${CIRCLE_ID}`);

      if (response && response.data) {
        setMemories(response.data);
      } else {
        setMemories([]);
      }
    } catch (err) {
      console.error("Erreur chargement souvenirs:", err);
      setError("Impossible de charger les souvenirs.");
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [CIRCLE_ID]);

  // --- FONCTION POUR PUBLIER UN SOUVENIR ---
  const handleAddMemory = async () => {
    if (!newText.trim()) return;

    setIsPublishing(true);
    try {
      await apiPost('/souvenirs', {
        circle_id: CIRCLE_ID,
        author_id: CURRENT_USER_ID,
        text_content: newText,
        mood: newMood,
        photo_url: newPhotoUrl || null
      });

      // Reset du formulaire
      setNewText("");
      setNewPhotoUrl("");
      setNewMood(5);
      
      // Rafraîchir la liste
      await fetchMemories();
    } catch (err) {
      console.error("Erreur lors de la publication:", err);
      alert("Erreur lors de la publication du souvenir.");
    } finally {
      setIsPublishing(false);
    }
  };

  // --- FONCTION AJOUTÉE POUR ENVOYER UN COMMENTAIRE ---
  const handleSendComment = async (entryId) => {
    if (!commentText.trim()) return;
    
    setIsSending(true);
    try {
      await apiPost(`/souvenirs/${entryId}/comments`, {
        author_name: "Utilisateur", // À dynamiser ultérieurement
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
              <span className="text-blue-600 font-bold">U</span>
            </div>
            <div className="flex-1">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Partagez une nouvelle ou un souvenir..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              
              {/* Optionnel: Input pour URL de photo (en attendant un upload réel) */}
              {newPhotoUrl !== "" || isPublishing ? null : (
                 <input 
                  type="text" 
                  placeholder="URL de l'image (optionnel)" 
                  className="w-full mt-2 text-xs p-1 border-b"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                 />
              )}

              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-4">
                   <button 
                    onClick={() => {
                      const url = prompt("Collez l'URL d'une image :");
                      if(url) setNewPhotoUrl(url);
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
                   >
                    <Image className="w-5 h-5" />
                    <span>{newPhotoUrl ? "Photo ajoutée" : "Ajouter une photo"}</span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Smile className="w-4 h-4" />
                    <select 
                      value={newMood} 
                      onChange={(e) => setNewMood(parseInt(e.target.value))}
                      className="bg-transparent outline-none cursor-pointer"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Humeur: {n}/10</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAddMemory}
                  disabled={isPublishing || !newText.trim()}
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

                {memory.photo_url && (
                  <div className="mb-4 rounded-lg overflow-hidden border">
                    <img src={memory.photo_url} alt="Souvenir" className="w-full h-auto max-h-96 object-cover" />
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
                </div>

                {/* --- SECTION DES COMMENTAIRES AJOUTÉE --- */}
                {activeCommentId === memory.id && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                      {memory.comments && memory.comments.length > 0 ? (
                        memory.comments.map((comment, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm shadow-sm border border-gray-100">
                            <p className="font-semibold text-blue-700 mb-1">{comment.author}</p>
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