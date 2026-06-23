// ============================================================
// Route Handler: OCR-Verfügbarkeit für den aktuellen Nutzer
// ============================================================
//
// GET /api/match-reports/ocr/config
// Liefert (nur Booleans, keine Secrets), ob der OCR-Upload für den
// eingeloggten Nutzer verfügbar ist — damit die UI den Einstieg zeigt/versteckt.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { getOcrConfig, isOcrAvailable, isRoleAllowed } from '@/lib/ocr/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cfg = getOcrConfig();
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ enabled: false }, { status: 200 });
  }
  const enabled = isOcrAvailable(cfg) && isRoleAllowed(auth.user.role, cfg);
  return NextResponse.json({
    enabled,
    provider: enabled ? cfg.provider : null,
    maxFileMb: Math.round(cfg.maxFileBytes / 1024 / 1024),
  }, { status: 200 });
}
