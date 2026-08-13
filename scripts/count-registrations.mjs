// ============================================================
// Zählung: Saison-Anmeldungen 26/27 vs. Teams aus 25/26 (pro Liga)
// ============================================================
//
// Vergleicht die bereits eingegangenen Mannschaftsanmeldungen der neuen Saison
// mit den Teams aus 25/26 (Baseline unten fest eingebaut, Quelle: lib/data).
// Ausgabe je Liga: wie viele der 25/26-Teams schon gemeldet sind, welche noch
// fehlen, plus neu gegründete Mannschaften.
//
// Nur LESEND (team_registrations). Ändert nichts.
//
// Ziel-Saison: standardmäßig die offene Anmelde-Saison (status registration_open).
//   Überschreibbar:  --season=season-2027
//
// Voraussetzung: .env.local mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Aufruf:  node scripts/count-registrations.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const seasonArg = process.argv.find(a => a.startsWith('--season='))?.slice('--season='.length);

// ── 25/26-Baseline (aus lib/data): [teamId, Name, Liga, withdrawn?] ──
const BASE = [
  ['spartans', 'Spartans', 'La'], ['ohne-jackie', 'Ohne Jackie', 'La'],
  ['jolly-pirates-kts', "Jolly Pirates KT's", 'La'], ['dc-null-bull', 'DC Null Bull', 'La'],
  ['no-maam', "No Ma'am", 'La'], ['les-dartagnons', 'Les Dartagnons', 'La'],

  ['alptraum', 'Alptraum', 'A'], ['dc-animals-ii', 'DC Animals', 'A'], ['gambas', 'Gambas', 'A'],
  ['spartans-vi', 'Spartans VI', 'A'], ['sound-warriors', "Sound Warrior's", 'A'], ['game-over', 'Game Over', 'A'],
  ['treff-nix-freimann', 'Treff Nix Freimann', 'A'], ['silberpfeile-ii', 'Silberpfeile II', 'A'],
  ['jolly-pirates-v', 'Jolly Pirates V', 'A'], ['oldies-co', 'Oldies & Co', 'A'],
  ['de-wolperdinga', 'De Wolperdinga', 'A', true],

  ['flying-fighters', 'Flying Fighters', 'B'], ['master-of-desaster', 'Master of Desaster', 'B'],
  ['flying-seven', 'Flying Seven', 'B'], ['lucky-darts-one', 'Lucky Darts One', 'B'],
  ['de-hutzeldarter', 'De Hutzeldarter', 'B'], ['massl-ghabt', 'Massl Ghabt', 'B'],
  ['belfort-evolution', 'Belfort Evolution', 'B'], ['fiaker-deife', 'Fiaker Deife', 'B'],
  ['freibad-bazis', 'Freibad Bazis', 'B'], ['team-desaster', 'Team Desaster', 'B'],
  ['dc-dark-angels', 'DC Dark Angels', 'B'], ['de-vogelwuidn', "De Vogelwuid'n", 'B'],

  ['wild-indians', 'Wild Indians', 'C'], ['muenchen-0815', 'München 08/15', 'C'],
  ['lucky-darts-two', 'Lucky Darts Two', 'C'], ['funny-darters', 'Funny Darters Munich', 'C'],
  ['black-devils', 'Black Devils', 'C'], ['fuenf-sterne-boazn', '5 Sterne Boazn Team', 'C'],
];
const LIGA_ORDER = ['La', 'A', 'B', 'C'];
const LIGA_LABEL = { La: 'La-Liga', A: 'A-Liga', B: 'B-Liga', C: 'C-Liga' };
const REQ_TO_LIGA = { la_liga: 'La', a_liga: 'A', b_liga: 'B', c_liga: 'C' };
const baseById = new Map(BASE.map(([id, name, liga, withdrawn]) => [id, { id, name, liga, withdrawn: !!withdrawn }]));

// ── ENV / Client ──────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

// ── Ziel-Saison ───────────────────────────────────────────────
let seasonId = seasonArg;
if (!seasonId) {
  const { data } = await admin.from('seasons').select('id, status').eq('status', 'registration_open');
  if (!data || data.length === 0) { console.error('Keine registration_open Saison. --season=… angeben.'); process.exit(1); }
  seasonId = data[0].id;
}

