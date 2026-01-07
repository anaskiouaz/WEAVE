import { useState, useEffect } from 'react';
import { Download, Image, Heart, MessageCircle, Calendar, Loader2, Send } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { apiGet, apiPost } from '../api/client';
import CalendarView from './CalendarView';

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour la gestion des commentaires
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ID du cercle à adapter selon l'utilisateur connecté
  const CIRCLE_ID = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44";

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      // Récupération des souvenirs via l'endpoint configuré dans index.js
      const response = await apiGet(`/souvenirs?circle_id=${CIRCLE_ID}`);
      
      if (response && response.data) {
        setMemories(response.data);
      }
    } catch (err) {
      console.error("Erreur chargement souvenirs:", err);
      setError("Impossible de charger le journal de bord.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (entryId) => {
    if (!newComment.trim()) return;
    
    setIsSending(true);
    try {
      // Envoi du commentaire vers la liste JSONB de l'entrée concernée
      await apiPost(`/souvenirs/${entryId}/comments`, {
        author_name: "Famille", // À dynamiser avec l'utilisateur réel
        content: newComment
      });
      
      setNewComment("");
      // On rafraîchit la liste pour voir le nouveau message apparaître
      await fetchMemories();
    } catch (err) {
      console.error("Erreur lors de l'envoi du commentaire:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Journal de bord - Souvenirs', 20, 20);
    
    let yPosition = 40;
    memories.forEach((memory, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(10);
      doc.text(`${new Date(memory.created_at).toLocaleDateString()} - ${memory.author_name}`, 20, yPosition);
      yPosition += 7;
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(memory.text_content, 170);
      doc.text(lines, 20, yPosition);
      yPosition += (lines.length * 7) + 10;
      if (index < memories.length - 1) {
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
      }
    });
    doc.save('souvenirs-weave.pdf');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500">Chargement de vos souvenirs...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Journal de bord</h1>
            <p className="text-gray-600">Les moments partagés avec Marguerite</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Télécharger PDF
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Memories Feed */}
        <div className="space-y-6">
          {memories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
              <p className="text-gray-500">Aucun souvenir partagé pour le moment.</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {memory.author_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{memory.author_name}</p>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(memory.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{memory.text_content}</p>

                {memory.photo_url && (
                  <div className="mb-4 rounded-lg overflow-hidden border">
                    <img
                      src={memory.photo_url}
                      alt="Souvenir"
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>{memory.mood ? `Humeur: ${memory.mood}/10` : 'Aimer'}</span>
                  </button>
                  <button 
                    onClick={() => setActiveCommentId(activeCommentId === memory.id ? null : memory.id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Commenter ({memory.comments?.length || 0})</span>
                  </button>
                </div>

                {/* Section Liste de messages (Commentaires récupérables) */}
                {activeCommentId === memory.id && (
                  <div className="mt-4 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                      {memory.comments && memory.comments.length > 0 ? (
                        memory.comments.map((comment, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                            <p className="font-semibold text-blue-700 mb-1">{comment.author}</p>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 text-sm py-2">Aucun message pour le moment.</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Répondre ou commenter..."
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment(memory.id)}
                      />
                      <button 
                        onClick={() => handleSendComment(memory.id)}
                        disabled={isSending || !newComment.trim()}
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

        {/* Formulaire pour ajouter un nouveau souvenir (Publier) */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">V</span>
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Partagez un moment ou une nouvelle..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
                  <Image className="w-5 h-5" />
                  <span>Ajouter une photo</span>
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <CalendarView />
        </div>
      </div>
    </div>
  );
}