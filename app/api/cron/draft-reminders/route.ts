// ============================================================
// Cron: Erinnerung an Mannschaftsanmeldungen im Entwurf
// ============================================================
//
// GET /api/cron/draft-reminders  (täglich via Vercel-Cron, siehe vercel.json)
//
// Regel:
//   • Liegt eine Anmeldung ≥ 7 Tage unverändert im Entwurf → freundliche
//     Erinnerung („kein Stress").
//   • Ab dem 18.09.2026 → DRINGENDE Erinnerung an alle noch offenen Entwürfe
//     (ohne „kein Stress", weil die Zeit drängt).
// Jede Variante geht pro Anmeldung nur EINMAL raus (Dedup über email_logs).
//
// Schutz: Header „Authorization: Bearer <CRON_SECRET>". Vercel-Cron sendet das
// automatisch, sobald CRON_SECRET als Projekt-ENV gesetzt ist. Fehlt das Secret,
// wird JEDE Anfrage abgelehnt (kein offener Endpoint).
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendRegistrationEmail } from '@/lib/server/email/send-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mdudarts.de';
const REGISTER_URL = `${SITE}/mein-bereich/mannschaft-anmelden`;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Ab hier drängt die Zeit → dringende Erinnerung (Europe/Berlin, CEST = +02:00).
const FINAL_DATE = new Date('2026-09-18T00:00:00+02:00');

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET nicht gesetzt' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service-Rolle nicht konfiguriert' }, { status: 503 });

  const { data: drafts, error } = await supabaseAdmin
    .from('team_registrations')
    .select('id, team_name, contact_name, contact_email, updated_at')
    .eq('status', 'draft');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (drafts ?? []) as { id: string; team_name: string; contact_name: string; contact_email: string; updated_at: string }[];
  if (rows.length === 0) return NextResponse.json({ ok: true, drafts: 0, sent: [] });

  // Bereits versendete Erinnerungen ermitteln (Dedup).
  const ids = rows.map(r => r.id);
  const { data: logs } = await supabaseAdmin
    .from('email_logs')
    .select('related_entity_id, type, status')
    .in('related_entity_id', ids)
    .in('type', ['draft_reminder', 'draft_reminder_final'])
    .eq('status', 'sent');
  const sentFriendly = new Set((logs ?? []).filter(l => l.type === 'draft_reminder').map(l => l.related_entity_id));
  const sentFinal = new Set((logs ?? []).filter(l => l.type === 'draft_reminder_final').map(l => l.related_entity_id));

  const now = new Date();
  const finalPhase = now >= FINAL_DATE;
  const sent: { team: string; type: string; status: string }[] = [];

  for (const r of rows) {
    if (!r.contact_email) continue;
    let type: 'draft_reminder' | 'draft_reminder_final' | null = null;
    if (finalPhase) {
      if (!sentFinal.has(r.id)) type = 'draft_reminder_final';
    } else {
      const stale = now.getTime() - new Date(r.updated_at).getTime() >= WEEK_MS;
      if (stale && !sentFriendly.has(r.id)) type = 'draft_reminder';
    }
    if (!type) continue;

    const res = await sendRegistrationEmail({
      type,
      to: r.contact_email,
      name: r.contact_name,
      teamName: r.team_name,
      relatedEntityId: r.id,
      actionUrl: REGISTER_URL,
    });
    sent.push({ team: r.team_name, type, status: res.status });
  }

  return NextResponse.json({ ok: true, drafts: rows.length, finalPhase, sent });
}
