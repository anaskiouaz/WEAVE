import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Copy, Check, Share2, Crown, Mail, Phone, Trash2, 
  Shield, Clock, UserPlus, UserMinus, Image, MessageSquare, 
  Calendar, Activity, AlertTriangle, Star, Send // <--- Added Send icon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/*
 * Config d'affichage des logs d'activité
 * Chaque action du backend (AUDIT_ACTIONS) a son style ici
 * Pour ajouter une action : 1) l'ajouter dans audits.js 2) l'ajouter ici
 */
const ACTION_CONFIG = {
  MEMBER_JOINED: { icon: UserPlus, color: 'bg-[#A7C9A7]/20 text-[#4A6A8A]', label: 'Nouveau membre' },
  MEMBER_REMOVED: { icon: UserMinus, color: 'bg-[#F08080]/20 text-[#F08080]', label: 'Membre retiré' },
  SOUVENIR_CREATED: { icon: Image, color: 'bg-[#4A6A8A]/15 text-[#4A6A8A]', label: 'Souvenir ajouté' },
  SOUVENIR_DELETED: { icon: Image, color: 'bg-[#F08080]/15 text-[#F08080]', label: 'Souvenir supprimé' },
  COMMENT_ADDED: { icon: MessageSquare, color: 'bg-[#6B8AAA]/20 text-[#4A6A8A]', label: 'Commentaire' },
  COMMENT_DELETED: { icon: MessageSquare, color: 'bg-gray-100 text-[#6B8AAA]', label: 'Commentaire supprimé' },
  TASK_VOLUNTEERED: { icon: Calendar, color: 'bg-[#A7C9A7]/30 text-[#4A6A8A]', label: 'Engagement activité' },
};

