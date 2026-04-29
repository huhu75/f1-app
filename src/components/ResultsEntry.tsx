"use client";

import { useState, useEffect } from "react";
import { Save, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { calendar2026, teams2026 } from "@/lib/f1-data";
import { storageService, Prediction } from "@/lib/storage";

export default function ResultsEntry({ onSaved }: { onSaved: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);
  const [qualiResults, setQualiResults] = useState<string[]>(Array(10).fill(""));
  const [raceResults, setRaceResults] = useState<string[]>(Array(10).fill(""));
  const [playersPredictions, setPlayersPredictions] = useState<Record<string, Prediction>>({});
  const [pendingBets, setPendingBets] = useState<Record<string, boolean | undefined>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const results = await storageService.getRaceResults();
      const currentResult = results[selectedRound];
      if (currentResult) {
        setQualiResults(currentResult.qualiPositions);
        setRaceResults(currentResult.racePositions);
      } else {
        setQualiResults(Array(10).fill(""));
        setRaceResults(Array(10).fill(""));
      }

      const allPreds = await storageService.getAllPredictions();
      const roundPreds = allPreds[selectedRound] || {};
      setPlayersPredictions(roundPreds);
      
      // Initialize pending bets state with current values from DB
      const initialBets: Record<string, boolean | undefined> = {};
      Object.entries(roundPreds).forEach(([name, pred]) => {
        initialBets[name] = pred.betWon;
      });
      setPendingBets(initialBets);
    };
    loadData();
  }, [selectedRound]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save GP Results
      await storageService.saveRaceResult({
        round: selectedRound,
        qualiPositions: qualiResults,
        racePositions: raceResults
      });

      // 2. Save all pending bet statuses
      const updatePromises = Object.entries(pendingBets).map(([name, won]) => {
        if (won !== undefined) {
          return storageService.updateBetStatus(selectedRound, name, won);
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);

      setShowSuccess(true);
      onSaved();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBetLocal = (playerName: string, won: boolean) => {
    setPendingBets(prev => ({
      ...prev,
      [playerName]: prev[playerName] === won ? undefined : won
    }));
  };

  const drivers = teams2026.flatMap(t => t.drivers).sort();

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
            !
          </div>
          <div className="text-left">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Gestion des Résultats</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrez les résultats officiels et validez les paris.</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
      </button>

      {isOpen && (
        <div className="p-8 pt-0 space-y-10 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-3">
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Sélectionner le Grand Prix</label>
            <select 
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-slate-300 transition-all"
            >
              {calendar2026.map(r => (
                <option key={r.round} value={r.round}>R{r.round} • {r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-b border-slate-50 pb-3">Qualifs (Top 10)</h3>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={`res-quali-${i}`} className="flex items-center gap-3 relative">
                    <span className="text-[9px] font-black w-6 text-slate-300 tabular-nums">P{i+1}</span>
                    <div className="flex-1 relative">
                      <select 
                        value={qualiResults[i]}
                        onChange={(e) => {
                          const next = [...qualiResults];
                          next[i] = e.target.value;
                          setQualiResults(next);
                        }}
                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-300 transition-all appearance-none"
                      >
                        <option value="">Pilote...</option>
                        {teams2026.map((team) => (
                          <optgroup key={team.name} label={team.name} className="text-[10px] font-black uppercase tracking-widest">
                            {team.drivers.map(driver => (
                              <option 
                                key={driver} 
                                value={driver}
                                disabled={qualiResults.includes(driver) && qualiResults[i] !== driver}
                              >
                                {driver}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {qualiResults[i] && (
                        <button 
                          onClick={() => {
                            const next = [...qualiResults];
                            next[i] = "";
                            setQualiResults(next);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors text-lg"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-b border-slate-50 pb-3">Course (Top 10)</h3>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={`res-race-${i}`} className="flex items-center gap-3 relative">
                    <span className="text-[9px] font-black w-6 text-slate-300 tabular-nums">P{i+1}</span>
                    <div className="flex-1 relative">
                      <select 
                        value={raceResults[i]}
                        onChange={(e) => {
                          const next = [...raceResults];
                          next[i] = e.target.value;
                          setRaceResults(next);
                        }}
                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-300 transition-all appearance-none"
                      >
                        <option value="">Pilote...</option>
                        {teams2026.map((team) => (
                          <optgroup key={team.name} label={team.name} className="text-[10px] font-black uppercase tracking-widest">
                            {team.drivers.map(driver => (
                              <option 
                                key={driver} 
                                value={driver}
                                disabled={raceResults.includes(driver) && raceResults[i] !== driver}
                              >
                                {driver}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {raceResults[i] && (
                        <button 
                          onClick={() => {
                            const next = [...raceResults];
                            next[i] = "";
                            setRaceResults(next);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors text-lg"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Validation des Paris Spéciaux</h3>
            <div className="space-y-4">
              {Object.keys(playersPredictions).length === 0 ? (
                <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-widest">Aucun pronostic enregistré</p>
              ) : (
                Object.entries(playersPredictions).map(([name, pred]) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="max-w-[60%]">
                      <div className="text-[10px] font-black text-slate-900 uppercase mb-1">{name}</div>
                      <div className="text-xs font-bold text-slate-500 leading-snug">"{pred.specialBet || "Pas de pari"}"</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleBetLocal(name, true)}
                        className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pendingBets[name] === true ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                      >
                        Gagné
                      </button>
                      <button 
                        onClick={() => toggleBetLocal(name, false)}
                        className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pendingBets[name] === false ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                      >
                        Perdu
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            {showSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 className="w-4 h-4" />
                Mise à jour réussie
              </div>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto h-14 px-10 bg-[#2b62e3] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#1d4ed8] shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2 inline" />
              {isSaving ? "Synchronisation..." : "Enregistrer les résultats"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
