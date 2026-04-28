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

export const calendar2026 = [
  { round: 1, name: "Grand Prix d'Australie", dateString: "06-08 MAR", startDate: new Date("2026-03-07T05:00:00Z") },
  { round: 2, name: "Grand Prix de Chine", dateString: "13-15 MAR", startDate: new Date("2026-03-14T07:00:00Z") },
  { round: 3, name: "Grand Prix du Japon", dateString: "27-29 MAR", startDate: new Date("2026-03-28T06:00:00Z") },
  { round: 4, name: "Grand Prix de Miami", dateString: "01-03 MAY", startDate: new Date("2026-05-02T20:00:00Z") },
  { round: 5, name: "Grand Prix du Canada", dateString: "22-24 MAY", startDate: new Date("2026-05-23T20:00:00Z") },
  { round: 6, name: "Grand Prix de Monaco", dateString: "05-07 JUN", startDate: new Date("2026-06-06T14:00:00Z") },
  { round: 7, name: "Grand Prix de Barcelone-Catalogne", dateString: "12-14 JUN", startDate: new Date("2026-06-13T14:00:00Z") },
  { round: 8, name: "Grand Prix d'Autriche", dateString: "26-28 JUN", startDate: new Date("2026-06-27T14:00:00Z") },
  { round: 9, name: "Grand Prix de Grande-Bretagne", dateString: "03-05 JUL", startDate: new Date("2026-07-04T15:00:00Z") },
  { round: 10, name: "Grand Prix de Belgique", dateString: "17-19 JUL", startDate: new Date("2026-07-18T14:00:00Z") },
  { round: 11, name: "Grand Prix de Hongrie", dateString: "24-26 JUL", startDate: new Date("2026-07-25T14:00:00Z") },
  { round: 12, name: "Grand Prix des Pays-Bas", dateString: "21-23 AUG", startDate: new Date("2026-08-22T14:00:00Z") },
  { round: 13, name: "Grand Prix d'Italie", dateString: "04-06 SEP", startDate: new Date("2026-09-05T14:00:00Z") },
  { round: 14, name: "Grand Prix d'Espagne (Madrid)", dateString: "11-13 SEP", startDate: new Date("2026-09-12T14:00:00Z") },
  { round: 15, name: "Grand Prix d'Azerbaïdjan", dateString: "24-26 SEP", startDate: new Date("2026-09-25T12:00:00Z") },
  { round: 16, name: "Grand Prix de Singapour", dateString: "09-11 OCT", startDate: new Date("2026-10-10T13:00:00Z") },
  { round: 17, name: "Grand Prix des États-Unis", dateString: "23-25 OCT", startDate: new Date("2026-10-24T21:00:00Z") },
  { round: 18, name: "Grand Prix du Mexique", dateString: "30 OCT-01 NOV", startDate: new Date("2026-10-31T21:00:00Z") },
  { round: 19, name: "Grand Prix du Brésil", dateString: "06-08 NOV", startDate: new Date("2026-11-07T18:00:00Z") },
  { round: 20, name: "Grand Prix de Las Vegas", dateString: "19-21 NOV", startDate: new Date("2026-11-21T04:00:00Z") },
  { round: 21, name: "Grand Prix du Qatar", dateString: "27-29 NOV", startDate: new Date("2026-11-28T18:00:00Z") },
  { round: 22, name: "Grand Prix d'Abou Dhabi", dateString: "04-06 DEC", startDate: new Date("2026-12-05T14:00:00Z") },
];

export function getNextRace() {
  const now = new Date();
  
  // Chercher la première course dont la date de début est dans le futur
  for (const race of calendar2026) {
    if (race.startDate > now) {
      return race;
    }
  }
  
  // Si la saison est finie
  return calendar2026[calendar2026.length - 1];
}

export function formatCountdown(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return "En cours / Terminé";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${days} jours, ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
}
