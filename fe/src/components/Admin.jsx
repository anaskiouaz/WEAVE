import { useState } from 'react';
import { Users, UserPlus, Mail, Trash2, Shield, X, Copy, Check } from 'lucide-react';

export default function Admin() {
  const [showAddContact, setShowAddContact] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteLink = 'https://weave.app/join/admin-abc123';

  const contacts = [
    {
      id: 1,
      name: 'Marie Dupont',
      role: 'Aidant bénévole',
      email: 'marie.dupont@email.com',
      phone: '06 12 34 56 78',
      joinDate: '15 déc 2025',
      active: true,
    },
    {
      id: 2,
      name: 'Jean Martin',
      role: 'Aidant bénévole',
      email: 'jean.martin@email.com',
      phone: '06 98 76 54 32',
      joinDate: '20 déc 2025',
      active: true,
    },
    {
      id: 3,
      name: 'Sophie Leroux',
      role: 'Aidant professionnel',
      email: 'sophie.leroux@email.com',
      phone: '06 45 67 89 01',
      joinDate: '22 déc 2025',
      active: true,
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Administration</h1>
          <p className="text-gray-600">
            Gérez les membres du cercle d'aidants
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total aidants</p>
                <p className="text-gray-900">8</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Actifs ce mois</p>
                <p className="text-gray-900">7</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">En attente</p>
                <p className="text-gray-900">1</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-gray-900">Membres du cercle</h2>
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un contact
            </button>
          </div>

          <div className="divide-y">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600">{contact.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900">{contact.name}</p>
                        {contact.active && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{contact.role}</p>
                      <div className="space-y-1 text-gray-600">
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </p>
                        <p>📱 {contact.phone}</p>
                        <p>Membre depuis le {contact.joinDate}</p>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-gray-900 mb-4">Permissions</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-900">Permettre aux aidants d'ajouter des tâches</p>
                <p className="text-gray-600">Les bénévoles peuvent créer des créneaux au calendrier</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-gray-900">Permettre aux aidants de publier des souvenirs</p>
                <p className="text-gray-600">Les bénévoles peuvent ajouter des posts au journal</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-900">Ajouter un contact</h2>
              <button
                onClick={() => setShowAddContact(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Partagez ce lien d'invitation avec un nouveau membre. Il pourra rejoindre le cercle d'aidants en cliquant dessus.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 mb-2">Lien d'invitation administrateur</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900">
                  Le nouveau membre recevra une invitation par email et devra créer un compte lors de sa première connexion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
