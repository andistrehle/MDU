// ============================================================
// MDU Spielplan-Generator — Saison 2026/2027 (VORSCHLAG)
// ============================================================
// Erzeugt je Liga eine Doppelrunde (gleiche Reihenfolge Hin/Rück, Heimrecht
// getauscht), Derbys (gleiches Lokal) früh, rotierendes Freilos bei ungerader
// Ligagröße, Lokal-Heimspiele ligaübergreifend entzerrt, Ferien frei.
// Ausgabe: app/admin/spielplan-vorschlag/spielplan.json
//
// Ausführen:  npx tsx scripts/mdu-spielplan-2627.ts
// Reiner Vorschlag — schreibt NICHTS in die DB.
// ============================================================
import { writeFileSync } from 'fs';
import { join } from 'path';

type TeamIn = { name: string; venue: string };
// "Zur flotten Biene" = "Flotte Biene" = "Spartans Dart Pub" ist dasselbe Lokal
// (vom Betreiber bestätigt) → ein Cluster.
const A = (v: string) => ({
  'Zur flotten Biene': 'Flotte Biene', 'Zur Flotten Biene': 'Flotte Biene',
  'Spartans Dart Pub': 'Flotte Biene', 'Flotte Biene': 'Flotte Biene',
} as Record<string, string>)[v] ?? v;

const LEAGUES: { key: string; label: string; teams: TeamIn[] }[] = [
  { key: 'la', label: 'La Liga', teams: [
    { name: 'Spartans München', venue: 'Flotte Biene' },
    { name: 'Silberpfeile II', venue: 'Wirtshaus bei Toni' },
    { name: 'Ohne Jackie', venue: 'Fiaker Stüberl' },
    { name: 'Jolly Pirates Kneipenterroristen', venue: 'Jolly Roger' },
    { name: 'Gambas', venue: 'Fiaker Stüberl' },
    { name: 'Alptraum', venue: "Di's Stüberl" },
  ]},
  { key: 'a', label: 'A Liga', teams: [
    { name: 'Spartans VI', venue: 'Flotte Biene' },
    { name: 'Illuminati', venue: 'Ambasador' },
    { name: 'Treff Nix Freimann', venue: 'Gaststätte ESV Freimann' },
    { name: 'Fiaker Deife', venue: 'Fiaker Stüberl' },
    { name: 'Freibad Bazis', venue: 'Fiaker Stüberl' },
    { name: 'DC Animals', venue: 'Kegelkeller' },
    { name: 'Oldies & Co', venue: "Di's Stüberl" },
    { name: 'Belfort Evolution', venue: 'Belfort Seven' },
    { name: 'Jolly Pirates V', venue: 'Jolly Roger' },
  ]},
  { key: 'b1', label: 'B1 Liga', teams: [
    { name: 'Game Over', venue: 'Wirtshaus zum Lustigen Bauer' },
    { name: 'Wild Indians', venue: 'Trappentreu Stüberl' },
    { name: 'München 08/15', venue: 'Flotte Biene' },
    { name: 'Master of Desaster', venue: 'Fiaker Stüberl' },
    { name: 'Lucky Darts One', venue: 'Players' },
    { name: 'De Hutzeldarter', venue: 'Bistro 118' },
    { name: "Dart's Vaders", venue: 'Ambasador' },
    { name: 'Black Storm', venue: 'Bistro 118' },
  ]},
  { key: 'b2', label: 'B2 Liga', teams: [
    { name: "Jolly Pirates Sound Warrior's", venue: 'Jolly Roger' },
    { name: 'Lucky Darts Two', venue: 'Players' },
    { name: 'Flying Fighters', venue: 'Fiaker Stüberl' },
    { name: 'Team Desaster', venue: 'DC Moosach' },
    { name: "De Vogelwuid'n", venue: 'Flotte Biene' },
    { name: 'Leider Geil', venue: 'Bistro 118' },
    { name: 'Wakan Tanka', venue: 'Schillers Bistro' },
  ]},
  { key: 'c', label: 'C Liga', teams: [
    { name: 'DartPromillos', venue: '70er' },
    { name: 'Würmtal Bazis', venue: 'DJK Würmtal' },
    { name: 'Team Desaster Mädels', venue: 'DC Moosach' },
    { name: 'Black Devils', venue: 'Flotte Biene' },
    { name: 'Funny Darters Munich', venue: "Sportsbar 'Live'" },
    { name: '5 Sterne Boazn Team', venue: 'Trappentreu Stüberl' },
    { name: 'Jolly Pirates VII', venue: 'Jolly Roger' },
  ]},
];
LEAGUES.forEach(l => l.teams.forEach(t => (t.venue = A(t.venue))));

