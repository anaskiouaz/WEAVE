import { useState, useEffect } from 'react';
import { Download, Image, Heart, MessageCircle, Calendar, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import CalendarView from './CalendarView';
import { apiGet } from '../api/client';

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ID du cercle à adapter selon votre contexte d'application
  const CIRCLE_ID = "00000000-0000-0000-0000-000000000000"; 

  useEffect(() => {
    async function fetchMemories() {
      try {
        setLoading(true);
        const data = await apiGet(`/journal-entries?circle_id=${CIRCLE_ID}`);
        setMemories(data);
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError("Impossible de charger les souvenirs.");
      } finally {
        setLoading(false);
      }
    }
    fetchMemories();
  }, [CIRCLE_ID]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Journal de bord - Souvenirs', 20, 20);
    
    let yPosition = 40;
    memories.forEach((memory, index) => {
      if (yPosition > 250) { doc.addPage(); yPosition = 20; }
      
      const dateStr = new Date(memory.created_at).toLocaleDateString('fr-FR');
      // Ajout du nom de l'auteur dans le PDF
      const authorStr = memory.author_name || "Utilisateur inconnu";
      
      doc.setFontSize(10);
      doc.text(`${dateStr} - Par: ${authorStr}`, 20, yPosition);
      yPosition += 7;
      
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(memory.text_content || '', 170);
      doc.text(lines, 20, yPosition);
      yPosition += (lines.length * 7) + 10;
      
      if (index < memories.length - 1) {
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
      }
    });
    doc.save('souvenirs-weave.pdf');
  };

  if (loading) return (
    <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>
  );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* ... En-tête ... */}
        
        <div className="space-y-6">
          {memories.map((memory) => (
            <div key={memory.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                {/* Avatar avec l'initiale du nom de l'auteur réel */}
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">
                    {memory.author_name ? memory.author_name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  {/* Affichage du nom de l'auteur */}
                  <p className="text-gray-900 font-medium">
                    {memory.author_name || "Utilisateur anonyme"}
                  </p>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(memory.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{memory.text_content}</p>

              {memory.photo_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img src={memory.photo_url} alt="Souvenir" className="w-full h-64 object-cover" />
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t">
                <button className="flex items-center gap-2 text-gray-600">
                  <Heart className="w-5 h-5" />
                  <span>{memory.mood ? `Humeur: ${memory.mood}/10` : 'Aimer'}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span>Commenter</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Memory Button */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600">V</span>
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Partagez un moment ou une nouvelle..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Image className="w-5 h-5" />
                  <span>Ajouter une photo</span>
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
