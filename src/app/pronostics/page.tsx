"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, Check, Loader2, Trophy, Zap, Flag, MessageSquare, History, ChevronRight, Calendar, Lock } from "lucide-react";
import { teams2026, getNextRace, formatCountdown, calendar2026 } from "@/lib/f1-data";
import { storageService, PLAYERS } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

export default function Pronostics() {
  const positions = Array.from({ length: 10 }, (_, i) => i);

  const [qualiSelections, setQualiSelections] = useState<string[]>(Array(10).fill(""));
  const [raceSelections, setRaceSelections] = useState<string[]>(Array(10).fill(""));
  
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [currentPlayer, setCurrentPlayer] = useState<string>("Hugo");
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [editCount, setEditCount] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [specialBet, setSpecialBet] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Derived state for the selected race
  const selectedRace = calendar2026.find(r => r.round === selectedRound) || calendar2026[0];
  const isLocked = new Date() > selectedRace.startDate;

  useEffect(() => {
    const nextR = getNextRace();
    setSelectedRound(nextR.round);
  }, []);

  // Update countdown dynamically based on selection
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(formatCountdown(selectedRace.startDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [selectedRace]);

  useEffect(() => {
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
    if (isLocked) return;
    const newSelections = [...qualiSelections];
    newSelections[index] = value;
    setQualiSelections(newSelections);
  };

  const handleRaceChange = (index: number, value: string) => {
    if (isLocked) return;
    const newSelections = [...raceSelections];
    newSelections[index] = value;
    setRaceSelections(newSelections);
  };

  const handleSave = async () => {
    if (isLocked) return;
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
      "Hugo": "#334155",      // Slate
      "François": "#10b981",  // Emerald
      "Carole": "#fb7185"     // Sunset Rose
    };
    return colors[name] || "#2b62e3";
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10 pb-24 text-slate-900 bg-white min-h-screen">
      {/* HEADER SOFT FLAT */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#2b62e3]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2b62e3]/60">Pronostics</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            {selectedRace.name}
          </h1>
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-md">
              Round {selectedRace.round}
            </div>
            <div className="px-3 py-1 bg-[#2b62e3] text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-blue-100">
              F1 2026
            </div>
          </div>
        </div>

        <div className="space-y-4 min-w-[240px]">
          <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl">
            {PLAYERS.map(player => (
              <button
                key={player}
                onClick={() => setCurrentPlayer(player)}
                className={`flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  currentPlayer === player 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {player}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <select 
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black uppercase tracking-widest text-slate-900 outline-none appearance-none focus:border-slate-400 transition-colors"
            >
              {calendar2026.map(r => (
                <option key={r.round} value={r.round}>
                  R{r.round} • {r.name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* COUNTDOWN SECTION - DYNAMIC & LOCKING */}
      <div className={`border rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl transition-all ${
        isLocked 
          ? 'bg-rose-50 border-rose-100 shadow-rose-50' 
          : 'bg-[#2b62e3] border-blue-400/20 shadow-blue-100'
      }`}>
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${
            isLocked ? 'bg-rose-100 border-rose-200' : 'bg-white/10 border-white/20'
          }`}>
            {isLocked ? <Lock className="w-7 h-7 text-rose-500" /> : <Zap className="w-7 h-7 text-white" />}
          </div>
          <div>
            <div className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${
              isLocked ? 'text-rose-400' : 'text-white/60'
            }`}>
              {isLocked ? "Paris Clos" : "Clôture des paris"}
            </div>
            <div className={`text-2xl font-black tracking-tight tabular-nums ${
              isLocked ? 'text-rose-600' : 'text-white'
            }`}>
              {isLocked ? "Qualifs terminées" : countdown}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {editCount > 0 && (
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{editCount} modif{editCount > 1 ? 's' : ''}</span>
            </button>
          )}
          <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
            isLocked 
              ? 'bg-rose-100 text-rose-600 border-rose-200' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {isLocked ? "Fermé" : "Ouvert"}
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
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> Historique
              </h2>
              <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {[...predictionHistory].reverse().map((h, i) => (
                  <div key={i} className="text-[10px] p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
                    <span className="font-bold text-slate-400">#{h.editCount} - {h.changes}</span>
                    <span className="text-slate-400 italic">{new Date(h.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-start transition-opacity ${isLocked ? 'opacity-70' : 'opacity-100'}`}>
        {/* QUALIFICATIONS */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Qualifs</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top 10</span>
          </div>
          <div className="p-6 space-y-3">
            {positions.map((index) => (
              <div key={`quali-${index}`} className="flex items-center gap-4 relative">
                <div className="w-7 h-7 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 rounded-md bg-slate-50">
                  {index + 1}
                </div>
                <div className="flex-1 relative">
                  <select 
                    value={qualiSelections[index]}
                    disabled={isLocked}
                    onChange={(e) => handleQualiChange(index, e.target.value)}
                    className={`w-full bg-white border border-slate-200 h-11 px-4 text-xs font-bold text-slate-700 rounded-xl outline-none appearance-none transition-all ${isLocked ? 'cursor-not-allowed bg-slate-50' : 'focus:border-slate-400 cursor-pointer'}`}
                  >
                    <option value="">Pilote...</option>
                    {teams2026.map((team) => (
                      <optgroup key={team.name} label={team.name} className="text-[10px] font-black uppercase tracking-widest">
                        {team.drivers.map(driver => (
                          <option key={driver} value={driver} disabled={qualiSelections.includes(driver) && qualiSelections[index] !== driver}>
                            {driver}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {qualiSelections[index] && !isLocked && (
                    <button 
                      onClick={() => handleQualiChange(index, "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors text-lg"
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
          <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Course</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top 10</span>
          </div>
          <div className="p-6 space-y-3">
            {positions.map((index) => (
              <div key={`race-${index}`} className="flex items-center gap-4 relative">
                <div className="w-7 h-7 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 rounded-md bg-slate-50">
                  {index + 1}
                </div>
                <div className="flex-1 relative">
                  <select 
                    value={raceSelections[index]}
                    disabled={isLocked}
                    onChange={(e) => handleRaceChange(index, e.target.value)}
                    className={`w-full bg-white border border-slate-200 h-11 px-4 text-xs font-bold text-slate-700 rounded-xl outline-none appearance-none transition-all ${isLocked ? 'cursor-not-allowed bg-slate-50' : 'focus:border-slate-400 cursor-pointer'}`}
                  >
                    <option value="">Pilote...</option>
                    {teams2026.map((team) => (
                      <optgroup key={team.name} label={team.name} className="text-[10px] font-black uppercase tracking-widest">
                        {team.drivers.map(driver => (
                          <option key={driver} value={driver} disabled={raceSelections.includes(driver) && raceSelections[index] !== driver}>
                            {driver}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {raceSelections[index] && !isLocked && (
                    <button 
                      onClick={() => handleRaceChange(index, "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors text-lg"
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

      {/* SPECIAL BET */}
      <section className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-opacity ${isLocked ? 'opacity-70' : 'opacity-100'}`}>
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Pari Spécial</h2>
        </div>
        <div className="p-8 space-y-4">
          <textarea 
            value={specialBet}
            disabled={isLocked}
            onChange={(e) => setSpecialBet(e.target.value)}
            className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 min-h-[140px] text-xs font-bold text-slate-600 outline-none resize-none transition-all placeholder:text-slate-300 ${isLocked ? 'cursor-not-allowed' : 'focus:bg-white focus:border-slate-300'}`}
            placeholder="Intuition, abandon, pluie..."
          />
        </div>
      </section>

      {/* FOOTER */}
      {!isLocked && (
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-100">
          <div className="flex items-center gap-4">
            {showSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                <Check className="w-4 h-4" /> Enregistré
              </motion.div>
            )}
          </div>
          
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-12 h-14 text-xs font-black uppercase tracking-[0.2em] text-white rounded-xl transition-all disabled:opacity-50 bg-[#2b62e3] hover:bg-[#1d4ed8] shadow-lg shadow-blue-200"
          >
            {isSaving ? "Envoi..." : "Sauvegarder"}
          </button>
        </footer>
      )}

      {isLocked && (
        <div className="pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
            Ce Grand Prix est déjà en cours ou terminé. Les pronostics ne peuvent plus être modifiés.
          </p>
        </div>
      )}
    </div>
  );
}
