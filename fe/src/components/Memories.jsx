import { useState } from 'react';
import { Download, Heart, MessageCircle, Calendar, Camera as CameraIcon, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Camera, CameraResultType } from '@capacitor/camera';
import CalendarView from './CalendarView';

export default function Memories() {
  // État pour stocker la photo temporaire avant publication
  const [tempPhoto, setTempPhoto] = useState(null);
  const [newContent, setNewContent] = useState('');

  const memories = [
    {
      id: 1,
      author: 'Marie Dupont',
      date: '3 janvier 2026',
      content: 'Belle promenade au parc aujourd\'hui. Marguerite était de très bonne humeur et a beaucoup ri en regardant les enfants jouer.',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400',
      likes: 5,
    },
    
    {
      id: 2,
      author: 'Jean Martin',
      date: '2 janvier 2026',
      content: 'Après-midi lecture ensemble. Nous avons lu quelques pages de son roman préféré.',
      likes: 3,
    },
  ];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Journal de bord - Souvenirs', 20, 20);
    // ... ta logique PDF existante ...
    doc.save('souvenirs-weave.pdf');
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

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-gray-900 mb-2">Journal de bord</h1>
            <p className="text-gray-600">
              Les moments partagés avec Marguerite
            </p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Télécharger PDF
          </button>
        </div>

        {/* Memories Feed */}
        <div className="space-y-6">
          {memories.map((memory) => (
            <div key={memory.id} className="bg-white rounded-lg shadow p-6">
              {/* ... Affichage existant des souvenirs ... */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">{memory.author.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-gray-900">{memory.author}</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{memory.date}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{memory.content}</p>

              {memory.image && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={memory.image}
                    alt="Souvenir"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              
               <div className="flex items-center gap-6 pt-4 border-t">
                <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span>{memory.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span>Commenter</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- ZONE D'AJOUT MODIFIÉE --- */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600">V</span>
            </div>
            <div className="flex-1">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Partagez un moment ou une nouvelle..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              
              {/* Prévisualisation de la photo prise */}
              {tempPhoto && (
                <div className="mt-3 relative inline-block">
                  <img 
                    src={tempPhoto} 
                    alt="Aperçu" 
                    className="h-32 w-auto rounded-lg border border-gray-200"
                  />
                  <button 
                    onClick={clearPhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mt-3">
                {/* BOUTON CAMÉRA */}
                <button 
                  onClick={prendrePhoto}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <CameraIcon className="w-5 h-5" />
                  <span>Prendre une photo</span>
                </button>

                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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