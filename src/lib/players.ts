/**
 * Configuration des joueurs : seul endroit à modifier pour ajouter
 * ou renommer un joueur, changer sa couleur ou ses accords au féminin.
 */

export interface Player {
  name: string;
  color: string;
  female: boolean;
}

export const PLAYER_CONFIG: readonly Player[] = [
  { name: "Hugo", color: "#334155", female: false },     // Slate
  { name: "François", color: "#10b981", female: false }, // Emerald
  { name: "Carole", color: "#fb7185", female: true },    // Sunset Rose
];

export const PLAYERS: string[] = PLAYER_CONFIG.map((p) => p.name);

export const DEFAULT_PLAYER = PLAYERS[0];

const FALLBACK_COLOR = "#2b62e3";

const findPlayer = (name: string) => PLAYER_CONFIG.find((p) => p.name === name);

export const getPlayerColor = (name: string): string => findPlayer(name)?.color ?? FALLBACK_COLOR;

export const isFemale = (name: string): boolean => findPlayer(name)?.female ?? false;
