import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, FileText, ArrowLeft, AlertTriangle, Send } from 'lucide-react';
import { apiPost } from '../api/client';

export default function EmergencyDialog({ open, onClose }) {
  const [view, setView] = useState('CONTACTS'); // 'CONTACTS' ou 'REPORT'
  const [loading, setLoading] = useState(false);
  
  // États du formulaire
  const [incidentType, setIncidentType] = useState('URGENT');
  const [description, setDescription] = useState('');

  if (!open) return null;

  // --- Logique d'envoi du rapport ---
  const handleSubmitReport = async () => {
    if (!description.trim()) {
      alert("Veuillez décrire l'incident.");
      return;
    }

    setLoading(true);
    try {
      // On envoie 'URGENT' ou 'NON_URGENT' au backend qui le convertira en 'CRITICAL' ou 'LOW'
      await apiPost('/incidents', {
        type: incidentType,
        description: description
      });

      alert("Rapport enregistré avec succès !");
      onClose(); // Fermer la modale
      
      // Reset
      setView('CONTACTS');
      setDescription('');
      setIncidentType('URGENT');
    } catch (error) {
      console.error("Erreur front:", error);
      alert("Erreur lors de l'envoi du rapport.");
    } finally {
      setLoading(false);
    }
  };

  const emergencyContacts = [
    { name: "SAMU", label: " ", number: "15", color: "bg-red-600" },
    { name: "Police", label: "", number: "17", color: "bg-blue-600" },
    { name: "Pompiers", label: "", number: "18", color: "bg-red-600" },
    { name: "Europe", label: "", number: "112", color: "bg-orange-500" },
  ];

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        
        {/* === VUE 1 : CONTACTS === */}
        {view === 'CONTACTS' && (
          <>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-6 h-6 text-red-600" />
            Numéros d'Urgence
          </h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

            <div className="space-y-3 mb-6">
          {emergencyContacts.map((contact) => (
            <div key={contact.number} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="font-bold text-gray-900">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.label}</p>
              </div>
              <a 
                href={`tel:${contact.number}`}
                className={`${contact.color} text-white px-5 py-2.5 rounded-full font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                📞 {contact.number}
              </a>
            </div>
          ))}
        </div>

            <button
              onClick={() => setView('REPORT')}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Rédiger un rapport d'incident
            </button>
          </>
        )}

        {/* === VUE 2 : RAPPORT (FORMULAIRE) === */}
        {view === 'REPORT' && (
          <>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setView('CONTACTS')} 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                   <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-xl font-bold text-gray-900">Signaler un Incident</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Ce rapport sera enregistré et transmis aux administrateurs du cercle.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIncidentType('URGENT')}
                  className={`p-3 rounded-xl border-2 font-medium flex flex-col items-center gap-2 transition-all ${
                    incidentType === 'URGENT' 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 text-gray-400 hover:border-red-200'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                  URGENCE
                </button>
                <button
                  onClick={() => setIncidentType('NON_URGENT')}
                  className={`p-3 rounded-xl border-2 font-medium flex flex-col items-center gap-2 transition-all ${
                    incidentType === 'NON_URGENT' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 text-gray-400 hover:border-blue-200'
                  }`}
                >
                  <FileText className="w-6 h-6" />
                  Informatif
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description de la situation
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce qu'il se passe ici..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-base"
                />
              </div>

              <button
                onClick={handleSubmitReport}
                disabled={loading}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
              >
                {loading ? 'Enregistrement...' : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer le rapport
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Le Portal garantit que ça s'affiche par-dessus tout le reste
  return createPortal(modalContent, document.body);
}