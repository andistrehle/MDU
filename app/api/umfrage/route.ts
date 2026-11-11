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
import { TM_UMFRAGE, UMFRAGE, antwortenPruefen, findeUmfrage, umfrageLaeuft, type Antworten } from '@/lib/umfrage';
import { betreiber } from '@/lib/server/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({})) as { umfrage?: string; geraet?: string; antworten?: unknown };
  // Ohne Angabe = Website-Umfrage (so schickte es das Formular bisher).
  const u = findeUmfrage(b.umfrage ?? UMFRAGE.id);
  if (!u) return NextResponse.json({ ok: false, error: 'Unbekannte Umfrage.' }, { status: 400 });
  if (!umfrageLaeuft(new Date(), u.def)) return NextResponse.json({ ok: false, error: 'Die Umfrage läuft gerade nicht.' }, { status: 409 });
  const antworten = antwortenPruefen(b.antworten, u.fragen);
  if (!b.geraet || !UUID.test(b.geraet) || !antworten) return NextResponse.json({ ok: false, error: 'Bitte beantworte mindestens eine Frage.' }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Speichern geht gerade nicht.' }, { status: 503 });
  const { error } = await supabaseAdmin.from('umfrage_antworten').insert({ umfrage: u.def.id, geraet_id: b.geraet, antworten });
  if (error) {
    if (/duplicate key/.test(error.message)) return NextResponse.json({ ok: true, schonDa: true });
    return NextResponse.json({ ok: false, error: /umfrage_antworten/.test(error.message) ? 'Migration 0068 fehlt noch.' : 'Speichern fehlgeschlagen.' }, { status: 500 });
  }
  // Team-Manager-Umfrage: Glocke (+ Push über 0056) an den Super-Admin (Betreiber, 11.11.2026).
  if (u.def.id === TM_UMFRAGE.id) await meldeBetreiber(antworten).catch(() => {});
  return NextResponse.json({ ok: true });
}

async function meldeBetreiber(a: Antworten) {
  const an = await betreiber();
  if (!an.length || !supabaseAdmin) return;
  const wer = typeof a.name === 'string' ? a.name : 'anonym';
  const teile = [`von ${wer}`];
  if (typeof a.gesamt === 'number') teile.push(`${a.gesamt}/5 Sterne`);
  if (typeof a.empfehlen === 'number') teile.push(`Empfehlung ${a.empfehlen}/10`);
  const text = `Neue Antwort ${teile.join(' · ')}.`;
  await supabaseAdmin.from('notifications').insert(an.map(id => ({
    recipient_user_id: id, type: 'team_premium', title: 'Team-Manager-Umfrage ausgefüllt', message: text, short_text: text,
    related_entity_type: 'umfrage', action_url: `/admin/umfrage?umfrage=${TM_UMFRAGE.id}`,
  })));
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB fehlt' }, { status: 500 });
  const u = findeUmfrage(new URL(request.url).searchParams.get('umfrage') ?? UMFRAGE.id);
  if (!u) return NextResponse.json({ error: 'Unbekannte Umfrage.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('umfrage_antworten')
    .select('antworten, created_at').eq('umfrage', u.def.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: /umfrage_antworten/.test(error.message) ? 'Migration 0068 fehlt noch.' : error.message }, { status: 500 });
  return NextResponse.json({ antworten: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
