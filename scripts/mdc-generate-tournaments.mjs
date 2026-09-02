// ============================================================
// Einmal-Generator für die MDC-Demo-Turnierdaten
// ============================================================
//
// Erzeugt `data/tournaments.generated.ts`. Der Sinn: Die Saisonrangliste der Demo wird
// NICHT von Hand hingeschrieben, sondern aus echten Turnierergebnissen
// aufaddiert (`data/ranking.ts`). Damit die vom Auftraggeber vorgegebenen
// Ranglisten-Werte (Patrick Ruhland 1085 Punkte aus 5 Turnieren usw.) exakt
// herauskommen, sucht dieses Skript passende Platzierungen.
//
// Aufruf (nur bei Bedarf, das Ergebnis ist eingecheckt):
//   node scripts/mdc-generate-tournaments.mjs
//
// Deterministisch dank festem Seed — derselbe Lauf liefert dieselbe Datei.
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs';

// ------------------------------------------------------------
// Punkteschlüssel (Spiegel von lib/mdc/points.ts)
// ------------------------------------------------------------
const POINT_TABLE = [
  { upTo: 1, value: 1105 }, { upTo: 2, value: 1055 }, { upTo: 3, value: 1000 },
  { upTo: 4, value: 950 }, { upTo: 6, value: 850 }, { upTo: 8, value: 750 },
  { upTo: 12, value: 600 }, { upTo: 16, value: 450 }, { upTo: 24, value: 300 },
  { upTo: 32, value: 200 },
];
const pointsFor = (rank, size) => {
  const row = POINT_TABLE.find(r => rank <= r.upTo);
  return row ? Math.round((size * row.value) / 100) : 0;
};

