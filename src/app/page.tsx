"use client";

import { Trophy, Calendar, Flag, TrendingUp } from "lucide-react";

export default function Dashboard() {
  // Mock data for the 2026 season
  const standings = [
    { name: "Hugo", points: 125, trend: "up" },
    { name: "Ami 1", points: 118, trend: "down" },
    { name: "Ami 2", points: 102, trend: "stable" },
    { name: "Ami 3", points: 94, trend: "up" },
  ];

  const nextRace = {
    name: "Grand Prix de Melbourne",
    location: "Albert Park, Australie",
    date: "15 Mars 2026",
    countdown: "12 jours, 04:22:10"
  };

  return (
    <div className="space-y-10 text-black bg-white">
      {/* Header Section */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase text-black">Dashboard</h1>
        <p className="text-gray-500">Résumé de la saison 2026 entre amis.</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Standings Card */}
        <div className="card-minimal p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-black">
              <Trophy className="w-5 h-5 text-gray-700" />
              Classement Général
            </h2>
          </div>
          <div className="space-y-4">
            {standings.map((player, index) => (
              <div key={player.name} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-mono w-4">{index + 1}</span>
                  <span className="font-medium text-black">{player.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-bold text-lg text-black">{player.points} pts</span>
                  {player.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                  {player.trend === "down" && <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />}
                  {player.trend === "stable" && <div className="w-4 h-1 bg-gray-400 rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Race Card */}
        <div className="card-minimal p-6 border-l-4 border-black">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-black">
            <Calendar className="w-5 h-5 text-gray-700" />
            Prochaine Course
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Évènement</div>
              <div className="text-xl font-bold text-black">{nextRace.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Lieu</div>
              <div className="text-gray-700">{nextRace.location}</div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold mb-2">Compte à rebours</div>
              <div className="text-2xl font-mono text-black tracking-tighter">
                {nextRace.countdown}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Results Summary */}
      <section className="card-minimal p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-black">
          <Flag className="w-5 h-5 text-gray-700" />
          Derniers Résultats (GP de Bahreïn)
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Vainqueur</div>
            <div className="font-bold text-black">Max Verstappen</div>
            <div className="text-xs text-gray-600 mt-1">Écurie : Red Bull</div>
          </div>
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Pole Position</div>
            <div className="font-bold text-black">Charles Leclerc</div>
            <div className="text-xs text-gray-600 mt-1">Écurie : Ferrari</div>
          </div>
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Meilleur Joueur</div>
            <div className="font-bold text-black">Hugo (+25 pts)</div>
          </div>
        </div>
      </section>
    </div>
  );
}
