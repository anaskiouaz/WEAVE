import { useState, useEffect } from 'react';
import { Users, Copy, Check, Share2, Crown, Mail, Phone, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export default function Admin() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Trouver le cercle où je suis Admin
  // Note: user.circles vient du login (auth.js)
  const adminCircle = user?.circles?.find(c => 
    c.role?.toUpperCase() === 'ADMIN' || c.role?.toUpperCase() === 'SUPERADMIN'
  );

  // Récupérer le code d'invitation (envoyé par le backend au login)
  const inviteCode = adminCircle?.invite_code || '...';

  // 2. Récupérer la vraie liste des membres au chargement
  useEffect(() => {
    if (adminCircle?.id) {
      fetchMembers(adminCircle.id);
    } else {
      setLoading(false);
    }
  }, [adminCircle]);

  const fetchMembers = async (circleId) => {
    try {
      const token = localStorage.getItem('weave_token');
      const res = await fetch(`${API_BASE_URL}/circles/${circleId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Erreur chargement membres", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId, memberName) => {
    // Demander confirmation
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir retirer "${memberName}" du cercle ?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('weave_token');
      const res = await fetch(`${API_BASE_URL}/circles/${adminCircle.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Rafraîchir la liste des membres
        await fetchMembers(adminCircle.id);
        alert(`${memberName} a été retiré du cercle.`);
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.error || "Impossible de retirer le membre"}`);
      }
    } catch (err) {
      console.error("Erreur suppression membre", err);
      alert("Erreur lors de la suppression du membre");
    }
  };

  // Si l'utilisateur n'est pas admin, on affiche un message simple
  if (!adminCircle) {
      return (
        <div className="p-10 flex flex-col items-center justify-center text-center h-full">
            <Shield className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-600">Accès restreint</h2>
            <p className="text-gray-500">Cette page est réservée à l'administrateur du cercle.</p>
        </div>
      );
  }

  // Calcul des stats
  const activeMembers = members.filter(m => m.role !== 'PC').length; // On exclut le bénéficiaire des aidants actifs

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* --- EN-TÊTE --- */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Administration</h1>
        <p className="text-gray-600">
          Gérez le cercle de soin de <span className="font-semibold text-blue-600">{adminCircle.senior_name}</span>
        </p>
      </div>

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Aidants actifs</p>
              <p className="text-3xl font-bold text-gray-900">{activeMembers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          {/* Tu pourras brancher de vraies stats plus tard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between opacity-70">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Actions cette semaine</p>
              <p className="text-3xl font-bold text-gray-900">-</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
      </div>

      {/* --- ZONE D'INVITATION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                Inviter un nouveau membre
            </h2>
        </div>

        <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-gray-900">Code d'accès unique</p>
                <p className="text-sm text-gray-600">
                    Transmettez ce code à un proche ou un professionnel. Il devra le saisir lors de son inscription en cliquant sur "Rejoindre un cercle".
                </p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="flex-1 md:w-48 bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 font-mono text-xl tracking-wider text-center font-bold">
                    {inviteCode}
                </div>
                <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 min-w-[110px] ${
                        copied 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    }`}
                >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copié' : 'Copier'}
                </button>
            </div>
        </div>
      </div>

      {/* --- LISTE DES MEMBRES --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Membres du cercle</h2>
        </div>

        {loading ? (
            <div className="p-10 text-center text-gray-400">Chargement des membres...</div>
        ) : (
            <div className="divide-y divide-gray-100">
                {members.map((member) => (
                  <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        
                        {/* Avatar (Initiale) */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                            member.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 
                            member.role === 'PC' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Infos */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            
                            {/* Badge Rôle */}
                            {member.role === 'ADMIN' && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200 flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Admin
                                </span>
                            )}
                            {member.role === 'PC' && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200">
                                    Bénéficiaire
                                </span>
                            )}
                            {member.role === 'HELPER' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200">
                                    Aidant
                                </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-500 space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> {member.email}
                            </div>
                            {member.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" /> {member.phone}
                                </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions (Supprimer) - Sauf pour l'admin lui-même et le senior */}
                      {member.role === 'HELPER' && (
                        <button 
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="text-gray-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" 
                          title="Retirer du cercle"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}