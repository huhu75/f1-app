"use client";

import { useState, useEffect } from "react";
import { Calendar, Save, Loader2, Clock, AlertCircle, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Race, fetchCalendar } from "@/lib/f1-data";

interface CalendarManagerProps {
  onSaved: () => void;
}

export default function CalendarManager({ onSaved }: CalendarManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRound, setSelectedRound] = useState<number>(0);
  
  // Form fields
  const [dateString, setDateString] = useState("");
  const [qualiStart, setQualiStart] = useState("");
  const [raceStart, setRaceStart] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Helper to convert ISO string (UTC) to local YYYY-MM-DDTHH:MM
  const toLocalDatetimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Load calendar when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCalendar();
    }
  }, [isOpen]);

  const loadCalendar = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await fetchCalendar();
      setRaces(data);
      if (data.length > 0) {
        // Default to the first race or the next one
        const now = new Date();
        const nextRace = data.find((r) => r.startDate > now) ?? data[0];
        setSelectedRound(nextRace.round);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Impossible de charger le calendrier.");
    } finally {
      setIsLoading(false);
    }
  };

  // Populate form fields when selected race changes
  useEffect(() => {
    const selectedRace = races.find((r) => r.round === selectedRound);
    if (selectedRace) {
      setDateString(selectedRace.date_string);
      setQualiStart(toLocalDatetimeLocal(selectedRace.quali_start));
      setRaceStart(toLocalDatetimeLocal(selectedRace.race_start));
    }
  }, [selectedRound, races]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound) return;
    
    setIsSaving(true);
    setErrorMsg("");
    
    try {
      // Parse local input times to ISO strings (UTC)
      const qualiUtc = new Date(qualiStart).toISOString();
      const raceUtc = new Date(raceStart).toISOString();

      const { error } = await supabase
        .from("races")
        .update({
          date_string: dateString,
          quali_start: qualiUtc,
          race_start: raceUtc,
        })
        .eq("round", selectedRound);

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 1500);

      // Refresh parent page data
      onSaved();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur lors de la mise à jour de la course.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all flex items-center gap-2 border border-slate-800"
      >
        <Calendar className="w-3.5 h-3.5" />
        Mettre à jour
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => !isSaving && setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100/80 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Calendrier</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Horaires des Grands Prix</p>
              </div>
              <button 
                onClick={() => !isSaving && setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                disabled={isSaving}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-[#2b62e3] animate-spin" />
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chargement du calendrier...</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="p-8 space-y-6">
                {/* Race Selection */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sélectionner un Grand Prix</label>
                  <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-300 transition-all cursor-pointer"
                  >
                    {races.map((r) => (
                      <option key={r.round} value={r.round}>
                        R{r.round} • {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date String */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Libellé Date (ex: "22-24 MAI")</label>
                  <input
                    type="text"
                    required
                    value={dateString}
                    onChange={(e) => setDateString(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-300 transition-all"
                    placeholder="ex: 22-24 MAI"
                  />
                </div>

                {/* Quali Start */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Début des Qualifications
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={qualiStart}
                    onChange={(e) => setQualiStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>

                {/* Race Start */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Début de la Course
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={raceStart}
                    onChange={(e) => setRaceStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>

                {/* Info Text */}
                <p className="text-[9px] text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  💡 Les heures saisies correspondent à votre fuseau horaire local. Elles seront automatiquement converties en temps universel (UTC) lors de la sauvegarde.
                </p>

                {/* Alerts */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {showSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Calendrier mis à jour !</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 h-12 rounded-xl text-slate-500 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest transition-colors border border-slate-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-[#2b62e3] hover:bg-[#1d4ed8] text-white rounded-xl h-12 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
