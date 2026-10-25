// ============================================================
// Route Handler: Protest im Spielbericht melden / erledigen (Migration 0057)
// ============================================================
//
// POST /api/match-reports/protest  (Authorization: Bearer <access token>)
//   { id, aktion: 'melden' }              — nach dem Einreichen/Speichern eines
//       Berichts mit Protest (Formular). Einmal je Protest: Ligaleitung bekommt
//       Glocke + E-Mail, der Gegner-TC die Glocke. Nur Kapitäne der zwei Teams
//       und die Ligaleitung; nur eingereichte Berichte mit Begründung.
//   { id, aktion: 'erledigt', notiz }     — Ligaleitung schließt den Protest ab.
//
// Betreiber, 25.10.2026: „Wenn jemand wirklich Protest einlegt, möchte die
// Ligaleitung es sofort sehen.“ Ehrlich: Der Mailversand meldet je Empfänger
// sent / failed / skipped_no_provider zurück.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendTextEmail } from '@/lib/server/email/send-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mdudarts.de';
const TC_ROLLEN = ['team_captain', 'league_admin', 'super_admin'];
const PROTEST_MIN = 15;

interface Bericht {
  id: string; status: string; protest: boolean; protest_note: string | null;
  home_team_id: string | null; guest_team_id: string | null; home_team_name: string; guest_team_name: string;
  league_label: string | null; matchday: number | null; match_date: string | null;
  protest_notified_at: string | null; protest_handled_at: string | null;
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });
  const u = auth.user;
  const body = await request.json().catch(() => ({})) as { id?: string; aktion?: string; notiz?: string };
  if (!body.id) return NextResponse.json({ error: 'Bericht fehlt.' }, { status: 400 });

  const { data, error } = await db.from('match_reports')
    .select('id, status, protest, protest_note, home_team_id, guest_team_id, home_team_name, guest_team_name, league_label, matchday, match_date, protest_notified_at, protest_handled_at')
    .eq('id', body.id).maybeSingle();
  if (error) return NextResponse.json({ error: /protest_notified_at|protest_handled/.test(error.message) ? 'Migration 0057 fehlt noch.' : error.message }, { status: 500 });
  const r = data as Bericht | null;
  if (!r) return NextResponse.json({ error: 'Bericht nicht gefunden.' }, { status: 404 });
  const admin = isAdminUser(u);
  const beteiligt = u.role === 'team_captain' && !!u.teamId && (u.teamId === r.home_team_id || u.teamId === r.guest_team_id);

  if (body.aktion === 'erledigt') {
    if (!admin) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
    const notiz = (body.notiz ?? '').trim().slice(0, 500);
    const { error: e } = await db.from('match_reports').update({
      protest_handled_at: new Date().toISOString(), protest_handled_by: u.id, protest_handled_note: notiz || null,
    }).eq('id', r.id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.aktion !== 'melden') return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  if (!admin && !beteiligt) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  const grund = (r.protest_note ?? '').trim();
  if (!r.protest || r.status === 'draft' || grund.length < PROTEST_MIN) return NextResponse.json({ ok: true, gemeldet: false });
  // Einmal je Protest: schon gemeldet und noch offen → nichts doppelt.
  if (r.protest_notified_at && !r.protest_handled_at) return NextResponse.json({ ok: true, gemeldet: false });

  const paarung = `${r.home_team_name} – ${r.guest_team_name}`;
  const wer = admin && !beteiligt ? 'die Ligaleitung' : u.teamId === r.guest_team_id ? r.guest_team_name : r.home_team_name;
  const gegner = u.teamId === r.guest_team_id ? r.home_team_id : r.guest_team_id;
  const wo = [r.league_label, r.matchday ? `${r.matchday}. Spieltag` : null, r.match_date ? new Date(r.match_date).toLocaleDateString('de-DE') : null].filter(Boolean).join(' · ');
  const titel = `Protest: ${paarung}`;
  const text = `${wer} hat Protest eingelegt (${wo}). Begründung: „${grund.slice(0, 300)}“`;

  const { data: ll } = await db.from('profiles').select('id, email').in('role', ['league_admin', 'super_admin']);
  const liga = (ll ?? []) as { id: string; email: string | null }[];
  const { data: tc } = gegner ? await db.from('profiles').select('id').eq('team_id', gegner).in('role', TC_ROLLEN) : { data: [] };
  const zeilen = [
    ...liga.map(p => ({ id: p.id, url: '/admin/spielberichte?status=problem' })),
    ...((tc ?? []) as { id: string }[]).map(p => ({ id: p.id, url: `/mein-bereich/spielberichte?id=${r.id}` })),
  ].filter((z, i, a) => z.id !== u.id && a.findIndex(x => x.id === z.id) === i);
  if (zeilen.length) {
    await db.from('notifications').insert(zeilen.map(z => ({
      recipient_user_id: z.id, type: 'match_report_protest', title: titel, message: text, short_text: text,
      related_entity_type: 'match_reports', related_entity_id: r.id, action_url: z.url,
    })));
  }
  const mails: { an: string; status: string }[] = [];
  for (const p of liga) {
    if (!p.email) continue;
    const m = await sendTextEmail({
      type: 'match_report_protest', to: p.email, subject: titel, relatedEntityType: 'match_reports',
      text: [`Hallo,`, '', text, '', `Zum Bericht: ${SITE}/mein-bereich/spielberichte?id=${r.id}&from=admin`, `Alle offenen Proteste: ${SITE}/admin/spielberichte?status=problem`, '', 'Münchner Dart Union'].join('\n'),
    });
    mails.push({ an: p.id, status: m.status });
  }
  await db.from('match_reports').update({ protest_notified_at: new Date().toISOString(), protest_handled_at: null, protest_handled_by: null, protest_handled_note: null }).eq('id', r.id);
  return NextResponse.json({ ok: true, gemeldet: true, glocke: zeilen.length, mails });
}
