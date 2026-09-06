"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Flag, TrendingUp, Info, BarChart3, Target, Zap, ChevronRight, ChevronLeft, Award, Loader2, Gauge, Timer } from "lucide-react";
import { getNextRaceFromList, formatCountdown } from "@/lib/f1-data";
import { useCalendar } from "@/hooks/useCalendar";
import { storageService, Prediction, DashboardInsights, RaceResult, PLAYERS, DetailedStanding, PlayerDetailedStats, isFemale } from "@/lib/storage";
import ResultsEntry from "@/components/ResultsEntry";
import CalendarManager from "@/components/CalendarManager";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// Custom Tooltip component for the points distribution chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc: number, entry: any) => acc + (entry.value || 0), 0);
    return (
      <div className="backdrop-blur-md bg-white/95 border border-slate-200/50 p-4 rounded-2xl shadow-xl min-w-[200px] transition-all duration-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 border-b border-slate-100 pb-1.5">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any) => {
            let gradColor = "";
            if (entry.dataKey === "qualiPoints") gradColor = "bg-gradient-to-r from-indigo-500 to-purple-500";
            else if (entry.dataKey === "racePoints") gradColor = "bg-gradient-to-r from-blue-500 to-cyan-500";
            else if (entry.dataKey === "betPoints") gradColor = "bg-gradient-to-r from-amber-500 to-yellow-500";
            
            return (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${gradColor}`} />
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{entry.name}</span>
                </div>
                <span className="text-xs font-black tabular-nums text-slate-800">{entry.value} pts</span>
              </div>
            );
          })}
          <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-black text-slate-800">
            <span className="text-slate-400">TOTAL</span>
            <span className="text-sm text-[#2b62e3] tabular-nums">{total} pts</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { calendar } = useCalendar();
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
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (calendar.length > 0) {
      const nextR = getNextRaceFromList(calendar);
      if (nextR) {
        setNextRace(nextR);
        setViewerRound(nextR.round);
        setCountdown(formatCountdown(nextR.qualiDate));
      }
    }
  }, [calendar]);

  useEffect(() => {
    if (!nextRace) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(nextRace.qualiDate));
    }, 60000);
    return () => clearInterval(interval);
  }, [nextRace]);

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
  const betChamp = [...standings].sort((a, b) => b.betPoints - a.betPoints)[0];

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
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Saison en cours</span>
          </div>
          <div className="bg-[#2b62e3] px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
            {calendar.length} Grands Prix
          </div>
          <CalendarManager onSaved={loadAllData} />
        </div>
      </header>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {standings.map((p, i) => {
          const female = isFemale(p.name);
          const rankLabel = i === 0 ? (female ? "1ère" : "1er") : `${i + 1}e`;
          
          return (
            <button 
              key={p.name} 
              onClick={() => setSelectedPlayerName(p.name)}
              className="group text-left bg-white border border-slate-100 p-6 rounded-3xl relative shadow-sm hover:shadow-xl hover:border-[#2b62e3]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2" 
                style={{ backgroundColor: getPlayerColor(p.name) }} 
              />
              
              <div className="space-y-5">
                {/* 1. Header: Rank + Name + Flair Profile Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase">
                        {rankLabel}
                      </span>
                      {i === 0 && <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500 inline" />}
                    </div>
                    <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                  </div>
                  
                  {p.profile && (
                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-xs ${p.profile.badgeClass}`}>
                      <span>{p.profile.icon}</span>
                      <span>{p.profile.title}</span>
                    </div>
                  )}
                </div>

                {/* 2. PRIORITÉ 1 : POINTS TOTAUX (Grand & Imposant) */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Points Totaux</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">
                        {p.points || 0}
                      </span>
                      <span className="text-xs font-black text-slate-400 uppercase">pts</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Écart moyen</span>
                    <span className="text-xl font-black text-indigo-600 tabular-nums">
                      ±{p.avgDistance || 0} <span className="text-[10px] font-bold text-slate-400">pl.</span>
                    </span>
                  </div>
                </div>

                {/* 3. PRIORITÉ 2 : DÉTAIL DES POINTS (QUALIFS, COURSE, PARIS) */}
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-2">Points par session</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Qualifs */}
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase text-indigo-600 mb-1">
                        <Timer className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>Qualifs</span>
                      </div>
                      <div className="text-xl font-black text-indigo-950 tabular-nums">
                        {p.qualiPoints || 0}
                        <span className="text-[9px] font-bold text-indigo-500/70 ml-1">pts</span>
                      </div>
                    </div>

                    {/* Course */}
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase text-blue-600 mb-1">
                        <Flag className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>Course</span>
                      </div>
                      <div className="text-xl font-black text-blue-950 tabular-nums">
                        {p.racePoints || 0}
                        <span className="text-[9px] font-bold text-blue-500/70 ml-1">pts</span>
                      </div>
                    </div>

                    {/* Paris */}
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/70 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase text-amber-700 mb-1">
                        <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Paris</span>
                      </div>
                      <div className="text-xl font-black text-amber-950 tabular-nums">
                        {p.betPoints || 0}
                        <span className="text-[9px] font-bold text-amber-600/70 ml-1">pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. SYNTHÈSE FLAIR & PROXIMITÉ (Plus compacte) */}
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-indigo-500" />
                      Indice de précision
                    </span>
                    <span className="text-indigo-600 font-bold">{p.proximityScore || 0}% de flair</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                    <span className="text-slate-700 flex items-center gap-1">
                      <span>🎯</span> {p.exactCount || 0} dans le mille
                    </span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1 font-black text-[9px]">
                      <span>🤏</span> {p.nearMissCount || 0} à ±1 place
                    </span>
                  </div>
                </div>
              </div>

              {/* Call to action footer */}
              <div className="mt-4 pt-3 border-t border-slate-100/70 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[#2b62e3] group-hover:text-[#1d4ed8]">
                <span>Voir l'analyse détaillée</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* SESSION KINGS SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Timer className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isFemale(qualiChamp?.name || "") ? "L'Experte des Qualifs" : "L'Expert des Qualifs"}
              </h4>
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
              <Flag className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isFemale(raceChamp?.name || "") ? "La Maîtresse de la Course" : "Le Maître de la Course"}
              </h4>
              <p className="text-xl font-black text-slate-900 uppercase">{raceChamp?.name || "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#2b62e3] tabular-nums">{raceChamp?.racePoints || 0}</span>
            <p className="text-[8px] font-black uppercase text-slate-300">points</p>
          </div>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isFemale(betChamp?.name || "") ? "La Reine des Paris" : "Le Roi des Paris"}
              </h4>
              <p className="text-xl font-black text-slate-900 uppercase">{betChamp?.name || "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#2b62e3] tabular-nums">{betChamp?.betPoints || 0}</span>
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
                  const name = calendar.find(c => c.round === r)?.name;
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
      <section className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 relative z-10">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Analyse</h2>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Répartition des Points par Session</p>
          </div>
          
          {/* Custom HTML Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/70 transition-all duration-200 cursor-default">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shadow-indigo-200" />
              <span>Qualifs</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/70 transition-all duration-200 cursor-default">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-sm shadow-blue-200" />
              <span>Course</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/70 transition-all duration-200 cursor-default">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 shadow-sm shadow-amber-200" />
              <span>Paris</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={standings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
              <defs>
                <linearGradient id="qualiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="raceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="betGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(241, 245, 249, 0.4)', radius: 12 }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="qualiPoints" name="Qualifs" fill="url(#qualiGrad)" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="racePoints" name="Course" fill="url(#raceGrad)" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="betPoints" name="Paris" fill="url(#betGrad)" radius={[6, 6, 0, 0]} barSize={20} />
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
              <div className="text-xs font-black text-slate-900 uppercase">{calendar.find(r => r.round === viewerRound)?.name}</div>
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
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedPlayerName(null)} 
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.96 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.96 }} 
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-100"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                      {selectedPlayerName}
                    </h3>
                    {playerStats?.profile && (
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-xs ${playerStats.profile.badgeClass}`}>
                        <span>{playerStats.profile.icon}</span>
                        <span>{playerStats.profile.title}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {playerStats?.isFemale ? "Analyse de la pilote • Pronostics F1" : "Analyse du pilote • Pronostics F1"}
                  </p>
                  {playerStats?.profile?.description && (
                    <p className="text-xs text-slate-500 italic mt-1.5 font-medium">
                      « {playerStats.profile.description} »
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedPlayerName(null)} 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center text-lg font-bold transition-colors"
                >
                  ×
                </button>
              </div>
              
              {playerStats ? (
                <div className="space-y-6">
                  {/* Top 3 High-Level Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Points Totaux</div>
                      <div className="text-2xl font-black text-slate-900 tabular-nums">{playerStats.totalPoints}</div>
                      <div className="text-[8px] font-bold text-slate-400 mt-0.5">Rang actuel</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Moyenne / GP</div>
                      <div className="text-2xl font-black text-slate-900 tabular-nums">{playerStats.avgPointsPerGP.toFixed(1)}</div>
                      <div className="text-[8px] font-bold text-slate-400 mt-0.5">pts par week-end</div>
                    </div>
                    <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-center">
                      <div className="text-[8px] font-black text-indigo-500 uppercase mb-1">Écart Moyen</div>
                      <div className="text-2xl font-black text-indigo-700 tabular-nums">±{playerStats.avgDistance}</div>
                      <div className="text-[8px] font-bold text-indigo-500/80 mt-0.5">places de la vérité</div>
                    </div>
                  </div>

                  {/* LE RADAR DE TIR : OU TOMBENT TES PRONOSTICS ? */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-indigo-600" />
                          Précision des tirs ({playerStats.totalPredicted} pilotes pronostiqués)
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Où atterrissent vos pilotes par rapport au résultat réel ?
                        </p>
                      </div>
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {playerStats.proximityScore}% flair
                      </span>
                    </div>

                    {/* Stacked bar of accuracy */}
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      {playerStats.exactCount > 0 && (
                        <div 
                          style={{ width: `${(playerStats.exactCount / (playerStats.totalPredicted || 1)) * 100}%` }}
                          className="bg-emerald-500 h-full transition-all duration-700" 
                          title={`Dans le mille : ${playerStats.exactCount}`}
                        />
                      )}
                      {playerStats.nearMissCount > 0 && (
                        <div 
                          style={{ width: `${(playerStats.nearMissCount / (playerStats.totalPredicted || 1)) * 100}%` }}
                          className="bg-amber-400 h-full transition-all duration-700" 
                          title={`À ±1 place : ${playerStats.nearMissCount}`}
                        />
                      )}
                      {playerStats.top10OnlyCount > 0 && (
                        <div 
                          style={{ width: `${(playerStats.top10OnlyCount / (playerStats.totalPredicted || 1)) * 100}%` }}
                          className="bg-[#2b62e3] h-full transition-all duration-700" 
                          title={`Dans le Top 10 : ${playerStats.top10OnlyCount}`}
                        />
                      )}
                      {playerStats.missCount > 0 && (
                        <div 
                          style={{ width: `${(playerStats.missCount / (playerStats.totalPredicted || 1)) * 100}%` }}
                          className="bg-slate-300 h-full transition-all duration-700" 
                          title={`Hors Top 10 : ${playerStats.missCount}`}
                        />
                      )}
                    </div>

                    {/* 4 Cards under stacked bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-left">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 mb-0.5">
                          <span>🎯</span> Dans le mille
                        </div>
                        <div className="text-xl font-black text-emerald-900 tabular-nums">
                          {playerStats.exactCount}
                          <span className="text-[10px] font-normal text-emerald-600 ml-1">
                            ({Math.round((playerStats.exactCount / (playerStats.totalPredicted || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="text-[8px] font-bold text-emerald-600/80 mt-1">
                          Rang exact (+1 pt)
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-left">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-700 mb-0.5">
                          <span>🤏</span> À ±1 place
                        </div>
                        <div className="text-xl font-black text-amber-900 tabular-nums">
                          {playerStats.nearMissCount}
                          <span className="text-[10px] font-normal text-amber-700 ml-1">
                            ({Math.round((playerStats.nearMissCount / (playerStats.totalPredicted || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="text-[8px] font-black text-amber-600 mt-1">
                          Frôlé ! (Si proche)
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-left">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-700 mb-0.5">
                          <span>📍</span> Top 10
                        </div>
                        <div className="text-xl font-black text-blue-900 tabular-nums">
                          {playerStats.top10OnlyCount}
                          <span className="text-[10px] font-normal text-blue-600 ml-1">
                            ({Math.round((playerStats.top10OnlyCount / (playerStats.totalPredicted || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="text-[8px] font-bold text-blue-600/80 mt-1">
                          Vu, mais décalé
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-left">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 mb-0.5">
                          <span>❌</span> Hors-piste
                        </div>
                        <div className="text-xl font-black text-slate-800 tabular-nums">
                          {playerStats.missCount}
                          <span className="text-[10px] font-normal text-slate-500 ml-1">
                            ({Math.round((playerStats.missCount / (playerStats.totalPredicted || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 mt-1">
                          Hors du Top 10
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DUEL SAMEDI vs DIMANCHE */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-blue-600" />
                        Duel des Sessions : Qualifs vs Course
                      </h4>
                      <span className="text-[9px] font-black uppercase text-slate-500">
                        {playerStats.qualiStats.avgDistance < playerStats.raceStats.avgDistance
                          ? (playerStats.isFemale ? "Plus affûtée le samedi ⏱️" : "Plus affûté le samedi ⏱️")
                          : (playerStats.isFemale ? "Meilleur flair en course 🏁" : "Meilleur flair en course 🏁")
                        }
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Qualifs */}
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Qualifications
                          </span>
                          <span className="text-xs font-black text-slate-900">{playerStats.qualiPoints} pts</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-50">
                          <span className="text-[9px] font-medium text-slate-400">Écart moyen :</span>
                          <span className="text-sm font-black text-indigo-600 tabular-nums">±{playerStats.qualiStats.avgDistance} pl.</span>
                        </div>
                        <div className="flex items-baseline justify-between text-[9px]">
                          <span className="font-medium text-slate-400">Rangs exacts :</span>
                          <span className="font-bold text-slate-700">{playerStats.qualiStats.exactCount} ({playerStats.qualiStats.totalPredicted ? Math.round((playerStats.qualiStats.exactCount / playerStats.qualiStats.totalPredicted) * 100) : 0}%)</span>
                        </div>
                        <div className="flex items-baseline justify-between text-[9px]">
                          <span className="font-medium text-slate-400">À ±1 place :</span>
                          <span className="font-bold text-amber-600">{playerStats.qualiStats.nearMissCount} si proche</span>
                        </div>
                      </div>

                      {/* Course */}
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-1">
                            <Flag className="w-3 h-3" /> Course
                          </span>
                          <span className="text-xs font-black text-slate-900">{playerStats.racePoints} pts</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-50">
                          <span className="text-[9px] font-medium text-slate-400">Écart moyen :</span>
                          <span className="text-sm font-black text-blue-600 tabular-nums">±{playerStats.raceStats.avgDistance} pl.</span>
                        </div>
                        <div className="flex items-baseline justify-between text-[9px]">
                          <span className="font-medium text-slate-400">Rangs exacts :</span>
                          <span className="font-bold text-slate-700">{playerStats.raceStats.exactCount} ({playerStats.raceStats.totalPredicted ? Math.round((playerStats.raceStats.exactCount / playerStats.raceStats.totalPredicted) * 100) : 0}%)</span>
                        </div>
                        <div className="flex items-baseline justify-between text-[9px]">
                          <span className="font-medium text-slate-400">À ±1 place :</span>
                          <span className="font-bold text-amber-600">{playerStats.raceStats.nearMissCount} si proche</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PILOTE FÉTICHE & BÊTE NOIRE + PARIS SPÉCIAUX */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Pilote Fétiche */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="text-[8px] font-black uppercase text-emerald-600 mb-1 flex items-center gap-1">
                          <span>🟢</span> Pilote Fétiche
                        </div>
                        {playerStats.bestDriver ? (
                          <>
                            <div className="text-sm font-black text-slate-900">{playerStats.bestDriver.driver}</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-1">
                              {playerStats.bestDriver.exact} rang(s) exact(s) • Écart ±{playerStats.bestDriver.avgDist} pl.
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-400 italic">En attente de courses</div>
                        )}
                      </div>
                    </div>

                    {/* Bête Noire ou Paris */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="text-[8px] font-black uppercase text-rose-600 mb-1 flex items-center gap-1">
                          <span>🔴</span> {playerStats.worstDriver ? "Bête Noire" : "Paris Spéciaux"}
                        </div>
                        {playerStats.worstDriver ? (
                          <>
                            <div className="text-sm font-black text-slate-900">{playerStats.worstDriver.driver}</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-1">
                              Écart moyen ±{playerStats.worstDriver.avgDist} pl.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-black text-slate-900">{playerStats.betsWon} / {playerStats.betsTotal} gagnés</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-1">
                              {Math.round(playerStats.betWinRate)}% de réussite
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-[10px] font-black text-slate-300 animate-pulse">
                  Chargement de l'analyse...
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
