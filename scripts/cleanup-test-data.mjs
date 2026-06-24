// Einmaliges Aufräum-Skript (Service-Role). Löscht ALLE Spielberichte + Uploads
// (inkl. Storage-Dateien) und anschließend die angegebenen Test-Benutzer.
// Start: node scripts/cleanup-test-data.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('ENV fehlt'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const BUCKET = 'match-report-uploads';
const USER_IDS = [
  '6b8b0731-156a-4ce7-bd16-0c7e5a45d69e', // Thomas Gemmerle / julia.andi@web.de
  'f07ff760-187a-41a1-af01-34ca0196799b', // Andreas Strehle / strehleandi@gmail.com
];
const ALL = (q) => q.not('id', 'is', null); // „alle Zeilen"-Filter (delete braucht where)

async function main() {
  // 1) Storage-Dateien der Uploads entfernen
  const { data: uploads } = await admin.from('match_report_uploads').select('id, storage_path');
  const paths = (uploads ?? []).map(u => u.storage_path).filter(Boolean);
  if (paths.length) {
    const { error } = await admin.storage.from(BUCKET).remove(paths);
    console.log(`Storage: ${paths.length} Datei(en) entfernt ${error ? '— FEHLER: ' + error.message : 'ok'}`);
  } else console.log('Storage: keine Dateien');

  // 2) Upload-Zeilen (cascadet OCR-Results/Fields)
  console.log('uploads:', (await ALL(admin.from('match_report_uploads').delete()).select('id')).data?.length ?? 0, 'gelöscht');

  // 3) Spielberichte (cascadet games/players/history)
  console.log('match_reports:', (await ALL(admin.from('match_reports').delete()).select('id')).data?.length ?? 0, 'gelöscht');

  // 4) Weitere User-Referenzen lösen, damit der Auth-Delete nicht blockiert
  for (const tbl of ['team_registrations', 'player_nominations']) {
    const { data, error } = await admin.from(tbl).delete().in('submitted_by', USER_IDS).select('id');
    console.log(`${tbl} (submitted_by): ${data?.length ?? 0} gelöscht ${error ? '— ' + error.message : ''}`);
  }

  // 5) Auth-Benutzer löschen (cascadet profiles + notifications)
  for (const id of USER_IDS) {
    const { error } = await admin.auth.admin.deleteUser(id);
    console.log(`User ${id}: ${error ? 'FEHLER ' + error.message : 'gelöscht'}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
