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
      setPlayersPredictions(allPreds[selectedRound] || {});
    };
    loadData();
  }, [selectedRound]);

  const handleSave = async () => {
    setIsSaving(true);
    await storageService.saveRaceResult({
      round: selectedRound,
      qualiPositions: qualiResults,
      racePositions: raceResults
    });
    setIsSaving(false);
    setShowSuccess(true);
    onSaved();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleBet = async (playerName: string, won: boolean) => {
    await storageService.updateBetStatus(selectedRound, playerName, won);
    const allPreds = await storageService.getAllPredictions();
    setPlayersPredictions(allPreds[selectedRound] || {});
    onSaved();
  };

  const drivers = teams2026.flatMap(t => t.drivers).sort();

  return (
    <div className="card-minimal overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
            !
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-black uppercase">Gestion des Résultats</h2>
            <p className="text-sm text-gray-500">Entrez les résultats officiels et validez les paris.</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="p-6 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Grand Prix</label>
            <select 
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="w-full p-3 bg-white border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-black"
            >
              {calendar2026.map(r => (
                <option key={r.round} value={r.round}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase border-b pb-2">Qualifs (Top 10)</h3>
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={`res-quali-${i}`} className="flex items-center gap-2">
                    <span className="text-xs font-mono w-6 text-gray-400">P{i+1}</span>
                    <select 
                      value={qualiResults[i]}
                      onChange={(e) => {
                        const next = [...qualiResults];
                        next[i] = e.target.value;
                        setQualiResults(next);
                      }}
                      className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded text-sm"
                    >
                      <option value="">-</option>
                      {teams2026.map((team) => (
                        <optgroup key={team.name} label={team.name}>
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
                        className="w-8 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors text-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase border-b pb-2">Course (Top 10)</h3>
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={`res-race-${i}`} className="flex items-center gap-2">
                    <span className="text-xs font-mono w-6 text-gray-400">P{i+1}</span>
                    <select 
                      value={raceResults[i]}
                      onChange={(e) => {
                        const next = [...raceResults];
                        next[i] = e.target.value;
                        setRaceResults(next);
                      }}
                      className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded text-sm"
                    >
                      <option value="">-</option>
                      {teams2026.map((team) => (
                        <optgroup key={team.name} label={team.name}>
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
                        className="w-8 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors text-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-gray-50 p-4 rounded-md border border-gray-100">
            <h3 className="text-sm font-bold uppercase">Validation des Paris Spéciaux</h3>
            <div className="space-y-3">
              {Object.keys(playersPredictions).length === 0 ? (
                <p className="text-xs text-gray-500 italic">Aucun pronostic pour ce GP.</p>
              ) : (
                Object.entries(playersPredictions).map(([name, pred]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                    <div>
                      <div className="text-xs font-bold text-gray-900">{name}</div>
                      <div className="text-xs text-gray-500 italic">"{pred.specialBet || "Pas de pari"}"</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleBet(name, true)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${pred.betWon === true ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-green-100'}`}
                      >
                        Gagné
                      </button>
                      <button 
                        onClick={() => toggleBet(name, false)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${pred.betWon === false ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-red-100'}`}
                      >
                        Perdu
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {showSuccess && (
              <div className="flex items-center gap-2 text-green-600 font-bold text-xs animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 className="w-4 h-4" />
                Résultats enregistrés !
              </div>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-md font-bold uppercase text-sm hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Enregistrement..." : "Enregistrer les résultats"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
