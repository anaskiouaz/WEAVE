import React from 'react';
import { createPortal } from 'react-dom';
import { X, Phone } from 'lucide-react';

// J'ai renommé la prop 'isOpen' en 'open' pour qu'elle corresponde à ton App.jsx
export default function EmergencyDialog({ open, onClose }) {
  // Si la modale n'est pas ouverte, on ne rend rien
  if (!open) return null;

  const emergencyContacts = [
    { name: "SAMU", label: "Urgence médicale", number: "15", color: "bg-red-600" },
    { name: "Police", label: "Secours", number: "17", color: "bg-blue-600" },
    { name: "Pompiers", label: "Incendie/Accident", number: "18", color: "bg-red-600" },
    { name: "Europe", label: "Urgence", number: "112", color: "bg-orange-500" },
  ];

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-6 h-6 text-red-600" />
            Numéros d'Urgence
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          {emergencyContacts.map((contact) => (
            <div key={contact.number} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="font-bold text-gray-900">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.label}</p>
              </div>
              
              {/* Le lien tel: fonctionne sur mobile et ouvre l'app d'appel */}
              <a 
                href={`tel:${contact.number}`}
                className={`${contact.color} text-white px-5 py-2.5 rounded-full font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                📞 {contact.number}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Appuyez sur un numéro pour appeler
        </p>
      </div>
    </div>
  );

  // Le Portal garantit que ça s'affiche par-dessus tout le reste
  return createPortal(modalContent, document.body);
}