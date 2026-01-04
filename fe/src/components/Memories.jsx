import { Download, Image, Heart, MessageCircle, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import CalendarView from './CalendarView';

export default function Memories() {
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
    {
      id: 3,
      author: 'Sophie Leroux',
      date: '1 janvier 2026',
      content: 'Excellente séance de kiné ce matin. Les exercices se passent de mieux en mieux !',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
      likes: 7,
    },
    {
      id: 4,
      author: 'Pierre Dubois',
      date: '31 décembre 2025',
      content: 'Magnifique réveillon en famille. Marguerite a chanté avec nous et semblait très heureuse.',
      image: 'https://images.unsplash.com/photo-1482575832494-771f74bf6857?w=400',
      likes: 12,
    },
  ];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Journal de bord - Souvenirs', 20, 20);
    
    doc.setFontSize(12);
    let yPosition = 40;
    
    memories.forEach((memory, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`${memory.date} - ${memory.author}`, 20, yPosition);
      yPosition += 7;
      
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(memory.content, 170);
      doc.text(lines, 20, yPosition);
      yPosition += (lines.length * 7) + 10;
      
      if (index < memories.length - 1) {
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
      }
    });
    
    doc.save('souvenirs-weave.pdf');
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

        <div className="mt-12">
          <CalendarView />
        </div>
      </div>
    </div>
  );
}
