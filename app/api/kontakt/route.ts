// ============================================================
// Route Handler: Kontaktformular (öffentlich)
// ============================================================
//
// POST /api/kontakt
// Nimmt Name, E-Mail, Betreff (optional) und Nachricht entgegen und sendet
// sie per E-Mail an die Ligaleitung (Resend). Dient als zweiter, unmittelbarer
// Kontaktweg i. S. d. § 5 DDG neben der E-Mail-Adresse.
//
// Spam-Schutz: verstecktes Honeypot-Feld ("website"). Ist es gefüllt, wird die
// Anfrage stillschweigend verworfen (ok:true, aber kein Versand).
// ============================================================

import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/server/email/send-contact';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KONTAKT_EMAIL = 'kontakt@mdudarts.de';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 }); }

  // Honeypot: echte Nutzer füllen dieses Feld nie aus.
  if (String(body.website ?? '').trim() !== '') {
    return NextResponse.json({ ok: true, status: 'sent' });
  }

  const name    = String(body.name ?? '').trim();
  const email   = String(body.email ?? '').trim();
  const subject = String(body.subject ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || name.length > 120) return NextResponse.json({ ok: false, error: 'name' }, { status: 422 });
  if (!EMAIL_RE.test(email) || email.length > 200) return NextResponse.json({ ok: false, error: 'email' }, { status: 422 });
  if (message.length < 10 || message.length > 5000) return NextResponse.json({ ok: false, error: 'message' }, { status: 422 });
  if (subject.length > 200) return NextResponse.json({ ok: false, error: 'subject' }, { status: 422 });

  // Empfänger: dediziertes Postfach im To; Liga-Admins als verdecktes BCC.
  const adminBcc: string[] = [];
  if (supabaseAdmin) {
    const { data: admins } = await supabaseAdmin
      .from('profiles').select('email').in('role', ['league_admin', 'super_admin']);
    for (const a of (admins ?? []) as { email?: string }[]) {
      if (a.email) adminBcc.push(a.email);
    }
  }

  const { status, error } = await sendContactEmail({ name, email, subject, message }, [KONTAKT_EMAIL], adminBcc);

  if (status === 'sent') return NextResponse.json({ ok: true, status });
  // Ehrlich bleiben: kein Provider oder Fehler → Client zeigt Fallback (Direkt-E-Mail).
  return NextResponse.json({ ok: false, status, error: error ?? null }, { status: 200 });
}
