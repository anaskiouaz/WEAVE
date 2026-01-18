import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, Check, Copy, Activity, FileText, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function Admin() {
  const { user, circleId, token, setCircleId } = useAuth();
  const [activeTab, setActiveTab] = useState('members'); 
  const [showAddContact, setShowAddContact] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // Pour les boutons de suppression

  const currentCircleId = circleId || localStorage.getItem('circle_id');
  const adminCircle = user?.circles?.find(c => String(c.id) === String(currentCircleId));
  const inviteCode = adminCircle?.invite_code || '---';

  // --- ACTIONS ---

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchMembers = async () => {
    if (!currentCircleId) return;
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE_URL}/circles/${currentCircleId}/members`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    if (!currentCircleId) return;
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE_URL}/audit/${currentCircleId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // --- NOUVEAU : Supprimer un membre ---
  const handleRemoveMember = async (userId, userName) => {
      if (!window.confirm(`Êtes-vous sûr de vouloir retirer ${userName} du cercle ?`)) return;
      
      setActionLoading(true);
      try {
          const res = await fetch(`${API_BASE_URL}/circles/${currentCircleId}/members/${userId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
              // On rafraîchit la liste
              fetchMembers();
          } else {
              alert("Erreur lors de la suppression.");
          }
      } catch (error) {
          console.error(error);
          alert("Impossible de contacter le serveur.");
      } finally {
          setActionLoading(false);
      }
  };

  // --- NOUVEAU : Supprimer le cercle ---
  const handleDeleteCircle = async () => {
      const confirm1 = window.confirm("ATTENTION : Vous êtes sur le point de supprimer DÉFINITIVEMENT ce cercle et toutes ses données.");
      if (!confirm1) return;

      const confirm2 = window.confirm("Cette action est irréversible. Êtes-vous vraiment sûr ?");
      if (!confirm2) return;

      setActionLoading(true);
      try {
          const res = await fetch(`${API_BASE_URL}/circles/${currentCircleId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
              // Nettoyage local
              localStorage.removeItem('circle_id');
              localStorage.removeItem('circle_nom');
              setCircleId(null);
              // Redirection vers la sélection
              window.location.href = '/select-circle';
          } else {
              alert("Erreur: Impossible de supprimer le cercle.");
          }
      } catch (error) {
          console.error(error);
      } finally {
          setActionLoading(false);
      }
  };

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, currentCircleId]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24 md:pb-6">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Administration
          </h1>
          <p className="text-gray-500">Gérez les accès et surveillez l'activité.</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
            <div className="text-sm">
                <p className="text-blue-600 font-medium">Code d'invitation</p>
                <p className="font-mono text-xl font-bold tracking-wider text-gray-800">{inviteCode}</p>
            </div>
            <button onClick={copyCode} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-blue-600" />}
            </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-2">
        <button onClick={() => setActiveTab('members')} className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Users className="w-4 h-4" /> Membres
        </button>
        <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Activity className="w-4 h-4" /> Journal
        </button>
      </div>

      {/* CONTENU : MEMBRES */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 p-6 space-y-8">
            {/* Liste des membres */}
            <div>
                <div className="flex justify-between mb-6">
                    <h3 className="font-bold text-lg text-gray-700">Équipe de soins</h3>
                    <button onClick={() => setShowAddContact(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all">
                        <UserPlus className="w-4 h-4" /> Inviter
                    </button>
                </div>

                {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-gray-600 text-sm">
                                <tr>
                                    <th className="px-6 py-3 text-left">Nom</th>
                                    <th className="px-6 py-3 text-left">Email</th>
                                    <th className="px-6 py-3 text-left">Rôle</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-medium text-gray-800">{member.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{member.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* On ne peut pas se supprimer soi-même ici */}
                                            {member.id !== user.id && (
                                                <button 
                                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                                    disabled={actionLoading}
                                                    className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors"
                                                    title="Retirer du cercle"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {members.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-400">Aucun membre trouvé</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ZONE DE DANGER */}
            <div className="mt-12 pt-8 border-t border-red-100">
                <h3 className="text-red-700 font-bold flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" /> Zone de danger
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="text-red-800 font-medium">Supprimer ce cercle</p>
                        <p className="text-red-600 text-sm">Cette action est irréversible. Toutes les données, messages et souvenirs seront perdus.</p>
                    </div>
                    <button 
                        onClick={handleDeleteCircle}
                        disabled={actionLoading}
                        className="bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                        {actionLoading ? "..." : "Supprimer le cercle"}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CONTENU : LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 p-6">
            <div className="flex justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-700">Historique des actions</h3>
                <button onClick={fetchLogs} className="p-2 hover:bg-gray-100 rounded-full" title="Actualiser"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
            </div>

            {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></div> : (
                <div className="space-y-4">
                    {logs.length === 0 ? <p className="text-center text-gray-400 py-8">Aucune activité récente.</p> : 
                    logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="bg-blue-100 p-2 rounded-full mt-1">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-gray-900">{log.action}</p>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                     {new Date(log.created_at).toLocaleString('fr-FR', { 
                                        timeZone: 'Europe/Paris', 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Par <span className="font-semibold">{log.user_name}</span> • {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* Modal d'ajout (inchangé) */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Inviter un membre</h3>
            <p className="text-gray-600 mb-6 text-sm">Transmettez ce code à la personne que vous souhaitez inviter :</p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200">
                <p className="font-mono text-2xl font-bold text-center tracking-widest text-blue-900 select-all">{inviteCode}</p>
            </div>
            <button onClick={() => setShowAddContact(false)} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}