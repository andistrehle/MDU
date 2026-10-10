// ============================================================
// Server: Original-Fotos eines Spielberichts finden und löschen
// ============================================================
// Gemeinsam für das Löschen nach Bestätigung, beim Löschen eines Berichts,
// fürs Anzeigen (signierte Links) und fürs Aufräumen am Saisonende.
// Privater Bucket, nur service_role.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const UPLOAD_BUCKET = 'match-report-uploads';

export interface UploadZeile { id: string; storage_path: string; upload_status: string; page_group_id: string | null; created_at?: string }

/** Alle Seiten zu einem Bericht: Hauptseite(n) über match_report_id, Zusatzseiten über page_group_id. */
export async function uploadsZuBericht(reportId: string): Promise<UploadZeile[]> {
  if (!supabaseAdmin) return [];
  const cols = 'id, storage_path, upload_status, page_group_id, created_at';
  const { data: primaries } = await supabaseAdmin.from('match_report_uploads').select(cols).eq('match_report_id', reportId);
  const rows = new Map<string, UploadZeile>();
  for (const u of (primaries ?? []) as UploadZeile[]) rows.set(u.id, u);
  const groupIds = [...new Set([...rows.values()].flatMap(u => [u.id, u.page_group_id]).filter((x): x is string => !!x))];
  if (groupIds.length) {
    const { data: siblings } = await supabaseAdmin.from('match_report_uploads').select(cols).in('page_group_id', groupIds);
    for (const u of (siblings ?? []) as UploadZeile[]) rows.set(u.id, u);
  }
  return [...rows.values()].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
}

/** Dateien aus dem Bucket entfernen und die Zeilen als gelöscht markieren (Zeile bleibt fürs Audit). */
export async function loescheUploads(rows: UploadZeile[]): Promise<{ deleted: number; error: string | null }> {
  if (!supabaseAdmin) return { deleted: 0, error: 'Server-Service ist nicht konfiguriert.' };
  const toDelete = rows.filter(u => u.upload_status !== 'deleted' && u.storage_path);
  if (!toDelete.length) return { deleted: 0, error: null };
  for (let i = 0; i < toDelete.length; i += 100) {
    const { error } = await supabaseAdmin.storage.from(UPLOAD_BUCKET).remove(toDelete.slice(i, i + 100).map(u => u.storage_path));
    if (error) return { deleted: i, error: `Löschen fehlgeschlagen: ${error.message}` };
  }
  await supabaseAdmin.from('match_report_uploads').update({ upload_status: 'deleted' }).in('id', toDelete.map(u => u.id));
  return { deleted: toDelete.length, error: null };
}
