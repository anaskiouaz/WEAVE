import { Mail, Phone, MapPin, Calendar, Award, Clock } from 'lucide-react';

export default function Profile() {
  const userInfo = {
    name: 'Vous (Aidant principal)',
    email: 'vous@email.com',
    phone: '06 12 34 56 78',
    address: '123 Rue de la Paix, 75001 Paris',
    joinDate: 'Janvier 2025',
  };

  const skills = [
    'Aide aux courses',
    'Accompagnement médical',
    'Activités de loisirs',
    'Soutien moral',
  ];

  const availability = [
    { day: 'Lundi', slots: 'Matin, Après-midi' },
    { day: 'Mercredi', slots: 'Après-midi' },
    { day: 'Samedi', slots: 'Journée complète' },
  ];

  const stats = [
    { label: 'Interventions', value: '24', icon: Calendar },
    { label: 'Heures d\'aide', value: '48h', icon: Clock },
    { label: 'Compétences', value: '4', icon: Award },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Profil aidant</h1>
          <p className="text-gray-600">
            Vos informations et disponibilités
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600">V</span>
            </div>
            <div className="flex-1">
              <h2 className="text-gray-900 mb-4">{userInfo.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{userInfo.phone}</span>
                </div>
                <div className="flex items-center gap-3 col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{userInfo.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Membre depuis {userInfo.joinDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-gray-900 mb-4">Compétences</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-gray-900 mb-4">Disponibilités</h2>
          <div className="space-y-3">
            {availability.map((item) => (
              <div key={item.day} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{item.day}</span>
                <span className="text-gray-600">{item.slots}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Modifier mes disponibilités
          </button>
        </div>

        {/* Edit Button */}
        <div className="mt-6">
          <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Modifier le profil
          </button>
        </div>
      </div>
    </div>
  );
}
