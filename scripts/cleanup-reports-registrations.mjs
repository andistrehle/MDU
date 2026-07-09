// ============================================================
// Aufräum-Skript: ALLE Spielberichte + ALLE Mannschaftsanmeldungen löschen
// ============================================================
//
// Für einen sauberen Start vor dem Go-live. Löscht (Service-Role):
//   • ALLE Spielberichte (match_reports) inkl. Spiele/Spieler/Historie (Cascade)
//   • ALLE OCR-Uploads (match_report_uploads) inkl. Storage-Fotos + OCR-Ergebnisse
//   • ALLE Mannschaftsanmeldungen (team_registrations) inkl. Anmelde-Kader (Cascade)
//
// NICHT betroffen (bewusst): season_team_assignments (die bereits übernommenen
// Saisondaten) — deren registration_id wird durch das Löschen nur auf NULL
// gesetzt, die Zuordnung bleibt bestehen. Ebenso Benachrichtigungen (kein FK;
// bleiben als Historie stehen). Spieler-Nachmeldungen (player_nominations)
// bleiben ebenfalls unangetastet.
//
// SICHERHEIT: Standard = Trockenlauf (zeigt nur, WAS gelöscht würde).
//   Trockenlauf:  node scripts/cleanup-reports-registrations.mjs
//   Wirklich:     node scripts/cleanup-reports-registrations.mjs --yes
//
// Braucht .env.local mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// (Service-Role) → lokal ausführen, nicht in Cloud-/Handy-Sessions.
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('ENV fehlt (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'); process.exit(1); }

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const BUCKET = 'match-report-uploads';
const APPLY = process.argv.includes('--yes');
const ALL = (q) => q.not('id', 'is', null); // „alle Zeilen"-Filter (delete braucht ein where)

async function count(table) {
  const { count: c } = await admin.from(table).select('id', { count: 'exact', head: true });
  return c ?? 0;
}

async function main() {
  console.log(APPLY ? '*** LÖSCHMODUS (--yes) ***\n' : '*** TROCKENLAUF (kein --yes) — es wird nichts gelöscht ***\n');

  // Übersicht, was betroffen ist
  for (const t of ['match_reports', 'match_report_uploads', 'team_registrations']) {
    console.log(`  ${t}: ${await count(t)} Zeile(n)`);
  }
  console.log('');

  if (!APPLY) {
    console.log('Zum tatsächlichen Löschen erneut mit  --yes  starten.');
    return;
  }

  // 1) Storage-Fotos der OCR-Uploads entfernen
  const { data: uploads } = await admin.from('match_report_uploads').select('id, storage_path');
  const paths = (uploads ?? []).map(u => u.storage_path).filter(Boolean);
  if (paths.length) {
    const { error } = await admin.storage.from(BUCKET).remove(paths);
    console.log(`Storage: ${paths.length} Datei(en) entfernt ${error ? '— FEHLER: ' + error.message : 'ok'}`);
  } else console.log('Storage: keine Dateien');

  // 2) Upload-Zeilen (cascadet OCR-Results/Fields via upload_id)
  console.log('match_report_uploads:', (await ALL(admin.from('match_report_uploads').delete()).select('id')).data?.length ?? 0, 'gelöscht');

  // 3) Spielberichte (cascadet match_report_games/players/history)
  console.log('match_reports:', (await ALL(admin.from('match_reports').delete()).select('id')).data?.length ?? 0, 'gelöscht');

  // 4) Mannschaftsanmeldungen (cascadet team_registration_players; season_team_assignments.registration_id → NULL)
  console.log('team_registrations:', (await ALL(admin.from('team_registrations').delete()).select('id')).data?.length ?? 0, 'gelöscht');

  console.log('\n=== FERTIG ===');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
