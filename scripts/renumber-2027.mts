// ============================================================
// Einmal-Umstellung: Passnummern auf die Systematik MDU 27 YYYY (Saison 2026/2027)
// ============================================================
//
// Betreiber-Regel:
//   • Format MDU 27 YYYY (27 = Saison 2026/2027; YYYY = permanente 4-stellige Nr.).
//   • Bestehende 4-stellige Nummern bleiben, bekommen nur die "27": MDU 27 YYYY.
//   • 5-/3-stellige Ausreißer werden in den 100er-Block ihres Teams einsortiert
//     (TC bevorzugt X01), global eindeutig.
//   • Dublette 3703: Silvi Lindner behält, Markus Schneider bekommt die nächste
//     freie Spartans-Nummer.
//   • Inaktiv (bleiben unverändert): Dimos Katsikas, Peter Seidl.
//   • TCs, die nicht auf X01 sitzen, behalten ihre Nummer (nur "27" dazu).
//
// Aktualisiert public.players.license_number (idempotent). Vorhandene 27er-Saison-
// Kaderzeilen (season_roster_assignments) werden – falls vorhanden – mitgezogen.
//
// Voraussetzung: .env.local mit SUPABASE_SERVICE_ROLE_KEY.
// DRY-RUN (nur anzeigen):   npx tsx scripts/renumber-2027.mts
// ECHT anwenden:            npx tsx scripts/renumber-2027.mts --apply
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { TEAMS } from '../lib/data/teams';
import { getPlayersForTeamInSeason, getCaptainForTeamInSeason } from '../lib/data/assignments';
import { getCurrentSeason } from '../lib/data/seasons';
import { getPlayerDisplayName } from '../lib/data/players';
import { parseLicenseNumber } from '../lib/data/pass-numbers';
import { normalizePersonName } from '../lib/auth/player-match';

const APPLY = process.argv.includes('--apply');
const SEASON_PREFIX = '27';

// ── ENV / Client ──────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

// ── Mapping aus dem statischen Bestand berechnen (= bestätigte Excel-Logik) ──
const season = getCurrentSeason().id;
const clean = (n: number | null) => n != null && n >= 1000 && n < 10000;

interface P { id: string; name: string; teamId: string; num: number | null; raw: string; isCap: boolean }
const byId = new Map<string, P>();
for (const t of TEAMS) {
  const cap = getCaptainForTeamInSeason(t.id, season);
  for (const { player: p } of getPlayersForTeamInSeason(t.id, season)) {
    if (byId.has(p.id)) continue;
    const cands = [getPlayerDisplayName(p), `${p.firstName} ${p.lastName}`].map(normalizePersonName);
    byId.set(p.id, { id: p.id, name: getPlayerDisplayName(p), teamId: t.id, num: parseLicenseNumber(p.licenseNumber), raw: p.licenseNumber ?? '', isCap: !!cap && cands.includes(normalizePersonName(cap)) });
  }
}
const all = [...byId.values()];

const RETIRED = new Set(['Dimos Katsikas', 'Peter Seidl']);      // bleiben unverändert
const DUPE_REASSIGN = new Set(['Markus Schneider']);            // Silvi Lindner behält 3703

// global belegte Nummern (ohne die neu zu vergebenden)
const used = new Set<number>();
for (const p of all) if (clean(p.num) && !DUPE_REASSIGN.has(p.name)) used.add(p.num!);
// Block je Team (Modus der Hunderter)
const block = new Map<string, number>();
for (const t of TEAMS) {
  const c = all.filter(p => p.teamId === t.id && clean(p.num)).map(p => p.num as number);
  if (c.length) { const m = new Map<number, number>(); for (const n of c) { const b = Math.floor(n / 100) * 100; m.set(b, (m.get(b) ?? 0) + 1); } block.set(t.id, [...m.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]); }
}
function assign(teamId: string, isCap: boolean): number | null {
  const B = block.get(teamId); if (B == null) return null;
  if (isCap && !used.has(B + 1)) { used.add(B + 1); return B + 1; }
  for (let i = 1; i <= 99; i++) if (!used.has(B + i)) { used.add(B + i); return B + i; }
  return null;
}
// zu vergeben: Ausreißer (nicht clean, nicht retired) + Dublette; TC zuerst (X01)
const toAssign = all.filter(p => (!clean(p.num) && !RETIRED.has(p.name)) || DUPE_REASSIGN.has(p.name))
  .sort((a, b) => (b.isCap ? 1 : 0) - (a.isCap ? 1 : 0));
