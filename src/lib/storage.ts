/**
 * Service de stockage pour les pronostics.
 * Actuellement utilise le localStorage, mais conçu pour être migré vers Supabase.
 */

export interface Prediction {
  qualiPositions: string[];
  racePositions: string[];
  specialBet: string;
  updatedAt: string;
}

const STORAGE_KEY = 'f1_2026_predictions';

export const storageService = {
  /**
   * Enregistre les pronostics localement.
   * Retourne une Promise pour rester compatible avec une future API asynchrone.
   */
  async savePredictions(prediction: Prediction): Promise<void> {
    // Simuler un délai réseau pour tester l'état de chargement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prediction));
    }
  },

  /**
   * Récupère les pronostics sauvegardés.
   */
  async getPredictions(): Promise<Prediction | null> {
    if (typeof window === 'undefined') return null;
    
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    try {
      return JSON.parse(data) as Prediction;
    } catch (e) {
      console.error("Erreur lors de la lecture des pronostics", e);
      return null;
    }
  }
};
