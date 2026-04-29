import { calendar2026 } from "./f1-data";

/**
 * Service de stockage pour les pronostics.
 * Actuellement utilise le localStorage, mais conçu pour être migré vers Supabase.
 */

export interface PredictionHistory {
  timestamp: string;
  editCount: number;
  qualiPositions: string[];
  racePositions: string[];
  specialBet: string;
  changes: string; // Summary of what changed
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

const PREDICTIONS_KEY = 'f1_2026_all_predictions';
const RESULTS_KEY = 'f1_2026_results';
export const PLAYERS = ["Hugo", "François", "Carole"];

export const storageService = {
  async savePrediction(prediction: Omit<Prediction, 'editCount' | 'history'>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof window === 'undefined') return;

    const all = await this.getAllPredictions();
    if (!all[prediction.round]) all[prediction.round] = {};
    
    const existing = all[prediction.round][prediction.playerName];
    
    // Calculate changes summary
    let changes = "Initiale";
    if (existing) {
      const diffs: string[] = [];
      const qDiff = prediction.qualiPositions.filter((p, i) => p !== existing.qualiPositions[i]).length;
      const rDiff = prediction.racePositions.filter((p, i) => p !== existing.racePositions[i]).length;
      if (qDiff > 0) diffs.push(`${qDiff} quali`);
      if (rDiff > 0) diffs.push(`${rDiff} course`);
      if (prediction.specialBet !== existing.specialBet) diffs.push(`pari`);
      changes = diffs.length > 0 ? diffs.join(", ") : "Pas de changement";
    }

    // Logic for history and edit count
    const newHistory: PredictionHistory = {
      timestamp: new Date().toISOString(),
      editCount: (existing?.editCount || 0) + 1,
      qualiPositions: [...prediction.qualiPositions],
      racePositions: [...prediction.racePositions],
      specialBet: prediction.specialBet,
      changes: changes
    };

    const finalPrediction: Prediction = {
      ...prediction,
      editCount: (existing?.editCount || 0) + 1,
      history: existing?.history ? [...existing.history, newHistory] : [newHistory]
    };

    all[prediction.round][prediction.playerName] = finalPrediction;
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(all));
  },

  async getAllPredictions(): Promise<Record<number, Record<string, Prediction>>> {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(PREDICTIONS_KEY);
    return data ? JSON.parse(data) : {};
  },

  async saveRaceResult(result: RaceResult): Promise<void> {
    if (typeof window === 'undefined') return;
    const results = await this.getRaceResults();
    results[result.round] = result;
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  },

  async getRaceResults(): Promise<Record<number, RaceResult>> {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(RESULTS_KEY);
    return data ? JSON.parse(data) : {};
  },

  async updateBetStatus(round: number, playerName: string, won: boolean): Promise<void> {
    const all = await this.getAllPredictions();
    if (all[round] && all[round][playerName]) {
      all[round][playerName].betWon = won;
      localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(all));
    }
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
          // Points for Quali
          pred.qualiPositions.forEach((driver, idx) => {
            if (driver && driver === result.qualiPositions[idx]) qualiPoints += 1;
          });
          // Points for Race
          pred.racePositions.forEach((driver, idx) => {
            if (driver && driver === result.racePositions[idx]) racePoints += 1;
          });
          // Points for Special Bet
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
      if (!preds || Object.keys(preds).length === 0) return; // Skip rounds without predictions
      
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
    
    // Calculate average based on actual players who played in those rounds
    const totalPredictionsMade = totalPositionsPredicted / 10; // 10 positions per player session (approx)
    
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
