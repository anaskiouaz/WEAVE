import { Calendar, Heart, MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const upcomingTasks = [
    { id: 1, title: 'Visite médicale', time: '14:00', helper: 'Marie Dupont', type: 'medical' },
    { id: 2, title: 'Courses alimentaires', time: '16:30', helper: 'À pourvoir', type: 'shopping' },
    { id: 3, title: 'Promenade au parc', time: 'Demain 10:00', helper: 'Jean Martin', type: 'activity' },
  ];

  const stats = [
    { label: 'Aidants actifs', value: '8', icon: Users, color: 'blue' },
    { label: 'Tâches cette semaine', value: '12', icon: Calendar, color: 'green' },
    { label: 'Souvenirs partagés', value: '45', icon: Heart, color: 'pink' },
    { label: 'Messages non lus', value: '3', icon: MessageSquare, color: 'purple' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">
            Bienvenue sur votre espace d'entraide
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClass = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              pink: 'bg-pink-50 text-pink-600',
              purple: 'bg-purple-50 text-purple-600',
            }[stat.color];

            return (
              <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* État de la personne aidée */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-gray-900 mb-4">État de santé</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-gray-900">Moral</p>
                <p className="text-gray-600">Bon</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-gray-900">Santé générale</p>
                <p className="text-gray-600">Stable</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-gray-900">Dernier contact</p>
                <p className="text-gray-600">Aujourd'hui 10:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prochaines interventions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Prochaines interventions</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {upcomingTasks.map((task) => {
              const typeColor = {
                medical: 'bg-red-50 border-red-200',
                shopping: 'bg-blue-50 border-blue-200',
                activity: 'bg-green-50 border-green-200',
              }[task.type];

              return (
                <div key={task.id} className={`border rounded-lg p-4 ${typeColor}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 mb-1">{task.title}</p>
                      <p className="text-gray-600">{task.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700">{task.helper}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
