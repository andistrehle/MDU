// ============================================================
// Cleanup: nachgemeldeten (Test-)Spieler wieder entfernen
// ============================================================
//
// Entfernt eine per Nachmeldung angelegte Person vollständig aus der DB:
//   1. player_assignments (Kaderzuordnung der Nachmeldung)
//   2. players            (nur wenn source='nomination' — Sicherheitscheck!)
//   3. player_nominations (die Nachmeldung selbst)
//
// Es werden AUSSCHLIESSLICH Datensätze mit source='nomination' angefasst —
// der aus dartunion übernommene Stamm (source='dartunion') bleibt unberührt.
//
// Voraussetzung: .env.local mit SUPABASE_SERVICE_ROLE_KEY (wie beim Seed).
// Start (aus Repo-Root):
//   npx tsx scripts/delete-nominated-player.mts "Hans Dampf"
// Ohne Argument wird standardmäßig „Hans Dampf" entfernt.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

const name = (process.argv[2] ?? 'Hans Dampf').trim();
const parts = name.split(/\s+/);
const first = parts[0] ?? '';
const last = parts.slice(1).join(' ');
if (!first || !last) { console.error('Bitte Vor- UND Nachname angeben, z. B.: "Hans Dampf"'); process.exit(1); }

console.log(`Suche Nachmeldung(en) für „${first} ${last}" …`);
const { data: noms, error: qe } = await admin.from('player_nominations')
  .select('id, first_name, last_name, player_id, license_number, status')
  .ilike('first_name', first).ilike('last_name', last);
if (qe) { console.error('Query-Fehler:', qe.message); process.exit(1); }
if (!noms || noms.length === 0) { console.log('Keine passende Nachmeldung gefunden — nichts zu tun.'); process.exit(0); }

for (const n of noms as { id: string; first_name: string; last_name: string; player_id: string | null; license_number: string | null; status: string }[]) {
  console.log(`\n• Nachmeldung ${n.id} — ${n.first_name} ${n.last_name} (${n.license_number ?? 'ohne Nr.'}), Status ${n.status}, player_id ${n.player_id ?? '—'}`);

  if (n.player_id) {
    // Sicherheitscheck: nur selbst angelegte (source='nomination') Spieler löschen.
    const { data: prow } = await admin.from('players').select('id, source').eq('id', n.player_id).maybeSingle();
    const p = prow as { id: string; source: string } | null;
    if (p && p.source === 'nomination') {
      const { error: ae } = await admin.from('player_assignments').delete().eq('player_id', n.player_id);
      if (ae) console.warn('  player_assignments delete:', ae.message);
      else console.log('  player_assignments entfernt');
      const { error: pe } = await admin.from('players').delete().eq('id', n.player_id);
      if (pe) console.warn('  players delete:', pe.message);
      else console.log('  players entfernt:', n.player_id);
    } else if (p) {
      console.warn(`  players ${n.player_id} hat source=${p.source} — NICHT gelöscht (Sicherheitscheck).`);
    } else {
      console.log('  Kein players-Datensatz vorhanden.');
    }
  }

  const { error: ne } = await admin.from('player_nominations').delete().eq('id', n.id);
  if (ne) console.warn('  player_nominations delete:', ne.message);
  else console.log('  Nachmeldung entfernt');
}

console.log('\nDONE');
