// ============================================================
// Passnummern eines Teams in EINEN Block ziehen (Einzelfall-Korrektur)
// ============================================================
//
// Wenn ein Team überwiegend aus einem alten Team stammt (Nummern z. B. im
// 7300er-Block wiederverwendet), echte Neuzugänge aber einen anderen Block
// (z. B. 2100er) bekommen haben, holt dieses Skript die Ausreißer in den
// dominanten Team-Block — kollisionssicher (keine schon vergebene Nummer).
//
// Aktualisiert players.license_number UND season_roster_assignments.license_number.
// Historie/Team-Zuordnung bleibt unangetastet.
//
// Aufruf (DRY-RUN):
//   node scripts/fix-passnummer-block.mjs --team="Black Storm"
// Echt schreiben:
//   node scripts/fix-passnummer-block.mjs --team="Black Storm" --apply
// Optional: --block=7300  (sonst automatisch der häufigste Block des Teams)
//           --season=season-2027  (sonst die offene Anmelde-Saison)
//
// Voraussetzung: .env.local mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const arg = (n) => process.argv.find(a => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const teamArg = arg('team');
const blockArg = arg('block') ? parseInt(arg('block'), 10) : null;
const seasonArg = arg('season');
if (!teamArg) { console.error('Bitte --team="<Name oder slug>" angeben.'); process.exit(1); }

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

const parseNum = (lic) => { const m = String(lic ?? '').match(/(\d{3,4})\s*$/); return m ? parseInt(m[1], 10) : null; };
const prefixOf = (lic) => { const m = String(lic ?? '').match(/^(.*?)(\d{3,4})\s*$/); return m ? m[1] : null; };

// ── Ziel-Saison ───────────────────────────────────────────────
let seasonId = seasonArg;
if (!seasonId) {
  const { data } = await admin.from('seasons').select('id, status').eq('status', 'registration_open');
  if (!data || data.length === 0) { console.error('Keine registration_open Saison. --season=… angeben.'); process.exit(1); }
  seasonId = data[0].id;
}

// ── Team auflösen (slug ODER Namens-Substring) ────────────────
const { data: sta } = await admin.from('season_team_assignments')
  .select('team_id, teams:team_id(name)').eq('season_id', seasonId);
const cand = (sta ?? []).filter(t =>
  t.team_id === teamArg || (t.teams?.name ?? '').toLowerCase().includes(teamArg.toLowerCase()));
if (cand.length === 0) { console.error(`Kein Team gefunden für "${teamArg}" in ${seasonId}.`); process.exit(1); }
if (cand.length > 1) {
  console.error(`Mehrdeutig – bitte genauer/als slug angeben:\n${cand.map(c => `  ${c.team_id}  „${c.teams?.name ?? ''}"`).join('\n')}`);
  process.exit(1);
}
const teamId = cand[0].team_id;
const teamName = cand[0].teams?.name ?? teamId;

// ── Roster des Teams ──────────────────────────────────────────
const { data: roster } = await admin.from('season_roster_assignments')
  .select('id, player_id, first_name, last_name, license_number, status')
  .eq('season_id', seasonId).eq('team_id', teamId);
const rows = (roster ?? []).filter(r => r.license_number);
if (rows.length === 0) { console.error('Keine Kaderzeilen mit Passnummer gefunden.'); process.exit(1); }

// ── Ziel-Block bestimmen (häufigster 100er-Block, sonst --block) ──
const blockOf = (n) => Math.floor(n / 100) * 100;
let block = blockArg;
if (!block) {
  const cnt = new Map();
  for (const r of rows) { const n = parseNum(r.license_number); if (n != null) cnt.set(blockOf(n), (cnt.get(blockOf(n)) ?? 0) + 1); }
  block = [...cnt.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}
const prefix = prefixOf(rows.map(r => r.license_number).find(l => parseNum(l) != null && blockOf(parseNum(l)) === block))
  ?? prefixOf(rows[0].license_number) ?? 'MDU 27 ';

// ── Ausreißer = Zeilen außerhalb des Ziel-Blocks ──────────────
const outliers = rows.filter(r => { const n = parseNum(r.license_number); return n != null && blockOf(n) !== block; });
if (outliers.length === 0) { console.log(`\nAlle Kaderzeilen von „${teamName}" sind bereits im ${block}er-Block. Nichts zu tun.`); process.exit(0); }

// ── Alle global vergebenen Nummern einsammeln (Kollisionsschutz) ──
const used = new Set();
const collect = (arr) => { for (const r of arr ?? []) { const n = parseNum(r.license_number); if (n != null) used.add(n); } };
collect((await admin.from('players').select('license_number').not('license_number', 'is', null)).data);
collect((await admin.from('season_roster_assignments').select('license_number').not('license_number', 'is', null)).data);
collect((await admin.from('player_nominations').select('license_number').not('license_number', 'is', null)).data);

// ── Nächste freie Nummern IM Block, oberhalb des bisherigen Team-Max ──
const teamMaxInBlock = Math.max(block, ...rows.map(r => parseNum(r.license_number)).filter(n => n != null && blockOf(n) === block));
let next = teamMaxInBlock + 1;
const freeInBlock = () => {
  while (next < block + 100 && used.has(next)) next++;
  if (next >= block + 100) return null;
  const v = next; used.add(v); next++; return v;
};

console.log(`\n=== Passnummern-Block-Korrektur  ${APPLY ? '[SCHREIBEN]' : '[DRY-RUN]'} ===`);
console.log(`Team: „${teamName}"  (${teamId})  ·  Saison: ${seasonId}  ·  Ziel-Block: ${block}er\n`);

const plan = [];
for (const r of outliers) {
  const target = freeInBlock();
  if (target == null) { console.error(`Block ${block} ist voll – keine freie Nummer mehr.`); process.exit(1); }
  plan.push({ r, oldLic: r.license_number, newLic: `${prefix}${target}` });
}
for (const p of plan) {
  const name = `${p.r.first_name ?? ''} ${p.r.last_name ?? ''}`.trim() || '(ohne Namen)';
  console.log(`  ${name}:  ${p.oldLic}  →  ${p.newLic}`);
}

if (!APPLY) { console.log(`\nDRY-RUN – nichts geschrieben. Mit  --apply  wirklich umnummerieren.`); process.exit(0); }

let ok = 0;
for (const p of plan) {
  const { error: e1 } = await admin.from('season_roster_assignments').update({ license_number: p.newLic }).eq('id', p.r.id);
  if (e1) { console.error(`  FEHLER season_roster (${p.r.id}): ${e1.message}`); continue; }
  if (p.r.player_id) {
    const { error: e2 } = await admin.from('players').update({ license_number: p.newLic }).eq('id', p.r.player_id);
    if (e2) { console.error(`  FEHLER players (${p.r.player_id}): ${e2.message}`); continue; }
  }
  ok++;
}
console.log(`\nFertig. ${ok}/${plan.length} Passnummern umgestellt.`);
