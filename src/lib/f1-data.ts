import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Race {
  round: number;
  name: string;
  date_string: string;
  race_start: string; // ISO 8601
  quali_start: string; // ISO 8601
  // Helpers calculés côté client
  startDate: Date;    // = race_start as Date (compat avec le code existant)
  qualiDate: Date;    // = quali_start as Date
}

// ─── Équipes (statique, ne change pas en cours de saison) ─────────────────────

export const teams2026 = [
  { name: "Red Bull", drivers: ["Max Verstappen", "Isack Hadjar"] },
  { name: "Mercedes", drivers: ["George Russell", "Kimi Antonelli"] },
  { name: "Ferrari", drivers: ["Charles Leclerc", "Lewis Hamilton"] },
  { name: "McLaren", drivers: ["Lando Norris", "Oscar Piastri"] },
  { name: "Aston Martin", drivers: ["Fernando Alonso", "Lance Stroll"] },
  { name: "Alpine", drivers: ["Pierre Gasly", "Franco Colapinto"] },
  { name: "Williams", drivers: ["Alex Albon", "Carlos Sainz"] },
  { name: "Racing Bulls", drivers: ["Liam Lawson", "Arvid Lindblad"] },
  { name: "Audi", drivers: ["Nico Hülkenberg", "Gabriel Bortoleto"] },
  { name: "Haas", drivers: ["Esteban Ocon", "Oliver Bearman"] },
  { name: "Cadillac", drivers: ["Sergio Pérez", "Valtteri Bottas"] },
];

// ─── Chargement du calendrier depuis Supabase ─────────────────────────────────

export async function fetchCalendar(): Promise<Race[]> {
  const { data, error } = await supabase
    .from("races")
    .select("*")
    .order("round");

  if (error) {
    console.error("Erreur fetchCalendar:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    round: row.round,
    name: row.name,
    date_string: row.date_string,
    race_start: row.race_start,
    quali_start: row.quali_start,
    startDate: new Date(row.race_start),
    qualiDate: new Date(row.quali_start),
  }));
}

// ─── Helpers (compatibles avec le code existant) ──────────────────────────────

/** Trouve la prochaine course à partir d'une liste déjà chargée. */
export function getNextRaceFromList(calendar: Race[]): Race | undefined {
  const now = new Date();
  return calendar.find((r) => r.startDate > now) ?? calendar[calendar.length - 1];
}

/**
 * Version synchrone conservée pour les composants qui l'utilisent encore.
 * Utilise un fallback statique ; à remplacer progressivement par getNextRaceFromList.
 */
export function getNextRace() {
  const fallback = [
    { round: 5,  name: "Canada",      startDate: new Date("2026-05-23T20:00:00Z"), qualiDate: new Date("2026-05-22T22:00:00Z"), date_string: "22-24 MAI", race_start: "2026-05-23T20:00:00Z", quali_start: "2026-05-22T22:00:00Z" },
    { round: 6,  name: "Monaco",      startDate: new Date("2026-06-06T14:00:00Z"), qualiDate: new Date("2026-06-05T14:00:00Z"), date_string: "05-07 JUN", race_start: "2026-06-06T14:00:00Z", quali_start: "2026-06-05T14:00:00Z" },
    { round: 7,  name: "Barcelone",   startDate: new Date("2026-06-13T14:00:00Z"), qualiDate: new Date("2026-06-12T14:00:00Z"), date_string: "12-14 JUN", race_start: "2026-06-13T14:00:00Z", quali_start: "2026-06-12T14:00:00Z" },
    { round: 22, name: "Abou Dhabi",  startDate: new Date("2026-12-05T14:00:00Z"), qualiDate: new Date("2026-12-04T14:00:00Z"), date_string: "04-06 DÉC", race_start: "2026-12-05T14:00:00Z", quali_start: "2026-12-04T14:00:00Z" },
  ] as Race[];
  const now = new Date();
  return fallback.find((r) => r.startDate > now) ?? fallback[fallback.length - 1];
}

export function formatCountdown(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return "En cours / Terminé";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${days} jours, ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
}

// Conservé pour les imports existants dans storage.ts – sera retiré une fois la migration complète.
export const calendar2026: Race[] = [];
