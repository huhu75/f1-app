"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Flag, TrendingUp, Info, BarChart3, Target, Zap, ChevronRight, ChevronLeft } from "lucide-react";
import { getNextRace, formatCountdown, calendar2026 } from "@/lib/f1-data";
import { storageService, Prediction, DashboardInsights, RaceResult } from "@/lib/storage";
import ResultsEntry from "@/components/ResultsEntry";

export default function Dashboard() {
  const [standings, setStandings] = useState<{ name: string; points: number }[]>([]);
  const [nextRace, setNextRace] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [userPredictions, setUserPredictions] = useState<Prediction | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // GP Viewer State
  const [viewerRound, setViewerRound] = useState(1);
  const [viewerPredictions, setViewerPredictions] = useState<Record<string, Prediction>>({});
  const [viewerResult, setViewerResult] = useState<RaceResult | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    const [leaderboard, stats, allPreds, allResults] = await Promise.all([
      storageService.getLeaderboard(),
      storageService.getInsights(),
      storageService.getAllPredictions(),
      storageService.getRaceResults()
    ]);

    setStandings(leaderboard);
    setInsights(stats);
    
    // Default viewer to last finished round or current round
    const roundsWithResults = Object.keys(allResults).map(Number);
    const lastRound = roundsWithResults.length > 0 ? Math.max(...roundsWithResults) : 1;
    setViewerRound(lastRound);
    setViewerPredictions(allPreds[lastRound] || {});
    setViewerResult(allResults[lastRound] || null);

    // Get current user (Hugo) predictions for NEXT race
    const nextR = getNextRace();
    setNextRace(nextR);
    setCountdown(formatCountdown(nextR.startDate));
    setUserPredictions(allPreds[nextR.round]?.["Hugo"] || null);
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      const race = getNextRace();
      setCountdown(formatCountdown(race.startDate));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update viewer data when round changes
  useEffect(() => {
    const updateViewer = async () => {
      const allPreds = await storageService.getAllPredictions();
      const allResults = await storageService.getRaceResults();
      setViewerPredictions(allPreds[viewerRound] || {});
      setViewerResult(allResults[viewerRound] || null);
    };
    updateViewer();
  }, [viewerRound]);

  return (
    <div className="space-y-10 text-black bg-white pb-20">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase text-black italic">Dashboard</h1>
          <p className="text-gray-500 font-medium">Saison F1 2026 • Championnat entre Amis</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-gray-100 rounded-full text-xs font-bold uppercase tracking-widest text-gray-600 border border-gray-200">
            {calendar2026.length} Grands Prix
          </div>
          <div className="px-4 py-2 bg-black rounded-full text-xs font-bold uppercase tracking-widest text-white">
            4 Joueurs
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Standings Card */}
        <div className="card-minimal p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3 text-black italic uppercase">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Classement Général
            </h2>
          </div>
          <div className="space-y-3 flex-1">
            {standings.map((player, index) => (
              <div key={player.name} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${index === 0 ? 'bg-black text-white border-black scale-[1.02] shadow-lg' : 'bg-gray-50 border-gray-100 text-black'}`}>
                <div className="flex items-center gap-5">
                  <span className={`text-2xl font-black italic w-6 ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>{index + 1}</span>
                  <span className="font-bold text-lg tracking-tight">{player.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-black text-2xl tabular-nums">{player.points}</span>
                    <span className={`text-[10px] font-bold uppercase ml-1 ${index === 0 ? 'text-gray-400' : 'text-gray-500'}`}>pts</span>
                  </div>
                  {index === 0 && <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Race Card */}
        <div className="card-minimal p-6 border-l-8 border-black flex flex-col justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3 mb-8 text-black italic uppercase">
              <Calendar className="w-6 h-6 text-gray-400" />
              Next Round
            </h2>
            
            {nextRace ? (
              <div className="space-y-6">
                <div>
                  <div className="inline-block px-2 py-1 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] mb-3">Round {nextRace.round}</div>
                  <div className="text-3xl font-black text-black leading-none italic uppercase tracking-tighter mb-2">{nextRace.name}</div>
                  <div className="text-gray-500 font-bold flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    {nextRace.dateString}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Countdown to Q1</div>
                  <div className="text-2xl font-mono font-black text-black tracking-tighter">
                    {countdown}
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse flex space-y-4 flex-col">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            {userPredictions ? (
              <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-green-600 animate-ping" />
                Pronostics validés
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Pas encore de prono
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-3 text-black italic uppercase">
          <BarChart3 className="w-7 h-7 text-black" />
          Analyses & Insights
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card-minimal p-5 bg-black text-white">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Target className="w-3 h-3" /> Exactitude Moyenne
            </div>
            <div className="text-4xl font-black italic mb-1">{(insights?.averageCorrectPerGP || 0).toFixed(1)}</div>
            <div className="text-[10px] font-bold text-gray-400">PRONOS CORRECTS PAR GP</div>
          </div>

          <div className="card-minimal p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-500" /> Quali vs Course
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-black italic">{(insights?.qualiAccuracy || 0).toFixed(0)}%</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase">QUALI</div>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div className="flex-1 text-right">
                <div className="text-2xl font-black italic">{(insights?.raceAccuracy || 0).toFixed(0)}%</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase">COURSE</div>
              </div>
            </div>
          </div>

          <div className="card-minimal p-5 lg:col-span-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Trophy className="w-3 h-3 text-black" /> Pilotes les mieux pronostiqués
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {insights?.bestPredictedDrivers.length ? insights.bestPredictedDrivers.map((d, i) => (
                <div key={d.name} className="flex-shrink-0 text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-black mb-2 ${i === 0 ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-500'}`}>
                    {d.count}
                  </div>
                  <div className="text-[10px] font-bold text-black uppercase w-16 truncate">{d.name.split(' ').pop()}</div>
                </div>
              )) : <div className="text-gray-400 text-xs italic py-2">Pas encore de données</div>}
            </div>
          </div>
        </div>
      </section>

      {/* GP History Viewer */}
      <section className="card-minimal overflow-hidden border-2 border-gray-100">
        <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewerRound(r => Math.max(1, r - 1))}
              className="p-2 hover:bg-white rounded-full border border-gray-200 transition-all shadow-sm active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[200px]">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visualisation GP</div>
              <div className="text-lg font-black uppercase italic tracking-tight">
                {calendar2026.find(r => r.round === viewerRound)?.name}
              </div>
            </div>
            <button 
              onClick={() => setViewerRound(r => Math.min(24, r + 1))}
              className="p-2 hover:bg-white rounded-full border border-gray-200 transition-all shadow-sm active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {!viewerResult && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full">En attente de résultats</span>
            )}
          </div>
        </div>

        <div className="p-6">
          {Object.keys(viewerPredictions).length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
              <Info className="w-10 h-10 text-gray-400" />
              <p className="font-bold text-gray-500 uppercase tracking-widest">Aucun pronostic pour ce week-end</p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-2 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Qualifications
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="pb-2 w-10">Pos</th>
                        <th className="pb-2 min-w-[100px]">Résultat</th>
                        {Object.keys(viewerPredictions).map(p => (
                          <th key={p} className="pb-2 text-center px-2">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const result = viewerResult?.qualiPositions[i];
                        return (
                          <tr key={`quali-row-${i}`} className="group">
                            <td className="py-2 font-mono text-xs text-gray-400">P{i+1}</td>
                            <td className="py-2 font-bold text-sm text-black group-hover:text-black transition-colors">
                              {result || "—"}
                            </td>
                            {Object.entries(viewerPredictions).map(([name, pred]) => {
                              const p = pred.qualiPositions[i];
                              const isCorrect = result && p === result;
                              return (
                                <td key={`quali-${name}-${i}`} className="py-2 text-center">
                                  <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>
                                    {p ? p.split(' ').pop() : "—"}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-2 flex items-center gap-2">
                  <Flag className="w-3 h-3" /> Course
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="pb-2 w-10">Pos</th>
                        <th className="pb-2 min-w-[100px]">Résultat</th>
                        {Object.keys(viewerPredictions).map(p => (
                          <th key={p} className="pb-2 text-center px-2">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const result = viewerResult?.racePositions[i];
                        return (
                          <tr key={`race-row-${i}`} className="group">
                            <td className="py-2 font-mono text-xs text-gray-400">P{i+1}</td>
                            <td className="py-2 font-bold text-sm text-black">
                              {result || "—"}
                            </td>
                            {Object.entries(viewerPredictions).map(([name, pred]) => {
                              const p = pred.racePositions[i];
                              const isCorrect = result && p === result;
                              return (
                                <td key={`race-${name}-${i}`} className="py-2 text-center">
                                  <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>
                                    {p ? p.split(' ').pop() : "—"}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bets summary row */}
        {Object.keys(viewerPredictions).length > 0 && (
          <div className="bg-gray-50 p-6 border-t border-gray-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 italic">Paris Spéciaux & Bonus</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(viewerPredictions).map(([name, pred]) => (
                <div key={`bet-${name}`} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">{name}</div>
                  <div className="text-[11px] italic mb-2 leading-tight">"{pred.specialBet || "Aucun"}"</div>
                  {pred.betWon !== undefined && (
                    <div className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${pred.betWon ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pred.betWon ? '✓ +2 pts' : '✗ 0 pt'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Admin Panel */}
      <ResultsEntry onSaved={loadAllData} />
    </div>
  );
}
