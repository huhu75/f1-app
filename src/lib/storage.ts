import { calendar2026 } from "./f1-data";
import { supabase } from "./supabase";

/**
 * Service de stockage pour les pronostics.
 * Désormais connecté à Supabase pour la synchronisation multi-joueurs.
 */

export interface PredictionHistory {
  timestamp: string;
  editCount: number;
  qualiPositions: string[];
  racePositions: string[];
  specialBet: string;
  changes: string;
}

export interface Prediction {
  round: number;
  playerName: string;
  qualiPositions: string[];
  racePositions: string[];
  specialBet: string;
  betWon?: boolean;
  updatedAt: string;
  editCount: number;
  history: PredictionHistory[];
}

export interface RaceResult {
  round: number;
  qualiPositions: string[];
  racePositions: string[];
}

export interface DashboardInsights {
  bestPredictedDrivers: { name: string; count: number }[];
  averageCorrectPerGP: number;
  qualiAccuracy: number;
  raceAccuracy: number;
}

export const PLAYERS = ["Hugo", "François", "Carole"];

export const storageService = {
  async savePrediction(prediction: Omit<Prediction, 'editCount' | 'history'>): Promise<void> {
    // 1. Get existing to compute history
    const { data: existing } = await supabase
      .from('predictions')
      .select('*')
      .eq('round', prediction.round)
      .eq('player_name', prediction.playerName)
      .single();

    let changes = "Initiale";
    let editCount = 1;
    let history: PredictionHistory[] = [];

    if (existing) {
      const diffs: string[] = [];
      const qDiff = prediction.qualiPositions.filter((p, i) => p !== existing.quali_positions[i]).length;
      const rDiff = prediction.racePositions.filter((p, i) => p !== existing.race_positions[i]).length;
      if (qDiff > 0) diffs.push(`${qDiff} quali`);
      if (rDiff > 0) diffs.push(`${rDiff} course`);
      if (prediction.specialBet !== existing.special_bet) diffs.push(`pari`);
      
      changes = diffs.length > 0 ? diffs.join(", ") : "Pas de changement";
      editCount = (existing.edit_count || 0) + 1;
      history = existing.history || [];
    }

    const newHistory: PredictionHistory = {
      timestamp: new Date().toISOString(),
      editCount: editCount,
      qualiPositions: [...prediction.qualiPositions],
      racePositions: [...prediction.racePositions],
      specialBet: prediction.specialBet,
      changes: changes
    };

    history.push(newHistory);

    // 2. Upsert to Supabase
    const { error } = await supabase
      .from('predictions')
      .upsert({
        round: prediction.round,
        player_name: prediction.playerName,
        quali_positions: prediction.qualiPositions,
        race_positions: prediction.racePositions,
        special_bet: prediction.specialBet,
        bet_won: existing?.bet_won, // Preserve bet status if exists
        updated_at: new Date().toISOString(),
        edit_count: editCount,
        history: history
      }, { onConflict: 'round,player_name' });

    if (error) throw error;
  },

  async getAllPredictions(): Promise<Record<number, Record<string, Prediction>>> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*');

    if (error) {
      console.error("Error fetching predictions:", error);
      return {};
    }

    // Transform flat array to nested record
    const result: Record<number, Record<string, Prediction>> = {};
    data.forEach(row => {
      if (!result[row.round]) result[row.round] = {};
      result[row.round][row.player_name] = {
        round: row.round,
        playerName: row.player_name,
        qualiPositions: row.quali_positions,
        racePositions: row.race_positions,
        specialBet: row.special_bet,
        betWon: row.bet_won,
        updatedAt: row.updated_at,
        editCount: row.edit_count,
        history: row.history
      };
    });
    return result;
  },

  async saveRaceResult(result: RaceResult): Promise<void> {
    const { error } = await supabase
      .from('race_results')
      .upsert({
        round: result.round,
        quali_positions: result.qualiPositions,
        race_positions: result.racePositions,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  },

  async getRaceResults(): Promise<Record<number, RaceResult>> {
    const { data, error } = await supabase
      .from('race_results')
      .select('*');

    if (error) {
      console.error("Error fetching results:", error);
      return {};
    }

    const result: Record<number, RaceResult> = {};
    data.forEach(row => {
      result[row.round] = {
        round: row.round,
        qualiPositions: row.quali_positions,
        racePositions: row.race_positions
      };
    });
    return result;
  },

  async updateBetStatus(round: number, playerName: string, won: boolean): Promise<void> {
    const { error } = await supabase
      .from('predictions')
      .update({ bet_won: won })
      .eq('round', round)
      .eq('player_name', playerName);

    if (error) throw error;
  },

  async getLeaderboard(): Promise<{ name: string; points: number; qualiPoints: number; racePoints: number; betPoints: number }[]> {
    const allPredictions = await this.getAllPredictions();
    const allResults = await this.getRaceResults();
    
    return PLAYERS.map(name => {
      let qualiPoints = 0;
      let racePoints = 0;
      let betPoints = 0;
      
      Object.entries(allPredictions).forEach(([roundStr, playersPreds]) => {
        const round = parseInt(roundStr);
        const pred = playersPreds[name];
        const result = allResults[round];
        
        if (pred && result) {
          pred.qualiPositions.forEach((driver, idx) => {
            if (driver && driver === result.qualiPositions[idx]) qualiPoints += 1;
          });
          pred.racePositions.forEach((driver, idx) => {
            if (driver && driver === result.racePositions[idx]) racePoints += 1;
          });
          if (pred.betWon) betPoints += 2;
        }
      });
      return { 
        name, 
        points: qualiPoints + racePoints + betPoints,
        qualiPoints,
        racePoints,
        betPoints
      };
    }).sort((a, b) => b.points - a.points);
  },

  async getInsights(): Promise<DashboardInsights> {
    const allPredictions = await this.getAllPredictions();
    const allResults = await this.getRaceResults();
    
    const driverStats: Record<string, number> = {};
    let totalCorrectQuali = 0;
    let totalCorrectRace = 0;
    let totalPositionsPredicted = 0;
    let roundsWithResults = 0;

    Object.entries(allResults).forEach(([roundStr, result]) => {
      const round = parseInt(roundStr);
      const preds = allPredictions[round];
      if (!preds || Object.keys(preds).length === 0) return;
      
      roundsWithResults++;

      Object.values(preds).forEach(pred => {
        pred.qualiPositions.forEach((driver, idx) => {
          totalPositionsPredicted++;
          if (driver && result.qualiPositions && driver === result.qualiPositions[idx]) {
            totalCorrectQuali++;
            driverStats[driver] = (driverStats[driver] || 0) + 1;
          }
        });
        pred.racePositions.forEach((driver, idx) => {
          if (driver && result.racePositions && driver === result.racePositions[idx]) {
            totalCorrectRace++;
            driverStats[driver] = (driverStats[driver] || 0) + 1;
          }
        });
      });
    });

    const bestDrivers = Object.entries(driverStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalCorrect = totalCorrectQuali + totalCorrectRace;
    
    return {
      bestPredictedDrivers: bestDrivers,
      averageCorrectPerGP: roundsWithResults ? totalCorrect / roundsWithResults : 0,
      qualiAccuracy: totalPositionsPredicted ? (totalCorrectQuali / totalPositionsPredicted) * 100 : 0,
      raceAccuracy: totalPositionsPredicted ? (totalCorrectRace / totalPositionsPredicted) * 100 : 0,
    };
  },

  async getSeasonProgress(): Promise<{
    rounds: number[];
    players: { name: string; scores: number[]; cumulative: number[] }[];
  }> {
    const allPredictions = await this.getAllPredictions();
    const allResults = await this.getRaceResults();
    const rounds = calendar2026.map(r => r.round);
    
    const results = PLAYERS.map(name => {
      let cumulative = 0;
      const scores: number[] = [];
      const cumulativeScores: number[] = [];

      rounds.forEach(round => {
        const pred = allPredictions[round]?.[name];
        const res = allResults[round];
        let roundScore = 0;

        if (pred && res) {
          if (res.qualiPositions) {
            pred.qualiPositions.forEach((driver, idx) => {
              if (driver && driver === res.qualiPositions[idx]) roundScore += 1;
            });
          }
          if (res.racePositions) {
            pred.racePositions.forEach((driver, idx) => {
              if (driver && driver === res.racePositions[idx]) roundScore += 1;
            });
          }
          if (pred.betWon) roundScore += 2;
        }

        cumulative += roundScore;
        scores.push(roundScore);
        cumulativeScores.push(cumulative);
      });

      return { name, scores, cumulative: cumulativeScores };
    });

    return { rounds, players: results };
  },

  async getPlayerStats(playerName: string) {
    const allPredictions = await this.getAllPredictions();
    const allResults = await this.getRaceResults();
    
    let totalPoints = 0;
    let totalQualiCorrect = 0;
    let totalRaceCorrect = 0;
    let betsWon = 0;
    let betsTotal = 0;
    let roundsParticipated = 0;
    const driverFrequency: Record<string, number> = {};
    const scoresByRound: { round: number; points: number }[] = [];

    Object.entries(allPredictions).forEach(([roundStr, playersPreds]) => {
      const round = parseInt(roundStr);
      const pred = playersPreds[playerName];
      const result = allResults[round];
      
      if (pred) {
        roundsParticipated++;
        let roundScore = 0;
        
        pred.qualiPositions.forEach((driver, idx) => {
          if (driver) {
            driverFrequency[driver] = (driverFrequency[driver] || 0) + 1;
            if (result?.qualiPositions && driver === result.qualiPositions[idx]) {
              roundScore += 1;
              totalQualiCorrect++;
            }
          }
        });

        pred.racePositions.forEach((driver, idx) => {
          if (driver) {
            driverFrequency[driver] = (driverFrequency[driver] || 0) + 1;
            if (result?.racePositions && driver === result.racePositions[idx]) {
              roundScore += 1;
              totalRaceCorrect++;
            }
          }
        });

        if (pred.betWon !== undefined) {
          betsTotal++;
          if (pred.betWon) {
            roundScore += 2;
            betsWon++;
          }
        }

        totalPoints += roundScore;
        scoresByRound.push({ round, points: roundScore });
      }
    });

    const favoriteDrivers = Object.entries(driverFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      playerName,
      totalPoints,
      avgPointsPerGP: roundsParticipated ? totalPoints / roundsParticipated : 0,
      qualiAccuracy: roundsParticipated ? (totalQualiCorrect / (roundsParticipated * 10)) * 100 : 0,
      raceAccuracy: roundsParticipated ? (totalRaceCorrect / (roundsParticipated * 10)) * 100 : 0,
      betWinRate: betsTotal ? (betsWon / betsTotal) * 100 : 0,
      favoriteDrivers,
      lastScores: scoresByRound.sort((a, b) => b.round - a.round).slice(0, 5).reverse()
    };
  }
};
