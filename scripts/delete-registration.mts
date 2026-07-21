// ============================================================
// Anmeldung eines Teams für EINE Saison vollständig entfernen
// ============================================================
//
// Löscht streng begrenzt auf (team_id + season_id):
//   • season_roster_assignments  (Kaderzeilen dieser Saison)
//   • season_team_assignments    (freigegebene Saisonzuordnung)
//   • team_registration_players  (Anmelde-Kader)
//   • team_registrations         (die Anmeldung(en) selbst)
// Die Stammdaten des Teams (Tabelle `teams`) und andere Saisons bleiben
// unangetastet. Spielerprofile werden NICHT gelöscht.
//
// Standard-Ziel: freibad-bazis / season-2027 (Testanmeldung). Über Argumente
// überschreibbar:  --team=<team_id>  --season=<season_id>
//
// Voraussetzung: .env.local mit SUPABASE_SERVICE_ROLE_KEY.
// DRY-RUN (nur anzeigen):   npx tsx scripts/delete-registration.mts
// ECHT löschen:             npx tsx scripts/delete-registration.mts --apply
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const arg = (name: string, def: string) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const TEAM = arg('team', 'freibad-bazis');
const SEASON = arg('season', 'season-2027');

// ── ENV / Client ──────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

console.log(`\n=== delete-registration  ${APPLY ? '[LÖSCHEN]' : '[DRY-RUN]'} ===`);
console.log(`Ziel: team_id="${TEAM}"  season_id="${SEASON}"\n`);

// ── Betroffene Anmeldung(en) finden ───────────────────────────
const { data: regs, error: re } = await admin
  .from('team_registrations')
  .select('id, team_name, status, source_team_id, result_team_id, season_id')
  .eq('season_id', SEASON)
  .or(`source_team_id.eq.${TEAM},result_team_id.eq.${TEAM}`);
if (re) { console.error('team_registrations lesen:', re.message); process.exit(1); }
const regIds = (regs ?? []).map(r => r.id as string);

// ── Betroffene Zeilen zählen/anzeigen ─────────────────────────
const { data: sta } = await admin.from('season_team_assignments')
  .select('id, status').eq('season_id', SEASON).eq('team_id', TEAM);
const { data: sra } = await admin.from('season_roster_assignments')
  .select('id, first_name, last_name, player_id, status').eq('season_id', SEASON).eq('team_id', TEAM);
const { data: trp } = regIds.length
  ? await admin.from('team_registration_players').select('id, first_name, last_name').in('registration_id', regIds)
  : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };

console.log(`Anmeldungen (team_registrations): ${regs?.length ?? 0}`);
for (const r of regs ?? []) console.log(`  ${r.id}  "${r.team_name}"  status=${r.status}`);
console.log(`Anmelde-Kader (team_registration_players): ${trp?.length ?? 0}`);
for (const p of trp ?? []) console.log(`  ${(`${p.first_name ?? ''} ${p.last_name ?? ''}`).trim() || '(ohne Namen)'}`);
console.log(`Saisonzuordnung (season_team_assignments): ${sta?.length ?? 0}`);
console.log(`Saisonkader (season_roster_assignments): ${sra?.length ?? 0}`);
for (const p of sra ?? []) console.log(`  ${(`${p.first_name ?? ''} ${p.last_name ?? ''}`).trim() || '(ohne Namen)'}  ${p.player_id ? `[${p.player_id}]` : ''} status=${p.status}`);

if ((regs?.length ?? 0) === 0 && (sta?.length ?? 0) === 0 && (sra?.length ?? 0) === 0) {
  console.log('\nNichts zu löschen – für dieses Team/diese Saison existiert keine Anmeldung.');
  process.exit(0);
}

if (!APPLY) {
  console.log(`\nDRY-RUN – nichts gelöscht. Mit  --apply  wirklich löschen.`);
  process.exit(0);
}

// ── Löschen (Kind → Eltern) ───────────────────────────────────
const del = async (label: string, p: Promise<{ error: { message: string } | null }>) => {
  const { error } = await p;
  if (error) { console.error(`FEHLER ${label}: ${error.message}`); return false; }
  console.log(`  gelöscht: ${label}`);
  return true;
};

await del('season_roster_assignments', admin.from('season_roster_assignments').delete().eq('season_id', SEASON).eq('team_id', TEAM));
await del('season_team_assignments', admin.from('season_team_assignments').delete().eq('season_id', SEASON).eq('team_id', TEAM));
if (regIds.length) {
  await del('team_registration_players', admin.from('team_registration_players').delete().in('registration_id', regIds));
  await del('team_registrations', admin.from('team_registrations').delete().in('id', regIds));
}
console.log(`\nFertig. "${TEAM}" ist aus Saison "${SEASON}" entfernt – du kannst sauber neu anmelden.`);
