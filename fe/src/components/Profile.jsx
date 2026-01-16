import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Mail, Phone, MapPin, Loader2, Save, X, Edit2, Trash2, Plus, Star, Award, Camera, ChevronDown, ChevronUp, Bell, Heart, LogOut } from 'lucide-react';
import { apiGet, apiPut } from '../api/client';

// ID de "Marc Voisin"
const USER_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33";

export default function Profile() {
  const { circleId } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  // ÉTATS UI
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  
  // ÉTATS DONNÉES
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '', address: '', joinDate: '', yearsActive: 0, photoUrl: null });
  const [availability, setAvailability] = useState([]);
  const [stats, setStats] = useState({ interventions: 0, moments: 0, rating: 0 });
  const [skills, setSkills] = useState([]);
  
  // FORMULAIRES
  const [profileForm, setProfileForm] = useState({});
  const [availForm, setAvailForm] = useState([]);
  const [skillsForm, setSkillsForm] = useState([]);

  // CONSTANTES & AUTRES ÉTATS
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAssistedPeople, setShowAssistedPeople] = useState(false);
  const [assistedPeopleList] = useState(['Grand-Père Michel']); 
  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const availableSkillsList = ['Courses', 'Cuisine', 'Accompagnement médical', 'Promenade', 'Lecture', 'Jardinage', 'Bricolage'];

  // --- CHARGEMENT ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      // Appel au nouveau module
      const data = await apiGet('/module/profile', options);
      
      if (data.success) {
        const user = data.user;
        const createdDate = new Date(user.created_at);
        const now = new Date();
        const yearsActive = now.getFullYear() - createdDate.getFullYear();

        setUserInfo({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          joinDate: createdDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          yearsActive: yearsActive > 0 ? yearsActive : 1,
          photoUrl: null
        });

        setSkills(Array.isArray(user.skills) ? user.skills : []);
        setAvailability(data.availability || []);
        setStats({ interventions: 24, moments: 18, rating: 4.8 });
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SAUVEGARDES ---
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

  // Remplacer par le vrai cercle sélectionné côté UI !
  const saveAvailability = async () => {
    try {
      const options = { headers: { 'x-user-id': USER_ID } };
      if (!circleId) { alert('Aucun cercle sélectionné'); return; }
      // Conversion pour l'API backend : day -> day_of_week, ajout du circle_id
      const dataToSend = availForm.map(item => ({ day_of_week: item.day, slots: item.slots }));
      const data = await apiPut('/module/profile/availability', { circle_id: circleId, availability: dataToSend }, options);
      if (data.success) { setAvailability(dataToSend); setIsEditingAvailability(false); }
    } catch (err) { console.error(err); }
  };

  // --- HANDLERS UI ---
  const handlePhotoClick = () => fileInputRef.current.click();
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUserInfo({ ...userInfo, photoUrl: URL.createObjectURL(file) });
  };

  const startEditProfile = () => { setProfileForm({ ...userInfo }); setIsEditingProfile(true); };
  
  const startEditSkills = () => { setSkillsForm([...skills]); setIsEditingSkills(true); };
  const toggleSkill = (skill) => {
    if (skillsForm.includes(skill)) setSkillsForm(skillsForm.filter(s => s !== skill));
    else setSkillsForm([...skillsForm, skill]);
  };

  const startEditAvail = () => { 
    const initialForm = availability.length > 0 ? availability.map(a => ({...a})) : [{ day: 'Lundi', slots: '08:00 - 18:00' }];
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

  if (isLoading) return <div className="p-10 flex justify-center h-screen items-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-500 to-orange-400 pb-32 shadow-md">
        <div className="max-w-4xl mx-auto p-8 pt-12">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white/40 shadow-xl overflow-hidden">
                {userInfo.photoUrl ? <img src={userInfo.photoUrl} className="w-full h-full object-cover" /> : userInfo.name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full text-gray-600 hover:text-blue-600 shadow-lg transition-transform transform group-hover:scale-110"><Camera size={16} /></div>
            </div>
            <div className="text-white drop-shadow-md">
              <h1 className="text-3xl font-bold tracking-tight">{userInfo.name}</h1>
              <p className="opacity-95 flex items-center gap-2 font-medium mt-1"><Award size={18} className="text-orange-200" /> Aidant depuis {userInfo.yearsActive} ans</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-4xl mx-auto px-8 -mt-24 space-y-6">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-100"><span className="text-3xl font-bold text-gray-800">{stats.interventions}</span><span className="text-gray-500 text-sm font-bold uppercase mt-1">Interventions</span></div>
           <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-100"><span className="text-3xl font-bold text-gray-800">{stats.moments}</span><span className="text-gray-500 text-sm font-bold uppercase mt-1">Moments</span></div>
           <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-100"><div className="flex items-center gap-1 text-3xl font-bold text-gray-800">{stats.rating} <Star className="text-yellow-400 fill-yellow-400 w-6 h-6"/></div><span className="text-gray-500 text-sm font-bold uppercase mt-1">Appréciation</span></div>
        </div>

        {/* COMPÉTENCES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Award className="text-blue-600" size={20} /> Compétences</h2>
            {isEditingSkills && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingSkills(false)} className="px-3 py-2 text-sm border rounded flex gap-1 items-center"><X size={14}/> Annuler</button>
                <button onClick={saveSkills} className="px-3 py-2 text-sm bg-blue-600 text-white rounded flex gap-1 items-center"><Save size={14}/> Enregistrer</button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {(isEditingSkills ? availableSkillsList : skills).map(skill => {
              const isSelected = isEditingSkills ? skillsForm.includes(skill) : true;
              if (!isEditingSkills && !skills.includes(skill)) return null;
              return (
                <button key={skill} onClick={() => isEditingSkills && toggleSkill(skill)} disabled={!isEditingSkills} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${isSelected ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-400 border-gray-200'} ${isEditingSkills ? 'cursor-pointer hover:scale-105' : ''}`}>
                  {skill}
                </button>
              );
            })}
          </div>
          {!isEditingSkills && <button onClick={startEditSkills} className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-600"><Edit2 size={16} /> Modifier</button>}
        </div>

        {/* DISPONIBILITÉS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Loader2 className="text-blue-600" size={20} /> Disponibilités</h2>
              {isEditingAvailability ? (
                 <div className="flex gap-2">
                    <button onClick={() => setIsEditingAvailability(false)} className="px-3 py-2 text-sm border rounded flex gap-1 items-center"><X size={14}/> Annuler</button>
                    <button onClick={saveAvailability} className="px-3 py-2 text-sm bg-blue-600 text-white rounded flex gap-1 items-center"><Save size={14}/> Enregistrer</button>
                 </div>
              ) : (
                 <button onClick={startEditAvail} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2"><Edit2 size={16} /> Modifier</button>
              )}
           </div>
           <div className="space-y-3">
              {isEditingAvailability ? (
                  <div className="space-y-3">
                      {availForm.map((item, index) => {
                          let [start, end] = item.slots && item.slots.includes(' - ') ? item.slots.split(' - ') : ['08:00', '18:00'];
                          return (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <select value={item.day} onChange={(e) => updateAvailRow(index, 'day', e.target.value)} className="border p-2 rounded bg-white w-32 text-sm outline-none">{weekDays.map(d => <option key={d} value={d}>{d}</option>)}</select>
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-gray-500 text-sm">De</span>
                                    <select value={start} onChange={(e) => updateTimeSlot(index, 'start', e.target.value)} className="border p-2 rounded bg-white flex-1 text-sm outline-none">{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                    <span className="text-gray-500 text-sm">à</span>
                                    <select value={end} onChange={(e) => updateTimeSlot(index, 'end', e.target.value)} className="border p-2 rounded bg-white flex-1 text-sm outline-none">{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                </div>
                                <button onClick={() => removeAvailRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                            </div>
                          );
                      })}
                      <button onClick={addAvailRow} className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-2"><Plus size={16}/> Ajouter un créneau</button>
                  </div>
              ) : (
                  availability.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {availability.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"><span className="font-medium text-gray-900 w-32">{item.day}</span><span className="text-gray-600 bg-white px-3 py-1 rounded border border-gray-200 text-sm">{item.slots}</span></div>
                        ))}
                      </div>
                  ) : (<div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300"><p className="text-gray-500 italic text-sm">Aucune disponibilité.</p></div>)
              )}
           </div>
        </div>

        {/* INFOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Mail className="text-blue-600" size={20} /> Infos personnelles</h2>
              {isEditingProfile ? (
                  <div className="flex gap-2">
                      <button onClick={() => setIsEditingProfile(false)} className="px-3 py-2 border rounded flex gap-1 items-center text-sm"><X size={14}/> Annuler</button>
                      <button onClick={saveProfile} className="px-3 py-2 bg-blue-600 text-white rounded flex gap-1 items-center text-sm"><Save size={14}/> Enregistrer</button>
                  </div>
              ) : (
                  <button onClick={startEditProfile} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2"><Edit2 size={16} /> Modifier</button>
              )}
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {isEditingProfile ? (
                 <>
                    <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Nom</label><input value={profileForm.name || ''} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} className="mt-1 w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"/></div>
                    <div><label className="text-xs font-semibold text-gray-500 uppercase">Tel</label><input value={profileForm.phone || ''} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} className="mt-1 w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"/></div>
                    <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label><input value={profileForm.address || ''} onChange={(e) => setProfileForm({...profileForm, address: e.target.value})} className="mt-1 w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"/></div>
                 </>
               ) : (
                 <>
                    <div><label className="text-xs font-semibold text-gray-500 uppercase">Email</label><div className="flex items-center gap-3 mt-1 p-2 bg-gray-50 rounded border border-gray-100"><Mail className="w-4 h-4 text-gray-400"/><span className="text-gray-700">{userInfo.email}</span></div></div>
                    <div><label className="text-xs font-semibold text-gray-500 uppercase">Tel</label><div className="flex items-center gap-3 mt-1 p-2 bg-gray-50 rounded border border-gray-100"><Phone className="w-4 h-4 text-gray-400"/><span className="text-gray-700">{userInfo.phone || '-'}</span></div></div>
                    <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label><div className="flex items-center gap-3 mt-1 p-2 bg-gray-50 rounded border border-gray-100"><MapPin className="w-4 h-4 text-gray-400"/><span className="text-gray-700">{userInfo.address || '-'}</span></div></div>
                 </>
               )}
           </div>
        </div>

        {/* PARAMETRES (Garde le reste de ton code ici pour les notifications, etc.) */}
      </div>
    </div>
  );
}