import {
  SportEvent,
  Snapshot,
  Forecast,
  Outcome,
  DataIssue
} from '../types/ticketing';

// Reference date for simulation: October 9, 2026
export const SIMULATED_NOW = '2026-10-09T10:42:00Z';

export const RAW_EVENTS: SportEvent[] = [
  // --- AKTYWNE EVENTY ---
  {
    id: 'evt-lech-jaga',
    name: 'Lech Poznań – Jagiellonia Białystok',
    homeTeam: 'Lech Poznań',
    awayTeam: 'Jagiellonia Białystok',
    club: 'Lech Poznań',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-27T17:30:00Z', // 18 dni do eventu
    capacity: 42837,
    status: 'active'
  },
  {
    id: 'evt-lech-legia',
    name: 'Lech Poznań – Legia Warszawa',
    homeTeam: 'Lech Poznań',
    awayTeam: 'Legia Warszawa',
    club: 'Lech Poznań',
    competition: 'Ekstraklasa',
    eventDate: '2026-11-08T19:00:00Z', // 30 dni do eventu
    capacity: 42837,
    status: 'active'
  },
  {
    id: 'evt-jaga-cracovia',
    name: 'Jagiellonia Białystok – Cracovia',
    homeTeam: 'Jagiellonia Białystok',
    awayTeam: 'Cracovia',
    club: 'Jagiellonia Białystok',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-18T14:45:00Z', // 9 dni do eventu
    capacity: 22372,
    status: 'active'
  },
  {
    id: 'evt-pogon-gornik',
    name: 'Pogoń Szczecin – Górnik Zabrze',
    homeTeam: 'Pogoń Szczecin',
    awayTeam: 'Górnik Zabrze',
    club: 'Pogoń Szczecin',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-24T20:15:00Z', // 15 dni do eventu
    capacity: 21163,
    status: 'active'
  },
  {
    id: 'evt-legia-rakow',
    name: 'Legia Warszawa – Raków Częstochowa',
    homeTeam: 'Legia Warszawa',
    awayTeam: 'Raków Częstochowa',
    club: 'Legia Warszawa',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-16T20:30:00Z', // 7 dni do eventu
    capacity: 31103,
    status: 'active'
  },
  {
    id: 'evt-gornik-slask',
    name: 'Górnik Zabrze – Śląsk Wrocław',
    homeTeam: 'Górnik Zabrze',
    awayTeam: 'Śląsk Wrocław',
    club: 'Górnik Zabrze',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-21T18:00:00Z', // 12 dni do eventu
    capacity: 24563,
    status: 'active'
  },
  {
    id: 'evt-rakow-pogon',
    name: 'Raków Częstochowa – Pogoń Szczecin',
    homeTeam: 'Raków Częstochowa',
    awayTeam: 'Pogoń Szczecin',
    club: 'Raków Częstochowa',
    competition: 'Ekstraklasa',
    eventDate: '2026-11-01T15:00:00Z', // 23 dni do eventu
    capacity: 5500,
    status: 'active'
  },
  {
    id: 'evt-widzew-korona',
    name: 'Widzew Łódź – Korona Kielce',
    homeTeam: 'Widzew Łódź',
    awayTeam: 'Korona Kielce',
    club: 'Widzew Łódź',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-12T19:00:00Z', // 3 dni do eventu
    capacity: 18018,
    status: 'active'
  },
  {
    id: 'evt-cracovia-motor',
    name: 'Cracovia – Motor Lublin',
    homeTeam: 'Cracovia',
    awayTeam: 'Motor Lublin',
    club: 'Cracovia',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-25T12:15:00Z', // 16 dni do eventu
    capacity: 15114,
    status: 'active'
  },
  {
    id: 'evt-slask-piast',
    name: 'Śląsk Wrocław – Piast Gliwice',
    homeTeam: 'Śląsk Wrocław',
    awayTeam: 'Piast Gliwice',
    club: 'Śląsk Wrocław',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-31T17:30:00Z', // 22 dni do eventu
    capacity: 42771,
    status: 'active'
  },
  {
    id: 'evt-lech-odra',
    name: 'Lech Poznań – Odra Opole',
    homeTeam: 'Lech Poznań',
    awayTeam: 'Odra Opole',
    club: 'Lech Poznań',
    competition: 'Puchar Polski',
    eventDate: '2026-10-29T20:30:00Z', // 20 dni do eventu
    capacity: 42837,
    status: 'active'
  },
  {
    id: 'evt-katowice-radomiak',
    name: 'GKS Katowice – Radomiak Radom',
    homeTeam: 'GKS Katowice',
    awayTeam: 'Radomiak Radom',
    club: 'GKS Katowice',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-14T18:00:00Z', // 5 dni do eventu
    capacity: 9511,
    status: 'active'
  },

  // --- ZAKOŃCZONE EVENTY (Do oceny skuteczności modelu) ---
  {
    id: 'evt-lech-motor-done',
    name: 'Lech Poznań – Motor Lublin',
    homeTeam: 'Lech Poznań',
    awayTeam: 'Motor Lublin',
    club: 'Lech Poznań',
    competition: 'Ekstraklasa',
    eventDate: '2026-10-04T17:30:00Z',
    capacity: 42837,
    status: 'completed'
  },
  {
    id: 'evt-legia-gornik-done',
    name: 'Legia Warszawa – Górnik Zabrze',
    homeTeam: 'Legia Warszawa',
    awayTeam: 'Górnik Zabrze',
    club: 'Legia Warszawa',
    competition: 'Ekstraklasa',
    eventDate: '2026-09-28T17:30:00Z',
    capacity: 31103,
    status: 'completed'
  },
  {
    id: 'evt-jaga-lechia-done',
    name: 'Jagiellonia Białystok – Lechia Gdańsk',
    homeTeam: 'Jagiellonia Białystok',
    awayTeam: 'Lechia Gdańsk',
    club: 'Jagiellonia Białystok',
    competition: 'Ekstraklasa',
    eventDate: '2026-09-21T14:45:00Z',
    capacity: 22372,
    status: 'completed'
  },
  {
    id: 'evt-pogon-legia-done',
    name: 'Pogoń Szczecin – Legia Warszawa',
    homeTeam: 'Pogoń Szczecin',
    awayTeam: 'Legia Warszawa',
    club: 'Pogoń Szczecin',
    competition: 'Ekstraklasa',
    eventDate: '2026-09-15T20:15:00Z',
    capacity: 21163,
    status: 'completed'
  },
  {
    id: 'evt-slask-cracovia-done',
    name: 'Śląsk Wrocław – Cracovia',
    homeTeam: 'Śląsk Wrocław',
    awayTeam: 'Cracovia',
    club: 'Śląsk Wrocław',
    competition: 'Ekstraklasa',
    eventDate: '2026-09-12T17:30:00Z',
    capacity: 42771,
    status: 'completed'
  },
  {
    id: 'evt-rakow-zaglebie-done',
    name: 'Raków Częstochowa – Zagłębie Lubin',
    homeTeam: 'Raków Częstochowa',
    awayTeam: 'Zagłębie Lubin',
    club: 'Raków Częstochowa',
    competition: 'Ekstraklasa',
    eventDate: '2026-09-06T15:00:00Z',
    capacity: 5500,
    status: 'completed'
  }
];