// ------------------------------------------------------------
// Deterministischer Zufall
// ------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rnd = mulberry32(20260808);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const shuffled = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ------------------------------------------------------------
// Stammdaten
// ------------------------------------------------------------
// ── Spielerstamm aus den echten Endranglisten lesen ──
// Dieselbe ID-Bildung wie in `data/parse-ranking.ts` (Slug aus Vor-/Nachname).
const SPECIAL_CASE = {
  '70ER': '70er', '5STERNE': '5Sterne', SSTERNE: '5Sterne',
  RG: 'RG', LB: 'LB', CB5: 'CB5', X: 'X', A: 'A', F: 'F',
};
const titleCase = value => value.split(' ').map(token => {
  const special = SPECIAL_CASE[token.toUpperCase()];
  if (special) return special;
  return token.replace(/[\p{L}\p{N}]+/gu, run =>
    run.charAt(0).toUpperCase() + run.slice(1).toLowerCase());
}).join(' ');
const slugify = value => value.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function readRanking(file) {
  const text = readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8');
  const lines = [...text.matchAll(/'([^']*\|[^']*)'/g)].map(m => m[1]);
  const used = new Set();
  return lines.map(line => {
    const [, , nameRaw, firstRaw] = line.split('|');
    const lastName = titleCase(nameRaw);
    const firstName = titleCase((firstRaw.match(/^(.*?)\s*\(/) ?? [, firstRaw])[1]);
    const base = slugify(`${firstName} ${lastName}`);
    const id = used.has(base) ? `${base}-${line.split('|')[1]}` : base;
    used.add(id);
    return id;
  });
}

const MEN_IDS = readRanking('ranking-2025-26-men.ts');
const WOMEN_IDS = readRanking('ranking-2025-26-women.ts');

// Das Sommer-Ranking spielen die aktiven Stammspieler — die vorderen Plätze
// beider Endranglisten plus Patrick Müller (Platz noch nicht ausgewertet).
const PLAYER_IDS = [...new Set([
  'patrick-mueller',
  ...MEN_IDS.slice(0, 85),
  ...WOMEN_IDS.slice(0, 25),
])];

// Gespielte Turniere des Sommer-Rankings 2026. Wochentag und Uhrzeit passen
// jeweils zum Spieltag des Lokals in data/venues.ts.
const FINISHED = [
  { id: 'sr-01', nr: 1,  venueId: 'legendary',          date: '2026-07-27', time: '20:00', size: 18 },
  { id: 'sr-02', nr: 2,  venueId: 'harlekin',           date: '2026-07-27', time: '20:00', size: 28 },
  { id: 'sr-03', nr: 3,  venueId: 'tonys-wirtshaus',    date: '2026-07-27', time: '20:00', size: 16 },
  { id: 'sr-04', nr: 4,  venueId: 'bistro-118',         date: '2026-07-27', time: '20:00', size: 14 },
  { id: 'sr-05', nr: 5,  venueId: 'ambasador',          date: '2026-07-28', time: '20:00', size: 30 },
  { id: 'sr-06', nr: 6,  venueId: 'fuenf-sterne-boazn', date: '2026-07-28', time: '19:00', size: 14 },
  { id: 'sr-07', nr: 7,  venueId: 'djk-wuermtal',       date: '2026-07-29', time: '19:30', size: 20 },
  { id: 'sr-08', nr: 8,  venueId: 'machete-1',          date: '2026-07-29', time: '19:00', size: 18 },
  { id: 'sr-09', nr: 9,  venueId: 'siebziger',          date: '2026-07-29', time: '19:00', size: 22 },
  { id: 'sr-10', nr: 10, venueId: 'fiakerstueberl',     date: '2026-07-30', time: '19:30', size: 26 },
  { id: 'sr-11', nr: 11, venueId: 'lustiger-bauer',     date: '2026-07-30', time: '20:00', size: 24 },
  { id: 'sr-12', nr: 12, venueId: 'harlekin',           date: '2026-08-03', time: '20:00', size: 20 },
  { id: 'sr-13', nr: 13, venueId: 'legendary',          date: '2026-08-03', time: '20:00', size: 22 },
];

// Vom Auftraggeber vorgegebene Ranglistenwerte (Punkte / gewertete Turniere).
const TARGETS = {
  'patrick-ruhland': { points: 1085, count: 5 },
  'manuel-jung':     { points: 891,  count: 5 },
  'donato-mastria':  { points: 757,  count: 5 },
  'patrick-mueller': { points: 749,  count: 4 },
  'jimmy-pogremino': { points: 735,  count: 5 },
  'peter-froese':    { points: 661,  count: 6 },
  'micky-schul':     { points: 483,  count: 5 },
  'ronny-mueller':   { points: 471,  count: 4 },
  // Plätze 9 und 10 — müssen unter 471 bleiben, damit die Top 8 stimmen.
  'christian-mohr':  { points: 462,  count: 4 },
  'dominic-70er':    { points: 448,  count: 4 },
};

// Fest vorgegebenes Podium des letzten Turniers (Harlekin, 03.08.2026):
// 1. Ruhland 221, 2. Mohr 211, 3. Dominic 70er 200, 4. Jung 190.
const FIXED = {
  'sr-12': { 'patrick-ruhland': 1, 'christian-mohr': 2, 'dominic-70er': 3, 'manuel-jung': 4 },
};

// Alle Spieler außerhalb der Top 10 bleiben unter dieser Punktzahl, damit die
// vorgegebene Reihenfolge der Rangliste nicht durch Auffüllen gekippt wird.
const FILLER_CAP = 440;

// ------------------------------------------------------------
// Suche: Platzierungen finden, die die Zielpunkte exakt treffen
// ------------------------------------------------------------
const sizeOf = tid => FINISHED.find(t => t.id === tid).size;

/** Verfügbare (Platz, Punkte)-Optionen eines Turniers, nach Punkten gebündelt. */
function options(tid, taken) {
  const size = sizeOf(tid);
  const byPoints = new Map();
  for (let rank = 1; rank <= size; rank++) {
    if (taken.has(rank)) continue;
    const p = pointsFor(rank, size);
    if (!byPoints.has(p)) byPoints.set(p, []);
    byPoints.get(p).push(rank);
  }
  return [...byPoints.entries()]
    .map(([points, ranks]) => ({ points, rank: pick(ranks) }))
    .sort((a, b) => b.points - a.points);
}

/** Tiefensuche: Plätze in `tids` so wählen, dass die Summe exakt `need` ist. */
function solveRanks(tids, need, takenByT, acc = []) {
  if (tids.length === 0) return need === 0 ? acc : null;
  const [tid, ...rest] = tids;
  const opts = shuffled(options(tid, takenByT.get(tid)));
  const restMin = rest.reduce((s, t) => s + pointsFor(sizeOf(t), sizeOf(t)), 0);
  const restMax = rest.reduce((s, t) => s + pointsFor(1, sizeOf(t)), 0);
  for (const opt of opts) {
    const remaining = need - opt.points;
    if (remaining < restMin || remaining > restMax) continue;
    const found = solveRanks(rest, remaining, takenByT, [...acc, { tid, ...opt }]);
    if (found) return found;
  }
  return null;
}

/** Ein kompletter Lösungsversuch für alle Zielspieler. */
function attempt() {
  const takenByT = new Map(FINISHED.map(t => [t.id, new Set()]));
  const assign = new Map(); // playerId -> [{ tid, rank, points }]

  // 1. Feste Podiumsplätze setzen.
  for (const [tid, ranks] of Object.entries(FIXED)) {
    for (const [pid, rank] of Object.entries(ranks)) {
      takenByT.get(tid).add(rank);
      const entry = { tid, rank, points: pointsFor(rank, sizeOf(tid)) };
      assign.set(pid, [...(assign.get(pid) ?? []), entry]);
    }
  }

  // 2. Zielspieler in absteigender Schwierigkeit (hoher Schnitt zuerst).
  const order = Object.entries(TARGETS)
    .sort((a, b) => b[1].points / b[1].count - a[1].points / a[1].count);

  for (const [pid, target] of order) {
    const fixedEntries = assign.get(pid) ?? [];
    const need = target.points - fixedEntries.reduce((s, e) => s + e.points, 0);
    const open = target.count - fixedEntries.length;
    if (open < 0 || need < 0) return null;

    const used = new Set(fixedEntries.map(e => e.tid));
    const candidates = FINISHED.map(t => t.id).filter(t => !used.has(t));

    // Mehrere Turnier-Kombinationen probieren: Nur solche, mit denen die
    // Zielpunktzahl überhaupt erreichbar ist, gehen in die Platzsuche.
    let solution = null;
    for (let tryNo = 0; tryNo < 80 && !solution; tryNo++) {
      const tids = shuffled(candidates).slice(0, open).sort((a, b) => sizeOf(b) - sizeOf(a));
      const max = tids.reduce((s, t) => s + pointsFor(1, sizeOf(t)), 0);
      const min = tids.reduce((s, t) => s + pointsFor(sizeOf(t), sizeOf(t)), 0);
      if (need < min || need > max) continue;
      solution = solveRanks(tids, need, takenByT);
    }
    if (!solution) return null;

    for (const s of solution) takenByT.get(s.tid).add(s.rank);
    assign.set(pid, [...fixedEntries, ...solution]);
  }
  return { assign, takenByT };
}

let solved = null;
for (let i = 0; i < 4000 && !solved; i++) {
  rnd = mulberry32(20260808 + i);
  solved = attempt();
}
if (!solved) {
  console.error('Keine Lösung gefunden — Zielwerte oder Turniergrößen anpassen.');
  process.exit(1);
}
const { assign, takenByT } = solved;

// ------------------------------------------------------------
// Restplätze mit den übrigen Spielern auffüllen
// ------------------------------------------------------------
const totals = new Map(PLAYER_IDS.map(p => [p, 0]));
for (const [pid, entries] of assign) {
  totals.set(pid, entries.reduce((s, e) => s + e.points, 0));
}

/** tid -> Map(rank -> playerId) */
const placements = new Map(FINISHED.map(t => [t.id, new Map()]));
for (const [pid, entries] of assign) {
  for (const e of entries) placements.get(e.tid).set(e.rank, pid);
}

const fillers = PLAYER_IDS.filter(p => !TARGETS[p]);
for (const t of FINISHED) {
  const placed = placements.get(t.id);
  const openRanks = [];
  for (let r = 1; r <= t.size; r++) if (!placed.has(r)) openRanks.push(r);

  // Beste offene Plätze zuerst vergeben, damit die Punkte-Deckelung greift.
  const inThis = new Set(placed.values());
  for (const rank of openRanks) {
    const points = pointsFor(rank, t.size);
    const candidates = shuffled(fillers).filter(
      p => !inThis.has(p) && totals.get(p) + points <= FILLER_CAP,
    );
    // Spieler mit wenigen Turnieren bevorzugen → gleichmäßige Teilnahme.
    const counts = new Map(candidates.map(p => [p, 0]));
    for (const tt of FINISHED) {
      for (const pid of placements.get(tt.id).values()) {
        if (counts.has(pid)) counts.set(pid, counts.get(pid) + 1);
      }
    }
    candidates.sort((a, b) => counts.get(a) - counts.get(b));
    // Notnagel: Wenn die Punkte-Deckelung alle Kandidaten sperrt, nimmt der
    // Spieler mit den wenigsten Punkten den Platz — das Feld muss voll werden.
    const chosen = candidates[0] ?? fillers
      .filter(p => !inThis.has(p))
      .sort((a, b) => totals.get(a) - totals.get(b))[0];
    if (!chosen) throw new Error(`Zu wenige Spieler für ${t.id} (Feldgröße ${t.size}).`);
    placed.set(rank, chosen);
    inThis.add(chosen);
    totals.set(chosen, totals.get(chosen) + points);
  }
}

// ------------------------------------------------------------
// Legs plausibel ableiten (bessere Platzierung → mehr Legs gewonnen)
// ------------------------------------------------------------
function legsFor(rank, size) {
  const rounds = Math.ceil(Math.log2(size));
  const survived = Math.max(1, rounds - Math.floor(Math.log2(rank)));
  const won = survived * 3 + Math.floor(rnd() * 4);
  // Wer weit kommt, gewinnt deutlich mehr Legs als er abgibt; wer früh zweimal
  // verliert, hat eine negative Bilanz.
  const factor = rank === 1 ? 0.45 : rank <= 4 ? 0.72 : rank <= 8 ? 0.88 : 1.15;
  const lost = Math.round(won * factor) + (rank === 1 ? 0 : 1 + Math.floor(rnd() * 3));
  return { won, lost: Math.max(2, lost) };
}

// ------------------------------------------------------------
// Kommende Turniere (Meldestand) — die Woche nach dem 08.08.2026
// ------------------------------------------------------------
// Kommende Termine der Saison 2026/27 (Start 31.08.2026). Wochentag und
// Uhrzeit folgen dem festen Spieltag des jeweiligen Lokals.
const UPCOMING = [
  { id: 'sr-14', nr: 14, venueId: 'fiakerstueberl',     date: '2026-09-03', time: '19:30', max: 24, meldungen: 15 },
  { id: 'sr-15', nr: 15, venueId: 'lustiger-bauer',     date: '2026-09-03', time: '20:00', max: 24, meldungen: 15 },
  { id: 'sr-16', nr: 16, venueId: 'legendary',          date: '2026-09-07', time: '20:00', max: 24, meldungen: 14 },
  { id: 'sr-17', nr: 17, venueId: 'harlekin',           date: '2026-09-07', time: '20:00', max: 32, meldungen: 19 },
  { id: 'sr-18', nr: 18, venueId: 'bistro-118',         date: '2026-09-07', time: '20:00', max: 16, meldungen: 8  },
  { id: 'sr-19', nr: 19, venueId: 'tonys-wirtshaus',    date: '2026-09-07', time: '20:00', max: 24, meldungen: 9  },
  { id: 'sr-20', nr: 20, venueId: 'ambasador',          date: '2026-09-08', time: '20:00', max: 32, meldungen: 17 },
  { id: 'sr-21', nr: 21, venueId: 'fuenf-sterne-boazn', date: '2026-09-08', time: '19:00', max: 16, meldungen: 11 },
  { id: 'sr-22', nr: 22, venueId: 'djk-wuermtal',       date: '2026-09-09', time: '19:30', max: 24, meldungen: 13 },
  { id: 'sr-23', nr: 23, venueId: 'machete-1',          date: '2026-09-09', time: '19:00', max: 24, meldungen: 12 },
  { id: 'sr-24', nr: 24, venueId: 'siebziger',          date: '2026-09-09', time: '19:00', max: 32, meldungen: 16 },
];

const bracketSizeFor = n => (n <= 8 ? 8 : n <= 16 ? 16 : 32);

// ------------------------------------------------------------
// Ausgabe
// ------------------------------------------------------------
const lines = [];
lines.push(`// ============================================================
// MDC — Turniere (Demo-Daten)
// ============================================================
//
// ERZEUGT von \`scripts/mdc-generate-tournaments.mjs\` — nicht von Hand
// bearbeiten, sondern das Skript anpassen und neu laufen lassen.
//
// Die Ergebnisse sind so gewählt, dass die aufaddierte Saisonrangliste
// (\`data/ranking.ts\`) exakt die vorgegebenen Werte ergibt. Punkte kommen
// immer aus \`lib/mdc/points.ts\` — nichts ist doppelt gepflegt.
// ============================================================

import type { Tournament } from './types';

export const TOURNAMENTS: Tournament[] = [`);

const fmtResults = t => {
  const placed = placements.get(t.id);
  if (placed.size !== t.size) throw new Error(`${t.id}: ${placed.size} statt ${t.size} Plätze belegt.`);
  const ranks = [...placed.keys()].sort((a, b) => a - b);
  return ranks.map(rank => {
    const legs = legsFor(rank, t.size);
    return `      { rank: ${rank}, playerId: '${placed.get(rank)}', points: ${pointsFor(rank, t.size)}, legsWon: ${legs.won}, legsLost: ${legs.lost} },`;
  }).join('\n');
};

for (const t of FINISHED) {
  const placed = placements.get(t.id);
  const ordered = [...placed.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
  lines.push(`  {
    id: '${t.id}',
    series: 'Sommer-Ranking',
    name: 'Sommer-Ranking #${t.nr}',
    venueId: '${t.venueId}',
    date: '${t.date}',
    time: '${t.time}',
    status: 'finished',
    maxPlayers: ${Math.max(24, ordered.length)},
    entryFee: 5,
    bracketSize: ${bracketSizeFor(ordered.length)},
    participantIds: [
${ordered.map(p => `      '${p}',`).join('\n')}
    ],
    results: [
${fmtResults(t)}
    ],
  },`);
}

for (const t of UPCOMING) {
  // Meldeliste: Stammspieler des Lokals zuerst, danach aufgefüllt.
  const field = shuffled(PLAYER_IDS).slice(0, t.meldungen);
  lines.push(`  {
    id: '${t.id}',
    series: 'Sommer-Ranking',
    name: 'Sommer-Ranking #${t.nr}',
    venueId: '${t.venueId}',
    date: '${t.date}',
    time: '${t.time}',
    status: 'upcoming',
    maxPlayers: ${t.max},
    entryFee: 5,
    bracketSize: ${bracketSizeFor(t.meldungen)},
    participantIds: [
${field.map(p => `      '${p}',`).join('\n')}
    ],
    results: [],
  },`);
}

lines.push('];\n');
writeFileSync(new URL('../data/tournaments.generated.ts', import.meta.url), lines.join('\n'));

// ------------------------------------------------------------
// Kontrolle
// ------------------------------------------------------------
const check = new Map();
for (const t of FINISHED) {
  for (const [rank, pid] of placements.get(t.id)) {
    const cur = check.get(pid) ?? { points: 0, count: 0 };
    check.set(pid, { points: cur.points + pointsFor(rank, t.size), count: cur.count + 1 });
  }
}
const table = [...check.entries()].sort((a, b) => b[1].points - a[1].points);
console.log('Rang | Spieler            | Punkte | Turniere | Schnitt  | Ziel');
table.forEach(([pid, v], i) => {
  const target = TARGETS[pid];
  const ok = target ? (target.points === v.points && target.count === v.count ? 'OK' : 'ABWEICHUNG') : '';
  console.log(
    `${String(i + 1).padStart(4)} | ${pid.padEnd(18)} | ${String(v.points).padStart(6)} | ${String(v.count).padStart(8)} | ${(v.points / v.count).toFixed(2).padStart(8)} | ${ok}`,
  );
});