// ── Anmeldungen laden ─────────────────────────────────────────
const { data: regs, error } = await admin.from('team_registrations')
  .select('team_name, source_team_id, is_new_team, requested_league, assigned_competition_id, status')
  .eq('season_id', seasonId);
if (error) { console.error('team_registrations lesen:', error.message); process.exit(1); }

// Beste Anmeldung je Team/Neuteam (approved > eingereicht > entwurf).
const RANK = { approved: 4, in_review: 3, submitted: 3, changes_requested: 2, draft: 1, rejected: 0 };
const bestForBase = new Map();     // teamId → {status}
const newTeams = [];               // { name, liga, status }
for (const r of regs ?? []) {
  const st = r.status ?? 'draft';
  if (!r.is_new_team && r.source_team_id && baseById.has(r.source_team_id)) {
    const prev = bestForBase.get(r.source_team_id);
    if (!prev || (RANK[st] ?? 0) > (RANK[prev.status] ?? 0)) bestForBase.set(r.source_team_id, { status: st });
  } else {
    const liga = REQ_TO_LIGA[r.assigned_competition_id] ?? REQ_TO_LIGA[r.requested_league] ?? '?';
    newTeams.push({ name: r.team_name || '(ohne Namen)', liga, status: st });
  }
}

const isMeldung = (st) => (RANK[st] ?? 0) >= RANK.submitted; // eingereicht oder freigegeben
const stLabel = { approved: 'freigegeben', in_review: 'in Prüfung', submitted: 'eingereicht', changes_requested: 'Nachbesserung', draft: 'nur Entwurf', rejected: 'abgelehnt' };

console.log(`\n=== Anmeldungen ${seasonId}  vs.  Teams 25/26 ===\n`);

let totExpect = 0, totDone = 0, totDraft = 0, totMissing = 0;
for (const liga of LIGA_ORDER) {
  const teams = BASE.filter(([, , l]) => l === liga).map(([id]) => baseById.get(id));
  const active = teams.filter(t => !t.withdrawn);
  const done = [], draftOnly = [], missing = [];
  for (const t of active) {
    const b = bestForBase.get(t.id);
    if (b && isMeldung(b.status)) done.push(t);
    else if (b) draftOnly.push(t);
    else missing.push(t);
  }
  const newInLiga = newTeams.filter(n => n.liga === liga);
  totExpect += active.length; totDone += done.length; totDraft += draftOnly.length; totMissing += missing.length;

  console.log(`■ ${LIGA_LABEL[liga]} — ${done.length}/${active.length} gemeldet` +
    (draftOnly.length ? ` (+${draftOnly.length} nur Entwurf)` : '') +
    (newInLiga.length ? ` · ${newInLiga.length} neue Mannschaft(en)` : ''));
  if (done.length)      console.log(`   ✓ gemeldet:   ${done.map(t => t.name).join(', ')}`);
  if (draftOnly.length) console.log(`   ⋯ nur Entwurf: ${draftOnly.map(t => t.name).join(', ')}`);
  if (missing.length)   console.log(`   ✗ fehlen noch: ${missing.map(t => t.name).join(', ')}`);
  const withdrawn = teams.filter(t => t.withdrawn);
  if (withdrawn.length) console.log(`   – zurückgezogen (25/26): ${withdrawn.map(t => t.name).join(', ')}`);
  if (newInLiga.length) console.log(`   + neu: ${newInLiga.map(n => `${n.name} [${stLabel[n.status] ?? n.status}]`).join(', ')}`);
  console.log('');
}

console.log('── Gesamt ───────────────────────────────');
console.log(`Teams 25/26 (aktiv):     ${totExpect}`);
console.log(`davon gemeldet:          ${totDone}`);
if (totDraft)   console.log(`nur Entwurf:             ${totDraft}`);
console.log(`fehlen noch:             ${totMissing}`);
console.log(`neue Mannschaften:       ${newTeams.length}`);
console.log(`Anmeldungen gesamt (Datensätze): ${(regs ?? []).length}`);
