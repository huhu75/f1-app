"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Flag, TrendingUp, Info, BarChart3, Target, Zap, ChevronRight, ChevronLeft, Award } from "lucide-react";
import { getNextRace, formatCountdown, calendar2026 } from "@/lib/f1-data";
import { storageService, Prediction, DashboardInsights, RaceResult } from "@/lib/storage";
import ResultsEntry from "@/components/ResultsEntry";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const [standings, setStandings] = useState<{ name: string; points: number }[]>([]);
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

  const loadAllData = async () => {
    setIsLoading(true);
    const [leaderboard, stats, allPreds, allResults, progress] = await Promise.all([
      storageService.getLeaderboard(),
      storageService.getInsights(),
      storageService.getAllPredictions(),
      storageService.getRaceResults(),
      storageService.getSeasonProgress()
    ]);

    setStandings(leaderboard);
    setInsights(stats);
    setSeasonProgress(progress);
    
    const roundsWithResults = Object.keys(allResults).map(Number);
    const lastRound = roundsWithResults.length > 0 ? Math.max(...roundsWithResults) : 1;
    setViewerRound(lastRound);
    setViewerPredictions(allPreds[lastRound] || {});
    setViewerResult(allResults[lastRound] || null);

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

  useEffect(() => {
    const updateViewer = async () => {
      const allPreds = await storageService.getAllPredictions();
      const allResults = await storageService.getRaceResults();
      setViewerPredictions(allPreds[viewerRound] || {});
      setViewerResult(allResults[viewerRound] || null);
    };
    updateViewer();
  }, [viewerRound]);

  // Format chart data
  const chartData = seasonProgress?.rounds.map((round, idx) => {
    const data: any = { name: `R${round}` };
    seasonProgress.players.forEach(p => {
      data[p.name] = p.cumulative[idx];
    });
    return data;
  }) || [];

  const playerColors = ["#0f172a", "#3b82f6", "#ef4444", "#10b981"];

  return (
    <div className="space-y-12 text-slate-900 bg-slate-50/30 pb-20 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Saison F1 2026 • Championnat entre Amis</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
            {calendar2026.length} GP
          </span>
          <span className="px-3 py-1.5 bg-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-slate-200">
            4 Joueurs
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Standings Card */}
        <div className="card-minimal p-6 lg:col-span-2 flex flex-col bg-white border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-amber-500" />
              Classement Général
            </h2>
          </div>
          <div className="space-y-2.5 flex-1">
            {standings.map((player, index) => (
              <div key={player.name} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${index === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:shadow-sm'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${index === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                    {index + 1}
                  </div>
                  <span className="font-semibold">{player.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-bold text-lg tabular-nums">{player.points}</span>
                    <span className={`text-[9px] font-bold uppercase ml-1 opacity-60`}>pts</span>
                  </div>
                  {index === 0 && <Award className="w-4 h-4 text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Race Card */}
        <div className="card-minimal p-6 bg-white border-slate-200/60 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-8 text-slate-800 uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-slate-400" />
            Prochain Round
          </h2>
          
          {nextRace ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider rounded mb-3">Round {nextRace.round}</div>
                <div className="text-2xl font-bold text-slate-900 leading-tight mb-1">{nextRace.name}</div>
                <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  {nextRace.dateString}
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Départ dans</div>
                  <div className="text-xl font-mono font-bold text-slate-800 tracking-tight">
                    {countdown}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">État</span>
                  {userPredictions ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      Prêt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px] uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                      À remplir
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              <div className="h-8 bg-slate-100 rounded w-3/4"></div>
              <div className="h-24 bg-slate-100 rounded w-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Chart */}
      <section className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-6">
        <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 uppercase tracking-widest mb-8">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          Évolution des Scores Cumulés
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" />
              {seasonProgress?.players.map((p, i) => (
                <Line 
                  key={p.name} 
                  type="monotone" 
                  dataKey={p.name} 
                  stroke={playerColors[i % playerColors.length]} 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Championship Matrix Table */}
      <section className="bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 uppercase tracking-widest">
            <Info className="w-4 h-4 text-slate-400" />
            Tableau de Saison (Points par GP)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[140px]">Joueur</th>
                {seasonProgress?.rounds.map(r => (
                  <th key={`head-${r}`} className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center min-w-[50px]">R{r}</th>
                ))}
                <th className="p-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 text-center bg-slate-100/50">Total</th>
              </tr>
            </thead>
            <tbody>
              {seasonProgress?.players.map((p, pIdx) => (
                <tr key={`row-${p.name}`} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-sm font-bold text-slate-700 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: playerColors[pIdx % playerColors.length] }} />
                    {p.name}
                  </td>
                  {p.scores.map((s, sIdx) => (
                    <td key={`score-${p.name}-${sIdx}`} className="p-4 text-center text-xs font-medium text-slate-500 tabular-nums">
                      {s || "—"}
                    </td>
                  ))}
                  <td className="p-4 text-center text-sm font-bold text-slate-900 bg-slate-50/50 tabular-nums">
                    {p.cumulative[p.cumulative.length - 1]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insights Section */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 uppercase tracking-widest">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          Analyses de Performance
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card-minimal p-5 bg-white border-slate-200/60 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Target className="w-3 h-3" /> Moyenne / GP
            </div>
            <div className="text-3xl font-bold text-slate-900">{(insights?.averageCorrectPerGP || 0).toFixed(1)}</div>
            <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase">PRONOS CORRECTS</div>
          </div>

          <div className="card-minimal p-5 bg-white border-slate-200/60 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" /> Précision
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{(insights?.qualiAccuracy || 0).toFixed(0)}%</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase">Quali</div>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{(insights?.raceAccuracy || 0).toFixed(0)}%</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase">Course</div>
              </div>
            </div>
          </div>

          <div className="card-minimal p-5 lg:col-span-2 bg-white border-slate-200/60 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Trophy className="w-3 h-3 text-slate-400" /> Pilotes les mieux pronostiqués
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
              {insights?.bestPredictedDrivers.length ? insights.bestPredictedDrivers.map((d, i) => (
                <div key={d.name} className="flex-shrink-0 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold mb-2 ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                    {d.count}
                  </div>
                  <div className="text-[8px] font-bold text-slate-600 uppercase w-12 truncate text-center">{d.name.split(' ').pop()}</div>
                </div>
              )) : <div className="text-slate-400 text-[10px] italic py-2">En attente de données...</div>}
            </div>
          </div>
        </div>
      </section>

      {/* GP History Viewer */}
      <section className="bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewerRound(r => Math.max(1, r - 1))}
              className="p-1.5 hover:bg-white rounded-lg border border-slate-200 transition-all shadow-sm active:scale-95 text-slate-400 hover:text-slate-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center min-w-[180px]">
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Visualisation du Weekend</div>
              <div className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {calendar2026.find(r => r.round === viewerRound)?.name}
              </div>
            </div>
            <button 
              onClick={() => setViewerRound(r => Math.min(22, r + 1))}
              className="p-1.5 hover:bg-white rounded-lg border border-slate-200 transition-all shadow-sm active:scale-95 text-slate-400 hover:text-slate-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            {!viewerResult && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-wider rounded-md border border-amber-100">En attente de résultats</span>
            )}
          </div>
        </div>

        <div className="p-6">
          {Object.keys(viewerPredictions).length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3 opacity-40">
              <Info className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Aucun pronostic enregistré</p>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Quali Results Table */}
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
                          <th key={p} className="pb-2 text-center px-2">{p}</th>
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

              {/* Race Results Table */}
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
                          <th key={p} className="pb-2 text-center px-2">{p}</th>
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
        
        {/* Bets summary row */}
        {Object.keys(viewerPredictions).length > 0 && (
          <div className="bg-slate-50/30 p-6 border-t border-slate-100">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4 italic">Paris Spéciaux</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(viewerPredictions).map(([name, pred]) => (
                <div key={`bet-${name}`} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[90px]">
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">{name}</div>
                    <div className="text-[11px] font-medium text-slate-700 leading-snug">"{pred.specialBet || "—"}"</div>
                  </div>
                  <div className="mt-3">
                    {pred.betWon !== undefined && (
                      <div className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${pred.betWon ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {pred.betWon ? '✓ +2 pts' : '✗ 0 pt'}
                      </div>
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
    </div>
  );
}
