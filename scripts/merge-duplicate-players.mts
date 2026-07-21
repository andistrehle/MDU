// ============================================================
// Dublette-Spieler zusammenführen (Teamwechsler, doppelt angelegt)
// ============================================================
//
// Hintergrund: Wechselt ein Spieler das Team und wird bei der Mannschafts-
// anmeldung als „neu" getippt, legte die Freigabe früher ein ZWEITES Profil mit
// neuer Passnummer an (z. B. Peter Kerklau: alt 2912 + neu 1207). Die
// Freigabe-Logik ist inzwischen gefixt (verknüpft bestehende Profile), aber
// bereits entstandene Dubletten müssen einmalig bereinigt werden.
//
// Dieses Skript erkennt Namensgleiche, bei denen genau EINE Seite eine frisch
// generierte Registrierungs-Dublette ist (id endet auf „-<nummer>", source=
// 'registration') und die andere das bestehende Stammprofil. Es führt die
// Dublette in das Stammprofil zusammen:
//   • profiles / player_assignments / season_roster_assignments → auf Stammprofil
//     umbiegen (Kader übernimmt die permanente Nummer des Stammprofils),
//   • Dubletten-Profil löschen.
// Mehrdeutige Fälle werden NICHT angefasst, sondern nur gemeldet.
//
// Voraussetzung: .env.local mit SUPABASE_SERVICE_ROLE_KEY.
// DRY-RUN (nur anzeigen):   npx tsx scripts/merge-duplicate-players.mts
// ECHT anwenden:            npx tsx scripts/merge-duplicate-players.mts --apply
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { normalizePersonName } from '../lib/auth/player-match';

const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

type P = { id: string; first_name: string | null; last_name: string | null; display_name: string | null; license_number: string | null; source: string | null };
const { data: pData, error: pe } = await admin.from('players').select('id, first_name, last_name, display_name, license_number, source');
if (pe) { console.error('players lesen:', pe.message); process.exit(1); }
const players = (pData ?? []) as P[];

const nameOf = (p: P) => (p.display_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`).trim();
const isRegDup = (p: P) => /-\d+$/.test(p.id) && (p.source ?? '') === 'registration';

// Namensgruppen bilden
const groups = new Map<string, P[]>();
for (const p of players) {
  const k = normalizePersonName(nameOf(p));
  if (!k) continue;
  (groups.get(k) ?? groups.set(k, []).get(k)!).push(p);
}

const merges: { dup: P; canon: P }[] = [];
const manual: { name: string; ids: string[] }[] = [];
for (const [, g] of groups) {
  if (g.length < 2) continue;
  const dups = g.filter(isRegDup);
  const canons = g.filter(p => !isRegDup(p));
  if (dups.length >= 1 && canons.length === 1) {
    for (const dup of dups) merges.push({ dup, canon: canons[0] });
  } else {
    manual.push({ name: nameOf(g[0]), ids: g.map(p => `${p.id}${isRegDup(p) ? ' (reg-dup)' : ''}`) });
  }
}

console.log(`\n=== merge-duplicate-players  ${APPLY ? '[ANWENDEN]' : '[DRY-RUN]'} ===`);
console.log(`Zusammenzuführen: ${merges.length}`);
for (const m of merges) {
  console.log(`  "${nameOf(m.dup)}"  Dublette ${m.dup.id} (${m.dup.license_number ?? '—'})  →  Stamm ${m.canon.id} (${m.canon.license_number ?? '—'})`);
}
if (manual.length) {
  console.log(`\n⚠ Mehrdeutig – bitte manuell prüfen (NICHT automatisch zusammengeführt):`);
  for (const m of manual) console.log(`  "${m.name}": ${m.ids.join(' , ')}`);
}
if (merges.length === 0) { console.log('\nKeine eindeutigen Dubletten gefunden.'); process.exit(0); }

if (!APPLY) { console.log(`\nDRY-RUN – nichts geändert. Mit  --apply  wirklich zusammenführen.`); process.exit(0); }

// ── Anwenden ──────────────────────────────────────────────────
let done = 0;
for (const { dup, canon } of merges) {
  const canonLic = canon.license_number ?? null;

  // 1) Konten, die auf die Dublette zeigen, aufs Stammprofil umbiegen.
  await admin.from('profiles').update({ player_id: canon.id }).eq('player_id', dup.id);

  // 2) Zuordnungen der Dublette übernehmen (bei Kollision season+team → löschen).
  const { data: dupPA } = await admin.from('player_assignments')
    .select('id, season_id, team_id').eq('player_id', dup.id);
  for (const a of (dupPA ?? []) as { id: string; season_id: string; team_id: string }[]) {
    const { data: exists } = await admin.from('player_assignments')
      .select('id').eq('player_id', canon.id).eq('season_id', a.season_id).eq('team_id', a.team_id).limit(1);
    if (exists && exists.length) await admin.from('player_assignments').delete().eq('id', a.id);
    else await admin.from('player_assignments').update({ player_id: canon.id }).eq('id', a.id);
  }

  // 3) Kaderzeilen der Dublette aufs Stammprofil + dessen permanente Nummer.
  await admin.from('season_roster_assignments')
    .update({ player_id: canon.id, license_number: canonLic }).eq('player_id', dup.id);

  // 4) Dubletten-Profil löschen.
  const { error: de } = await admin.from('players').delete().eq('id', dup.id);
  if (de) { console.error(`FEHLER löschen ${dup.id}: ${de.message}`); continue; }
  console.log(`  zusammengeführt: ${dup.id} → ${canon.id}`);
  done++;
}
console.log(`\nFertig: ${done}/${merges.length} Dubletten zusammengeführt.`);
