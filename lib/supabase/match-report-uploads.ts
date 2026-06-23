// ============================================================
// OCR-Uploads — Client-Datenzugriff (RLS-konform, nur Lesen + Korrekturen)
// ============================================================
//
// Frontend-Lesezugriff auf die OCR-Tabellen (Migration 0023) über den
// anon-Client mit RLS. Schreibende Pipeline-Schritte (Upload/Start/Confirm)
// laufen serverseitig über Route Handler — NICHT hier.
// ============================================================

import { supabase } from './client';
import type { MatchReportExtraction } from '@/lib/ocr/schemas';

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'needs_review' | 'failed';
export type OcrReviewStatus = 'pending_review' | 'in_review' | 'confirmed' | 'rejected';

export const OCR_STATUS_LABELS: Record<OcrStatus, string> = {
  pending: 'Wartet', processing: 'Erkennung läuft', completed: 'Erkannt',
  needs_review: 'Prüfung nötig', failed: 'Fehlgeschlagen',
};

export interface MatchReportUpload {
  id: string;
  match_id: string | null;
  season_id: string | null;
  match_report_id: string | null;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  page_number: number;
  upload_status: string;
  ocr_status: OcrStatus;
  ocr_provider: string | null;
  ocr_model: string | null;
  ocr_error: string | null;
  attempt_count: number;
  review_status: OcrReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface OcrResultRow {
  id: string;
  upload_id: string;
  match_report_id: string | null;
  raw_text: string | null;
  structured_result: MatchReportExtraction | null;
  overall_confidence: number | null;
  provider: string | null;
  model_version: string | null;
  warnings: string[] | null;
  created_at: string;
}

export interface OcrFieldRow {
  id: string;
  ocr_result_id: string;
  field_key: string;
  detected_value: string | null;
  normalized_value: string | null;
  confidence: number | null;
  status: string;
  corrected_value: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
}

export async function listMyUploads(): Promise<MatchReportUpload[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('match_report_uploads')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as MatchReportUpload[];
}

export async function getUpload(id: string): Promise<MatchReportUpload | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('match_report_uploads').select('*').eq('id', id).maybeSingle();
  return (data as MatchReportUpload) ?? null;
}

export async function getOcrResult(uploadId: string): Promise<OcrResultRow | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('match_report_ocr_results')
    .select('*')
    .eq('upload_id', uploadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as OcrResultRow) ?? null;
}

export async function getOcrFields(resultId: string): Promise<OcrFieldRow[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('match_report_ocr_fields')
    .select('*')
    .eq('ocr_result_id', resultId);
  return (data ?? []) as OcrFieldRow[];
}

/** Manuelle Korrektur eines erkannten Feldes (RLS-geprüft). */
export async function correctOcrField(id: string, value: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('match_report_ocr_fields')
    .update({ corrected_value: value, status: 'corrected', corrected_by: auth.user?.id ?? null, corrected_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error?.message ?? null };
}

// ── Server-API (OCR-Pipeline) ────────────────────────────────
// Aufrufe an die Route Handler mit dem Supabase-Access-Token (Bearer).

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface OcrAvailability {
  enabled: boolean;
  provider: string | null;
  maxFileMb: number;
}

export async function getOcrAvailability(): Promise<OcrAvailability> {
  try {
    const res = await fetch('/api/match-reports/ocr/config', { headers: await authHeader() });
    if (!res.ok) return { enabled: false, provider: null, maxFileMb: 12 };
    return (await res.json()) as OcrAvailability;
  } catch {
    return { enabled: false, provider: null, maxFileMb: 12 };
  }
}

export async function uploadReportFile(matchId: string, file: File, page: number): Promise<{ uploadId?: string; error?: string }> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('matchId', matchId);
  fd.append('page', String(page));
  const res = await fetch('/api/match-reports/upload', { method: 'POST', headers: await authHeader(), body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error ?? 'Upload fehlgeschlagen.' };
  return { uploadId: json.uploadId };
}

export interface StartOcrResult {
  status?: string;
  matchReportId?: string;
  ocrResultId?: string;
  reused?: boolean;
  error?: string;
}

export async function startOcr(uploadId: string): Promise<StartOcrResult> {
  const res = await fetch(`/api/match-reports/ocr/${uploadId}`, { method: 'POST', headers: await authHeader() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error ?? 'Erkennung fehlgeschlagen.' };
  return json as StartOcrResult;
}

export async function getUploadSignedUrl(uploadId: string): Promise<string | null> {
  const res = await fetch(`/api/match-reports/uploads/${uploadId}/signed-url`, { headers: await authHeader() });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return json.url ?? null;
}
