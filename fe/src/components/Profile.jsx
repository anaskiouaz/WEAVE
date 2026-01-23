import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Loader2, Save, X, Edit2, Trash2, Plus, Star, Award, PenSquare, Bell, LogOut, Camera, RotateCcw, Cookie, Heart, ChevronDown, ChevronUp, Moon, Sun, Download, AlertTriangle, Check } from 'lucide-react';
import { apiGet, apiPut, apiPost, apiDelete } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCookieConsent } from '../context/CookieContext';
import RestartOnboardingButton from './RestartOnboardingButton';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { openPreferences } = useCookieConsent();
  const navigate = useNavigate();
  
  // --- ID DYNAMIQUE (Vital pour que ça marche) ---
  const USER_ID = user?.id; 

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '', address: '', joinDate: '', yearsActive: '0 jour', photoUrl: null });
  const [availability, setAvailability] = useState([]);
  const [stats, setStats] = useState({ interventions: 0, moments: 0, rating: 0 });
  const [skills, setSkills] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // --- UI ETATS (Travail de l'équipe : Personnes aidées) ---
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAssistedPeople, setShowAssistedPeople] = useState(false);
  const [assistedPeopleList] = useState(['Grand-Père Michel']); 

  // --- RGPD : Export et Suppression ---
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [profileForm, setProfileForm] = useState({});
  const [availForm, setAvailForm] = useState([]);
  const [skillsForm, setSkillsForm] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const availableSkillsList = ['Courses', 'Cuisine', 'Accompagnement médical', 'Promenade', 'Lecture', 'Jardinage', 'Bricolage'];

  useEffect(() => {
    if (USER_ID) {
        setIsLoading(true);
        fetchData();
        checkNotificationStatus();
    }
  }, [USER_ID]);

  const checkNotificationStatus = async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      const perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'granted') {
        setNotificationsEnabled(true);
      }
    } catch (e) {
      console.error("Erreur check notifs", e);
    }
  };

  const fetchData = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      
      // 1. Charger le profil de base
      const data = await apiGet('/module/profile', options);
      
      if (data.success) {
        const userData = data.user;
        const createdDate = new Date(userData.created_at);

        setUserInfo({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          joinDate: createdDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          yearsActive: 0,  // Sera mis à jour par les stats
          photoUrl: userData.profile_photo ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/uploads/${userData.profile_photo}` : null
        });

        // Formatage des disponibilités
        const formattedAvail = (data.availability || []).map(a => ({
            day: a.day_of_week,
            slots: a.slots
        }));
        setAvailability(formattedAvail);
        
        // Initialisation des skills
        setSkills(Array.isArray(userData.skills) ? userData.skills : []);
        
        // Notifs depuis la DB
        if (userData.notifications_enabled !== undefined) {
            setNotificationsEnabled(userData.notifications_enabled);
        }

        // 2. Charger les statistiques (Logique ÉQUIPE)
        // On met un try/catch pour ne pas faire planter la page si l'API stats n'est pas encore prête
        try {
            const statsData = await apiGet('/module/profile/stats', options);
            if (statsData.success) {
                setStats(statsData.stats);
                if (statsData.stats.yearsActiveText) {
                    setUserInfo(prev => ({ ...prev, yearsActive: statsData.stats.yearsActiveText }));
                }
            }
        } catch (statsError) {
            console.log("⚠️ API Stats non disponible ou vide, utilisation valeurs par défaut.");
            setStats({ interventions: 0, moments: 0, rating: 5.0 }); // Valeurs par défaut sûres
        }
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- GESTION PHOTO ---
  const handlePhotoClick = () => fileInputRef.current.click();

  // --- SAUVEGARDES ---
  const startEditProfile = () => { setProfileForm({ ...userInfo }); setIsEditingProfile(true); };
  
  const saveProfile = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      const data = await apiPut('/module/profile/info', profileForm, options);
      if (data.success) { setUserInfo({ ...userInfo, ...profileForm }); setIsEditingProfile(false); }
    } catch (err) { console.error(err); }
  };

  const startEditSkills = () => { setSkillsForm([...skills]); setIsEditingSkills(true); setShowCustomSkillInput(false); setCustomSkill(''); };
  
  const toggleSkill = (skill) => {
    if (skillsForm.includes(skill)) setSkillsForm(skillsForm.filter(s => s !== skill));
    else setSkillsForm([...skillsForm, skill]);
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skillsForm.includes(trimmed)) {
      setSkillsForm([...skillsForm, trimmed]);
    }
    setCustomSkill('');
    setShowCustomSkillInput(false);
  };

  const saveSkills = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      const data = await apiPut('/module/profile/skills', { skills: skillsForm }, options);
      if (data.success) { setSkills(skillsForm); setIsEditingSkills(false); }
    } catch (err) { console.error(err); }
  };

  const startEditAvail = () => { 
    const initialForm = availability.length > 0 
      ? availability.map(a => ({
          day: a.day_of_week || a.day,
          slots: a.slots
        })) 
      : [{ day: 'Lundi', slots: '08:00 - 18:00' }];
    setAvailForm(initialForm); 
    setIsEditingAvailability(true); 
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

  const updateAvailRow = (index, field, value) => { 
    const newAvail = [...availForm]; 
    newAvail[index][field] = value; 
    setAvailForm(newAvail); 
  };
  const addAvailRow = () => setAvailForm([...availForm, { day: 'Lundi', slots: '08:00 - 18:00' }]); 
  const removeAvailRow = (index) => setAvailForm(availForm.filter((_, i) => i !== index));

  const saveAvailability = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      const circleId = localStorage.getItem('circle_id');
      if (!circleId) { alert('Aucun cercle sélectionné'); return; }
      
      const dataToSend = availForm.map(item => ({ 
        day_of_week: item.day || item.day_of_week, 
        slots: item.slots 
      }));
      
      const data = await apiPut('/module/profile/availability', { 
        circle_id: circleId, 
        availability: dataToSend 
      }, options);
      
      if (data.success) { 
        setAvailability(dataToSend); 
        setIsEditingAvailability(false); 
      }
    } catch (err) { 
      console.error(err); 
      alert('Erreur lors de la sauvegarde des disponibilités');
    }
  };

  // --- GESTION NOTIFICATIONS (Consolidée) ---
  const handleNotificationToggle = async () => {
    const newStatus = !notificationsEnabled;
    const options = { headers: { 'x-user-id': USER_ID } };

    // Optimistic UI Update
    setNotificationsEnabled(newStatus);

    try {
        await apiPut('/module/profile/notifications', { notifications_enabled: newStatus }, options);

        if (Capacitor.getPlatform() !== 'web') {
            if (newStatus === true) {
                let perm = await PushNotifications.checkPermissions();
                if (perm.receive === 'prompt') {
                    perm = await PushNotifications.requestPermissions();
                }

                if (perm.receive === 'granted') {
                    await PushNotifications.register();
                    PushNotifications.addListener('registration', async (token) => {
                        await apiPost('/users/device-token', { userId: USER_ID, token: token.value }, options);
                        PushNotifications.removeAllListeners(); 
                    });
                } else {
                    setNotificationsEnabled(false);
                    await apiPut('/module/profile/notifications', { enabled: false }, options); 
                    alert("Les notifications sont bloquées dans les paramètres.");
                }
            } else {
                await apiPost('/users/device-token', { userId: USER_ID, token: "" }, options);
                await PushNotifications.removeAllListeners();
                await PushNotifications.unregister();
            }
        } 
    } catch (error) {
        console.error("Erreur toggle notifs:", error);
        setNotificationsEnabled(!newStatus);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- RGPD : Export des données ---
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/users/me/export`;
      console.log('Export URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('weave_token')}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error response:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weave-mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Erreur export complète:', error);
      alert(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- RGPD : Suppression du compte ---
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    
    setIsDeleting(true);
    try {
      await apiDelete(`/users/${USER_ID}`);
      // Notify the user that the account was deleted
      try { alert('Compte supprimé'); } catch (e) { /* ignore */ }
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      // 1. Afficher l'aperçu temporaire
      const tempUrl = URL.createObjectURL(file);
      setUserInfo({ ...userInfo, photoUrl: tempUrl });

      // 2. Préparer le FormData pour l'upload
      const formData = new FormData();
      formData.append('image', file);

      // 3. Uploader vers le backend qui uploadera à Azure
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload de l\'image');
      }

      const uploadData = await uploadResponse.json();
      if (uploadData.status !== 'ok' || !uploadData.data.blobName) {
        throw new Error('Erreur lors de la sauvegarde de l\'image');
      }

      // 4. Sauvegarder le nom du blob en base de données
      const options = { headers: { 'x-user-id': USER_ID } };
      const saveResponse = await apiPost('/module/profile/upload-photo', {
        photoBlobName: uploadData.data.blobName
      }, options);

      if (saveResponse.success) {
        // 5. Mettre à jour l'URL avec le blob Azure
        const photoUrl = `${API_BASE_URL}/uploads/${uploadData.data.blobName}`;
        setUserInfo({ ...userInfo, photoUrl });
        alert('Photo de profil mise à jour avec succès!');
      }
    } catch (err) {
      console.error('Erreur upload photo:', err);
      alert(`Erreur lors de l'upload: ${err.message}`);
      // Réinitialiser la photo en cas d'erreur
      setUserInfo({ ...userInfo, photoUrl: userInfo.photoUrl });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center h-screen items-center" style={{ backgroundColor: 'var(--bg-primary)' }}><Loader2 className="animate-spin w-10 h-10" style={{ color: 'var(--soft-coral)' }}/></div>;

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* HEADER (Digital Cocooning) */}
      <div className="pb-32" style={{ background: 'linear-gradient(135deg, var(--soft-coral), var(--bg-tertiary), var(--sage-green))', boxShadow: 'var(--shadow-lg)' }}>
        <div className="max-w-4xl mx-auto p-8 pt-12">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={!isUploadingPhoto ? handlePhotoClick : null}>
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold border-4 border-white/40 overflow-hidden relative" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}>
                {isUploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                    <Loader2 className="animate-spin text-white w-6 h-6" />
                  </div>
                )}
                {userInfo.photoUrl ? <img src={userInfo.photoUrl} className="w-full h-full object-cover" /> : userInfo.name?.charAt(0).toUpperCase()}
              </div>
              {!isUploadingPhoto && (
                <div className="absolute bottom-0 right-0 p-2 rounded-full text-white transition-all transform group-hover:scale-110 group-hover:-translate-y-0.5" style={{ backgroundColor: 'var(--soft-coral)', boxShadow: 'var(--shadow-md)' }}><Camera size={16} /></div>
              )}
            </div>

            <div style={{ color: 'var(--text-primary)' }} className="drop-shadow-sm">
              <h1 className="text-3xl font-bold tracking-tight">{userInfo.name}</h1>
              <p className="opacity-90 flex items-center gap-2 font-semibold mt-1">
                <Award size={18} style={{ color: 'var(--soft-coral)' }} /> 
                Aidant{userInfo.name && userInfo.name.endsWith('e') ? 'e' : ''} depuis {userInfo.yearsActive}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENU --- */}
      <div className="max-w-4xl mx-auto px-8 -mt-24 space-y-6">

        {/* STATS (Digital Cocooning) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl p-6 flex flex-col items-center justify-center transform hover:-translate-y-1 transition-all duration-200" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.interventions}</span>
            <span className="text-sm font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>Interventions</span>
          </div>
          <div className="rounded-3xl p-6 flex flex-col items-center justify-center transform hover:-translate-y-1 transition-all duration-200" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.moments}</span>
            <span className="text-sm font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>Moments partagés</span>
          </div>
          <div className="rounded-3xl p-6 flex flex-col items-center justify-center transform hover:-translate-y-1 transition-all duration-200" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-1 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.rating} <Star className="w-6 h-6" style={{ color: 'var(--soft-coral)', fill: 'var(--soft-coral)' }} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>Appréciation</span>
          </div>
        </div>

        {/* COMPÉTENCES */}
        <div className="rounded-3xl p-8" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Award style={{ color: 'var(--sage-green)' }} size={20} /> Compétences</h2>
            {isEditingSkills && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingSkills(false)} className="px-4 py-2 text-sm border-2 rounded-full flex gap-1 items-center font-semibold transition-all" style={{ borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}><X size={14}/> Annuler</button>
                <button onClick={saveSkills} className="px-4 py-2 text-sm text-white rounded-full flex gap-1 items-center font-semibold transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--soft-coral)', boxShadow: '0 4px 16px rgba(240, 128, 128, 0.25)' }}><Save size={14}/> Enregistrer</button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {(isEditingSkills ? [...new Set([...availableSkillsList, ...skillsForm])] : skills).map(skill => {
              const isSelected = isEditingSkills ? skillsForm.includes(skill) : true;
              if (!isEditingSkills && !skills.includes(skill)) return null;
              return (
                <button 
                  key={skill} 
                  onClick={() => isEditingSkills && toggleSkill(skill)} 
                  disabled={!isEditingSkills} 
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all border-2 ${isEditingSkills ? 'cursor-pointer hover:scale-105 hover:-translate-y-0.5' : ''}`}
                  style={{ 
                    backgroundColor: isSelected ? 'rgba(167, 201, 167, 0.2)' : 'var(--bg-secondary)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderColor: isSelected ? 'rgba(167, 201, 167, 0.5)' : 'var(--border-input)'
                  }}
                >
                  {skill}
                </button>
              );
            })}
            {/* Bouton "Autre" pour ajouter une compétence personnalisée */}
            {isEditingSkills && !showCustomSkillInput && (
              <button 
                onClick={() => setShowCustomSkillInput(true)}
                className="px-4 py-2 rounded-full font-semibold text-sm transition-all border-2 border-dashed cursor-pointer hover:scale-105 hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'var(--soft-coral)',
                  borderColor: 'var(--soft-coral)'
                }}
              >
                + Autre
              </button>
            )}
            {/* Champ de saisie pour compétence personnalisée */}
            {isEditingSkills && showCustomSkillInput && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                  placeholder="Votre compétence..."
                  className="px-4 py-2 rounded-full text-sm border-2 focus:outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--soft-coral)'
                  }}
                  autoFocus
                />
                <button 
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                  className="p-2 rounded-full transition-all"
                  style={{ 
                    backgroundColor: customSkill.trim() ? 'var(--soft-coral)' : 'var(--bg-secondary)',
                    color: customSkill.trim() ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  <Check size={16} />
                </button>
                <button 
                  onClick={() => { setShowCustomSkillInput(false); setCustomSkill(''); }}
                  className="p-2 rounded-full transition-all"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {!isEditingSkills && <button onClick={startEditSkills} className="mt-6 flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: 'var(--soft-coral)' }}><Edit2 size={16} /> Modifier</button>}
        </div>

        {/* DISPONIBILITÉS */}
        <div className="rounded-3xl p-8" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Loader2 style={{ color: 'var(--sage-green)' }} size={20} /> Disponibilités</h2>
              {isEditingAvailability ? (
                 <div className="flex gap-2">
                    <button onClick={() => setIsEditingAvailability(false)} className="px-4 py-2 text-sm border-2 rounded-full flex gap-1 items-center font-semibold transition-all" style={{ borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}><X size={14}/> Annuler</button>
                    <button onClick={saveAvailability} className="px-4 py-2 text-sm text-white rounded-full flex gap-1 items-center font-semibold transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--soft-coral)', boxShadow: '0 4px 16px rgba(240, 128, 128, 0.25)' }}><Save size={14}/> Enregistrer</button>
                 </div>
              ) : (
                 <button onClick={startEditAvail} className="px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all" style={{ color: 'var(--soft-coral)', backgroundColor: 'rgba(240, 128, 128, 0.1)' }}><Edit2 size={16} /> Modifier</button>
              )}
           </div>
           <div className="space-y-3">
              {isEditingAvailability ? (
                  <div className="space-y-3">
                      {availForm.map((item, index) => {
                          let [start, end] = item.slots && item.slots.includes(' - ') 
                            ? item.slots.split(' - ') 
                            : ['08:00', '18:00'];

                          return (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-input)' }}>
                                <select 
                                  value={item.day} 
                                  onChange={(e) => updateAvailRow(index, 'day', e.target.value)} 
                                  className="border-2 p-2.5 rounded-xl w-full sm:w-32 text-sm font-semibold focus:ring-2 outline-none transition-all"
                                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                                >
                                  {weekDays.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                
                                <div className="flex items-center gap-2 flex-1 w-full">
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>De</span>
                                    <select value={start} onChange={(e) => updateTimeSlot(index, 'start', e.target.value)} className="border-2 p-2.5 rounded-xl flex-1 text-sm font-semibold outline-none" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>à</span>
                                    <select value={end} onChange={(e) => updateTimeSlot(index, 'end', e.target.value)} className="border-2 p-2.5 rounded-xl flex-1 text-sm font-semibold outline-none" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                </div>

                                <button onClick={() => removeAvailRow(index)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end sm:self-center">
                                  <Trash2 size={18}/>
                                </button>
                            </div>
                          );
                      })}
                      <button onClick={addAvailRow} className="mt-2 text-sm font-semibold flex items-center gap-2 transition-colors" style={{ color: 'var(--soft-coral)' }}><Plus size={16}/> Ajouter un créneau</button>
                  </div>
              ) : (
                  availability.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {availability.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                              <span className="font-semibold w-32" style={{ color: 'var(--text-primary)' }}>{item.day_of_week || item.day}</span>
                              <span className="px-4 py-1.5 rounded-full text-sm font-semibold" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-input)' }}>{item.slots}</span>
                            </div>
                        ))}
                      </div>
                  ) : (<div className="text-center py-8 rounded-2xl border-2 border-dashed" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-input)' }}><p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune disponibilité.</p></div>)
              )}
           </div>
        </div>

        {/* INFOS */}
        <div className="rounded-3xl p-8" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Mail style={{ color: 'var(--sage-green)' }} size={20} /> Infos personnelles</h2>
              {isEditingProfile ? (
                  <div className="flex gap-2">
                      <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 border-2 rounded-full flex gap-1 items-center text-sm font-semibold transition-all" style={{ borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}><X size={14}/> Annuler</button>
                      <button onClick={saveProfile} className="px-4 py-2 text-white rounded-full flex gap-1 items-center text-sm font-semibold transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--soft-coral)', boxShadow: '0 4px 16px rgba(240, 128, 128, 0.25)' }}><Save size={14}/> Enregistrer</button>
                  </div>
              ) : (
                  <button onClick={startEditProfile} className="px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 transition-all" style={{ color: 'var(--soft-coral)', backgroundColor: 'rgba(240, 128, 128, 0.1)' }}><Edit2 size={16} /> Modifier</button>
              )}
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {isEditingProfile ? (
                 <>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Nom</label>
                      <input 
                        value={profileForm.name || ''} 
                        disabled 
                        className="mt-1 w-full p-3 border-2 rounded-2xl cursor-not-allowed font-semibold"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}
                        title="Le nom ne peut pas être modifié"
                      />
                    </div>
                    <div><label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Email</label><div className="flex items-center gap-3 mt-1 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}><Mail className="w-4 h-4" style={{ color: 'var(--sage-green)' }}/><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userInfo.email}</span></div></div>
                    <div><label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Tel</label><input value={profileForm.phone || ''} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} className="mt-1 w-full p-3 border-2 rounded-2xl outline-none focus:ring-2 font-semibold transition-all" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}/></div>
                    <div className="md:col-span-2"><label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Adresse</label><input value={profileForm.address || ''} onChange={(e) => setProfileForm({...profileForm, address: e.target.value})} className="mt-1 w-full p-3 border-2 rounded-2xl outline-none focus:ring-2 font-semibold transition-all" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}/></div>
                 </>
               ) : (
                 <>
                    <div><label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Nom</label><div className="flex items-center gap-3 mt-1 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}><PenSquare className="w-4 h-4" style={{ color: 'var(--sage-green)' }}/><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userInfo.name}</span></div></div>
                    <div><label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Email</label><div className="flex items-center gap-3 mt-1 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}><Mail className="w-4 h-4" style={{ color: 'var(--sage-green)' }}/><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userInfo.email}</span></div></div>
                    <div><label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Tel</label><div className="flex items-center gap-3 mt-1 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}><Phone className="w-4 h-4" style={{ color: 'var(--sage-green)' }}/><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userInfo.phone || '-'}</span></div></div>
                    <div className="md:col-span-2"><label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Adresse</label><div className="flex items-center gap-3 mt-1 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}><MapPin className="w-4 h-4" style={{ color: 'var(--sage-green)' }}/><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userInfo.address || '-'}</span></div></div>
                 </>
               )}
           </div>
        </div>

        {/* --- PARAMÈTRES (Digital Cocooning) --- */}
        <div className="rounded-3xl p-8" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Paramètres</h2>
          <div className="space-y-6">

            {/* MODE JOUR/NUIT */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? <Moon size={20} style={{ color: 'var(--soft-coral)' }} /> : <Sun size={20} style={{ color: 'var(--sage-green)' }} />}
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{isDark ? 'Mode nuit' : 'Mode jour'}</span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isDark ? 'Cocon nocturne activé' : 'Lumière douce activée'}</p>
                </div>
              </div>
            <button 
  onClick={toggleTheme}
  className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none`}
  style={{ backgroundColor: isDark ? 'var(--soft-coral)' : 'var(--border-input)' }}
>
  <div 
    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-2.5' : 'translate-x-0'}`}
  ></div>
</button>
            </div>
            
            {/* NOTIFICATIONS */}
            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-3">
                <Bell size={20} style={{ color: 'var(--sage-green)' }} />
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
              </div>
            <button 
              onClick={handleNotificationToggle}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none`}
              style={{ backgroundColor: notificationsEnabled ? 'var(--sage-green)' : 'var(--border-input)' }}
            >
              <div 
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-2.5' : 'translate-x-0'}`}
              ></div>
            </button>
            </div>

            {/* PERSONNES AIDÉES */}
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
              <button 
                onClick={() => setShowAssistedPeople(!showAssistedPeople)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Heart size={20} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--soft-coral)' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Personnes aidées</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(240, 128, 128, 0.15)', color: 'var(--soft-coral)' }}>{assistedPeopleList.length}</span>
                  {showAssistedPeople ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }}/> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }}/>}
                </div>
              </button>
            </div>

            {/* RELANCER LE TOUR ONBOARDING */}
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
              <RestartOnboardingButton />
            </div>

            {/* GESTION COOKIES RGPD */}
            <button 
              onClick={openPreferences}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all w-full text-left font-semibold"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(240, 128, 128, 0.08)'; e.currentTarget.style.color = 'var(--soft-coral)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <Cookie size={20} />
              <span>Gérer mes cookies</span>
            </button>

            {/* EXPORT DONNÉES RGPD */}
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all w-full text-left font-semibold"
              style={{ color: 'var(--text-primary)', opacity: isExporting ? 0.6 : 1 }}
              onMouseEnter={(e) => { if (!isExporting) { e.currentTarget.style.backgroundColor = 'rgba(240, 128, 128, 0.08)'; e.currentTarget.style.color = 'var(--soft-coral)'; }}}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <Download size={20} />
              <span>{isExporting ? 'Export en cours...' : 'Exporter mes données'}</span>
            </button>

            {/* SUPPRESSION COMPTE RGPD */}
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all w-full text-left font-semibold"
              style={{ color: '#dc2626' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <AlertTriangle size={20} />
              <span>Supprimer mon compte</span>
            </button>

            {/* DÉCONNEXION */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all w-full text-left pt-4 mt-2 font-semibold"
              style={{ borderTop: '1px solid var(--border-light)', color: 'var(--soft-coral)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(240, 128, 128, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut size={20} />
              <span className="text-lg">Se déconnecter</span>
            </button>

          </div>
        </div>

      </div>

      {/* MODAL SUPPRESSION COMPTE */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-md w-full shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
                <AlertTriangle size={24} style={{ color: '#dc2626' }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Supprimer mon compte
              </h3>
            </div>
            
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées :
            </p>
            
            <ul className="mb-4 text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• Votre profil et informations personnelles</li>
              <li>• Vos messages et conversations</li>
              <li>• Vos souvenirs et photos</li>
              <li>• Vos tâches et calendrier</li>
            </ul>
            
            <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Pour confirmer, tapez <strong style={{ color: '#dc2626' }}>SUPPRIMER</strong> ci-dessous :
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Tapez SUPPRIMER"
              className="w-full p-3 rounded-xl mb-4 border-2"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                color: 'var(--text-primary)',
                borderColor: deleteConfirmText === 'SUPPRIMER' ? '#dc2626' : 'var(--border-light)'
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="flex-1 py-3 rounded-xl font-semibold transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-primary)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-light)'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                className="flex-1 py-3 rounded-xl font-semibold transition-colors"
                style={{ 
                  backgroundColor: deleteConfirmText === 'SUPPRIMER' ? '#dc2626' : '#9ca3af',
                  color: 'white',
                  opacity: isDeleting ? 0.6 : 1,
                  cursor: deleteConfirmText === 'SUPPRIMER' && !isDeleting ? 'pointer' : 'not-allowed'
                }}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}