"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Flag, TrendingUp } from "lucide-react";
import { getNextRace, formatCountdown } from "@/lib/f1-data";

export default function Dashboard() {
  // Mock data for the 2026 season
  const standings = [
    { name: "Hugo", points: 125, trend: "up" },
    { name: "Ami 1", points: 118, trend: "down" },
    { name: "Ami 2", points: 102, trend: "stable" },
    { name: "Ami 3", points: 94, trend: "up" },
  ];

  const [nextRace, setNextRace] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const race = getNextRace();
    setNextRace(race);
    setCountdown(formatCountdown(race.startDate));
    
    const interval = setInterval(() => {
      setCountdown(formatCountdown(race.startDate));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

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
        <div className="card-minimal p-6 border-l-4 border-black flex flex-col justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-black">
            <Calendar className="w-5 h-5 text-gray-700" />
            Prochaine Course
          </h2>
          
          {nextRace ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Rnd {nextRace.round}</div>
                <div className="text-xl font-bold text-black leading-tight">{nextRace.name}</div>
                <div className="text-gray-700 mt-1">{nextRace.dateString}</div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 uppercase font-bold mb-2">Début estimé</div>
                <div className="text-xl font-mono text-black tracking-tighter">
                  {countdown}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Chargement...</div>
          )}
        </div>
      </div>

      {/* Last Results Summary */}
      <section className="card-minimal p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-black">
          <Flag className="w-5 h-5 text-gray-700" />
          Derniers Résultats
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Vainqueur</div>
            <div className="font-bold text-black">En attente</div>
            <div className="text-xs text-gray-600 mt-1">-</div>
          </div>
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Pole Position</div>
            <div className="font-bold text-black">En attente</div>
            <div className="text-xs text-gray-600 mt-1">-</div>
          </div>
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Meilleur Joueur</div>
            <div className="font-bold text-black">-</div>
          </div>
        </div>
      </section>
    </div>
  );
}
