// ============================================================
// Cron: E-Mail-Erinnerung an offene Zu-/Absagen (Team Manager)
// ============================================================
//
// GET /api/cron/zusagen-mails  (täglich via Vercel-Cron, siehe vercel.json)
//
// Betreiber, 21.10.2026: Der Teamcaptain schaltet die Mail fürs Team ein
// (team_availability_settings.email_reminder, Vorgabe aus), jeder Spieler kann
// sich per Link abmelden (profiles.zusage_mail_aus). Erinnert wird für Termine
// im Fenster der Glocke (reminder_days), für die der Spieler weder zu- noch
// abgesagt hat — je Spieler und Termin nur EINMAL (zusage_mail_log, Migration
// 0054). Mehrere offene Termine kommen in EINE Mail.
//
// Schutz wie /api/cron/draft-reminders: Bearer CRON_SECRET, ohne Secret wird
// jede Anfrage abgelehnt. Ehrlich: Jede Mail meldet ihren echten Status, ins
// Protokoll kommt nur, was wirklich versendet wurde.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ZUSAGEN_TEAMS } from '@/lib/features';
import { NEUE_SAISON, team27 } from '@/lib/data/saison-2027';
import { termineImFenster } from '@/lib/server/zusagen-fenster';
import { sendTextEmail } from '@/lib/server/email/send-email';
import { abmeldeSchluessel } from '@/lib/server/zusage-mail-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mdudarts.de';
const VORGABE_TAGE = 7;

type Profil = { id: string; email: string; display_name: string; player_id: string | null; zusage_mail_aus?: boolean };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET nicht gesetzt' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service-Rolle nicht konfiguriert' }, { status: 503 });
  const db = supabaseAdmin;

  const bericht: Record<string, unknown>[] = [];
  for (const teamId of ZUSAGEN_TEAMS) {
    const { data: einst, error: einstErr } = await db.from('team_availability_settings')
      .select('reminder_days, email_reminder').eq('team_id', teamId).maybeSingle();
    // Migration 0054 fehlt → Spalte unbekannt → nichts verschicken.
    if (einstErr) { bericht.push({ teamId, uebersprungen: 'Einstellungen nicht lesbar (Migration 0054?)' }); continue; }
    const e = einst as { reminder_days?: number; email_reminder?: boolean } | null;
    const tage = e?.reminder_days ?? VORGABE_TAGE;
    if (!e?.email_reminder || tage <= 0) { bericht.push({ teamId, uebersprungen: 'E-Mail-Erinnerung aus' }); continue; }

    const termine = await termineImFenster(teamId, tage);
    if (!termine.length) { bericht.push({ teamId, termine: 0 }); continue; }
    const keys = termine.map(t => t.key);

    const [{ data: profile, error: pErr }, { data: antworten }, { data: log, error: logErr }] = await Promise.all([
      db.from('profiles').select('id, email, display_name, player_id, zusage_mail_aus').eq('team_id', teamId).not('player_id', 'is', null),
      db.from('match_availability').select('player_id, match_key').eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).in('match_key', keys),
      db.from('zusage_mail_log').select('user_id, match_key').in('match_key', keys),
    ]);
    if (pErr || logErr) { bericht.push({ teamId, fehler: (pErr ?? logErr)?.message }); continue; }
    const beantwortet = new Set(((antworten ?? []) as { player_id: string; match_key: string }[]).map(a => a.player_id + '|' + a.match_key));
    const gemailt = new Set(((log ?? []) as { user_id: string; match_key: string }[]).map(l => l.user_id + '|' + l.match_key));
    const teamName = team27(teamId)?.name ?? 'dein Team';

    const versand: { an: string; termine: number; status: string }[] = [];
    for (const p of (profile ?? []) as Profil[]) {
      if (p.zusage_mail_aus || !p.email || !p.player_id) continue;
      const offen = termine.filter(t => !beantwortet.has(p.player_id + '|' + t.key) && !gemailt.has(p.id + '|' + t.key));
      if (!offen.length) continue;
      const schluessel = abmeldeSchluessel(p.id);
      if (!schluessel) { versand.push({ an: p.id, termine: offen.length, status: 'kein Abmelde-Schlüssel – nicht gesendet' }); continue; }
      const vorname = p.display_name.trim().split(/\s+/)[0] || 'du';
      const subject = offen.length === 1 ? `Sag kurz zu oder ab: ${offen[0].text}` : `Sag kurz zu oder ab – ${offen.length} Termine offen`;
      const text = [
        `Servus ${vorname},`,
        '',
        `für ${offen.length === 1 ? 'diesen Termin' : 'diese Termine'} von ${teamName} hast du noch nicht zu- oder abgesagt:`,
        '',
        ...offen.flatMap(t => [`• ${t.text}`, `  ${SITE}${t.pfad}`]),
        '',
        'Ein Tipp genügt – dann weiß dein Teamcaptain Bescheid.',
        '',
        `Diese Erinnerung hat euer Teamcaptain im Team Manager eingeschaltet. Du bekommst sie für jeden Termin nur einmal.`,
        `Keine Erinnerungs-Mails mehr: ${SITE}/api/zusagen/mail-abmelden?u=${p.id}&t=${schluessel}`,
        '',
        'Viele Grüße',
        'Münchner Dart Union',
      ].join('\n');
      const r = await sendTextEmail({ type: 'zusage_reminder', to: p.email, subject, text, relatedEntityType: 'match_availability' });
      versand.push({ an: p.id, termine: offen.length, status: r.status });
      // Nur wirklich Versendetes merken — sonst käme die Erinnerung nie mehr.
      if (r.status === 'sent') await db.from('zusage_mail_log').upsert(offen.map(t => ({ user_id: p.id, match_key: t.key, team_id: teamId })));
    }
    bericht.push({ teamId, termine: termine.length, versand });
  }
  return NextResponse.json({ ok: true, bericht });
}
