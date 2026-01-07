import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login:', formData);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-6 border-blue-600">
        <CardHeader className="space-y-2 pb-6">
          <Link to="/" className="flex items-center text-lg text-gray-600 hover:text-blue-700 mb-4 w-fit -ml-2 p-2 rounded hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour
          </Link>
          <CardTitle className="text-3xl font-bold text-blue-900">Se connecter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold">Email</Label>
              <Input id="email" name="email" type="email" required className="h-14 text-lg bg-white" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><Label htmlFor="password" className="text-lg font-semibold">Mot de passe</Label><a href="#" className="text-blue-700 hover:underline">Oublié ?</a></div>
              <Input id="password" name="password" type="password" required className="h-14 text-lg bg-white" value={formData.password} onChange={handleChange} />
            </div>
            <Button type="submit" size="lg" className="w-full h-16 text-xl font-bold bg-blue-700 hover:bg-blue-800 mt-4 shadow-md text-white">Me connecter</Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50/50 rounded-b-xl">
          <p className="text-lg">Pas de compte ? <Link to="/register" className="font-bold text-blue-700 hover:underline">S'inscrire</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}