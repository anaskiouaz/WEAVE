import { X, Phone, AlertCircle } from 'lucide-react';

export default function EmergencyDialog({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-orange-600">Alerte d'urgence</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            Une notification d'urgence va être envoyée à tous les membres du cercle d'aidants.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-orange-600" />
              <span className="text-orange-900">Numéros d'urgence</span>
            </div>
            <div className="space-y-1 text-orange-800">
              <p>SAMU : 15</p>
              <p>Police : 17</p>
              <p>Pompiers : 18</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                alert('Alerte envoyée à tous les aidants');
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Envoyer l'alerte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
