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
  { round: 3,  name: "Japon",                    dateString: "27-29 MAR",      startDate: new Date("2026-03-28T06:00:00Z") }, // qualifs 07:00 CET
  { round: 4,  name: "Miami",                    dateString: "01-03 MAI",      startDate: new Date("2026-05-02T20:00:00Z") }, // qualifs 22:00 CEST
  { round: 5,  name: "Canada",                   dateString: "22-24 MAI",      startDate: new Date("2026-05-23T20:00:00Z") }, // qualifs 22:00 CEST
  { round: 6,  name: "Monaco",                   dateString: "05-07 JUN",      startDate: new Date("2026-06-06T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 7,  name: "Barcelone",                dateString: "12-14 JUN",      startDate: new Date("2026-06-13T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 8,  name: "Autriche",                 dateString: "26-28 JUN",      startDate: new Date("2026-06-27T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 9,  name: "Grande-Bretagne",          dateString: "03-05 JUL",      startDate: new Date("2026-07-04T15:00:00Z") }, // qualifs 17:00 CEST
  { round: 10, name: "Belgique",                 dateString: "17-19 JUL",      startDate: new Date("2026-07-18T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 11, name: "Hongrie",                  dateString: "24-26 JUL",      startDate: new Date("2026-07-25T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 12, name: "Pays-Bas",                 dateString: "21-23 AOÛ",      startDate: new Date("2026-08-22T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 13, name: "Italie",                   dateString: "04-06 SEP",      startDate: new Date("2026-09-05T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 14, name: "Madrid",                   dateString: "11-13 SEP",      startDate: new Date("2026-09-12T14:00:00Z") }, // qualifs 16:00 CEST
  { round: 15, name: "Azerbaïdjan",              dateString: "24-26 SEP",      startDate: new Date("2026-09-25T12:00:00Z") }, // qualifs 14:00 CEST
  { round: 16, name: "Singapour",                dateString: "09-11 OCT",      startDate: new Date("2026-10-10T13:00:00Z") }, // qualifs 15:00 CEST
  { round: 17, name: "Austin",                   dateString: "23-25 OCT",      startDate: new Date("2026-10-24T21:00:00Z") }, // qualifs 23:00 CEST
  { round: 18, name: "Mexique",                  dateString: "30 OCT-01 NOV",  startDate: new Date("2026-10-31T21:00:00Z") }, // qualifs 22:00 CET
  { round: 19, name: "Brésil",                   dateString: "06-08 NOV",      startDate: new Date("2026-11-07T18:00:00Z") }, // qualifs 19:00 CET
  { round: 20, name: "Las Vegas",                dateString: "20-22 NOV",      startDate: new Date("2026-11-21T04:00:00Z") }, // qualifs 05:00 CET
  { round: 21, name: "Qatar",                    dateString: "27-29 NOV",      startDate: new Date("2026-11-28T18:00:00Z") }, // qualifs 19:00 CET
  { round: 22, name: "Abou Dhabi",               dateString: "04-06 DÉC",      startDate: new Date("2026-12-05T14:00:00Z") }, // qualifs 15:00 CET
];

export function getNextRace() {
  const now = new Date();
  for (const race of calendar2026) {
    if (race.startDate > now) {
      return race;
    }
  }
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
