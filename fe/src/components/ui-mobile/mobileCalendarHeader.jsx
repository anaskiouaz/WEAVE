import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MobileCalendarHeader({ currentWeekStart, selectedDate, onDateSelect }) {
    // Générer les 7 jours de la semaine à partir de la date de début
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date;
    });

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    // Formater la plage de dates (ex: "2 - 8 Décembre 2025")
    const startDay = weekDays[0].getDate();
    const endDay = weekDays[6].getDate();
    const month = monthNames[weekDays[0].getMonth()];
    const year = weekDays[0].getFullYear();

    return (
        <div className="bg-blue-500 rounded-b-[30px] shadow-lg text-white pb-6 pt-4 px-4 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Calendrier Partagé</h1>
            </div>

            {/* Navigation Semaine */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex justify-between items-center mb-6">
                <button className="p-1 hover:bg-white/10 rounded-full">
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <span className="font-medium">
                    {startDay} - {endDay} {month} {year}
                </span>
                <button className="p-1 hover:bg-white/10 rounded-full">
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Barre des jours (Bulles) */}
            <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {weekDays.map((date, index) => {
                    // On compare juste la date (jour/mois/année) pour l'état actif
                    const isSelected = selectedDate.getDate() === date.getDate() &&
                        selectedDate.getMonth() === date.getMonth();

                    return (
                        <button
                            key={index}
                            onClick={() => onDateSelect(date)}
                            className={`flex flex-col items-center justify-center min-w-[45px] h-[65px] rounded-2xl transition-all ${isSelected
                                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                                : 'bg-transparent text-blue-100 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-xs opacity-80 mb-1">{dayNames[date.getDay()]}</span>
                            <span className={`text-lg font-bold ${isSelected ? 'text-blue-600' : 'text-white'}`}>
                                {date.getDate()}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}