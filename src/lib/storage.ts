/**
 * Service de stockage pour les pronostics.
 * Actuellement utilise le localStorage, mais conçu pour être migré vers Supabase.
 */

export interface Prediction {
  round: number;
  playerName: string;
  qualiPositions: string[];
  racePositions: string[];
  specialBet: string;
  betWon?: boolean;
  updatedAt: string;
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
const PLAYERS = ["Hugo", "Ami 1", "Ami 2", "Ami 3"];

export const storageService = {
  async savePrediction(prediction: Prediction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof window === 'undefined') return;

    const all = await this.getAllPredictions();
    if (!all[prediction.round]) all[prediction.round] = {};
    all[prediction.round][prediction.playerName] = prediction;

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

  async getLeaderboard(): Promise<{ name: string; points: number }[]> {
    const allPredictions = await this.getAllPredictions();
    const allResults = await this.getRaceResults();
    
    return PLAYERS.map(name => {
      let points = 0;
      Object.entries(allPredictions).forEach(([roundStr, playersPreds]) => {
        const round = parseInt(roundStr);
        const pred = playersPreds[name];
        const result = allResults[round];
        
        if (pred && result) {
          // Points for Quali
          pred.qualiPositions.forEach((driver, idx) => {
            if (driver && driver === result.qualiPositions[idx]) points += 1;
          });
          // Points for Race
          pred.racePositions.forEach((driver, idx) => {
            if (driver && driver === result.racePositions[idx]) points += 1;
          });
          // Points for Special Bet
          if (pred.betWon) points += 2;
        }
      });
      return { name, points };
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
      const preds = allPredictions[round] || {};
      roundsWithResults++;

      Object.values(preds).forEach(pred => {
        pred.qualiPositions.forEach((driver, idx) => {
          totalPositionsPredicted++;
          if (driver && driver === result.qualiPositions[idx]) {
            totalCorrectQuali++;
            driverStats[driver] = (driverStats[driver] || 0) + 1;
          }
        });
        pred.racePositions.forEach((driver, idx) => {
          if (driver && driver === result.racePositions[idx]) {
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
    const playerCount = PLAYERS.length;
    
    return {
      bestPredictedDrivers: bestDrivers,
      averageCorrectPerGP: roundsWithResults ? totalCorrect / (roundsWithResults * playerCount) : 0,
      qualiAccuracy: totalPositionsPredicted ? (totalCorrectQuali / totalPositionsPredicted) * 100 : 0,
      raceAccuracy: totalPositionsPredicted ? (totalCorrectRace / totalPositionsPredicted) * 100 : 0,
    };
  }
};