// ── Round-Robin (Kreismethode) ───────────────────────────────
function circle(n: number): { games: [number, number][]; bye: number | null }[] {
  const odd = n % 2 === 1;
  const ids = [...Array(n).keys()]; if (odd) ids.push(-1);
  const m = ids.length;
  const fixed = ids[0];
  let rot = ids.slice(1);
  const res: { games: [number, number][]; bye: number | null }[] = [];
  for (let r = 0; r < m - 1; r++) {
    const line = [fixed, ...rot];
    const games: [number, number][] = []; let bye: number | null = null;
    for (let i = 0; i < m / 2; i++) {
      const a = line[i], b = line[m - 1 - i];
      if (a === -1) bye = b; else if (b === -1) bye = a; else games.push([a, b]);
    }
    res.push({ games, bye });
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)];
  }
  return res;
}

type Round = { games: [number, number][]; bye: number | null };
// Hin-Runden je Liga, Derby-Runden (gleiches Lokal) nach vorne
const perLeagueHinRounds: Round[][] = LEAGUES.map((lg) => {
  const rounds = circle(lg.teams.length);
  const sv = (p: [number, number]) => lg.teams[p[0]].venue === lg.teams[p[1]].venue;
  rounds.sort((x, y) => y.games.filter(sv).length - x.games.filter(sv).length);
  return rounds;
});

type Fix = { li: number; hw: number; a: number; b: number; homeA: boolean };
const hinLen: number[] = [];
const baseFix: Fix[] = [];
perLeagueHinRounds.forEach((rounds, li) => {
  hinLen[li] = rounds.length;
  rounds.forEach((rd, hw) => rd.games.forEach(([a, b]) => baseFix.push({ li, hw, a, b, homeA: true })));
});

