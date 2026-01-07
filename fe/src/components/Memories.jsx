import { useState, useEffect } from 'react';
import { Download, Image, Heart, MessageCircle, Calendar, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { apiGet } from '../api/client'; // Import du client API

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ID du cercle (famille) à récupérer (à dynamiser selon l'utilisateur connecté)
  const CIRCLE_ID = "0"; // Exemple d'ID de cercle (utiliser useState du login plus tard)

  // Récupération des données depuis la base de données
  useEffect(() => {
    async function fetchMemories() {
      try {
        setLoading(true);
        // On utilise la route définie dans le backend pour le journal de bord
        const data = await apiGet(`/souvenirs?circle_id=${CIRCLE_ID}`);
        setMemories(data);
      } catch (err) {
        console.error("Erreur chargement souvenirs:", err);
        setError("Impossible de charger les souvenirs de la famille.");
      } finally {
        setLoading(false);
      }
    }

    fetchMemories();
  }, [CIRCLE_ID]);

  // Fonction d'export PDF avec les données réelles
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Journal de bord - Souvenirs Partagés', 20, 20);
    
    doc.setFontSize(12);
    let yPosition = 40;
    
    memories.forEach((memory, index) => {
      // Gestion du saut de page
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
      // Utilisation du champ text_content de la DB
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
            <p className="text-gray-600">
              Les moments précieux partagés au sein du cercle
            </p>
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

        {/* Formulaire d'ajout (Interface maintenue) */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">V</span>
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Partagez une nouvelle ou un souvenir..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm">
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
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>Commenter</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}