export const RAW_SNAPSHOTS: Snapshot[] = [
  // --- Lech Poznań – Jagiellonia Białystok (evt-lech-jaga, 2026-10-27) ---
  { id: 'snp-lj-1', eventId: 'evt-lech-jaga', timestamp: '2026-09-27T10:00:00Z', sold: 7800 },
  { id: 'snp-lj-2', eventId: 'evt-lech-jaga', timestamp: '2026-10-01T10:00:00Z', sold: 9420 },
  { id: 'snp-lj-3', eventId: 'evt-lech-jaga', timestamp: '2026-10-04T10:00:00Z', sold: 12300 },
  { id: 'snp-lj-4', eventId: 'evt-lech-jaga', timestamp: '2026-10-07T10:00:00Z', sold: 15900 },
  { id: 'snp-lj-5', eventId: 'evt-lech-jaga', timestamp: '2026-10-09T08:30:00Z', sold: 18420 },

  // --- Lech Poznań – Legia Warszawa (evt-lech-legia, 2026-11-08) ---
  { id: 'snp-ll-1', eventId: 'evt-lech-legia', timestamp: '2026-10-02T12:00:00Z', sold: 14200 },
  { id: 'snp-ll-2', eventId: 'evt-lech-legia', timestamp: '2026-10-08T18:00:00Z', sold: 22100 },

  // --- Jagiellonia Białystok – Cracovia (evt-jaga-cracovia, 2026-10-18) ---
  { id: 'snp-jc-1', eventId: 'evt-jaga-cracovia', timestamp: '2026-09-20T10:00:00Z', sold: 5200 },
  { id: 'snp-jc-2', eventId: 'evt-jaga-cracovia', timestamp: '2026-09-28T10:00:00Z', sold: 8900 },
  { id: 'snp-jc-3', eventId: 'evt-jaga-cracovia', timestamp: '2026-10-05T10:00:00Z', sold: 12400 },
  { id: 'snp-jc-4', eventId: 'evt-jaga-cracovia', timestamp: '2026-10-08T22:00:00Z', sold: 15120 },

  // --- Pogoń Szczecin – Górnik Zabrze (evt-pogon-gornik, 2026-10-24) ---
  { id: 'snp-pg-1', eventId: 'evt-pogon-gornik', timestamp: '2026-09-26T10:00:00Z', sold: 6100 },
  { id: 'snp-pg-2', eventId: 'evt-pogon-gornik', timestamp: '2026-10-02T10:00:00Z', sold: 9850 },
  { id: 'snp-pg-3', eventId: 'evt-pogon-gornik', timestamp: '2026-10-09T07:15:00Z', sold: 13200 },

  // --- Legia Warszawa – Raków Częstochowa (evt-legia-rakow, 2026-10-16) ---
  { id: 'snp-lr-1', eventId: 'evt-legia-rakow', timestamp: '2026-09-18T10:00:00Z', sold: 11000 },
  { id: 'snp-lr-2', eventId: 'evt-legia-rakow', timestamp: '2026-09-26T10:00:00Z', sold: 17500 },
  { id: 'snp-lr-3', eventId: 'evt-legia-rakow', timestamp: '2026-10-02T10:00:00Z', sold: 22800 },
  { id: 'snp-lr-4', eventId: 'evt-legia-rakow', timestamp: '2026-10-07T10:00:00Z', sold: 26400 },
  { id: 'snp-lr-5', eventId: 'evt-legia-rakow', timestamp: '2026-10-09T09:00:00Z', sold: 28150 },

  // --- Górnik Zabrze – Śląsk Wrocław (evt-gornik-slask, 2026-10-21) ---
  { id: 'snp-gs-1', eventId: 'evt-gornik-slask', timestamp: '2026-09-23T10:00:00Z', sold: 4800 },
  { id: 'snp-gs-2', eventId: 'evt-gornik-slask', timestamp: '2026-10-01T10:00:00Z', sold: 9100 },
  { id: 'snp-gs-3', eventId: 'evt-gornik-slask', timestamp: '2026-10-08T15:30:00Z', sold: 14600 },

  // --- Raków Częstochowa – Pogoń Szczecin (evt-rakow-pogon, 2026-11-01) ---
  { id: 'snp-rp-1', eventId: 'evt-rakow-pogon', timestamp: '2026-10-03T10:00:00Z', sold: 2100 },
  { id: 'snp-rp-2', eventId: 'evt-rakow-pogon', timestamp: '2026-10-08T11:00:00Z', sold: 3450 },

  // --- Widzew Łódź – Korona Kielce (evt-widzew-korona, 2026-10-12) - PROBLEM: unusual sales drop! ---
  { id: 'snp-wk-1', eventId: 'evt-widzew-korona', timestamp: '2026-09-22T10:00:00Z', sold: 11200 },
  { id: 'snp-wk-2', eventId: 'evt-widzew-korona', timestamp: '2026-09-29T10:00:00Z', sold: 14800 },
  { id: 'snp-wk-3', eventId: 'evt-widzew-korona', timestamp: '2026-10-06T10:00:00Z', sold: 16950 },
  { id: 'snp-wk-4', eventId: 'evt-widzew-korona', timestamp: '2026-10-08T15:00:00Z', sold: 16400 }, // drop due to ticket release/refund bug!

  // --- Cracovia – Motor Lublin (evt-cracovia-motor, 2026-10-25) ---
  { id: 'snp-cm-1', eventId: 'evt-cracovia-motor', timestamp: '2026-09-28T10:00:00Z', sold: 3100 },
  { id: 'snp-cm-2', eventId: 'evt-cracovia-motor', timestamp: '2026-10-07T12:00:00Z', sold: 6800 },

  // --- Śląsk Wrocław – Piast Gliwice (evt-slask-piast, 2026-10-31) - PROBLEM: stale snapshot (19h temu) ---
  { id: 'snp-sp-1', eventId: 'evt-slask-piast', timestamp: '2026-10-02T10:00:00Z', sold: 5400 },
  { id: 'snp-sp-2', eventId: 'evt-slask-piast', timestamp: '2026-10-08T15:42:00Z', sold: 9800 },

  // --- Lech Poznań – Odra Opole (evt-lech-odra, 2026-10-29) - BRAK PROGNOZY ---
  { id: 'snp-lo-1', eventId: 'evt-lech-odra', timestamp: '2026-10-07T10:00:00Z', sold: 4200 },
  { id: 'snp-lo-2', eventId: 'evt-lech-odra', timestamp: '2026-10-09T06:00:00Z', sold: 5900 },

  // --- GKS Katowice – Radomiak Radom (evt-katowice-radomiak, 2026-10-14) ---
  { id: 'snp-kr-1', eventId: 'evt-katowice-radomiak', timestamp: '2026-09-24T10:00:00Z', sold: 3500 },
  { id: 'snp-kr-2', eventId: 'evt-katowice-radomiak', timestamp: '2026-10-02T10:00:00Z', sold: 5800 },
  { id: 'snp-kr-3', eventId: 'evt-katowice-radomiak', timestamp: '2026-10-08T19:00:00Z', sold: 7600 },

  // === ZAKOŃCZONE EVENTY ===
  // Lech Poznań – Motor Lublin (evt-lech-motor-done, 2026-10-04)
  { id: 'snp-lmd-1', eventId: 'evt-lech-motor-done', timestamp: '2026-09-04T10:00:00Z', sold: 7800 },
  { id: 'snp-lmd-2', eventId: 'evt-lech-motor-done', timestamp: '2026-09-14T10:00:00Z', sold: 11400 },
  { id: 'snp-lmd-3', eventId: 'evt-lech-motor-done', timestamp: '2026-09-20T10:00:00Z', sold: 14800 },
  { id: 'snp-lmd-4', eventId: 'evt-lech-motor-done', timestamp: '2026-09-27T10:00:00Z', sold: 19600 },
  { id: 'snp-lmd-5', eventId: 'evt-lech-motor-done', timestamp: '2026-10-01T10:00:00Z', sold: 23900 },
  { id: 'snp-lmd-6', eventId: 'evt-lech-motor-done', timestamp: '2026-10-04T12:00:00Z', sold: 26650 },

  // Legia Warszawa – Górnik Zabrze (evt-legia-gornik-done, 2026-09-28)
  { id: 'snp-lgd-1', eventId: 'evt-legia-gornik-done', timestamp: '2026-08-29T10:00:00Z', sold: 8200 },
  { id: 'snp-lgd-2', eventId: 'evt-legia-gornik-done', timestamp: '2026-09-08T10:00:00Z', sold: 13500 },
  { id: 'snp-lgd-3', eventId: 'evt-legia-gornik-done', timestamp: '2026-09-18T10:00:00Z', sold: 18900 },
  { id: 'snp-lgd-4', eventId: 'evt-legia-gornik-done', timestamp: '2026-09-24T10:00:00Z', sold: 22600 },
  { id: 'snp-lgd-5', eventId: 'evt-legia-gornik-done', timestamp: '2026-09-27T10:00:00Z', sold: 24700 },

  // Jagiellonia Białystok – Lechia Gdańsk (evt-jaga-lechia-done, 2026-09-21)
  { id: 'snp-jld-1', eventId: 'evt-jaga-lechia-done', timestamp: '2026-08-22T10:00:00Z', sold: 4100 },
  { id: 'snp-jld-2', eventId: 'evt-jaga-lechia-done', timestamp: '2026-09-01T10:00:00Z', sold: 7600 },
  { id: 'snp-jld-3', eventId: 'evt-jaga-lechia-done', timestamp: '2026-09-10T10:00:00Z', sold: 11200 },
  { id: 'snp-jld-4', eventId: 'evt-jaga-lechia-done', timestamp: '2026-09-17T10:00:00Z', sold: 15400 },
  { id: 'snp-jld-5', eventId: 'evt-jaga-lechia-done', timestamp: '2026-09-20T18:00:00Z', sold: 17850 },

  // Pogoń Szczecin – Legia Warszawa (evt-pogon-legia-done, 2026-09-15) - HIT SEZONU
  { id: 'snp-pld-1', eventId: 'evt-pogon-legia-done', timestamp: '2026-08-16T10:00:00Z', sold: 9200 },
  { id: 'snp-pld-2', eventId: 'evt-pogon-legia-done', timestamp: '2026-08-26T10:00:00Z', sold: 14500 },
  { id: 'snp-pld-3', eventId: 'evt-pogon-legia-done', timestamp: '2026-09-05T10:00:00Z', sold: 18900 },
  { id: 'snp-pld-4', eventId: 'evt-pogon-legia-done', timestamp: '2026-09-12T10:00:00Z', sold: 20600 },
  { id: 'snp-pld-5', eventId: 'evt-pogon-legia-done', timestamp: '2026-09-14T20:00:00Z', sold: 21050 },

  // Śląsk Wrocław – Cracovia (evt-slask-cracovia-done, 2026-09-12) - POOR FORECAST (ulewa, mecz bez frekwencji)
  { id: 'snp-scd-1', eventId: 'evt-slask-cracovia-done', timestamp: '2026-08-13T10:00:00Z', sold: 5800 },
  { id: 'snp-scd-2', eventId: 'evt-slask-cracovia-done', timestamp: '2026-08-23T10:00:00Z', sold: 8900 },
  { id: 'snp-scd-3', eventId: 'evt-slask-cracovia-done', timestamp: '2026-09-02T10:00:00Z', sold: 11400 },
  { id: 'snp-scd-4', eventId: 'evt-slask-cracovia-done', timestamp: '2026-09-09T10:00:00Z', sold: 12900 },
  { id: 'snp-scd-5', eventId: 'evt-slask-cracovia-done', timestamp: '2026-09-11T19:00:00Z', sold: 13350 },

  // Raków Częstochowa – Zagłębie Lubin (evt-rakow-zaglebie-done, 2026-09-06)
  { id: 'snp-rzd-1', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-08-07T10:00:00Z', sold: 2100 },
  { id: 'snp-rzd-2', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-08-17T10:00:00Z', sold: 3300 },
  { id: 'snp-rzd-3', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-08-27T10:00:00Z', sold: 4400 },
  { id: 'snp-rzd-4', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-09-03T10:00:00Z', sold: 4950 }
];

export const RAW_FORECASTS: Forecast[] = [
  // --- Lech Poznań – Jagiellonia Białystok ---
  { id: 'fc-lj-1', eventId: 'evt-lech-jaga', timestamp: '2026-09-27T11:00:00Z', predictedFinalSales: 23800, sourceSnapshotId: 'snp-lj-1' },
  { id: 'fc-lj-2', eventId: 'evt-lech-jaga', timestamp: '2026-10-01T11:00:00Z', predictedFinalSales: 25100, sourceSnapshotId: 'snp-lj-2' },
  { id: 'fc-lj-3', eventId: 'evt-lech-jaga', timestamp: '2026-10-04T11:00:00Z', predictedFinalSales: 26000, sourceSnapshotId: 'snp-lj-3' },
  { id: 'fc-lj-4', eventId: 'evt-lech-jaga', timestamp: '2026-10-07T11:00:00Z', predictedFinalSales: 26500, sourceSnapshotId: 'snp-lj-4' },
  { id: 'fc-lj-5', eventId: 'evt-lech-jaga', timestamp: '2026-10-09T09:15:00Z', predictedFinalSales: 26850, sourceSnapshotId: 'snp-lj-5' },

  // --- Lech Poznań – Legia Warszawa ---
  { id: 'fc-ll-1', eventId: 'evt-lech-legia', timestamp: '2026-10-02T13:00:00Z', predictedFinalSales: 39500, sourceSnapshotId: 'snp-ll-1' },
  { id: 'fc-ll-2', eventId: 'evt-lech-legia', timestamp: '2026-10-08T19:00:00Z', predictedFinalSales: 41200, sourceSnapshotId: 'snp-ll-2' },

  // --- Jagiellonia Białystok – Cracovia ---
  { id: 'fc-jc-1', eventId: 'evt-jaga-cracovia', timestamp: '2026-09-20T11:00:00Z', predictedFinalSales: 16800, sourceSnapshotId: 'snp-jc-1' },
  { id: 'fc-jc-2', eventId: 'evt-jaga-cracovia', timestamp: '2026-09-28T11:00:00Z', predictedFinalSales: 17400, sourceSnapshotId: 'snp-jc-2' },
  { id: 'fc-jc-3', eventId: 'evt-jaga-cracovia', timestamp: '2026-10-05T11:00:00Z', predictedFinalSales: 17950, sourceSnapshotId: 'snp-jc-3' },
  { id: 'fc-jc-4', eventId: 'evt-jaga-cracovia', timestamp: '2026-10-09T01:00:00Z', predictedFinalSales: 18200, sourceSnapshotId: 'snp-jc-4' },

  // --- Pogoń Szczecin – Górnik Zabrze ---
  { id: 'fc-pg-1', eventId: 'evt-pogon-gornik', timestamp: '2026-09-26T11:00:00Z', predictedFinalSales: 15400, sourceSnapshotId: 'snp-pg-1' },
  { id: 'fc-pg-2', eventId: 'evt-pogon-gornik', timestamp: '2026-10-02T11:00:00Z', predictedFinalSales: 16200, sourceSnapshotId: 'snp-pg-2' },
  { id: 'fc-pg-3', eventId: 'evt-pogon-gornik', timestamp: '2026-10-09T08:00:00Z', predictedFinalSales: 17100, sourceSnapshotId: 'snp-pg-3' },

  // --- Legia Warszawa – Raków Częstochowa ---
  { id: 'fc-lr-1', eventId: 'evt-legia-rakow', timestamp: '2026-09-18T11:00:00Z', predictedFinalSales: 27800, sourceSnapshotId: 'snp-lr-1' },
  { id: 'fc-lr-2', eventId: 'evt-legia-rakow', timestamp: '2026-09-26T11:00:00Z', predictedFinalSales: 28900, sourceSnapshotId: 'snp-lr-2' },
  { id: 'fc-lr-3', eventId: 'evt-legia-rakow', timestamp: '2026-10-02T11:00:00Z', predictedFinalSales: 29400, sourceSnapshotId: 'snp-lr-3' },
  { id: 'fc-lr-4', eventId: 'evt-legia-rakow', timestamp: '2026-10-07T11:00:00Z', predictedFinalSales: 29850, sourceSnapshotId: 'snp-lr-4' },
  { id: 'fc-lr-5', eventId: 'evt-legia-rakow', timestamp: '2026-10-09T09:30:00Z', predictedFinalSales: 30100, sourceSnapshotId: 'snp-lr-5' },

  // --- Górnik Zabrze – Śląsk Wrocław ---
  { id: 'fc-gs-1', eventId: 'evt-gornik-slask', timestamp: '2026-09-23T11:00:00Z', predictedFinalSales: 17200, sourceSnapshotId: 'snp-gs-1' },
  { id: 'fc-gs-2', eventId: 'evt-gornik-slask', timestamp: '2026-10-01T11:00:00Z', predictedFinalSales: 18100, sourceSnapshotId: 'snp-gs-2' },
  { id: 'fc-gs-3', eventId: 'evt-gornik-slask', timestamp: '2026-10-08T16:00:00Z', predictedFinalSales: 18900, sourceSnapshotId: 'snp-gs-3' },

  // --- Raków Częstochowa – Pogoń Szczecin ---
  { id: 'fc-rp-1', eventId: 'evt-rakow-pogon', timestamp: '2026-10-03T11:00:00Z', predictedFinalSales: 4900, sourceSnapshotId: 'snp-rp-1' },
  { id: 'fc-rp-2', eventId: 'evt-rakow-pogon', timestamp: '2026-10-08T12:00:00Z', predictedFinalSales: 5150, sourceSnapshotId: 'snp-rp-2' },

  // --- Widzew Łódź – Korona Kielce ---
  { id: 'fc-wk-1', eventId: 'evt-widzew-korona', timestamp: '2026-09-22T11:00:00Z', predictedFinalSales: 17200, sourceSnapshotId: 'snp-wk-1' },
  { id: 'fc-wk-2', eventId: 'evt-widzew-korona', timestamp: '2026-09-29T11:00:00Z', predictedFinalSales: 17500, sourceSnapshotId: 'snp-wk-2' },
  { id: 'fc-wk-3', eventId: 'evt-widzew-korona', timestamp: '2026-10-06T11:00:00Z', predictedFinalSales: 17800, sourceSnapshotId: 'snp-wk-3' },
  // Notice: no forecast computed yet for the problematic drop snapshot snp-wk-4!

  // --- Cracovia – Motor Lublin ---
  { id: 'fc-cm-1', eventId: 'evt-cracovia-motor', timestamp: '2026-09-28T11:00:00Z', predictedFinalSales: 9800, sourceSnapshotId: 'snp-cm-1' },
  { id: 'fc-cm-2', eventId: 'evt-cracovia-motor', timestamp: '2026-10-07T13:00:00Z', predictedFinalSales: 10450, sourceSnapshotId: 'snp-cm-2' },

  // --- Śląsk Wrocław – Piast Gliwice ---
  { id: 'fc-sp-1', eventId: 'evt-slask-piast', timestamp: '2026-10-02T11:00:00Z', predictedFinalSales: 16400, sourceSnapshotId: 'snp-sp-1' },
  { id: 'fc-sp-2', eventId: 'evt-slask-piast', timestamp: '2026-10-08T16:00:00Z', predictedFinalSales: 17200, sourceSnapshotId: 'snp-sp-2' },

  // --- Lech Poznań – Odra Opole: Brak prognozy! Żadnego rekordu w RAW_FORECASTS ---

  // --- GKS Katowice – Radomiak Radom ---
  { id: 'fc-kr-1', eventId: 'evt-katowice-radomiak', timestamp: '2026-09-24T11:00:00Z', predictedFinalSales: 8400, sourceSnapshotId: 'snp-kr-1' },
  { id: 'fc-kr-2', eventId: 'evt-katowice-radomiak', timestamp: '2026-10-02T11:00:00Z', predictedFinalSales: 8900, sourceSnapshotId: 'snp-kr-2' },
  { id: 'fc-kr-3', eventId: 'evt-katowice-radomiak', timestamp: '2026-10-08T20:00:00Z', predictedFinalSales: 9100, sourceSnapshotId: 'snp-kr-3' },

  // === ZAKOŃCZONE EVENTY FORECASTS (Zgodne z przykładem z promptu) ===
  // Lech Poznań – Motor Lublin: Actual = 26 740
  // 30 dni: 22 400
  // 20 dni: 24 100
  // 14 dni: 25 200
  // 7 dni: 26 500
  // 3 dni: 26 900
  { id: 'fc-lmd-1', eventId: 'evt-lech-motor-done', timestamp: '2026-09-04T11:00:00Z', predictedFinalSales: 22400, sourceSnapshotId: 'snp-lmd-1' },
  { id: 'fc-lmd-2', eventId: 'evt-lech-motor-done', timestamp: '2026-09-14T11:00:00Z', predictedFinalSales: 24100, sourceSnapshotId: 'snp-lmd-2' },
  { id: 'fc-lmd-3', eventId: 'evt-lech-motor-done', timestamp: '2026-09-20T11:00:00Z', predictedFinalSales: 25200, sourceSnapshotId: 'snp-lmd-3' },
  { id: 'fc-lmd-4', eventId: 'evt-lech-motor-done', timestamp: '2026-09-27T11:00:00Z', predictedFinalSales: 26500, sourceSnapshotId: 'snp-lmd-4' },
  { id: 'fc-lmd-5', eventId: 'evt-lech-motor-done', timestamp: '2026-10-01T11:00:00Z', predictedFinalSales: 26900, sourceSnapshotId: 'snp-lmd-5' },

  // Legia Warszawa – Górnik Zabrze: Actual = 25 150
  { id: 'fc-lgd-1', eventId: 'evt-legia-gornik-done', timestamp: '2026-08-29T11:00:00Z', predictedFinalSales: 23100, sourceSnapshotId: 'snp-lgd-1' },
  { id: 'fc-lgd-2', eventId: 'evt-legia-gornik-done', timestamp: '2026-09-08T11:00:00Z', predictedFinalSales: 24200, sourceSnapshotId: 'snp-lgd-2' },
  { id: 'fc-lgd-3', eventId: 'evt-legia-gornik-done', timestamp: '2026-09-18T11:00:00Z', predictedFinalSales: 24800, sourceSnapshotId: 'snp-lgd-3' },
  { id: 'fc-lgd-4', eventId: 'evt-legia-gornik-done', timestamp: '2026-09-24T11:00:00Z', predictedFinalSales: 25050, sourceSnapshotId: 'snp-lgd-4' },

  // Jagiellonia Białystok – Lechia Gdańsk: Actual = 18 100
  { id: 'fc-jld-1', eventId: 'evt-jaga-lechia-done', timestamp: '2026-08-22T11:00:00Z', predictedFinalSales: 16500, sourceSnapshotId: 'snp-jld-1' },
  { id: 'fc-jld-2', eventId: 'evt-jaga-lechia-done', timestamp: '2026-09-01T11:00:00Z', predictedFinalSales: 17200, sourceSnapshotId: 'snp-jld-2' },
  { id: 'fc-jld-3', eventId: 'evt-jaga-lechia-done', timestamp: '2026-09-10T11:00:00Z', predictedFinalSales: 17800, sourceSnapshotId: 'snp-jld-3' },
  { id: 'fc-jld-4', eventId: 'evt-jaga-lechia-done', timestamp: '2026-09-17T11:00:00Z', predictedFinalSales: 18250, sourceSnapshotId: 'snp-jld-4' },

  // Pogoń Szczecin – Legia Warszawa: Actual = 21 163 (Wyprzedany komplet!)
  { id: 'fc-pld-1', eventId: 'evt-pogon-legia-done', timestamp: '2026-08-16T11:00:00Z', predictedFinalSales: 20400, sourceSnapshotId: 'snp-pld-1' },
  { id: 'fc-pld-2', eventId: 'evt-pogon-legia-done', timestamp: '2026-08-26T11:00:00Z', predictedFinalSales: 20900, sourceSnapshotId: 'snp-pld-2' },
  { id: 'fc-pld-3', eventId: 'evt-pogon-legia-done', timestamp: '2026-09-05T11:00:00Z', predictedFinalSales: 21100, sourceSnapshotId: 'snp-pld-3' },
  { id: 'fc-pld-4', eventId: 'evt-pogon-legia-done', timestamp: '2026-09-12T11:00:00Z', predictedFinalSales: 21150, sourceSnapshotId: 'snp-pld-4' },

  // Śląsk Wrocław – Cracovia: Słaba prognoza (ulewa, Actual: 13 420 vs forecast: 17 800)
  { id: 'fc-scd-1', eventId: 'evt-slask-cracovia-done', timestamp: '2026-08-13T11:00:00Z', predictedFinalSales: 21500, sourceSnapshotId: 'snp-scd-1' },
  { id: 'fc-scd-2', eventId: 'evt-slask-cracovia-done', timestamp: '2026-08-23T11:00:00Z', predictedFinalSales: 20200, sourceSnapshotId: 'snp-scd-2' },
  { id: 'fc-scd-3', eventId: 'evt-slask-cracovia-done', timestamp: '2026-09-02T11:00:00Z', predictedFinalSales: 18900, sourceSnapshotId: 'snp-scd-3' },
  { id: 'fc-scd-4', eventId: 'evt-slask-cracovia-done', timestamp: '2026-09-09T11:00:00Z', predictedFinalSales: 17800, sourceSnapshotId: 'snp-scd-4' },

  // Raków Częstochowa – Zagłębie Lubin: Actual = 5 120
  { id: 'fc-rzd-1', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-08-07T11:00:00Z', predictedFinalSales: 4700, sourceSnapshotId: 'snp-rzd-1' },
  { id: 'fc-rzd-2', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-08-17T11:00:00Z', predictedFinalSales: 4950, sourceSnapshotId: 'snp-rzd-2' },
  { id: 'fc-rzd-3', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-08-27T11:00:00Z', predictedFinalSales: 5080, sourceSnapshotId: 'snp-rzd-3' },
  { id: 'fc-rzd-4', eventId: 'evt-rakow-zaglebie-done', timestamp: '2026-09-03T11:00:00Z', predictedFinalSales: 5150, sourceSnapshotId: 'snp-rzd-4' }
];

export const RAW_OUTCOMES: Outcome[] = [
  { eventId: 'evt-lech-motor-done', actualFinalSales: 26740, recordedAt: '2026-10-04T20:30:00Z' },
  { eventId: 'evt-legia-gornik-done', actualFinalSales: 25150, recordedAt: '2026-09-28T20:30:00Z' },
  { eventId: 'evt-jaga-lechia-done', actualFinalSales: 18100, recordedAt: '2026-09-21T17:45:00Z' },
  { eventId: 'evt-pogon-legia-done', actualFinalSales: 21163, recordedAt: '2026-09-15T23:00:00Z' },
  { eventId: 'evt-slask-cracovia-done', actualFinalSales: 13420, recordedAt: '2026-09-12T20:30:00Z' },
  { eventId: 'evt-rakow-zaglebie-done', actualFinalSales: 5120, recordedAt: '2026-09-06T18:00:00Z' }
];

export const RAW_DATA_ISSUES: DataIssue[] = [
  {
    id: 'iss-1',
    eventId: 'evt-widzew-korona',
    type: 'unusual_sales_drop',
    description: 'Liczba sprzedanych biletów spadła o 550 szt. względem poprzedniego snapshotu (16 950 → 16 400). Prawdopodobny błąd zwrotów lub anulowania rezerwacji.',
    detectedAt: '2026-10-08T15:05:00Z',
    severity: 'critical'
  },
  {
    id: 'iss-2',
    eventId: 'evt-slask-piast',
    type: 'stale_snapshot',
    description: 'Ostatni snapshot został pobrany 19 godzin temu. Harmonogram synchronizacji z systemem biletowym klubu nie zwrócił nowej paczki.',
    detectedAt: '2026-10-09T06:12:00Z',
    severity: 'warning'
  },
  {
    id: 'iss-3',
    eventId: 'evt-lech-odra',
    type: 'missing_forecast',
    description: 'Event posiada dane sprzedażowe (5 900 biletów), ale nie posiada aktualnej prognozy. Mecz pucharowy wymaga flagi kalendarzowej.',
    detectedAt: '2026-10-09T07:00:00Z',
    severity: 'warning'
  },
  {
    id: 'iss-4',
    eventId: 'evt-widzew-korona',
    type: 'forecast_older_than_data',
    description: 'Istnieje nowszy snapshot niż ten wykorzystany do ostatniej prognozy. Model wstrzymał inferencję z powodu anomalii wolumenu.',
    detectedAt: '2026-10-08T16:00:00Z',
    severity: 'warning'
  }
];
