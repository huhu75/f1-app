"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, Check, Loader2, Trophy, Zap, Flag, MessageSquare, History, ChevronRight } from "lucide-react";
import { teams2026, getNextRace, formatCountdown, calendar2026 } from "@/lib/f1-data";
import { storageService, PLAYERS } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

export default function Pronostics() {
  const positions = Array.from({ length: 10 }, (_, i) => i);

  const [qualiSelections, setQualiSelections] = useState<string[]>(Array(10).fill(""));
  const [raceSelections, setRaceSelections] = useState<string[]>(Array(10).fill(""));
  
  const [nextRace, setNextRace] = useState<any>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [currentPlayer, setCurrentPlayer] = useState<string>("Hugo");
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [editCount, setEditCount] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [specialBet, setSpecialBet] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const race = getNextRace();
    setNextRace(race);
    setSelectedRound(race.round);
    setCountdown(formatCountdown(race.startDate));
    
    const interval = setInterval(() => {
      setCountdown(formatCountdown(race.startDate));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Charger les pronostics existants quand le round ou le joueur change
    const loadData = async () => {
      const all = await storageService.getAllPredictions();
      const saved = all[selectedRound]?.[currentPlayer];
      if (saved) {
        setQualiSelections(saved.qualiPositions);
        setRaceSelections(saved.racePositions);
        setSpecialBet(saved.specialBet);
        setEditCount(saved.editCount || 0);
        setPredictionHistory(saved.history || []);
      } else {
        setQualiSelections(Array(10).fill(""));
        setRaceSelections(Array(10).fill(""));
        setSpecialBet("");
        setEditCount(0);
        setPredictionHistory([]);
      }
    };
    loadData();
  }, [selectedRound, currentPlayer]);

  const handleQualiChange = (index: number, value: string) => {
    const newSelections = [...qualiSelections];
    newSelections[index] = value;
    setQualiSelections(newSelections);
  };

  const handleRaceChange = (index: number, value: string) => {
    const newSelections = [...raceSelections];
    newSelections[index] = value;
    setRaceSelections(newSelections);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await storageService.savePrediction({
        round: selectedRound,
        playerName: currentPlayer,
        qualiPositions: qualiSelections,
        racePositions: raceSelections,
        specialBet: specialBet,
        updatedAt: new Date().toISOString()
      });
      setShowSuccess(true);
      // Refresh local history info
      const all = await storageService.getAllPredictions();
      const saved = all[selectedRound]?.[currentPlayer];
      if (saved) {
        setEditCount(saved.editCount);
        setPredictionHistory(saved.history || []);
      }
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const getPlayerColor = (name: string) => {
    const colors: Record<string, string> = {
      "Hugo": "#0f172a",      // Ardoise
      "François": "#4338ca",  // Indigo
      "Carole": "#be185d"     // Framboise
    };
    return colors[name] || "#0f172a";
  };

  const accentColor = getPlayerColor(currentPlayer);

  if (!nextRace) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 px-4 sm:px-6">
      {/* Header & Selectors */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pronostics</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Configurez vos prédictions pour le prochain Grand Prix</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 absolute -top-2.5 left-3 bg-white px-2 z-10 transition-colors group-focus-within:text-slate-900">Joueur</label>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 h-14 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-50 min-w-[160px]">
              <div className="w-2.5 h-2.5 rounded-full mr-3 shadow-sm" style={{ backgroundColor: accentColor }} />
              <select 
                value={currentPlayer}
                onChange={(e) => setCurrentPlayer(e.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none border-none text-slate-900 cursor-pointer appearance-none pr-8"
              >
                {PLAYERS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-300 absolute right-4 pointer-events-none rotate-90" />
            </div>
          </div>

          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 absolute -top-2.5 left-3 bg-white px-2 z-10 transition-colors group-focus-within:text-slate-900">Grand Prix</label>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 h-14 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-50 min-w-[240px]">
              <select 
                value={selectedRound}
                onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                className="w-full bg-transparent text-sm font-bold outline-none border-none text-slate-900 cursor-pointer appearance-none pr-8"
              >
                {calendar2026.map(r => (
                  <option key={r.round} value={r.round}>
                    R{r.round} • {r.name}
                  </option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-300 absolute right-4 pointer-events-none rotate-90" />
            </div>
          </div>
        </div>
      </header>

      {/* Countdown & Status */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 shadow-xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Temps restant pour pronostiquer</div>
              <div className="text-xl font-mono font-bold text-white tracking-tight">{countdown}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {editCount > 0 && (
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 group"
              >
                <History className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{editCount} modif{editCount > 1 ? 's' : ''}</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Ouvert</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> Historique des modifications
              </h2>
              <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {[...predictionHistory].reverse().map((h, i) => (
                  <div key={i} className="text-xs p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-400 w-8">#{h.editCount}</span>
                      <span className="px-2 py-0.5 bg-slate-50 rounded text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-100">
                        {h.changes}
                      </span>
                    </div>
                    <div className="text-slate-400 font-medium italic">
                      {new Date(h.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* QUALIFICATIONS */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Qualifications
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 10</span>
          </div>
          <div className="p-6 space-y-4">
            {positions.map((index) => (
              <div key={`quali-${index}`} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                  {index + 1}
                </div>
                <div className="flex-1 flex items-center gap-2 group">
                  <select 
                    value={qualiSelections[index]}
                    onChange={(e) => handleQualiChange(index, e.target.value)}
                    style={{ borderLeftColor: qualiSelections[index] ? accentColor : undefined, borderLeftWidth: qualiSelections[index] ? '3px' : '1px' }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-50 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                  >
                    <option value="">Choisir un pilote...</option>
                    {teams2026.map((team) => (
                      <optgroup key={team.name} label={team.name}>
                        {team.drivers.map(driver => (
                          <option 
                            key={driver} 
                            value={driver}
                            disabled={qualiSelections.includes(driver) && qualiSelections[index] !== driver}
                          >
                            {driver}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {qualiSelections[index] && (
                    <button 
                      type="button"
                      onClick={() => handleQualiChange(index, "")}
                      className="w-10 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl border border-slate-100 active:scale-95"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COURSE */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800 flex items-center gap-2">
              <Flag className="w-4 h-4 text-indigo-600" /> Course
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 10</span>
          </div>
          <div className="p-6 space-y-4">
            {positions.map((index) => (
              <div key={`race-${index}`} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                  {index + 1}
                </div>
                <div className="flex-1 flex items-center gap-2 group">
                  <select 
                    value={raceSelections[index]}
                    onChange={(e) => handleRaceChange(index, e.target.value)}
                    style={{ borderLeftColor: raceSelections[index] ? accentColor : undefined, borderLeftWidth: raceSelections[index] ? '3px' : '1px' }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-50 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                  >
                    <option value="">Choisir un pilote...</option>
                    {teams2026.map((team) => (
                      <optgroup key={team.name} label={team.name}>
                        {team.drivers.map(driver => (
                          <option 
                            key={driver} 
                            value={driver}
                            disabled={raceSelections.includes(driver) && raceSelections[index] !== driver}
                          >
                            {driver}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {raceSelections[index] && (
                    <button 
                      type="button"
                      onClick={() => handleRaceChange(index, "")}
                      className="w-10 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl border border-slate-100 active:scale-95"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* PARI SPÉCIAL */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" /> Pari Spécial
          </h2>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-2xl">
            Laissez libre cours à votre intuition. Un pari libre qui peut vous rapporter gros (ex: "Crash au premier virage", "Podium surprise d'une Alpine").
          </p>
          <textarea 
            value={specialBet}
            onChange={(e) => setSpecialBet(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 min-h-[140px] text-sm font-medium focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-50 outline-none resize-none transition-all text-slate-900 placeholder:text-slate-300 shadow-inner"
            placeholder="Écrivez votre intuition ici..."
          />
        </div>
      </section>

      {/* FOOTER ACTIONS */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Pronostics enregistrés
            </motion.div>
          )}
        </div>
        
        <button 
          type="button" 
          onClick={handleSave}
          disabled={isSaving}
          className="relative group w-full sm:w-auto overflow-hidden rounded-xl bg-slate-900 px-10 h-14 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-slate-200 transition-all hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="flex items-center justify-center gap-3">
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Sauvegarder</span>
              </>
            )}
          </div>
        </button>
      </footer>
    </div>
  );
}
