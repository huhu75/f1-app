import { fetchCalendar } from "./f1-data";
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

export const isFemale = (name: string): boolean => {
  const n = (name || "").trim().toLowerCase();
  return n === "carole" || n === "caroline" || n === "marie" || n === "sophie" || n === "claire" || n === "camille" || n === "lucie";
};

export interface PlayerFlairProfile {
  title: string;
  tag: string;
  icon: string;
  badgeClass: string;
  description: string;
}

export const getPlayerFlairProfile = (
  name: string,
  stats: {
    avgDistance: number;
    nearMissCount: number;
    exactCount: number;
    proximityScore: number;
    qualiPoints?: number;
    racePoints?: number;
    points?: number;
  },
  context?: {
    isLeader?: boolean;
    isBestQuali?: boolean;
    isBestNear?: boolean;
  }
): PlayerFlairProfile => {
  const female = isFemale(name);

  // 1. Leader du championnat / Maître de la course
  if (context?.isLeader) {
    return {
      title: female ? "La Reine de la Course" : "Le Maître de la Course",
      tag: "Leader du Général",
      icon: "🏁",
      badgeClass: female ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-blue-50 text-blue-600 border-blue-200",
      description: female
        ? "Excellente vision stratégique le dimanche : elle fait la différence en course et sur les paris."
        : "Excellente vision stratégique le dimanche : il fait la différence en course et sur les paris."
    };
  }

  // 2. Chasseur de pôles (le meilleur en qualifications)
  if (context?.isBestQuali || (stats.qualiPoints !== undefined && stats.racePoints !== undefined && stats.qualiPoints > stats.racePoints + 5)) {
    return {
      title: female ? "Chasseuse de Pôles" : "Chasseur de Pôles",
      tag: stats.qualiPoints ? `Leader Qualifs (${stats.qualiPoints} pts)` : "Expert du samedi",
      icon: "⏱️",
      badgeClass: "bg-indigo-50 text-indigo-600 border-indigo-200",
      description: female
        ? "Impressionnante le samedi sur le tour chrono : elle trouve les pôles et le top 5 avec brio."
        : "Impressionnant le samedi sur le tour chrono : il trouve les pôles et le top 5 avec brio."
    };
  }

  // 3. Le Frôleur d'élite (le plus de quasi-tirs / meilleur écart moyen)
  if (context?.isBestNear || stats.nearMissCount >= 45 || (stats.avgDistance > 0 && stats.avgDistance <= 2.05)) {
    return {
      title: female ? "La Frôleuse d'Élite" : "Le Frôleur d'Élite",
      tag: `${stats.nearMissCount} fois à ±1 place`,
      icon: "🤏",
      badgeClass: "bg-amber-50 text-amber-600 border-amber-200",
      description: female
        ? "Précision chirurgicale et flair affûté : constamment à un cheveu du bonus parfait !"
        : "Précision chirurgicale et flair affûté : constamment à un cheveu du bonus parfait !"
    };
  }

  // 4. Sniper (si taux d'exacts particulièrement élevé)
  if (stats.exactCount >= 45 || (stats.avgDistance > 0 && stats.avgDistance <= 1.7)) {
    return {
      title: female ? "Snipeuse du Paddock" : "Sniper du Paddock",
      tag: "Précision chirurgicale",
      icon: "🎯",
      badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
      description: female 
        ? "Elle place ses pilotes au millimètre près avec une régularité impressionnante."
        : "Il place ses pilotes au millimètre près avec une régularité impressionnante."
    };
  }

  // 5. Profil régulier par défaut
  return {
    title: female ? "Pilote Régulière" : "Pilote Régulier",
    tag: "Dans le peloton",
    icon: "🚗",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
    description: female
      ? "Une constance honorable avec de belles fulgurances le week-end."
      : "Une constance honorable avec de belles fulgurances le week-end."
  };
};

export interface DetailedStanding {
  name: string;
  points: number;
  qualiPoints: number;
  racePoints: number;
  betPoints: number;
  exactCount: number;
  nearMissCount: number;
  top10OnlyCount: number;
  missCount: number;
  totalPredicted: number;
  avgDistance: number;
  proximityScore: number;
  profile: PlayerFlairProfile;
}

