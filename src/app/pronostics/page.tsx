"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, Check, Loader2 } from "lucide-react";
import { teams2026, getNextRace, formatCountdown } from "@/lib/f1-data";
import { storageService } from "@/lib/storage";

export default function Pronostics() {
  const positions = Array.from({ length: 10 }, (_, i) => i);

  const [qualiSelections, setQualiSelections] = useState<string[]>(Array(10).fill(""));
  const [raceSelections, setRaceSelections] = useState<string[]>(Array(10).fill(""));
  
  const [nextRace, setNextRace] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [specialBet, setSpecialBet] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const race = getNextRace();
    setNextRace(race);
    setCountdown(formatCountdown(race.startDate));
    
    // Charger les pronostics existants
    const loadData = async () => {
      const saved = await storageService.getPredictions();
      if (saved) {
        setQualiSelections(saved.qualiPositions);
        setRaceSelections(saved.racePositions);
        setSpecialBet(saved.specialBet);
      }
    };
    loadData();
    
    const interval = setInterval(() => {
      setCountdown(formatCountdown(race.startDate));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

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
      await storageService.savePredictions({
        qualiPositions: qualiSelections,
        racePositions: raceSelections,
        specialBet: specialBet,
        updatedAt: new Date().toISOString()
      });
      setShowSuccess(true);
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
      <section className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase text-black">Saisie des Pronostics</h1>
        <p className="text-gray-500">{nextRace.name} ({nextRace.dateString})</p>
      </section>

      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
        <AlertCircle className="w-5 h-5 shrink-0 text-gray-500" />
        <p>Fin des pronostics dans : <span className="font-bold text-black">{countdown}</span> (Début Q1 estimé)</p>
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
