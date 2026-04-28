"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, Check, Loader2 } from "lucide-react";
import { teams2026, getNextRace, formatCountdown, calendar2026 } from "@/lib/f1-data";
import { storageService } from "@/lib/storage";

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

  if (!nextRace) return null; // ou un loader

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 text-black bg-white">
      <section className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase text-black">Saisie des Pronostics</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Joueur</label>
              <select 
                value={currentPlayer}
                onChange={(e) => setCurrentPlayer(e.target.value)}
                className="w-full bg-black text-white rounded-md h-12 px-4 text-sm font-bold outline-none border-none transition-all hover:bg-gray-800"
              >
                {["Hugo", "Ami 1", "Ami 2", "Ami 3"].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Grand Prix</label>
              <select 
                value={selectedRound}
                onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-md h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all text-black"
              >
                {calendar2026.map(r => (
                  <option key={r.round} value={r.round}>
                    Round {r.round}: {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {editCount > 0 && (
          <div className="flex flex-col items-end">
            <button 
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1"
            >
              {editCount} modification{editCount > 1 ? 's' : ''} • Voir historique
            </button>
          </div>
        )}
      </section>

      {showHistory && (
        <section className="p-6 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-black mb-4">Historique des modifications</h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {[...predictionHistory].reverse().map((h, i) => (
              <div key={i} className="text-xs p-3 bg-white border border-gray-100 rounded-md flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">Modif #{h.editCount}</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {h.changes}
                  </span>
                </div>
                <div className="text-gray-400 font-mono">
                  {new Date(h.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
        <AlertCircle className="w-5 h-5 shrink-0 text-gray-500" />
        <p>
          {selectedRound === nextRace.round ? (
            <>Fin des pronostics dans : <span className="font-bold text-black">{countdown}</span> (Début Q1 estimé)</>
          ) : (
            <>Vous modifiez les pronostics pour un autre Grand Prix.</>
          )}
        </p>
      </div>

      <form className="space-y-10">
        
        {/* DEUX COLONNES : QUALIFS ET COURSE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* COLONNE GAUCHE : QUALIFICATIONS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-tight border-b border-gray-200 pb-2 text-black">
              Qualifications (Top 10)
            </h2>
            <div className="space-y-3">
              {positions.map((index) => (
                <div key={`quali-${index}`} className="flex items-center gap-3">
                  <span className="w-8 text-gray-500 font-mono font-bold text-right">P{index + 1}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <select 
                      value={qualiSelections[index]}
                      onChange={(e) => handleQualiChange(index, e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-black outline-none transition-colors hover:border-gray-400 text-black"
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
                        className="w-8 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* COLONNE DROITE : COURSE */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-tight border-b border-gray-200 pb-2 text-black">
              Course (Top 10)
            </h2>
            <div className="space-y-3">
              {positions.map((index) => (
                <div key={`race-${index}`} className="flex items-center gap-3">
                  <span className="w-8 text-gray-500 font-mono font-bold text-right">P{index + 1}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <select 
                      value={raceSelections[index]}
                      onChange={(e) => handleRaceChange(index, e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-black outline-none transition-colors hover:border-gray-400 text-black"
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
                        className="w-8 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
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

        {/* PARI SPÉCIAL EN BAS */}
        <section className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold uppercase tracking-tight text-black">
            Pari Spécial
          </h2>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Votre pari libre (ex: "Abandon de Verstappen", "Pluie au 20ème tour")
            </label>
            <textarea 
              value={specialBet}
              onChange={(e) => setSpecialBet(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md p-4 min-h-[100px] text-sm focus:ring-2 focus:ring-black outline-none resize-none transition-colors hover:border-gray-400 text-black"
              placeholder="Écrivez votre pari ici..."
            />
          </div>
        </section>

        {/* BOUTON ENREGISTRER */}
        <div className="pt-4 flex flex-col items-end gap-3">
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-right-4">
              <Check className="w-4 h-4" />
              Pronostics enregistrés avec succès !
            </div>
          )}
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full md:w-auto h-12 px-8 text-base bg-black text-white hover:bg-gray-800 rounded-md font-bold uppercase tracking-wider transition-all flex items-center justify-center ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Enregistrer mes pronostics
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
