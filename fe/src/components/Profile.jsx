import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Loader2, Save, X, Edit2, Trash2, Plus,
  Star, Award, PenSquare, Bell, LogOut, Camera, Cookie, AlertTriangle
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCookieConsent } from '../context/CookieContext';
import RestartOnboardingButton from './RestartOnboardingButton';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export default function Profile() {
  const { user, logout, circleId } = useAuth();
  const { openPreferences } = useCookieConsent();
  const navigate = useNavigate();

  // ID utilisateur dynamique
  const USER_ID = user?.id;

  // Données utilisateur et statistiques
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '', address: '', joinDate: '', yearsActive: '0 jour', photoUrl: null });
  const [availability, setAvailability] = useState([]);
  const [stats, setStats] = useState({ interventions: 0, moments: 0, messagesSent: 0, rating: 0 });
  const [skills, setSkills] = useState([]);

  // États d'édition des sections
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Données des formulaires
  const [profileForm, setProfileForm] = useState({});
  const [availForm, setAvailForm] = useState([]);
  const [skillsForm, setSkillsForm] = useState([]);

  // Paramètres et modales
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Modal suppression Cercle (Admin)
  const [showDeleteCircleModal, setShowDeleteCircleModal] = useState(false);
  const [deleteCircleConfirmText, setDeleteCircleConfirmText] = useState('');
  const [isDeletingCircle, setIsDeletingCircle] = useState(false);

  // Modal suppression Compte (Nouveau)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountInput, setDeleteAccountInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Constantes
  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const availableSkillsList = ['Courses', 'Cuisine', 'Accompagnement médical', 'Promenade', 'Lecture', 'Jardinage', 'Bricolage'];

  // Constructeur d'URL API
  const buildApiUrl = (p) => {
    const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    let host = raw.replace(/\/$/, '');
    if (host.endsWith('/api')) host = host.slice(0, -4);
    const path = p.startsWith('/') ? p.slice(1) : p;
    return `${host}/api/${path}`;
  };

  // Initialisation et chargement des données
  useEffect(() => {
    if (USER_ID) {
      setIsLoading(true);
      fetchData();
      checkNotificationStatus();
    }
  }, [USER_ID]);

  // Résoudre le cercle courant
  const currentCircle = (circleId && user?.circles?.find(c => String(c.id) === String(circleId))) || user?.circles?.[0] || null;
  const currentCircleName = currentCircle?.senior_name || currentCircle?.name || currentCircle?.circle_nom || '';
  const isAdmin = currentCircle && (String(currentCircle.role || '').toUpperCase() === 'ADMIN' || String(currentCircle.role || '').toUpperCase() === 'SUPERADMIN');

  const checkNotificationStatus = async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      const perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'granted') setNotificationsEnabled(true);
    } catch (e) {
      console.error("Erreur check notifs", e);
    }
  };

  const fetchData = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };

      // 1. Profil
      const data = await apiGet('/module/profile', options);
      if (data.success) {
        const userData = data.user;
        setUserInfo({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          joinDate: new Date(userData.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          yearsActive: 0,
          photoUrl: userData.profile_photo ? buildApiUrl(`/upload/blob/${userData.profile_photo}`) : null
        });

        setAvailability((data.availability || []).map(a => ({ day: a.day_of_week, slots: a.slots })));
        setSkills(Array.isArray(userData.skills) ? userData.skills : []);
        if (userData.notifications_enabled !== undefined) setNotificationsEnabled(userData.notifications_enabled);

        // 2. Stats
        try {
          const statsData = await apiGet('/module/profile/stats', options);
          if (statsData.success) {
            setStats(statsData.stats);
            if (statsData.stats.yearsActiveText) {
              setUserInfo(prev => ({ ...prev, yearsActive: statsData.stats.yearsActiveText }));
            }
          }
        } catch (e) {
          setStats({ interventions: 0, moments: 0, messagesSent: 0, rating: 5.0 });
        }
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion des photos de profil
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const tempUrl = URL.createObjectURL(file);
      setUserInfo({ ...userInfo, photoUrl: tempUrl });

      const formData = new FormData();
      formData.append('image', file);
      const uploadResponse = await fetch(buildApiUrl('/upload/image'), { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('Erreur upload');

      const uploadData = await uploadResponse.json();
      if (uploadData.status !== 'ok') throw new Error('Erreur sauvegarde');

      const options = { headers: { 'x-user-id': USER_ID } };
      await apiPost('/module/profile/upload-photo', { photoBlobName: uploadData.data.blobName }, options);

      setUserInfo({ ...userInfo, photoUrl: buildApiUrl(`/upload/blob/${uploadData.data.blobName}`) });
      alert('Photo mise à jour');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Mise à jour du profil
  const saveProfile = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      const data = await apiPut('/module/profile/info', profileForm, options);
      if (data.success) { setUserInfo({ ...userInfo, ...profileForm }); setIsEditingProfile(false); }
    } catch (err) { console.error(err); }
  };

  const saveSkills = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      const data = await apiPut('/module/profile/skills', { skills: skillsForm }, options);
      if (data.success) { setSkills(skillsForm); setIsEditingSkills(false); }
    } catch (err) { console.error(err); }
  };

  const toggleSkill = (skill) => {
    if (skillsForm.includes(skill)) setSkillsForm(skillsForm.filter(s => s !== skill));
    else setSkillsForm([...skillsForm, skill]);
  };

  // Gestion des disponibilités
  const updateAvailRow = (index, field, value) => {
    const newAvail = [...availForm];
    newAvail[index][field] = value;
    setAvailForm(newAvail);
  };

  const updateTimeSlot = (index, type, value) => {
    const newAvail = [...availForm];
    const currentSlots = newAvail[index].slots || '08:00 - 18:00';
    let [start, end] = currentSlots.includes(' - ') ? currentSlots.split(' - ') : ['08:00', '18:00'];
    if (type === 'start') start = value;
    if (type === 'end') end = value;
    newAvail[index].slots = `${start} - ${end}`;
    setAvailForm(newAvail);
  };

  const saveAvailability = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      const cid = localStorage.getItem('circle_id');
      if (!cid) return alert('Aucun cercle sélectionné');

      const dataToSend = availForm.map(item => ({ day_of_week: item.day || item.day_of_week, slots: item.slots }));
      const data = await apiPut('/module/profile/availability', { circle_id: cid, availability: dataToSend }, options);

      if (data.success) {
        setAvailability(dataToSend);
        setIsEditingAvailability(false);
      }
    } catch (err) { console.error(err); alert('Erreur lors de la sauvegarde'); }
  };

  // Gestion des notifications push
  const handleNotificationToggle = async () => {
    // 1. Sur PC (Web), on ne fait rien (bouton caché mais sécurité en plus)
    if (!Capacitor.isNativePlatform()) return;

    const newStatus = !notificationsEnabled;
    
    // Mise à jour optimiste pour éviter le "flicker"
    setNotificationsEnabled(newStatus);

    try {
        // 2. Sauvegarde en base
        await apiPut('/users/me', { notifications_enabled: newStatus });
        
        // Met à jour le contexte global pour que l'info soit partagée
        if (setUser) {
            setUser(prev => ({ ...prev, notifications_enabled: newStatus }));
        }

        if (newStatus === true) {
            // Activation
            let perm = await PushNotifications.checkPermissions();
            if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
            if (perm.receive !== 'granted') throw new Error("Permission refusée");

            await PushNotifications.register();
            // L'écouteur 'registration' dans App.jsx ou ici gérera l'envoi du token
        } else {
            // Désactivation
            await apiPost('/users/device-token', { userId: user.id, token: '' });
            await PushNotifications.removeAllListeners();
        }
    } catch (error) {
        console.error("Erreur notifs:", error);
        setNotificationsEnabled(!newStatus); // Revert en cas d'erreur
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) return <div className="p-10 flex justify-center h-screen items-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-500 to-orange-400 pb-32 shadow-md">
        <div className="max-w-4xl mx-auto p-8 pt-12">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => !isUploadingPhoto && fileInputRef.current.click()}>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white/40 shadow-xl overflow-hidden relative">
                {isUploadingPhoto && <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10"><Loader2 className="animate-spin text-white" /></div>}
                {userInfo.photoUrl ? <img src={userInfo.photoUrl} className="w-full h-full object-cover" alt="Profil" /> : userInfo.name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full text-gray-600 shadow-lg group-hover:scale-110 transition-transform"><Camera size={16} /></div>
            </div>
            <div className="text-white drop-shadow-md">
              <h1 className="text-3xl font-bold">{userInfo.name}</h1>
              <p className="opacity-95 flex items-center gap-2 font-medium mt-1">
                <Award size={18} className="text-orange-200" /> Aidant{userInfo.name?.endsWith('e') && 'e'} depuis {userInfo.yearsActive}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-4xl mx-auto px-8 -mt-24 space-y-6">

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { val: stats.interventions, label: 'Interventions' },
            { val: stats.moments, label: 'Souvenirs' },
            { val: stats.messagesSent || 0, label: 'Messages' },
            { val: <>{stats.rating} <Star className="inline w-6 h-6 text-yellow-400 fill-yellow-400" /></>, label: 'Appréciation' }
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-100 hover:-translate-y-1 transition-transform">
              <span className="text-3xl font-bold text-gray-800">{s.val}</span>
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wide mt-1">{s.label}</span>
            </div>
          ))}
        </div>

        {/* COMPÉTENCES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Award className="text-blue-600" size={20} /> Compétences</h2>
            {isEditingSkills ? (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingSkills(false)} className="px-3 py-2 text-sm border rounded flex gap-1 items-center"><X size={14} /> Annuler</button>
                <button onClick={saveSkills} className="px-3 py-2 text-sm bg-blue-600 text-white rounded flex gap-1 items-center"><Save size={14} /> Enregistrer</button>
              </div>
            ) : <button onClick={() => { setSkillsForm([...skills]); setIsEditingSkills(true); }} className="text-sm font-medium text-blue-600 flex items-center gap-2"><Edit2 size={16} /> Modifier</button>}
          </div>
          <div className="flex flex-wrap gap-3">
            {(isEditingSkills ? availableSkillsList : skills).map(skill => {
              const isSel = isEditingSkills ? skillsForm.includes(skill) : true;
              if (!isEditingSkills && !skills.includes(skill)) return null;
              return (
                <button key={skill} onClick={() => isEditingSkills && toggleSkill(skill)} disabled={!isEditingSkills}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${isSel ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-400 border-gray-200'} ${isEditingSkills ? 'cursor-pointer hover:scale-105' : ''}`}>
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* DISPONIBILITÉS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Loader2 className="text-blue-600" size={20} /> Disponibilités</h2>
            {isEditingAvailability ? (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingAvailability(false)} className="px-3 py-2 text-sm border rounded flex gap-1 items-center"><X size={14} /> Annuler</button>
                <button onClick={saveAvailability} className="px-3 py-2 text-sm bg-blue-600 text-white rounded flex gap-1 items-center"><Save size={14} /> Enregistrer</button>
              </div>
            ) : (
              <button onClick={() => {
                setAvailForm(availability.length ? availability.map(a => ({ day: a.day_of_week || a.day, slots: a.slots })) : [{ day: 'Lundi', slots: '08:00 - 18:00' }]);
                setIsEditingAvailability(true);
              }} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2"><Edit2 size={16} /> Modifier</button>
            )}
          </div>
          {/* ... Logique d'affichage des disponibilités identique ... */}
          <div className="space-y-3">
            {isEditingAvailability ? (
              <div className="space-y-3">
                {availForm.map((item, index) => {
                  let [start, end] = item.slots && item.slots.includes(' - ') ? item.slots.split(' - ') : ['08:00', '18:00'];
                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <select value={item.day} onChange={(e) => updateAvailRow(index, 'day', e.target.value)} className="border p-2 rounded bg-white w-full sm:w-32 text-sm outline-none">
                        {weekDays.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <div className="flex items-center gap-2 flex-1 w-full">
                        <span className="text-gray-500 text-sm">De</span>
                        <select value={start} onChange={(e) => updateTimeSlot(index, 'start', e.target.value)} className="border p-2 rounded bg-white flex-1 text-sm outline-none">{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                        <span className="text-gray-500 text-sm">à</span>
                        <select value={end} onChange={(e) => updateTimeSlot(index, 'end', e.target.value)} className="border p-2 rounded bg-white flex-1 text-sm outline-none">{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                      </div>
                      <button onClick={() => setAvailForm(availForm.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                    </div>
                  );
                })}
                <button onClick={() => setAvailForm([...availForm, { day: 'Lundi', slots: '08:00 - 18:00' }])} className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-2"><Plus size={16} /> Ajouter un créneau</button>
              </div>
            ) : (
              availability.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {availability.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-900 w-32">{item.day_of_week || item.day}</span>
                      <span className="text-gray-600 bg-white px-3 py-1 rounded border border-gray-200 text-sm">{item.slots}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-6 bg-gray-50 border border-dashed rounded-lg text-gray-500 italic text-sm">Aucune disponibilité.</div>
            )}
          </div>
        </div>

        {/* INFOS PERSONNELLES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Mail className="text-blue-600" size={20} /> Infos personnelles</h2>
            {isEditingProfile ? (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingProfile(false)} className="px-3 py-2 border rounded flex gap-1 items-center text-sm"><X size={14} /> Annuler</button>
                <button onClick={saveProfile} className="px-3 py-2 bg-blue-600 text-white rounded flex gap-1 items-center text-sm"><Save size={14} /> Enregistrer</button>
              </div>
            ) : (
              <button onClick={() => { setProfileForm({ ...userInfo }); setIsEditingProfile(true); }} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2"><Edit2 size={16} /> Modifier</button>
            )}
          </div>
          {/* Champs Infos Perso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditingProfile ? (
              <>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nom</label>
                  <input value={profileForm.name || ''} disabled className="mt-1 w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Email</label><div className="mt-1 p-2 bg-gray-50 rounded border text-gray-500">{userInfo.email}</div></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Tel</label><input value={profileForm.phone || ''} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-1 w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label><input value={profileForm.address || ''} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="mt-1 w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </>
            ) : (
              <>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Nom</label><div className="flex items-center gap-3 mt-1 p-2 bg-gray-50 rounded border border-gray-100"><PenSquare className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{userInfo.name}</span></div></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Email</label><div className="flex items-center gap-3 mt-1 p-2 bg-gray-50 rounded border border-gray-100"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{userInfo.email}</span></div></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Tel</label><div className="flex items-center gap-3 mt-1 p-2 bg-gray-50 rounded border border-gray-100"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{userInfo.phone || '-'}</span></div></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label><div className="flex items-center gap-3 mt-1 p-2 bg-gray-50 rounded border border-gray-100"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{userInfo.address || '-'}</span></div></div>
              </>
            )}
          </div>
        </div>

        {/* Paramètres généraux du profil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Paramètres</h2>
          <div className="space-y-6">

            {/* Notifications Switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-gray-500" size={20} />
                <span className="text-gray-700 font-medium">Notifications Push</span>
              </div>
              <button onClick={handleNotificationToggle} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100"><RestartOnboardingButton /></div>

            {/* Cookies */}
            <button onClick={openPreferences} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors w-full text-left">
              <Cookie size={20} />
              <span className="font-medium">Gérer mes cookies</span>
            </button>

            {/* LOGOUT */}
            <button onClick={handleLogout} className="flex items-center gap-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-colors w-full text-left pt-4 border-t border-gray-100 mt-2">
              <LogOut size={20} />
              <span className="font-medium text-lg">Se déconnecter</span>
            </button>
          </div>
        </div>

        {/* Actions dangereuses (suppressions) */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 overflow-hidden">
          <div className="flex items-center gap-2 mb-6 text-red-700">
            <AlertTriangle size={24} />
            <h2 className="text-lg font-bold">Zone dangereuse</h2>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-red-50 rounded-lg border border-red-100 gap-4">
              <div>
                <h3 className="font-bold text-red-800">Supprimer mon compte</h3>
                <p className="text-sm text-red-600 mt-1">Efface votre profil, vos messages et retire votre accès à tous les cercles.</p>
              </div>
              <button onClick={() => setShowDeleteAccountModal(true)} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap font-medium text-sm">
                <Trash2 size={16} /> Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation avant suppression du cercle */}
      {showDeleteCircleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600"><AlertTriangle size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-red-700">Supprimer "{currentCircleName}" ?</h3>
                <p className="text-xs text-red-600">Action irréversible</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">Pour confirmer, veuillez saisir le nom du cercle : <strong>{currentCircleName}</strong></p>
              <input type="text" value={deleteCircleConfirmText} onChange={(e) => setDeleteCircleConfirmText(e.target.value)} placeholder="Nom du cercle" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowDeleteCircleModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
              <button onClick={handleDeleteCircle} disabled={deleteCircleConfirmText !== currentCircleName || isDeletingCircle} className="flex-1 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                {isDeletingCircle ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation avant suppression du compte */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all">

            <div className="p-6 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700">Supprimer votre compte ?</h3>
                  <p className="text-sm text-red-600">Vous allez perdre toutes vos données.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Attention :</strong> Cette action est définitive. Vos informations personnelles, historique d'interventions et accès seront effacés.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour confirmer, tapez <span className="font-bold text-red-600">supprimer</span> ci-dessous :
                </label>
                <input
                  type="text"
                  value={deleteAccountInput}
                  onChange={(e) => setDeleteAccountInput(e.target.value)}
                  placeholder="supprimer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountInput('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={deleteAccountInput.toLowerCase() !== 'supprimer' || isDeletingAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Suppression...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Confirmer</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}