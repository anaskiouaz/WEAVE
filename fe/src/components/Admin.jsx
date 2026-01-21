import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Check, Share2, Crown, Mail, Phone, Trash2, Shield, Clock, UserPlus, UserMinus, Image, MessageSquare, Calendar, Activity, AlertTriangle, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Mapping des actions pour affichage
const ACTION_CONFIG = {
  MEMBER_JOINED: { icon: UserPlus, color: 'bg-green-100 text-green-600', label: 'Nouveau membre' },
  MEMBER_REMOVED: { icon: UserMinus, color: 'bg-red-100 text-red-600', label: 'Membre retiré' },
  SOUVENIR_CREATED: { icon: Image, color: 'bg-purple-100 text-purple-600', label: 'Souvenir ajouté' },
  SOUVENIR_DELETED: { icon: Image, color: 'bg-orange-100 text-orange-600', label: 'Souvenir supprimé' },
  COMMENT_ADDED: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600', label: 'Commentaire' },
  COMMENT_DELETED: { icon: MessageSquare, color: 'bg-gray-100 text-gray-600', label: 'Commentaire supprimé' },
  TASK_VOLUNTEERED: { icon: Calendar, color: 'bg-indigo-100 text-indigo-600', label: 'Engagement activité' },
};

export default function Admin() {
  const { user, circleId, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [ratingData, setRatingData] = useState({ average: 0, total: 0, my: null, skills: [] });
  const [pendingRating, setPendingRating] = useState(0);

  // Déterminer le cercle courant :
  // - si un `circleId` est sélectionné dans le contexte, on l'utilise
  // - sinon on prend le premier cercle où l'utilisateur est membre (peu importe le rôle)
  const currentCircle = (circleId && user?.circles?.find(c => String(c.id ?? c.circle_id) === String(circleId)))
    || (Array.isArray(user?.circles) ? user.circles[0] : null);

  const currentCircleId = currentCircle?.id ?? currentCircle?.circle_id;
  const currentCircleName = currentCircle?.senior_name || currentCircle?.name;

  // Rôle courant dans le cercle (pour limiter les actions sensibles aux admins)
  const currentRole = (currentCircle?.role || '').toUpperCase();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'SUPERADMIN';

  // Récupérer le code d'invitation du cercle courant
  const inviteCode = currentCircle?.invite_code || '...';

  // 2. Récupérer la vraie liste des membres au chargement
  useEffect(() => {
    if (currentCircleId) {
      fetchMembers(currentCircleId);
      fetchActivityLogs(currentCircleId);
    } else {
      setLoading(false);
      setLogsLoading(false);
    }
  }, [currentCircleId]);

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

  const fetchActivityLogs = async (circleId) => {
    try {
      const token = localStorage.getItem('weave_token');
      const res = await fetch(`${API_BASE_URL}/circles/${circleId}/logs?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.data || []);
      }
    } catch (err) {
      console.error("Erreur chargement logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Formater l'heure
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (diffInSeconds < 60) return `À l'instant (${timeStr})`;
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min (${timeStr})`;
    if (diffInSeconds < 86400) return `Aujourd'hui à ${timeStr}`;
    if (diffInSeconds < 172800) return `Hier à ${timeStr}`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` à ${timeStr}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteCircle = async () => {
    if (!isAdmin) return;
    if (deleteConfirmText !== currentCircleName) {
      alert("Le nom saisi ne correspond pas.");
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('weave_token');
      const res = await fetch(`${API_BASE_URL}/circles/${currentCircleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Le cercle a été supprimé définitivement.");
        // Rediriger vers la page de sélection de cercle
        navigate('/select-circle');
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.error || "Impossible de supprimer le cercle"}`);
      }
    } catch (err) {
      console.error("Erreur suppression cercle", err);
      alert("Erreur lors de la suppression du cercle");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    // Demander confirmation
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir retirer "${memberName}" du cercle ?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('weave_token');
      const res = await fetch(`${API_BASE_URL}/circles/${currentCircleId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Rafraîchir la liste des membres
        await fetchMembers(currentCircleId);
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

  // Si aucun cercle sélectionné ou disponible
  if (!currentCircle) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center h-full">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-600">Aucun cercle sélectionné</h2>
        <p className="text-gray-500">Choisissez un cercle pour voir ses membres.</p>
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
          Gérez le cercle de soin de <span className="font-semibold text-blue-600">{currentCircle?.senior_name}</span>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Actions récentes</p>
            <p className="text-3xl font-bold text-gray-900">{activityLogs.length}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

          {isAdmin && (
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
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 min-w-[110px] ${copied
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
          )}

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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
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
                        {/* Skills preview */}
                        {Array.isArray(member.skills) && member.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {member.skills.slice(0,4).map(s => (
                              <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">{s}</span>
                            ))}
                            {member.skills.length > 4 && <span className="text-xs text-gray-400">+{member.skills.length-4}</span>}
                          </div>
                        )}
                        {/* Afficher le bouton de notation uniquement si l'utilisateur courant est admin ou aidant et cible admin ou aidant, et pas pour soi-même */}
                        {(currentRole === 'ADMIN' || currentRole === 'HELPER') && (member.role === 'ADMIN' || member.role === 'HELPER') && member.id !== user.id && (
                          <button
                            onClick={async () => {
                              setSelectedMember(member);
                              setShowRatingModal(true);
                              try {
                                const token = localStorage.getItem('weave_token');
                                const res = await fetch(`${API_BASE_URL}/users/${member.id}/rating?circleId=${currentCircleId}&raterId=${user.id}`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setRatingData(data);
                                  setPendingRating(data.my?.rating || 0);
                                } else {
                                  setRatingData({ average: 0, total: 0, my: null, skills: member.skills || [] });
                                }
                              } catch (e) {
                                setRatingData({ average: 0, total: 0, my: null, skills: member.skills || [] });
                              }
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            <Star className="w-3.5 h-3.5" /> Voir compétences & noter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Supprimer) - Sauf pour l'admin lui-même et le senior */}
                  {isAdmin && member.role === 'HELPER' && (
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

      {/* --- JOURNAL D'ACTIVITÉ --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Journal d'activité
          </h2>
          <p className="text-sm text-gray-500 mt-1">Historique des actions récentes dans le cercle</p>
        </div>

        {logsLoading ? (
          <div className="p-10 text-center text-gray-400">Chargement de l'historique...</div>
        ) : activityLogs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune activité enregistrée pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => {
              const config = ACTION_CONFIG[log.action] || {
                icon: Activity,
                color: 'bg-gray-100 text-gray-600',
                label: log.action
              };
              const IconComponent = config.icon;

              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTimeAgo(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                      {log.user_name && (
                        <p className="text-xs text-gray-400 mt-0.5">par {log.user_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="p-6 border-b border-red-100 bg-red-50">
            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Zone de danger
            </h2>
            <p className="text-sm text-red-600 mt-1">Ces actions sont irréversibles</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Supprimer le cercle</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cette action supprimera définitivement le cercle, tous ses membres, souvenirs, messages et tâches. 
                  Cette action est irréversible.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer le cercle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMATION --- */}
      {isAdmin && showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700">Supprimer le cercle ?</h3>
                  <p className="text-sm text-red-600">Cette action est définitive</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Attention :</strong> Vous êtes sur le point de supprimer définitivement le cercle 
                  <span className="font-bold"> "{currentCircleName}"</span>. 
                  Toutes les données seront perdues :
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>Tous les membres seront retirés</li>
                  <li>Tous les souvenirs et commentaires</li>
                  <li>Toutes les conversations et messages</li>
                  <li>Toutes les tâches et disponibilités</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour confirmer, tapez <span className="font-bold text-red-600">"{currentCircleName}"</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Nom du cercle"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCircle}
                disabled={deleteConfirmText !== currentCircleName || deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NOTE MEMBRE --- */}
      {showRatingModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Compétences & appréciation</h3>
              <p className="text-sm text-gray-500">{selectedMember.name}</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Skills */}
              {Array.isArray(ratingData.skills) && ratingData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ratingData.skills.map(s => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">{s}</span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Aucune compétence renseignée</div>
              )}

              {/* Average */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{ratingData.average?.toFixed ? ratingData.average.toFixed(1) : ratingData.average} / 5</span>
                <span className="text-gray-400">({ratingData.total} avis)</span>
              </div>

              {/* Your rating */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Votre note</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setPendingRating(n)} className="p-1" aria-label={`Note ${n}`}>
                      <Star className={`w-6 h-6 ${pendingRating >= n ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setShowRatingModal(false); setSelectedMember(null); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">Fermer</button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('weave_token');
                    const res = await fetch(`${API_BASE_URL}/users/${selectedMember.id}/rating`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ raterId: user.id, circleId: currentCircleId, rating: pendingRating })
                    });
                    if (res.ok) {
                      // Refresh average
                      const r = await fetch(`${API_BASE_URL}/users/${selectedMember.id}/rating?circleId=${currentCircleId}&raterId=${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (r.ok) {
                        const data = await r.json();
                        setRatingData(data);
                      }
                      setShowRatingModal(false);
                      setSelectedMember(null);
                    } else {
                      alert('Erreur lors de l\'enregistrement de la note');
                    }
                  } catch (e) {
                    alert('Erreur réseau lors de la note');
                  }
                }}
                disabled={!pendingRating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}