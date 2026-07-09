// ============================================================
// Route Handler: Signed URL für ein Upload-Original (privater Bucket)
// ============================================================
//
// GET /api/match-reports/uploads/[uploadId]/signed-url
// Erzeugt eine kurzlebige Signed URL (serverseitig, service_role) für die
// Bildvorschau in der Prüfansicht. Keine öffentliche Bild-URL.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, canUploadForTeam } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findMatch } from '@/lib/server/ocr-draft';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'match-report-uploads';

export async function GET(request: Request, ctx: { params: Promise<{ uploadId: string }> }) {
  const { uploadId } = await ctx.params;
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  const { data: upload } = await supabaseAdmin
    .from('match_report_uploads').select('storage_path, uploaded_by, match_id').eq('id', uploadId).maybeSingle();
  if (!upload) return NextResponse.json({ error: 'Upload nicht gefunden.' }, { status: 404 });

  const match = upload.match_id ? findMatch(upload.match_id) : null;
  const owns = upload.uploaded_by === auth.user.id
    || (match && (canUploadForTeam(auth.user, match.homeTeamId) || canUploadForTeam(auth.user, match.awayTeamId)));
  if (!owns) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  // 15 Min: lang genug für eine gründliche Prüfung, aber weiterhin kurzlebig (REV-057).
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(upload.storage_path, 900);
  if (error || !data) return NextResponse.json({ error: 'Vorschau nicht verfügbar.' }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl }, { status: 200 });
}