const newNum = new Map<string, number>();
for (const p of toAssign) { const n = assign(p.teamId, p.isCap); if (n != null) newNum.set(p.id, n); }

// Ziel-Passnummer je Spieler-Id (null = unverändert lassen)
const target = new Map<string, string>();
for (const p of all) {
  if (RETIRED.has(p.name)) continue;
  const n4 = newNum.has(p.id) ? newNum.get(p.id)! : (clean(p.num) ? p.num! : null);
  if (n4 != null) target.set(p.id, `MDU ${SEASON_PREFIX} ${n4}`);
}
// Endcheck Eindeutigkeit
const vals = [...target.values()];
const dupe = vals.filter((v, i) => vals.indexOf(v) !== i);
if (dupe.length) { console.error('ABBRUCH – Ziel-Nummern nicht eindeutig:', [...new Set(dupe)]); process.exit(1); }

// ── DB laden + abgleichen ─────────────────────────────────────
const { data: dbPlayers, error: le } = await admin.from('players').select('id, first_name, last_name, license_number');
if (le) { console.error('players lesen fehlgeschlagen:', le.message); process.exit(1); }
const dbById = new Map((dbPlayers ?? []).map(r => [r.id as string, r as { id: string; first_name: string; last_name: string; license_number: string | null }]));

const changes: { id: string; name: string; old: string; neu: string }[] = [];
let already = 0, missing = 0;
for (const [id, neu] of target) {
  const db = dbById.get(id);
  if (!db) { missing++; continue; }                       // Spieler (noch) nicht in DB
  if ((db.license_number ?? '') === neu) { already++; continue; } // schon korrekt (idempotent)
  changes.push({ id, name: `${db.first_name} ${db.last_name}`, old: db.license_number ?? '—', neu });
}
const dbOnly = (dbPlayers ?? []).filter(r => !target.has(r.id as string)).length;

console.log(`\n=== renumber-2027  ${APPLY ? '[ANWENDEN]' : '[DRY-RUN]'} ===`);
console.log(`Spieler im Mapping: ${target.size} · schon korrekt: ${already} · zu ändern: ${changes.length} · nicht in DB: ${missing}`);
console.log(`DB-Spieler ohne Mapping (bleiben unberührt): ${dbOnly}\n`);
for (const c of changes) console.log(`  ${c.name.padEnd(26).slice(0, 26)} | ${String(c.old).padEnd(14)} → ${c.neu}`);

if (!APPLY) {
  console.log(`\nDRY-RUN – nichts geschrieben. Mit  --apply  wirklich anwenden.`);
  process.exit(0);
}

// ── Anwenden ──────────────────────────────────────────────────
let ok = 0;
for (const c of changes) {
  const { error: pe } = await admin.from('players').update({ license_number: c.neu }).eq('id', c.id);
  if (pe) { console.error(`FEHLER bei ${c.name}: ${pe.message}`); continue; }
  // Falls es schon 27er-Saison-Kaderzeilen gibt, dort mitziehen (best effort).
  await admin.from('season_roster_assignments').update({ license_number: c.neu })
    .eq('player_id', c.id).ilike('license_number', 'MDU%');
  ok++;
}
console.log(`\nFertig: ${ok}/${changes.length} Passnummern aktualisiert.`);
