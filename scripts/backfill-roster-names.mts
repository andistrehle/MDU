// ============================================================
// Backfill: fehlende Vor-/Nachnamen in Anmelde-Kadern nachtragen
// ============================================================
//
// Hintergrund: Neue Spieler wurden in der Mannschaftsanmeldung nur über EIN
// Feld (`display_name`) erfasst; `first_name`/`last_name` blieben leer. Die
// Kaderübernahme kopiert aber `first_name`/`last_name` → in
// `season_roster_assignments` standen dann namenlose Zeilen (Admin/Freigabe
// zeigten nichts, Passnummern-Vergabe hätte Leer-Profile erzeugt).
//
// Dieses Skript trägt die Namen aus `display_name` nach:
//   1) team_registration_players: first_name/last_name aus display_name ableiten
//      (letztes Wort = Nachname, Rest = Vorname), wo sie leer sind.
//   2) season_roster_assignments: leere first_name/last_name aus der verknüpften
//      Anmelde-Zeile (registration_player_id) übernehmen.
//
// Voraussetzung: .env.local mit SUPABASE_SERVICE_ROLE_KEY.
// DRY-RUN (nur anzeigen):   npx tsx scripts/backfill-roster-names.mts
// ECHT anwenden:            npx tsx scripts/backfill-roster-names.mts --apply
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

// ── ENV / Client ──────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

const isEmpty = (s: string | null | undefined) => !(s ?? '').trim();
function splitDisplayName(display: string): { first: string; last: string } {
  const parts = (display ?? '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

// ── 1) team_registration_players ──────────────────────────────
type TRP = { id: string; first_name: string | null; last_name: string | null; display_name: string | null };
const { data: trpData, error: trpErr } = await admin
  .from('team_registration_players')
  .select('id, first_name, last_name, display_name');
if (trpErr) { console.error('team_registration_players lesen:', trpErr.message); process.exit(1); }
const trp = (trpData ?? []) as TRP[];

// Ziel-Namen je Anmelde-Zeile (aus display_name), inkl. der schon gefüllten
// (für den Übertrag in den Kader). Fix nötig nur, wenn first+last leer.
const nameById = new Map<string, { first: string; last: string }>();
const trpFixes: { id: string; first: string; last: string; from: string }[] = [];
for (const r of trp) {
  const first0 = (r.first_name ?? '').trim(), last0 = (r.last_name ?? '').trim();
  if (first0 || last0) { nameById.set(r.id, { first: first0, last: last0 }); continue; }
  if (isEmpty(r.display_name)) { nameById.set(r.id, { first: '', last: '' }); continue; }
  const s = splitDisplayName(r.display_name!);
  nameById.set(r.id, s);
  trpFixes.push({ id: r.id, first: s.first, last: s.last, from: r.display_name!.trim() });
}

// ── 2) season_roster_assignments ──────────────────────────────
type SRA = { id: string; first_name: string | null; last_name: string | null; registration_player_id: string | null; team_id: string };
const { data: sraData, error: sraErr } = await admin
  .from('season_roster_assignments')
  .select('id, first_name, last_name, registration_player_id, team_id');
if (sraErr) { console.error('season_roster_assignments lesen:', sraErr.message); process.exit(1); }
const sra = (sraData ?? []) as SRA[];

const sraFixes: { id: string; first: string; last: string; team: string }[] = [];
const sraUnfixable: SRA[] = [];
for (const r of sra) {
  if (!isEmpty(r.first_name) || !isEmpty(r.last_name)) continue;  // schon benannt
  const src = r.registration_player_id ? nameById.get(r.registration_player_id) : undefined;
  if (src && (src.first || src.last)) sraFixes.push({ id: r.id, first: src.first, last: src.last, team: r.team_id });
  else sraUnfixable.push(r);
}

// ── Bericht ───────────────────────────────────────────────────
console.log(`\n=== backfill-roster-names  ${APPLY ? '[ANWENDEN]' : '[DRY-RUN]'} ===`);
console.log(`Anmelde-Zeilen zu füllen (team_registration_players): ${trpFixes.length}`);
for (const f of trpFixes) console.log(`  "${f.from}"  →  first="${f.first}"  last="${f.last}"`);
console.log(`\nKaderzeilen zu füllen (season_roster_assignments): ${sraFixes.length}`);
for (const f of sraFixes) console.log(`  [${f.team}]  first="${f.first}"  last="${f.last}"`);
if (sraUnfixable.length) {
  console.log(`\n⚠ ${sraUnfixable.length} namenlose Kaderzeile(n) ohne verwertbare Quelle (kein display_name):`);
  for (const r of sraUnfixable) console.log(`  id=${r.id} team=${r.team_id} reg_player=${r.registration_player_id ?? '—'}`);
}

if (!APPLY) {
  console.log(`\nDRY-RUN – nichts geschrieben. Mit  --apply  wirklich anwenden.`);
  process.exit(0);
}

// ── Anwenden ──────────────────────────────────────────────────
let okT = 0, okR = 0;
for (const f of trpFixes) {
  const { error } = await admin.from('team_registration_players').update({ first_name: f.first, last_name: f.last }).eq('id', f.id);
  if (error) console.error(`FEHLER TRP ${f.id}: ${error.message}`); else okT++;
}
for (const f of sraFixes) {
  const { error } = await admin.from('season_roster_assignments').update({ first_name: f.first, last_name: f.last }).eq('id', f.id);
  if (error) console.error(`FEHLER SRA ${f.id}: ${error.message}`); else okR++;
}
console.log(`\nFertig: ${okT}/${trpFixes.length} Anmelde-Zeilen · ${okR}/${sraFixes.length} Kaderzeilen aktualisiert.`);
