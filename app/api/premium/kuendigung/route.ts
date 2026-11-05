// ============================================================
// Kündigungsbutton Team Manager (§ 312k BGB) — ohne Anmeldung
// ============================================================
// POST { name, email, team, art, zeitpunkt, datum?, nachricht? } → Mail an den
// Anbieter (kontakt@ + Ligaleitung BCC, Antworten an den Kündigenden) und eine
// Eingangsbestätigung an den Kündigenden (Textform, mit Datum und Uhrzeit).
// Ehrlich: Schlägt der Versand fehl, sagt die Seite das und nennt die E-Mail-Adresse.
// ============================================================

import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/server/email/send-contact';
import { sendTextEmail } from '@/lib/server/email/send-email';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, clientIp } from '@/lib/server/rate-limit';
import { ANBIETER } from '@/lib/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const kurz = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);

export async function POST(request: Request) {
  if (!rateLimit(`kuendigung:${clientIp(request)}`, 5, 600_000)) return NextResponse.json({ ok: false, error: 'Zu viele Versuche – bitte in ein paar Minuten noch einmal.' }, { status: 429 });
  const b = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (kurz(b.website, 50)) return NextResponse.json({ ok: true, eingang: new Date().toISOString() });
  const name = kurz(b.name, 120), email = kurz(b.email, 200), team = kurz(b.team, 120);
  const zeitpunkt = b.zeitpunkt === 'datum' ? 'zum Datum' : 'zum nächstmöglichen Zeitpunkt';
  const datum = kurz(b.datum, 10), nachricht = kurz(b.nachricht, 1000);
  const art = b.art === 'ausserordentlich' ? 'außerordentliche Kündigung' : 'ordentliche Kündigung';
  if (!name) return NextResponse.json({ ok: false, error: 'Bitte deinen Namen angeben.' }, { status: 422 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 422 });
  if (!team) return NextResponse.json({ ok: false, error: 'Bitte das Team angeben.' }, { status: 422 });

  const eingang = new Date();
  const wann = eingang.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });
  const zeit = zeitpunkt === 'zum Datum' && datum ? `zum ${datum.split('-').reverse().join('.')}` : 'zum nächstmöglichen Zeitpunkt';
  const text = [
    `Kündigung Team Manager (${art})`, '',
    `Team: ${team}`, `Name: ${name}`, `E-Mail: ${email}`, `Kündigung: ${zeit}`,
    nachricht ? `Nachricht: ${nachricht}` : '', '', `Eingegangen: ${wann}`,
  ].filter(z => z !== null).join('\n');

  const bcc: string[] = [];
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin.from('profiles').select('email').eq('role', 'super_admin');
    for (const a of (data ?? []) as { email?: string }[]) if (a.email) bcc.push(a.email);
  }
  const an = await sendContactEmail({ name, email, subject: `Kündigung Team Manager – ${team}`, message: text }, [ANBIETER.email], bcc);
  if (an.status !== 'sent') return NextResponse.json({ ok: false, error: `Die Kündigung konnte gerade nicht verschickt werden. Bitte schick sie per E-Mail an ${ANBIETER.email}.` }, { status: 200 });

  const best = await sendTextEmail({
    type: 'premium_kuendigung', to: email, subject: 'Eingangsbestätigung deiner Kündigung – Team Manager',
    text: `Hallo ${name},\n\nwir haben deine Kündigung erhalten:\n\n${text}\n\nDer Team Manager läuft bis zum Ende des bezahlten Zeitraums weiter. Ein bei PayPal laufendes Monatsabo beenden wir zum Ende des bezahlten Monats; du bekommst eine Nachricht, sobald das erledigt ist.\n\nViele Grüße\n${ANBIETER.name}\n${ANBIETER.anschrift}`,
    relatedEntityType: 'team_premium',
  });
  return NextResponse.json({ ok: true, eingang: eingang.toISOString(), bestaetigung: best.status === 'sent' });
}
