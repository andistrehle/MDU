// ============================================================
// Konto-↔-Team-Zuordnung nachziehen (Altfälle einer Saison)
// ============================================================
//
// Setzt profiles.team_id für alle Konten, deren verknüpfter Spieler im Kader
// einer Saison steht, aber deren Konto noch nicht (oder auf ein altes Team)
// verknüpft ist. Entspricht dem, was seit dem Fix bei jeder neuen Freigabe/
// Nachmeldung automatisch passiert — dieses Skript holt nur die Altfälle nach.
//
// WICHTIG — die HISTORIE bleibt unberührt:
//   • Angefasst wird AUSSCHLIESSLICH profiles.team_id (der „aktuelle-Team"-Zeiger
//     am Konto) + ggf. match_status = 'confirmed'.
//   • Die saisonbezogene Historie (season_roster_assignments / player_assignments)
//     wird NICHT gelesen zum Ändern und NIE geschrieben. Wer wann in welchem Team
//     war, bleibt damit vollständig erhalten.
//
// Ziel-Saison: standardmäßig die offene Anmelde-Saison (status registration_open).
//   Überschreibbar:  --season=season-2027
//
// Sicherheitsregeln:
//   • Spieler in MEHREREN Teams dieser Saison → übersprungen (⚠, manuell klären).
//   • Konten, die bewusst „ohne Zuordnung" (match_status = 'rejected') sind →
//     übersprungen (deliberate Entscheidung nicht überschreiben).
//   • Steht das Konto schon auf dem richtigen Team → nichts zu tun.
//
// Voraussetzung: .env.local mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// DRY-RUN (nur anzeigen):   node scripts/backfill-account-teams.mjs
// ECHT schreiben:           node scripts/backfill-account-teams.mjs --apply
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const seasonArg = process.argv.find(a => a.startsWith('--season='))?.slice('--season='.length);

// ── ENV / Client ──────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

// ── Ziel-Saison bestimmen ─────────────────────────────────────
let seasonId = seasonArg;
if (!seasonId) {
  const { data, error } = await admin.from('seasons').select('id, name, status').eq('status', 'registration_open');
  if (error) { console.error('seasons lesen:', error.message); process.exit(1); }
  if (!data || data.length === 0) { console.error('Keine Saison mit status=registration_open gefunden. Bitte --season=… angeben.'); process.exit(1); }
  seasonId = data[0].id;
}

console.log(`\n=== backfill-account-teams  ${APPLY ? '[SCHREIBEN]' : '[DRY-RUN]'} ===`);
console.log(`Ziel-Saison: ${seasonId}`);
console.log('Historie (season_roster_assignments / player_assignments) wird NICHT verändert.\n');

// ── Kader dieser Saison: player_id → Set<team_id> ─────────────
// Quelle sind die freigegebenen Kaderzeilen (mit player_id, aktiv). Beide Tabellen
// werden nur GELESEN.
const playerTeams = new Map();
const addRows = (rows) => {
  for (const r of rows ?? []) {
    if (!r.player_id || !r.team_id) continue;
    const s = playerTeams.get(r.player_id) ?? new Set();
    s.add(r.team_id);
    playerTeams.set(r.player_id, s);
  }
};
const { data: sra } = await admin.from('season_roster_assignments')
  .select('player_id, team_id, status').eq('season_id', seasonId).eq('status', 'active').not('player_id', 'is', null);
addRows(sra);
const { data: pa } = await admin.from('player_assignments')
  .select('player_id, team_id, status').eq('season_id', seasonId).eq('status', 'active').not('player_id', 'is', null);
addRows(pa);

if (playerTeams.size === 0) { console.log('Kein aktiver Kader mit verknüpften Spielern in dieser Saison gefunden.'); process.exit(0); }

// ── Namen für die Ausgabe ─────────────────────────────────────
const { data: teams } = await admin.from('teams').select('id, name');
const teamName = new Map((teams ?? []).map(t => [t.id, t.name]));
const tn = (id) => (id ? (teamName.get(id) ?? id) : '—');

// ── Profile mit verknüpftem Spieler abgleichen ────────────────
const { data: profs, error: pe } = await admin.from('profiles')
  .select('id, email, display_name, player_id, team_id, match_status').not('player_id', 'is', null);
if (pe) { console.error('profiles lesen:', pe.message); process.exit(1); }

const changes = [];
const ambiguous = [];
const skippedRejected = [];
for (const p of profs ?? []) {
  const set = playerTeams.get(p.player_id);
  if (!set || set.size === 0) continue;                 // Spieler nicht in dieser Saison → Konto nicht anfassen
  if (p.match_status === 'rejected') { skippedRejected.push(p); continue; } // bewusst ohne Zuordnung
  if (set.size > 1) { ambiguous.push({ p, teams: [...set] }); continue; }   // mehrere Teams → manuell
  const target = [...set][0];
  if (p.team_id === target) continue;                   // schon korrekt
  changes.push({ p, from: p.team_id, to: target });
}

// ── Bericht ───────────────────────────────────────────────────
console.log(`Zu ändern: ${changes.length}`);
for (const c of changes) {
  console.log(`  ${c.p.email}  (${c.p.display_name})  ${tn(c.from)} → ${tn(c.to)}`);
}
if (ambiguous.length) {
  console.log(`\n⚠ Übersprungen – Spieler in mehreren Teams (bitte manuell klären): ${ambiguous.length}`);
  for (const a of ambiguous) console.log(`  ${a.p.email}  (${a.p.display_name})  Teams: ${a.teams.map(tn).join(', ')}`);
}
if (skippedRejected.length) {
  console.log(`\nÜbersprungen – bewusst ohne Zuordnung (match_status=rejected): ${skippedRejected.length}`);
  for (const p of skippedRejected) console.log(`  ${p.email}  (${p.display_name})`);
}

if (changes.length === 0) { console.log('\nNichts zu tun – alle Konten stehen bereits auf dem richtigen Team.'); process.exit(0); }

if (!APPLY) {
  console.log(`\nDRY-RUN – nichts geschrieben. Mit  --apply  wirklich setzen.`);
  process.exit(0);
}

// ── Schreiben (nur profiles.team_id) ──────────────────────────
let ok = 0;
for (const c of changes) {
  const patch = { team_id: c.to };
  if (c.p.match_status !== 'confirmed') patch.match_status = 'confirmed';
  const { error } = await admin.from('profiles').update(patch).eq('id', c.p.id);
  if (error) { console.error(`  FEHLER ${c.p.email}: ${error.message}`); continue; }
  ok++;
}
console.log(`\nFertig. ${ok}/${changes.length} Konten aktualisiert. Historie unverändert.`);
