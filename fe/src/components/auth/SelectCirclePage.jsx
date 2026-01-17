import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Users, UserPlus, ArrowRight, Loader2, ArrowLeft, Calendar, Phone, Mail, Stethoscope, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const MEDICAL_OPTIONS = [
    "Risque d'Escarres", "Phlébite / Thrombose", "Fonte musculaire",
    "Ankyloses / Raideurs", "Constipation", "Incontinence",
    "Encombrement bronchique", "Syndrome de glissement", "Ostéoporose"
];

export default function SelectCirclePage() {
    const navigate = useNavigate();
    const [view, setView] = useState('selection');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const [seniorData, setSeniorData] = useState({
        name: '', birth_date: '', phone: '', email: '', medical_select: []
    });

    const handleSeniorChange = (e) => setSeniorData({ ...seniorData, [e.target.name]: e.target.value });

    const toggleMedicalOption = (option) => {
        setSeniorData(prev => {
            const isSelected = prev.medical_select.includes(option);
            return { 
                ...prev, 
                medical_select: isSelected 
                    ? prev.medical_select.filter(item => item !== option) 
                    : [...prev.medical_select, option] 
            };
        });
    };

    const apiCall = async (endpoint, body) => {
        setLoading(true); setError('');
        const token = localStorage.getItem('weave_token');
        try {
            const res = await fetch(`${API_BASE_URL}/circles${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur inconnue");
            navigate('/dashboard');
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!seniorData.name.trim()) return setError("Le nom est requis.");
        const payload = { ...seniorData, medical_info: seniorData.medical_select.join(', ') };
        delete payload.medical_select;
        apiCall('/', { senior_info: payload });
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return setError("Code requis.");
        apiCall('/join', { invite_code: inviteCode });
    };

    return (
        <div className="min-h-screen bg-blue-50/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl border-t-6 border-blue-600">
                <CardHeader className="text-center pb-6">
                    {view !== 'selection' && (
                        <Button variant="ghost" onClick={() => setView('selection')} className="mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                        </Button>
                    )}
                    <CardTitle className="text-3xl font-bold text-blue-900">
                        {view === 'selection' ? "Rejoindre Weave" : view === 'create' ? "Créer un Cercle" : "Rejoindre un Cercle"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    {error && <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg">⚠️ {error}</div>}

                    {view === 'selection' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <button onClick={() => setView('create')} className="p-8 border-2 border-blue-100 rounded-xl bg-white hover:border-blue-500 hover:shadow-lg transition-all text-center group">
                                <UserPlus className="w-10 h-10 mx-auto text-blue-600 mb-4" />
                                <h3 className="text-xl font-bold">Je crée un cercle</h3>
                                <p className="text-gray-500">Je suis l'aidant principal.</p>
                            </button>
                            <button onClick={() => setView('join')} className="p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-white hover:shadow-lg transition-all text-center group">
                                <Users className="w-10 h-10 mx-auto text-gray-500 group-hover:text-blue-600 mb-4" />
                                <h3 className="text-xl font-bold">J'ai un code</h3>
                                <p className="text-gray-500">Je rejoins une équipe.</p>
                            </button>
                        </div>
                    )}

                    {view === 'create' && (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Label>Nom du Bénéficiaire *</Label>
                            <Input value={seniorData.name} name="name" onChange={handleSeniorChange} required />
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Date Naissance</Label><Input type="date" name="birth_date" onChange={handleSeniorChange} /></div>
                                <div><Label>Téléphone</Label><Input name="phone" onChange={handleSeniorChange} /></div>
                            </div>
                            <Label>Pathologies (Optionnel)</Label>
                            <div className="flex flex-wrap gap-2">
                                {MEDICAL_OPTIONS.map(opt => (
                                    <button key={opt} type="button" onClick={() => toggleMedicalOption(opt)} className={`px-3 py-1 rounded-full text-xs border ${seniorData.medical_select.includes(opt) ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}>{opt}</button>
                                ))}
                            </div>
                            <Button type="submit" className="w-full mt-4 bg-blue-700 text-white" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Créer"}</Button>
                        </form>
                    )}

                    {view === 'join' && (
                        <form onSubmit={handleJoin} className="space-y-4">
                            <Label>Code d'invitation</Label>
                            <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="text-center text-lg uppercase tracking-widest" placeholder="W-XXXXX" />
                            <Button type="submit" className="w-full bg-blue-700 text-white" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Rejoindre"}</Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}