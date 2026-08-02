// Korrigiert bereits BESTÄTIGTE Spieler-Nachmeldungen, die versehentlich unter
// der aktiven Saison (25/26, Präfix „MDU 26") statt der Anmelde-Saison (26/27,
// „MDU 27") angelegt wurden. Setzt Saison + Passnummer-Präfix + (falls nötig)
// den Team-Block gerade und aktualisiert players / player_nominations /
// player_assignments konsistent.
//
// Trockenlauf (nur anzeigen):   node scripts/fix-nominations-season.mjs
// Wirklich schreiben:           node scripts/fix-nominations-season.mjs --commit
//
// Erfordert .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const COMMIT = process.argv.includes('--commit');
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const numOf = (lic) => { const m = String(lic ?? '').match(/(\d{3,5})\s*$/); return m ? parseInt(m[1], 10) : null; };
const yyOf = (lic) => { const m = String(lic ?? '').match(/MDU\s*(\d{2})/i); return m ? m[1] : null; };

// 1) Anmelde-Saison bestimmen (registration_open, sonst upcoming).
let { data: reg } = await admin.from('seasons').select('id, year, status').eq('status', 'registration_open').order('year', { ascending: true }).limit(1).maybeSingle();
if (!reg) ({ data: reg } = await admin.from('seasons').select('id, year, status').eq('status', 'upcoming').order('year', { ascending: true }).limit(1).maybeSingle());
if (!reg) { console.error('Keine Anmelde-Saison (registration_open/upcoming) gefunden — Abbruch.'); process.exit(1); }
const SEASON_ID = reg.id;
const YY = String(reg.year % 100).padStart(2, '0');
console.log(`Anmelde-Saison: ${SEASON_ID} (Jahr ${reg.year} → Präfix „MDU ${YY}")\n`);

// 2) Belegte Nummern der Ziel-Saison sammeln (players + Kader mit „MDU YY …").
const usedIn = new Set();
const addUsed = (rows) => { for (const r of rows ?? []) { if (yyOf(r.license_number) === YY) { const n = numOf(r.license_number); if (n != null) usedIn.add(n); } } };
addUsed((await admin.from('players').select('license_number').not('license_number', 'is', null)).data);
addUsed((await admin.from('season_roster_assignments').select('license_number').not('license_number', 'is', null)).data);

// Team-Block je Team aus den Kader-Nummern der Ziel-Saison.
const { data: rosterRows } = await admin.from('season_roster_assignments').select('team_id, license_number').eq('season_id', SEASON_ID).not('license_number', 'is', null);
const teamBlock = new Map();
for (const r of rosterRows ?? []) {
  const n = numOf(r.license_number); if (n == null || n < 1000 || n >= 10000) continue;
  const b = Math.floor(n / 100) * 100;
  const m = teamBlock.get(r.team_id) ?? new Map(); m.set(b, (m.get(b) ?? 0) + 1); teamBlock.set(r.team_id, m);
}
const blockFor = (teamId, fallbackNum) => {
  const m = teamBlock.get(teamId);
  if (m && m.size) return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return fallbackNum != null ? Math.floor(fallbackNum / 100) * 100 : null;
};
const nextInBlock = (base) => { for (let i = 1; i <= 99; i++) if (!usedIn.has(base + i)) return base + i; let n = base + 100; while (usedIn.has(n)) n++; return n; };

// 3) player_assignments der Nachmeldungen (für season_id-Abgleich).
const { data: paRows } = await admin.from('player_assignments').select('id, season_id, player_id').eq('source', 'nomination');
const paById = new Map((paRows ?? []).map(r => [r.id, r]));

// 4) Bestätigte Nachmeldungen prüfen/korrigieren.
const { data: noms } = await admin.from('player_nominations')
  .select('id, team_id, team_name, first_name, last_name, player_id, license_number, license_provisional, status')
  .eq('status', 'approved');

let fixed = 0, skipped = 0;
for (const nom of noms ?? []) {
  const pa = paById.get(`pa-nom-${nom.id}`);
  const curYY = yyOf(nom.license_number);
  const curNum = numOf(nom.license_number);
  const seasonWrong = pa ? pa.season_id !== SEASON_ID : false;
  const prefixWrong = curYY !== null && curYY !== YY;
  const name = `${nom.first_name} ${nom.last_name}`;

  if (!prefixWrong && !seasonWrong) { skipped++; continue; }

  // Provisorische (selbst generierte) Nummern dürfen Block/Nummer neu bekommen;
  // wiederverwendete permanente Nummern (provisional=false) NUR das Präfix.
  let newNum = curNum;
  if (nom.license_provisional !== false) {
    const base = blockFor(nom.team_id, curNum);
    const inRightBlock = base != null && curNum != null && Math.floor(curNum / 100) * 100 === base;
    const collides = curNum != null && usedIn.has(curNum);
    newNum = (inRightBlock && !collides) ? curNum : nextInBlock(base ?? (Math.floor((curNum ?? 100) / 100) * 100));
  }
  if (newNum != null) usedIn.add(newNum);
  const newLic = newNum != null ? `MDU ${YY} ${newNum}` : nom.license_number;

  console.log(`• ${name} (${nom.team_name ?? nom.team_id})`);
  console.log(`    Passnummer: ${nom.license_number ?? '—'}  →  ${newLic}`);
  console.log(`    Saison(player_assignments): ${pa?.season_id ?? '—'}  →  ${SEASON_ID}`);

  if (COMMIT) {
    if (newLic !== nom.license_number) {
      await admin.from('player_nominations').update({ license_number: newLic }).eq('id', nom.id);
      if (nom.player_id) await admin.from('players').update({ license_number: newLic }).eq('id', nom.player_id);
      else if (nom.license_number) await admin.from('players').update({ license_number: newLic }).eq('license_number', nom.license_number);
    }
    if (pa && pa.season_id !== SEASON_ID) {
      await admin.from('player_assignments').update({ season_id: SEASON_ID }).eq('id', `pa-nom-${nom.id}`);
    }
  }
  fixed++;
}

console.log(`\n${COMMIT ? 'GESCHRIEBEN' : 'TROCKENLAUF'}: ${fixed} korrigiert, ${skipped} bereits korrekt.`);
if (!COMMIT && fixed > 0) console.log('→ Zum Übernehmen erneut mit  --commit  ausführen.');