// ── Kalender + Entzerrung ZUERST (vor der Heim/Auswärts-Optimierung) ──────────
// Die Entzerrung (welcher Spieltag auf welches Wochenende fällt) hängt nur an
// Ligagröße und Spieltag-Position, NICHT am Heimrecht. Steht sie vorher fest,
// kann die Optimierung die ECHTEN Wochenenden nach der Entzerrung nutzen statt
// der Spieltag-Nummern — und so Heimspiele desselben Lokals am selben Wochenende
// über ALLE Ligen und ALLE Spielstätten hinweg minimieren.
const HOLIDAYS: [string, string, string][] = [
  ['2026-10-30', '2026-11-08', 'Allerheiligen + Herbstferien'],
  ['2026-12-23', '2027-01-05', 'Weihnachtsferien'],
  ['2027-02-13', '2027-02-19', 'Faschingsferien'],
  ['2027-03-26', '2027-04-11', 'Ostern + Osterferien'],
  ['2027-05-01', '2027-05-01', '1. Mai'],
  ['2027-05-14', '2027-05-17', 'Pfingsten'],
];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const overlapsHoliday = (fri: Date) => {
  const sun = new Date(fri); sun.setUTCDate(sun.getUTCDate() + 2);
  return HOLIDAYS.find(([s, e]) => iso(fri) <= e && s <= iso(sun));
};
// Alle Spielwochenenden von startFri bis einschließlich endInclusive (Ferien raus).
function weekends(startFri: string, endInclusive: string) {
  const out: { fri: string; sun: string }[] = [];
  const skipped: { fri: string; label: string }[] = [];
  const d = new Date(startFri + 'T00:00:00Z');
  while (iso(d) <= endInclusive) {
    const h = overlapsHoliday(d);
    if (h) skipped.push({ fri: iso(d), label: h[2] });
    else { const sun = new Date(d); sun.setUTCDate(sun.getUTCDate() + 2); out.push({ fri: iso(d), sun: iso(sun) }); }
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return { out, skipped };
}
// Gemeinsamer Kalender: ALLE Ligen starten am 23.–25.10.2026, letztes Spiel-
// wochenende Ende Mai (28.–30.05.2027). Ferien ausgelassen, keine Playoffs.
const cal = weekends('2026-10-23', '2027-05-31');
const lastSlot = cal.out.length - 1; // letztes Wochenende = Ende Mai

// Entzerrung: M Spieltage gleichmäßig auf die Wochenenden [0…lastSlot].
function spreadSlots(M: number): number[] {
  const s: number[] = [];
  for (let i = 0; i < M; i++) s.push(M <= 1 ? 0 : Math.round((i * lastSlot) / (M - 1)));
  for (let i = 1; i < M; i++) if (s[i] <= s[i - 1]) s[i] = s[i - 1] + 1; // streng steigend
  return s;
}
// Spieltag-Index (0-basiert; erst alle Hin-, dann alle Rück-Spieltage) → Wochenende.
const leagueSlots: number[][] = LEAGUES.map((_, li) => spreadSlots(2 * hinLen[li]));
const hinWknd = (li: number, hw: number) => leagueSlots[li][hw];
const rueckWknd = (li: number, hw: number) => leagueSlots[li][hinLen[li] + hw];

// Zielfunktion: Summe über echte Wochenenden × Lokal der Paar-Kollisionen
// C(Heimspiele, 2). Kleiner = weniger gleichzeitige Heimspiele je Spielstätte.
function objective(fix: Fix[]): number {
  const load = new Map<string, number>();
  const add = (w: number, venue: string) => { const k = `${w}|${venue}`; load.set(k, (load.get(k) ?? 0) + 1); };
  for (const f of fix) {
    const lg = LEAGUES[f.li];
    add(hinWknd(f.li, f.hw), lg.teams[f.homeA ? f.a : f.b].venue);
    add(rueckWknd(f.li, f.hw), lg.teams[f.homeA ? f.b : f.a].venue);
  }
  let obj = 0;
  for (const c of load.values()) obj += (c * (c - 1)) / 2;
  return obj;
}

// Greedy Local Search + Zufalls-Restarts (Heim/Auswärts der Hin-Fixtures)
function optimize(seedFix: Fix[]): { fix: Fix[]; obj: number } {
  const fix = seedFix.map(f => ({ ...f }));
  let best = objective(fix);
  for (let pass = 0; pass < 20; pass++) {
    let improved = false;
    for (const f of fix) {
      f.homeA = !f.homeA;
      const o = objective(fix);
      if (o < best) { best = o; improved = true; } else { f.homeA = !f.homeA; }
    }
    if (!improved) break;
  }
  return { fix, obj: best };
}
let rng = 123456789 >>> 0;
const rand = () => { rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; rng >>>= 0; return rng / 4294967296; };
let bestRun = optimize(baseFix);
for (let restart = 0; restart < 400; restart++) {
  const seed = baseFix.map(f => ({ ...f, homeA: rand() < 0.5 }));
  const r = optimize(seed);
  if (r.obj < bestRun.obj) bestRun = r;
}
const hinFix = bestRun.fix;

// Volle Doppelrunde (Hin + Rück gespiegelt)
type Game = { home: string; away: string; venue: string; derby: boolean };
type MatchdayOut = { nr: number; half: 'hin' | 'rueck'; games: Game[]; bye: string | null; weekendIndex: number };
const schedule: Record<string, MatchdayOut[]> = {};
perLeagueHinRounds.forEach((rounds, li) => {
  const lg = LEAGUES[li];
  const nm = (i: number) => lg.teams[i].name;
  const vn = (i: number) => lg.teams[i].venue;
  const hin: MatchdayOut[] = []; const rueck: MatchdayOut[] = [];
  rounds.forEach((rd, hw) => {
    const hg: Game[] = []; const rg: Game[] = [];
    rd.games.forEach(([a, b]) => {
      const f = hinFix.find(x => x.li === li && x.hw === hw && x.a === a && x.b === b)!;
      const hHome = f.homeA ? a : b, hAway = f.homeA ? b : a;
      const derby = vn(a) === vn(b);
      hg.push({ home: nm(hHome), away: nm(hAway), venue: vn(hHome), derby });
      rg.push({ home: nm(hAway), away: nm(hHome), venue: vn(hAway), derby });
    });
    hin.push({ nr: hw + 1, half: 'hin', games: hg, bye: rd.bye != null ? nm(rd.bye) : null, weekendIndex: hinWknd(li, hw) });
    rueck.push({ nr: rounds.length + hw + 1, half: 'rueck', games: rg, bye: rd.bye != null ? nm(rd.bye) : null, weekendIndex: rueckWknd(li, hw) });
  });
  schedule[lg.key] = [...hin, ...rueck];
});

const maxMd = Math.max(...Object.values(schedule).map(s => s.length)); // A-Liga = 18

const outObj = {
  generatedAt: new Date().toISOString(),
  note: 'Vorschlag – keine DB-Speicherung. Ferientermine geschätzt.',
  leagues: LEAGUES.map(l => ({ key: l.key, label: l.label, teams: l.teams })),
  schedule,
  weekends: cal.out,      // [{fri,sun}] – Index = weekendIndex der Spieltage
  skipped: cal.skipped,   // ausgelassene Ferienwochenenden
  maxMatchday: maxMd,
  venueClusterObjective: bestRun.obj,
};
const outPath = join(process.cwd(), 'app/admin/spielplan-vorschlag/spielplan.json');
writeFileSync(outPath, JSON.stringify(outObj, null, 2) + '\n');
console.log('Geschrieben:', outPath);
console.log('Objective (Lokal-Heim-Paare/Wochenende, kleiner=besser):', bestRun.obj);
console.log('Spieltage je Liga:', Object.fromEntries(Object.entries(schedule).map(([k, s]) => [k, s.length])));
