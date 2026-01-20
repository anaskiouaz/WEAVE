import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, login, loading } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ajout du champ confirmPassword dans l'état
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birth_date: '',
    // onboarding_role removed: role is assigned via circles/user_roles
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Formatage automatique du numéro de téléphone
    if (name === 'phone') {
      // Retirer tous les caractères non-numériques
      const onlyNums = value.replace(/\D/g, '');
      
      // Limiter à 10 chiffres
      const limited = onlyNums.slice(0, 10);
      
      // Formater : XX XX XX XX XX
      let formatted = '';
      for (let i = 0; i < limited.length; i++) {
        if (i > 0 && i % 2 === 0) formatted += ' ';
        formatted += limited[i];
      }
      
      setFormData({ ...formData, phone: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  // handleSelectChange removed (no role selection at registration)

  // Fonction de validation du mot de passe
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    // Regex pour caractères spéciaux (ajustable selon vos besoins)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);

    if (password.length < minLength) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (!hasUpperCase) return "Le mot de passe doit contenir au moins une majuscule.";
    if (!hasNumber) return "Le mot de passe doit contenir au moins un chiffre.";
    if (!hasSpecialChar) return "Le mot de passe doit contenir au moins un caractère spécial.";
    return null;
  };


  // Validation du numéro de téléphone (exemple France : 10 chiffres)
  const validatePhone = (phone) => {
    if (!phone) return "Le numéro de téléphone est obligatoire.";
    // Retirer les espaces pour la validation
    const onlyDigits = phone.replace(/\s/g, '');
    if (!/^\d+$/.test(onlyDigits)) return "Le numéro de téléphone doit contenir uniquement des chiffres.";
    if (onlyDigits.length !== 10) return "Le numéro de téléphone doit contenir exactement 10 chiffres.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Vérification : Les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    // 2. Vérification : Complexité du mot de passe
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 3. Vérification : Numéro de téléphone
    const phoneError = validatePhone(formData.phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    // Préparation des données (on retire confirmPassword avant l'envoi)
    const { confirmPassword, ...payload } = formData;

    // 3. Inscription
    const resRegister = await register(payload);

    if (resRegister.success) {
      // Réinitialiser le flag du tour pour les nouveaux utilisateurs
      localStorage.removeItem('weave_onboarding_seen');
      
      // 4. Connexion automatique après inscription
      const resLogin = await login(formData.email, formData.password);
      if (resLogin.success) {
        navigate('/select-circle');
      } else {
        navigate('/login'); // Fallback si le login auto échoue
      }
    } else {
      setError(resRegister.error || "Une erreur est survenue.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-lg shadow-xl border-t-6 border-blue-600">
        <CardHeader className="space-y-2 pb-6">
          <Link to="/" className="flex items-center text-lg text-gray-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour
          </Link>
          <CardTitle className="text-3xl font-bold text-blue-900">Créer mon compte</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="p-3 text-red-700 bg-red-100 rounded-md text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg font-semibold text-gray-800">Nom complet *</Label>
              <Input id="name" name="name" required className="h-14 text-lg bg-white" value={formData.name} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold text-gray-800">Email *</Label>
              <Input id="email" name="email" type="email" required className="h-14 text-lg bg-white" value={formData.email} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg font-semibold text-gray-800">Téléphone *</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel"
                  placeholder="06 12 34 56 78"
                  required
                  className="h-14 text-lg bg-white" 
                  value={formData.phone} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-lg font-semibold text-gray-800">Date de naissance *</Label>
                <Input 
                  id="birth_date" 
                  name="birth_date" 
                  type="date" 
                  required
                  className="h-14 text-lg bg-white block w-full" 
                  value={formData.birth_date} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            {/* Role selection removed at registration — roles are managed via circles and admin assignment */}

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-semibold text-gray-800">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="h-14 text-lg bg-white pr-12"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-gray-500">8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial min.</p>
            </div>

            {/* Confirmation du mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-lg font-semibold text-gray-800">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`h-14 text-lg bg-white pr-12 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full h-16 text-xl font-bold bg-blue-700 hover:bg-blue-800 mt-6 shadow-md text-white">
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirmer l'inscription"}
            </Button>

          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50/50 rounded-b-xl">
          <p className="text-lg">Déjà inscrit ? <Link to="/login" className="font-bold text-blue-700 hover:underline">Se connecter</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}