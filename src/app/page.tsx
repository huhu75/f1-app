"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Flag, TrendingUp, Info, BarChart3, Target, Zap, ChevronRight, ChevronLeft, Award, Loader2, Gauge, Timer } from "lucide-react";
import { getNextRace, formatCountdown, calendar2026 } from "@/lib/f1-data";
import { storageService, Prediction, DashboardInsights, RaceResult, PLAYERS } from "@/lib/storage";
import ResultsEntry from "@/components/ResultsEntry";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

interface DetailedStanding {
  name: string;
  points: number;
  qualiPoints: number;
  racePoints: number;
  betPoints: number;
}

export default function Dashboard() {
  const [standings, setStandings] = useState<DetailedStanding[]>([]);
  const [nextRace, setNextRace] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [userPredictions, setUserPredictions] = useState<Prediction | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [seasonProgress, setSeasonProgress] = useState<{
    rounds: number[];
    players: { name: string; scores: number[]; cumulative: number[] }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewerRound, setViewerRound] = useState(1);
  const [viewerPredictions, setViewerPredictions] = useState<Record<string, Prediction>>({});
  const [viewerResult, setViewerResult] = useState<RaceResult | null>(null);

  // Player Detail Modal State
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    const [leaderboard, stats, allPreds, allResults, progress] = await Promise.all([
      storageService.getLeaderboard() as Promise<DetailedStanding[]>,
      storageService.getInsights(),
      storageService.getAllPredictions(),
      storageService.getRaceResults(),
      storageService.getSeasonProgress()
    ]);

    setStandings(leaderboard);
    setInsights(stats);
    setSeasonProgress(progress);
    
    // Set default viewer round to NEXT race (matching Pronostics)
    const nextR = getNextRace();
    setNextRace(nextR);
    setViewerRound(nextR.round);
    
    setViewerPredictions(allPreds[nextR.round] || {});
    setViewerResult(allResults[nextR.round] || null);

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

  useEffect(() => {
    const updateViewer = async () => {
      const allPreds = await storageService.getAllPredictions();
      const allResults = await storageService.getRaceResults();
      setViewerPredictions(allPreds[viewerRound] || {});
      setViewerResult(allResults[viewerRound] || null);
    };
    updateViewer();
  }, [viewerRound]);

  useEffect(() => {
    if (selectedPlayerName) {
      const fetchPlayerStats = async () => {
        const stats = await storageService.getPlayerStats(selectedPlayerName);
        setPlayerStats(stats);
      };
      fetchPlayerStats();
    } else {
      setPlayerStats(null);
    }
  }, [selectedPlayerName]);

  const getPlayerColor = (name: string) => {
    const colors: Record<string, string> = {
      "Hugo": "#334155",      // Slate
      "François": "#10b981",  // Emerald
      "Carole": "#fb7185"     // Sunset Rose
    };
    return colors[name] || "#2b62e3";
  };

  // Winners by session
  const qualiChamp = [...standings].sort((a, b) => b.qualiPoints - a.qualiPoints)[0];
  const raceChamp = [...standings].sort((a, b) => b.racePoints - a.racePoints)[0];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 text-slate-200 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialisation...</p>
    </div>
  );

  return (
    <div className="space-y-12 text-slate-900 bg-white pb-24 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header SOFT FLAT */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-12 border-b border-slate-50 pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">Résultats</h1>
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-[#2b62e3] rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2b62e3]/60">Saison F1 2026</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Saison en cours</span>
          </div>
          <div className="bg-[#2b62e3] px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
            {calendar2026.length} Grands Prix
          </div>
        </div>
      </header>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {standings.map((p, i) => (
          <button 
            key={p.name} 
            onClick={() => setSelectedPlayerName(p.name)}
            className="group text-left bg-white border border-slate-100 p-6 rounded-3xl relative shadow-sm hover:shadow-md hover:border-[#2b62e3]/30 transition-all overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 transition-transform group-hover:scale-y-125" style={{ backgroundColor: getPlayerColor(p.name) }} />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">0{i + 1}</span>
                <p className="text-base font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
              </div>
              {i === 0 && <Trophy className="w-5 h-5 text-amber-400 fill-amber-400" />}
            </div>

            <div className="flex items-end justify-between mb-8">
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Points</h3>
                <p className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">
                  {p.points || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Timer className="w-3 h-3 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Qualifs</div>
                    <div className="text-sm font-black text-slate-900 tabular-nums">{p.qualiPoints || 0} <span className="text-[8px] text-slate-300">pts</span></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Flag className="w-3 h-3 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Course</div>
                    <div className="text-sm font-black text-slate-900 tabular-nums">{p.racePoints || 0} <span className="text-[8px] text-slate-300">pts</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
               <Zap className="w-3 h-3 text-amber-500" />
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Paris gagnés :</span>
               <span className="text-[10px] font-black text-slate-700">{p.betPoints / 2 || 0}</span>
            </div>
          </button>
        ))}
      </div>

      {/* SESSION KINGS SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Timer className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">L'Expert des Qualifs</h4>
              <p className="text-xl font-black text-slate-900 uppercase">{qualiChamp?.name || "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#2b62e3] tabular-nums">{qualiChamp?.qualiPoints || 0}</span>
            <p className="text-[8px] font-black uppercase text-slate-300">points</p>
          </div>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Flag className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Le Maître de la Course</h4>
              <p className="text-xl font-black text-slate-900 uppercase">{raceChamp?.name || "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#2b62e3] tabular-nums">{raceChamp?.racePoints || 0}</span>
            <p className="text-[8px] font-black uppercase text-slate-300">points</p>
          </div>
        </div>
      </section>

      {/* TABLE SECTION */}
      <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
            <Info className="w-3.5 h-3.5" />
            Matrice des Points
          </h2>
        </div>
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="sticky left-0 z-30 p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 min-w-[120px] bg-white">Joueur</th>
                {seasonProgress?.rounds.map(r => {
                  const name = calendar2026.find(c => c.round === r)?.name;
                  return (
                    <th key={`head-${r}`} className="relative h-24 min-w-[45px] p-0 border-b border-slate-50 bg-white">
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <span className="whitespace-nowrap -rotate-45 origin-center text-[8px] font-black text-slate-300 uppercase tracking-wider">
                          {name}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="sticky right-0 z-30 px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center bg-white min-w-[70px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {seasonProgress?.players.map((p, pIdx) => (
                <tr key={`row-${p.name}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="sticky left-0 z-20 p-4 text-[11px] font-black text-slate-900 bg-white group-hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getPlayerColor(p.name) }} />
                      <span className="truncate uppercase">{p.name}</span>
                    </div>
                  </td>
                  {p.scores.map((s, sIdx) => (
                    <td key={`score-${p.name}-${sIdx}`} className="px-1 py-4 text-center text-[10px] font-black text-slate-400 tabular-nums">
                      {s || "—"}
                    </td>
                  ))}
                  <td className="sticky right-0 z-20 px-3 py-4 text-center text-xs font-black text-white bg-[#2b62e3] tabular-nums group-hover:bg-[#1d4ed8] transition-colors">
                    {p.cumulative[p.cumulative.length - 1]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SESSION COMPARISON BAR CHART */}
      <section className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
        <div className="mb-10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Analyse</h2>
          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Répartition des Points par Session</p>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={standings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 9, fontWeight: 900 }} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Bar dataKey="qualiPoints" name="Qualifs" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="racePoints" name="Course" fill="#2b62e3" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="betPoints" name="Paris" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* GP History Viewer & Admin */}
      <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 p-6 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewerRound(r => Math.max(1, r - 1))}
              className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-400 hover:text-slate-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center min-w-[140px]">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Historique</div>
              <div className="text-xs font-black text-slate-900 uppercase">{calendar2026.find(r => r.round === viewerRound)?.name}</div>
            </div>
            <button 
              onClick={() => setViewerRound(r => Math.min(22, r + 1))}
              className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-400 hover:text-slate-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!viewerResult && (
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-100">En attente</span>
          )}
        </div>
        
        <div className="p-6">
          {Object.keys(viewerPredictions).length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3 opacity-40">
              <Info className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Aucun pronostic enregistré</p>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Qualifications
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[8px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-2 w-8">Pos</th>
                        <th className="pb-2 min-w-[100px]">Officiel</th>
                        {Object.keys(viewerPredictions).map(p => (
                          <th key={p} className="pb-2 text-center px-2 font-black">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const result = viewerResult?.qualiPositions[i];
                        return (
                          <tr key={`quali-row-${i}`} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-2 font-mono text-[10px] text-slate-400">P{i+1}</td>
                            <td className="py-2 font-bold text-xs text-slate-900">
                              {result || "—"}
                            </td>
                            {Object.entries(viewerPredictions).map(([name, pred]) => {
                              const p = pred.qualiPositions[i];
                              const isCorrect = result && p === result;
                              return (
                                <td key={`quali-${name}-${i}`} className="py-2 text-center">
                                  <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${isCorrect ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-50' : 'text-slate-400 opacity-60'}`}>
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
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Flag className="w-3 h-3" /> Course
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[8px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-2 w-8">Pos</th>
                        <th className="pb-2 min-w-[100px]">Officiel</th>
                        {Object.keys(viewerPredictions).map(p => (
                          <th key={p} className="pb-2 text-center px-2 font-black">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const result = viewerResult?.racePositions[i];
                        return (
                          <tr key={`race-row-${i}`} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-2 font-mono text-[10px] text-slate-400">P{i+1}</td>
                            <td className="py-2 font-bold text-xs text-slate-900">
                              {result || "—"}
                            </td>
                            {Object.entries(viewerPredictions).map(([name, pred]) => {
                              const p = pred.racePositions[i];
                              const isCorrect = result && p === result;
                              return (
                                <td key={`race-${name}-${i}`} className="py-2 text-center">
                                  <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${isCorrect ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-50' : 'text-slate-400 opacity-60'}`}>
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
        
        {Object.keys(viewerPredictions).length > 0 && (
          <div className="bg-slate-50/30 p-6 border-t border-slate-100">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 italic">Paris Spéciaux</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(viewerPredictions).map(([name, pred]) => (
                <div key={`bet-${name}`} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px]">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getPlayerColor(name) }} />
                      {name}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 leading-snug">"{pred.specialBet || "—"}"</div>
                  </div>
                  <div className="mt-4">
                    {pred.betWon !== undefined ? (
                      <div className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${pred.betWon ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {pred.betWon ? '✓ Gagné (+2)' : '✗ Perdu (0)'}
                      </div>
                    ) : (
                      <div className="text-[8px] font-black uppercase text-slate-300 italic">En attente</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Admin Panel */}
      <ResultsEntry onSaved={loadAllData} />

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayerName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPlayerName(null)} className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden p-8 border border-slate-100">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{selectedPlayerName}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Analyse du Pilote</p>
                </div>
                <button onClick={() => setSelectedPlayerName(null)} className="p-2 text-slate-300 hover:text-slate-900">×</button>
              </div>
              
              {playerStats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div className="text-2xl font-black text-slate-900 tabular-nums">{playerStats.totalPoints}</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase">Points Totaux</div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div className="text-2xl font-black text-slate-900 tabular-nums">{playerStats.avgPointsPerGP.toFixed(1)}</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase">Moyenne / GP</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 p-6 rounded-2xl text-white">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[9px] font-black uppercase text-slate-500">Précision Qualifs</span>
                      <span className="text-lg font-black text-amber-400">{playerStats.qualiAccuracy.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${playerStats.qualiAccuracy}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[9px] font-black uppercase text-slate-400">Précision Course</span>
                      <span className="text-lg font-black text-slate-900">{playerStats.raceAccuracy.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-900 h-full transition-all duration-1000" style={{ width: `${playerStats.raceAccuracy}%` }} />
                    </div>
                  </div>
                </div>
              ) : <div className="py-20 text-center text-[10px] font-black text-slate-300 animate-pulse">Chargement...</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
