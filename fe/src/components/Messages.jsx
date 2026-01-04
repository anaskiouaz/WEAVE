import { useState } from 'react';
import { Search, Plus, Copy, Check, X } from 'lucide-react';

export default function Messages() {
  const [selectedConv, setSelectedConv] = useState(1);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = 'https://weave.app/join/abc123xyz';

  const conversations = [
    {
      id: 1,
      name: 'Marie Dupont',
      lastMessage: 'Je passe demain à 14h pour la visite',
      time: '10:30',
      unread: 2,
    },
    {
      id: 2,
      name: 'Groupe Aidants',
      lastMessage: 'Pierre: Quelqu\'un peut prendre le créneau de vendredi ?',
      time: 'Hier',
      unread: 0,
    },
    {
      id: 3,
      name: 'Jean Martin',
      lastMessage: 'Les courses sont faites !',
      time: '2 jan',
      unread: 0,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'Marie Dupont',
      content: 'Bonjour ! Comment va Marguerite aujourd\'hui ?',
      time: '09:15',
      isMine: false,
    },
    {
      id: 2,
      sender: 'Vous',
      content: 'Bonjour Marie, elle va bien merci. Elle a bien dormi cette nuit.',
      time: '09:20',
      isMine: true,
    },
    {
      id: 3,
      sender: 'Marie Dupont',
      content: 'Super ! Je passe demain à 14h pour la visite comme prévu.',
      time: '10:30',
      isMine: false,
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={`w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors border-b ${
                selectedConv === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600">{conv.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-gray-900 truncate">{conv.name}</p>
                  <span className="text-gray-500">{conv.time}</span>
                </div>
                <p className="text-gray-600 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span>{conv.unread}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">M</span>
            </div>
            <div>
              <p className="text-gray-900">Marie Dupont</p>
              <p className="text-gray-500">En ligne</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md rounded-lg p-4 ${
                  message.isMine
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900'
                }`}
              >
                {!message.isMine && (
                  <p className="text-blue-600 mb-1">{message.sender}</p>
                )}
                <p>{message.content}</p>
                <p
                  className={`mt-1 ${
                    message.isMine ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Envoyer
            </button>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-900">Inviter un bénévole</h2>
              <button
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Partagez ce lien d'invitation avec un nouveau bénévole. Il pourra rejoindre le cercle d'aidants en cliquant dessus.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 mb-2">Lien d'invitation</p>
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
                  Le bénévole devra créer un compte lors de sa première connexion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
