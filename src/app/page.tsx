"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Flag, TrendingUp, Info } from "lucide-react";
import { getNextRace, formatCountdown } from "@/lib/f1-data";
import { storageService, Prediction } from "@/lib/storage";

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
  const [userPredictions, setUserPredictions] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const race = getNextRace();
    setNextRace(race);
    setCountdown(formatCountdown(race.startDate));
    
    const loadPredictions = async () => {
      const saved = await storageService.getPredictions();
      setUserPredictions(saved);
      setIsLoading(false);
    };
    loadPredictions();
    
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

      {/* Last Results Summary / User Predictions */}
      <section className="card-minimal p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-black">
          <Flag className="w-5 h-5 text-gray-700" />
          {userPredictions ? `Vos Pronostics - ${nextRace?.name}` : "Derniers Résultats"}
        </h2>
        
        {userPredictions ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Qualifications (Top 3)</h3>
              <div className="space-y-2">
                {userPredictions.qualiPositions.slice(0, 3).map((driver, i) => (
                  <div key={`dash-quali-${i}`} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                    <span className="font-mono text-gray-400 text-xs">P{i+1}</span>
                    <span className="text-sm font-medium">{driver || "Non sélectionné"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Course (Top 3)</h3>
              <div className="space-y-2">
                {userPredictions.racePositions.slice(0, 3).map((driver, i) => (
                  <div key={`dash-race-${i}`} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                    <span className="font-mono text-gray-400 text-xs">P{i+1}</span>
                    <span className="text-sm font-medium">{driver || "Non sélectionné"}</span>
                  </div>
                ))}
              </div>
            </div>
            {userPredictions.specialBet && (
              <div className="md:col-span-2 mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Pari Spécial
                </div>
                <p className="text-sm italic text-gray-700">"{userPredictions.specialBet}"</p>
              </div>
            )}
          </div>
        ) : (
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
            <div className="p-4 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center">
              <div className="text-xs text-gray-400 italic">Aucun pronostic enregistré</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
