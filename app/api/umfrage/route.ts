// ============================================================
// Route Handler: Website-Umfrage (Migration 0068, lib/umfrage.ts)
// ============================================================
// POST { geraet, antworten }          → speichert anonym, je Gerät einmal
// GET  (Bearer, Ligaleitung/Betreiber) → alle Antworten für die Auswertung
// Solange die Umfrage nicht läuft, speichert POST nichts (409).
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { UMFRAGE, antwortenPruefen, umfrageLaeuft } from '@/lib/umfrage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!umfrageLaeuft()) return NextResponse.json({ ok: false, error: 'Die Umfrage läuft gerade nicht.' }, { status: 409 });
  const b = await request.json().catch(() => ({})) as { geraet?: string; antworten?: unknown };
  const antworten = antwortenPruefen(b.antworten);
  if (!b.geraet || !UUID.test(b.geraet) || !antworten) return NextResponse.json({ ok: false, error: 'Bitte beantworte mindestens eine Frage.' }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Speichern geht gerade nicht.' }, { status: 503 });
  const { error } = await supabaseAdmin.from('umfrage_antworten').insert({ umfrage: UMFRAGE.id, geraet_id: b.geraet, antworten });
  if (error) {
    if (/duplicate key/.test(error.message)) return NextResponse.json({ ok: true, schonDa: true });
    return NextResponse.json({ ok: false, error: /umfrage_antworten/.test(error.message) ? 'Migration 0068 fehlt noch.' : 'Speichern fehlgeschlagen.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB fehlt' }, { status: 500 });
  const { data, error } = await supabaseAdmin.from('umfrage_antworten')
    .select('antworten, created_at').eq('umfrage', UMFRAGE.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: /umfrage_antworten/.test(error.message) ? 'Migration 0068 fehlt noch.' : error.message }, { status: 500 });
  return NextResponse.json({ antworten: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
