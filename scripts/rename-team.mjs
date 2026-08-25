// ============================================================
// Team umbenennen (DB-Name) — z. B. Sound Warrior's → Jolly Pirates …
// ============================================================
//
// Ändert AUSSCHLIESSLICH den Namen in der DB-Tabelle `teams` (und, falls
// vorhanden, den Anzeigenamen der laufenden Anmelde-Saison in
// team_registrations). Damit greift der neue Name in allen DB-getriebenen
// 26/27-Ansichten (Saison-Teams, Mein Team). Die 25/26-Historie kommt aus den
// STATISCHEN Daten (lib/data) und bleibt unter dem alten Namen — genau so
// gewollt.
//
// Aufruf (DRY-RUN):
//   node scripts/rename-team.mjs
// Echt schreiben:
//   node scripts/rename-team.mjs --apply
// Andere Werte:
//   node scripts/rename-team.mjs --team=<id> --name="Neuer Name" --apply
//
// Voraussetzung: .env.local mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const arg = (name, def) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const TEAM = arg('team', 'sound-warriors');
const NAME = arg('name', "Jolly Pirates Sound Warrior's");

// ── ENV / Client ──────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

console.log(`\n=== rename-team  ${APPLY ? '[SCHREIBEN]' : '[DRY-RUN]'} ===`);

// ── Aktuellen Namen holen ─────────────────────────────────────
const { data: team, error: te } = await admin.from('teams').select('id, name, short_name').eq('id', TEAM).maybeSingle();
if (te) { console.error('teams lesen:', te.message); process.exit(1); }
if (!team) { console.error(`Kein Team mit id="${TEAM}" in der DB gefunden.`); process.exit(1); }
console.log(`Team-ID:   ${team.id}`);
console.log(`Alt:       „${team.name}"`);
console.log(`Neu:       „${NAME}"`);

// Anmelde-Saison (registration_open) für den optionalen Registrierungs-Namen.
const { data: reg } = await admin.from('seasons').select('id').eq('status', 'registration_open').maybeSingle();
const regSeasonId = reg?.id ?? null;
let regRows = [];
if (regSeasonId) {
  const { data } = await admin.from('team_registrations')
    .select('id, team_name, status').eq('season_id', regSeasonId).eq('source_team_id', TEAM);
  regRows = data ?? [];
  for (const r of regRows) console.log(`Anmeldung: ${r.id} · „${r.team_name}" (status=${r.status})`);
}

if (team.name === NAME) { console.log('\nName ist bereits gesetzt – nichts zu tun.'); process.exit(0); }

if (!APPLY) {
  console.log(`\nDRY-RUN – nichts geschrieben. Mit  --apply  wirklich umbenennen.`);
  console.log(`Hinweis: Die 25/26-Historie (statische Daten) bleibt „${team.name}".`);
  process.exit(0);
}

// ── Schreiben ─────────────────────────────────────────────────
const { error: ue } = await admin.from('teams').update({ name: NAME }).eq('id', TEAM);
if (ue) { console.error(`FEHLER teams: ${ue.message}`); process.exit(1); }
console.log(`  teams.name aktualisiert.`);

// Registrierungs-Anzeigenamen der Anmelde-Saison mitziehen (Konsistenz im Admin).
for (const r of regRows) {
  const { error } = await admin.from('team_registrations').update({ team_name: NAME }).eq('id', r.id);
  if (error) console.error(`  FEHLER team_registrations (${r.id}): ${error.message}`);
  else console.log(`  team_registrations ${r.id} aktualisiert.`);
}

console.log(`\nFertig. „${team.name}" → „${NAME}" (ab 26/27). 25/26-Historie unverändert.`);