export default function Admin() {
  const { user, circleId, logout } = useAuth();
  const navigate = useNavigate();
  
  // Existing State
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // New State for Email Invitation
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [ratingData, setRatingData] = useState({ average: 0, total: 0, my: null, skills: [] });
  const [pendingRating, setPendingRating] = useState(0);

  /*
   * Récupère le cercle sélectionné dans user.circles
   * Un user peut être ADMIN dans un cercle et HELPER dans un autre
   * On doit donc récupérer son rôle pour LE cercle actuellement affiché
   */
  const currentCircle = (circleId && user?.circles?.find(c => String(c.id ?? c.circle_id) === String(circleId)))
    || (Array.isArray(user?.circles) ? user.circles[0] : null);

  const currentCircleId = currentCircle?.id ?? currentCircle?.circle_id;
  const currentCircleName = currentCircle?.senior_name || currentCircle?.name;

  // Rôle dans ce cercle : ADMIN (créateur), HELPER (aidant), PC (bénéficiaire)
  const currentRole = (currentCircle?.role || '').toUpperCase();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'SUPERADMIN'; // Seuls eux peuvent gérer le cercle
  const inviteCode = currentCircle?.invite_code || '...';

  // Charge membres + logs quand on change de cercle
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

  // Récupère les logs d'activité du cercle (GET /circles/:id/logs)
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

  // Formate la date en "Il y a X min", "Hier à 10:00", etc.
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
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

  // --- NEW: Handle Email Invite ---
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSendingInvite(true);
    try {
      const token = localStorage.getItem('weave_token');
      const res = await fetch(`${API_BASE_URL}/circles/${currentCircle.id}/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Invitation envoyée avec succès !");
        setInviteEmail(''); // Clear input
      } else {
        alert(`Erreur: ${data.error || "Impossible d'envoyer l'email"}`);
      }
    } catch (err) {
      console.error("Erreur envoi invite", err);
      alert("Erreur réseau lors de l'envoi de l'invitation.");
    } finally {
      setSendingInvite(false);
    }
  };
  // --------------------------------

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
      <div className="p-10 flex flex-col items-center justify-center text-center h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Shield className="w-16 h-16 mb-4" style={{ color: 'var(--text-secondary)' }} />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Aucun cercle sélectionné</h2>
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Choisissez un cercle pour voir ses membres.</p>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.role !== 'PC').length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* --- EN-TÊTE --- */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Administration</h1>
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
          Gérez le cercle de soin de <span className="font-bold" style={{ color: 'var(--soft-coral)' }}>{currentCircle?.senior_name}</span>
        </p>
      </div>

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl p-6 flex items-center justify-between hover:-translate-y-1 transition-all duration-200" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Aidants actifs</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeMembers}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(74, 106, 138, 0.1)' }}>
            <Users className="w-7 h-7" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div className="rounded-3xl p-6 flex items-center justify-between hover:-translate-y-1 transition-all duration-200" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Actions récentes</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{activityLogs.length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(167, 201, 167, 0.2)' }}>
            <Activity className="w-7 h-7" style={{ color: 'var(--sage-green)' }} />
          </div>
        </div>
      </div>

          {isAdmin && (
            <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Share2 className="w-5 h-5" style={{ color: 'var(--sage-green)' }} />
                  Inviter un nouveau membre
                </h2>
              </div>

              <div className="rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center" style={{ backgroundColor: 'rgba(240, 128, 128, 0.05)', border: '1px solid rgba(240, 128, 128, 0.2)' }}>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Code d'accès unique</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Transmettez ce code à un proche ou un professionnel. Il devra le saisir lors de son inscription en cliquant sur "Rejoindre un cercle".
                  </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <div className="flex-1 md:w-48 border-2 rounded-2xl px-4 py-3 font-mono text-xl tracking-wider text-center font-bold" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
                    {inviteCode}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-5 py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 min-w-[110px]`}
                    style={{ 
                      backgroundColor: copied ? 'rgba(167, 201, 167, 0.2)' : 'var(--soft-coral)',
                      color: copied ? 'var(--text-primary)' : 'white',
                      border: copied ? '2px solid var(--sage-green)' : 'none',
                      boxShadow: copied ? 'none' : '0 4px 16px rgba(240, 128, 128, 0.25)'
                    }}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* --- LISTE DES MEMBRES --- */}
      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Membres du cercle</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>Chargement des membres...</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {members.map((member) => (
              <div key={member.id} className="p-6 transition-all duration-200 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">

                    {/* Avatar (Initiale) */}
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                      style={{ 
                        backgroundColor: member.role === 'ADMIN' ? 'rgba(74, 106, 138, 0.15)' : member.role === 'PC' ? 'rgba(240, 128, 128, 0.15)' : 'rgba(167, 201, 167, 0.2)',
                        color: member.role === 'ADMIN' ? 'var(--text-primary)' : member.role === 'PC' ? 'var(--soft-coral)' : 'var(--text-primary)'
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Infos */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{member.name}</p>

                        {/* Badge Rôle */}
                        {member.role === 'ADMIN' && (
                          <span className="px-2.5 py-1 text-xs rounded-full flex items-center gap-1 font-semibold" style={{ backgroundColor: 'rgba(74, 106, 138, 0.1)', color: 'var(--text-primary)', border: '1px solid rgba(74, 106, 138, 0.2)' }}>
                            <Crown className="w-3 h-3" /> Admin
                          </span>
                        )}
                        {member.role === 'PC' && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-semibold" style={{ backgroundColor: 'rgba(240, 128, 128, 0.15)', color: 'var(--soft-coral)', border: '1px solid rgba(240, 128, 128, 0.2)' }}>
                            Bénéficiaire
                          </span>
                        )}
                        {member.role === 'HELPER' && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-semibold" style={{ backgroundColor: 'rgba(167, 201, 167, 0.2)', color: 'var(--text-primary)', border: '1px solid rgba(167, 201, 167, 0.3)' }}>
                            Aidant
                          </span>
                        )}
                      </div>

                      <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" /> {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" /> {member.phone}
                          </div>
                        )}
                        
                        {/* Skills & Rating Button */}
                        {Array.isArray(member.skills) && member.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {member.skills.slice(0,4).map(s => (
                              <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(167, 201, 167, 0.15)', color: 'var(--text-primary)', border: '1px solid rgba(167, 201, 167, 0.3)' }}>{s}</span>
                            ))}
                            {member.skills.length > 4 && <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>+{member.skills.length-4}</span>}
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
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                            style={{ color: 'var(--soft-coral)' }}
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
                      className="text-gray-300 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 transition-all duration-200"
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
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock className="w-5 h-5" style={{ color: 'var(--sage-green)' }} />
            Journal d'activité
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Historique des actions récentes dans le cercle</p>
        </div>

        {logsLoading ? (
          <div className="p-10 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>Chargement de l'historique...</div>
        ) : activityLogs.length === 0 ? (
          <div className="p-10 text-center" style={{ color: 'var(--text-secondary)' }}>
            <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(167, 201, 167, 0.5)' }} />
            <p className="font-medium">Aucune activité enregistrée pour le moment</p>
          </div>
        ) : (
          <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: 'var(--border-light)' }}>
            {activityLogs.map((log) => {
              const config = ACTION_CONFIG[log.action] || {
                icon: Activity,
                color: 'bg-[#4A6A8A]/10 text-[#4A6A8A]',
                label: log.action
              };
              const IconComponent = config.icon;

              return (
                <div key={log.id} className="p-4 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(74, 106, 138, 0.1)', color: 'var(--text-primary)' }}>
                          {config.label}
                        </span>
                        <span className="text-xs flex-shrink-0 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {formatTimeAgo(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{log.details}</p>
                      {log.user_name && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>par {log.user_name}</p>
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
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(74,106,138,0.08)] border border-red-100/50 overflow-hidden">
          <div className="p-6 border-b border-red-100/50 bg-red-50/50">
            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Zone de danger
            </h2>
            <p className="text-sm text-red-500/80 mt-1 font-medium">Ces actions sont irréversibles</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#4A6A8A]">Supprimer le cercle</h3>
                <p className="text-sm text-[#6B8AAA] mt-1">
                  Cette action supprimera définitivement le cercle, tous ses membres, souvenirs, messages et tâches. 
                  Cette action est irréversible.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 font-semibold flex items-center gap-2 whitespace-nowrap shadow-md hover:-translate-y-0.5"
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
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-red-50/50 border-b border-red-100/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100/70 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-600">Supprimer le cercle ?</h3>
                  <p className="text-sm text-red-500/80 font-medium">Cette action est définitive</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
                <p className="text-sm text-red-700">
                  <strong>Attention :</strong> Vous êtes sur le point de supprimer définitivement le cercle 
                  <span className="font-bold"> "{currentCircleName}"</span>. 
                  Toutes les données seront perdues :
                </p>
                <ul className="text-sm text-red-600 mt-2 list-disc list-inside space-y-1">
                  <li>Tous les membres seront retirés</li>
                  <li>Tous les souvenirs et commentaires</li>
                  <li>Toutes les conversations et messages</li>
                  <li>Toutes les tâches et disponibilités</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4A6A8A] mb-2">
                  Pour confirmer, tapez <span className="font-bold text-red-500">"{currentCircleName}"</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Nom du cercle"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition-all text-[#4A6A8A]"
                />
              </div>
            </div>

            <div className="p-6 bg-[#FDFBF7] border-t border-gray-100/50 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-[#4A6A8A] rounded-full hover:bg-white transition-all duration-200 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCircle}
                disabled={deleteConfirmText !== currentCircleName || deleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NOTE MEMBRE --- */}
      {showRatingModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100/50">
              <h3 className="text-lg font-bold text-[#4A6A8A]">Compétences & appréciation</h3>
              <p className="text-sm text-[#6B8AAA] font-medium">{selectedMember.name}</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Skills Display */}
              {Array.isArray(ratingData.skills) && ratingData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ratingData.skills.map(s => (
                    <span key={s} className="text-xs bg-[#A7C9A7]/15 text-[#4A6A8A] px-2.5 py-1 rounded-full border border-[#A7C9A7]/30 font-medium">{s}</span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#6B8AAA] font-medium">Aucune compétence renseignée</div>
              )}

              {/* Average */}
              <div className="flex items-center gap-2 text-sm text-[#4A6A8A]">
                <Star className="w-4 h-4 text-[#F08080] fill-[#F08080]" />
                <span className="font-semibold">{ratingData.average?.toFixed ? ratingData.average.toFixed(1) : ratingData.average} / 5</span>
                <span className="text-[#6B8AAA]">({ratingData.total} avis)</span>
              </div>

              {/* User Input Rating */}
              <div>
                <label className="block text-xs font-bold text-[#4A6A8A] uppercase mb-2">Votre note</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setPendingRating(n)} className="p-1 hover:scale-110 transition-transform" aria-label={`Note ${n}`}>
                      <Star className={`w-7 h-7 ${pendingRating >= n ? 'text-[#F08080] fill-[#F08080]' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-[#FDFBF7] border-t border-gray-100/50 flex gap-3">
              <button onClick={() => { setShowRatingModal(false); setSelectedMember(null); }} className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-[#4A6A8A] rounded-full hover:bg-white transition-all duration-200 font-semibold">Fermer</button>
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
                className="flex-1 px-4 py-2.5 bg-[#F08080] text-white rounded-full hover:bg-[#E06B6B] transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5"
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