export interface DriverStatSummary {
  driver: string;
  picks: number;
  exact: number;
  near: number;
  avgDist: number;
}

export interface PlayerDetailedStats {
  playerName: string;
  isFemale: boolean;
  totalPoints: number;
  avgPointsPerGP: number;
  qualiPoints: number;
  racePoints: number;
  betPoints: number;
  betsWon: number;
  betsTotal: number;
  betWinRate: number;
  exactCount: number;
  nearMissCount: number;
  top10OnlyCount: number;
  missCount: number;
  totalPredicted: number;
  avgDistance: number;
  proximityScore: number;
  profile: PlayerFlairProfile;
  qualiStats: {
    exactCount: number;
    nearMissCount: number;
    top10OnlyCount: number;
    missCount: number;
    totalPredicted: number;
    avgDistance: number;
    proximityScore: number;
  };
  raceStats: {
    exactCount: number;
    nearMissCount: number;
    top10OnlyCount: number;
    missCount: number;
    totalPredicted: number;
    avgDistance: number;
    proximityScore: number;
  };
  bestDriver: DriverStatSummary | null;
  worstDriver: DriverStatSummary | null;
  favoriteDrivers: { name: string; count: number }[];
  lastScores: { round: number; points: number }[];
}

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

  async getLeaderboard(): Promise<DetailedStanding[]> {
    const allPredictions = await this.getAllPredictions();
    const allResults = await this.getRaceResults();
    
    const rawStandings = PLAYERS.map(name => {
      let qualiPoints = 0;
      let racePoints = 0;
      let betPoints = 0;
      let exactCount = 0;
      let nearMissCount = 0;
      let top10OnlyCount = 0;
      let missCount = 0;
      let totalPredicted = 0;
      let totalDistance = 0;
      
      Object.entries(allPredictions).forEach(([roundStr, playersPreds]) => {
        const round = parseInt(roundStr);
        const pred = playersPreds[name];
        const result = allResults[round];
        
        if (pred && result) {
          // Qualifs
          if (result.qualiPositions && result.qualiPositions.length > 0) {
            pred.qualiPositions.forEach((driver, idx) => {
              if (driver) {
                totalPredicted++;
                const actualIdx = result.qualiPositions.indexOf(driver);
                if (actualIdx !== -1) {
                  const dist = Math.abs(idx - actualIdx);
                  totalDistance += dist;
                  if (dist === 0) {
                    qualiPoints += 1;
                    exactCount++;
                  } else if (dist === 1) {
                    nearMissCount++;
                  } else {
                    top10OnlyCount++;
                  }
                } else {
                  missCount++;
                  totalDistance += Math.max(1, 10 - idx);
                }
              }
            });
          }

          // Course
          if (result.racePositions && result.racePositions.length > 0) {
            pred.racePositions.forEach((driver, idx) => {
              if (driver) {
                totalPredicted++;
                const actualIdx = result.racePositions.indexOf(driver);
                if (actualIdx !== -1) {
                  const dist = Math.abs(idx - actualIdx);
                  totalDistance += dist;
                  if (dist === 0) {
                    racePoints += 1;
                    exactCount++;
                  } else if (dist === 1) {
                    nearMissCount++;
                  } else {
                    top10OnlyCount++;
                  }
                } else {
                  missCount++;
                  totalDistance += Math.max(1, 10 - idx);
                }
              }
            });
          }

          if (pred.betWon) betPoints += 2;
        }
      });

      const avgDistance = totalPredicted ? parseFloat((totalDistance / totalPredicted).toFixed(1)) : 0;
      const proximityScore = totalPredicted
        ? Math.max(0, Math.min(100, Math.round(100 * (1 - (totalDistance / (totalPredicted * 5.5))))))
        : 0;

      return { 
        name, 
        points: qualiPoints + racePoints + betPoints,
        qualiPoints,
        racePoints,
        betPoints,
        exactCount,
        nearMissCount,
        top10OnlyCount,
        missCount,
        totalPredicted,
        avgDistance,
        proximityScore
      };
    }).sort((a, b) => b.points - a.points);

    const maxQuali = Math.max(...rawStandings.map(p => p.qualiPoints), 0);
    const maxNear = Math.max(...rawStandings.map(p => p.nearMissCount), 0);
    const leaderName = rawStandings[0]?.name;

    return rawStandings.map(p => {
      const isLeader = p.name === leaderName;
      const isBestQuali = !isLeader && p.qualiPoints === maxQuali;
      const isBestNear = !isLeader && !isBestQuali && (p.nearMissCount === maxNear || p.nearMissCount >= 45);

      const profile = getPlayerFlairProfile(p.name, p, {
        isLeader,
        isBestQuali,
        isBestNear
      });

      return {
        ...p,
        profile
      };
    });
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
    const [allPredictions, allResults, calendar] = await Promise.all([
      this.getAllPredictions(),
      this.getRaceResults(),
      fetchCalendar(),
    ]);
    const rounds = calendar.map(r => r.round);
    
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

  async getPlayerStats(playerName: string): Promise<PlayerDetailedStats> {
    const allPredictions = await this.getAllPredictions();
    const allResults = await this.getRaceResults();
    
    let totalPoints = 0;
    let qualiPoints = 0;
    let racePoints = 0;
    let betsWon = 0;
    let betsTotal = 0;
    let roundsParticipated = 0;

    let exactCount = 0;
    let nearMissCount = 0;
    let top10OnlyCount = 0;
    let missCount = 0;
    let totalPredicted = 0;
    let totalDistance = 0;

    let qualiExact = 0;
    let qualiNear = 0;
    let qualiTop10Only = 0;
    let qualiMiss = 0;
    let qualiTotal = 0;
    let qualiDistance = 0;

    let raceExact = 0;
    let raceNear = 0;
    let raceTop10Only = 0;
    let raceMiss = 0;
    let raceTotal = 0;
    let raceDistance = 0;

    const driverFrequency: Record<string, number> = {};
    const driverStats: Record<string, { picks: number; exact: number; near: number; totalDist: number }> = {};
    const scoresByRound: { round: number; points: number }[] = [];

    Object.entries(allPredictions).forEach(([roundStr, playersPreds]) => {
      const round = parseInt(roundStr);
      const pred = playersPreds[playerName];
      const result = allResults[round];
      
      if (pred) {
        roundsParticipated++;
        let roundScore = 0;
        const hasResult = !!result;

        // Qualifications
        pred.qualiPositions.forEach((driver, idx) => {
          if (!driver) return;
          driverFrequency[driver] = (driverFrequency[driver] || 0) + 1;

          if (hasResult && result.qualiPositions && result.qualiPositions.length > 0) {
            totalPredicted++;
            qualiTotal++;
            const dRec = driverStats[driver] = driverStats[driver] || { picks: 0, exact: 0, near: 0, totalDist: 0 };
            dRec.picks++;

            const actualIdx = result.qualiPositions.indexOf(driver);
            if (actualIdx !== -1) {
              const dist = Math.abs(idx - actualIdx);
              totalDistance += dist;
              qualiDistance += dist;
              dRec.totalDist += dist;

              if (dist === 0) {
                roundScore += 1;
                qualiPoints += 1;
                exactCount++;
                qualiExact++;
                dRec.exact++;
              } else if (dist === 1) {
                nearMissCount++;
                qualiNear++;
                dRec.near++;
              } else {
                top10OnlyCount++;
                qualiTop10Only++;
              }
            } else {
              const penalty = Math.max(1, 10 - idx);
              totalDistance += penalty;
              qualiDistance += penalty;
              dRec.totalDist += penalty;
              missCount++;
              qualiMiss++;
            }
          }
        });

        // Course
        pred.racePositions.forEach((driver, idx) => {
          if (!driver) return;
          driverFrequency[driver] = (driverFrequency[driver] || 0) + 1;

          if (hasResult && result.racePositions && result.racePositions.length > 0) {
            totalPredicted++;
            raceTotal++;
            const dRec = driverStats[driver] = driverStats[driver] || { picks: 0, exact: 0, near: 0, totalDist: 0 };
            dRec.picks++;

            const actualIdx = result.racePositions.indexOf(driver);
            if (actualIdx !== -1) {
              const dist = Math.abs(idx - actualIdx);
              totalDistance += dist;
              raceDistance += dist;
              dRec.totalDist += dist;

              if (dist === 0) {
                roundScore += 1;
                racePoints += 1;
                exactCount++;
                raceExact++;
                dRec.exact++;
              } else if (dist === 1) {
                nearMissCount++;
                raceNear++;
                dRec.near++;
              } else {
                top10OnlyCount++;
                raceTop10Only++;
              }
            } else {
              const penalty = Math.max(1, 10 - idx);
              totalDistance += penalty;
              raceDistance += penalty;
              dRec.totalDist += penalty;
              missCount++;
              raceMiss++;
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

    const avgDistance = totalPredicted ? parseFloat((totalDistance / totalPredicted).toFixed(1)) : 0;
    const proximityScore = totalPredicted 
      ? Math.max(0, Math.min(100, Math.round(100 * (1 - (totalDistance / (totalPredicted * 5.5))))))
      : 0;

    const qualiAvgDistance = qualiTotal ? parseFloat((qualiDistance / qualiTotal).toFixed(1)) : 0;
    const qualiProximityScore = qualiTotal
      ? Math.max(0, Math.min(100, Math.round(100 * (1 - (qualiDistance / (qualiTotal * 5.5))))))
      : 0;

    const raceAvgDistance = raceTotal ? parseFloat((raceDistance / raceTotal).toFixed(1)) : 0;
    const raceProximityScore = raceTotal
      ? Math.max(0, Math.min(100, Math.round(100 * (1 - (raceDistance / (raceTotal * 5.5))))))
      : 0;

    // Drivers breakdown
    const driverList: DriverStatSummary[] = Object.entries(driverStats).map(([driver, s]) => ({
      driver,
      picks: s.picks,
      exact: s.exact,
      near: s.near,
      avgDist: s.picks ? parseFloat((s.totalDist / s.picks).toFixed(1)) : 0
    }));

    const eligibleBest = [...driverList].sort((a, b) => b.exact !== a.exact ? b.exact - a.exact : a.avgDist - b.avgDist);
    const bestDriver = eligibleBest.length > 0 && (eligibleBest[0].exact > 0 || eligibleBest[0].near > 0) ? eligibleBest[0] : (eligibleBest[0] || null);

    const eligibleWorst = [...driverList].filter(d => !bestDriver || d.driver !== bestDriver.driver).sort((a, b) => b.avgDist - a.avgDist);
    const worstDriver = eligibleWorst.length > 0 ? eligibleWorst[0] : null;

    const leaderboard = await this.getLeaderboard();
    const playerStanding = leaderboard.find(l => l.name === playerName);
    const profile = playerStanding?.profile || getPlayerFlairProfile(playerName, { avgDistance, nearMissCount, exactCount, proximityScore, qualiPoints, racePoints, points: totalPoints });

    return {
      playerName,
      isFemale: isFemale(playerName),
      totalPoints,
      avgPointsPerGP: roundsParticipated ? totalPoints / roundsParticipated : 0,
      qualiPoints,
      racePoints,
      betPoints: betsWon * 2,
      betsWon,
      betsTotal,
      betWinRate: betsTotal ? (betsWon / betsTotal) * 100 : 0,
      exactCount,
      nearMissCount,
      top10OnlyCount,
      missCount,
      totalPredicted,
      avgDistance,
      proximityScore,
      profile,
      qualiStats: {
        exactCount: qualiExact,
        nearMissCount: qualiNear,
        top10OnlyCount: qualiTop10Only,
        missCount: qualiMiss,
        totalPredicted: qualiTotal,
        avgDistance: qualiAvgDistance,
        proximityScore: qualiProximityScore
      },
      raceStats: {
        exactCount: raceExact,
        nearMissCount: raceNear,
        top10OnlyCount: raceTop10Only,
        missCount: raceMiss,
        totalPredicted: raceTotal,
        avgDistance: raceAvgDistance,
        proximityScore: raceProximityScore
      },
      bestDriver,
      worstDriver,
      favoriteDrivers,
      lastScores: scoresByRound.sort((a, b) => b.round - a.round).slice(0, 5).reverse()
    };
  }
};
