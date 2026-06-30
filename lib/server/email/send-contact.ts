// ============================================================
// Serverseitiger Versand von Kontaktformular-Nachrichten (Resend)
// ============================================================
//
// NUR Server-Code. Liest Secrets aus server-only ENV (RESEND_API_KEY,
// EMAIL_FROM). Gleiches Ehrlichkeitsprinzip wie send-email.ts:
//   • kein Provider konfiguriert → 'skipped_no_provider' (kein Fake-Erfolg)
//   • Versandfehler             → 'failed' + error
//   • Erfolg                    → 'sent'
// Reply-To wird auf die Absenderadresse gesetzt, damit die Ligaleitung
// direkt antworten kann. Der eingegebene Text wird NICHT als HTML gesendet
// (reiner Text), um Injection zu vermeiden.
// ============================================================

import 'server-only';

export interface ContactMessage {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export type ContactSendStatus = 'sent' | 'failed' | 'skipped_no_provider';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function sendContactEmail(
  msg: ContactMessage,
  toRecipients: string[],
  bccRecipients: string[] = [],
): Promise<{ status: ContactSendStatus; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  const dedupe = (arr: string[]) =>
    Array.from(new Set(arr.map(e => e.trim()).filter(e => EMAIL_RE.test(e))));
  const to = dedupe(toRecipients);
  // BCC = verdeckte Empfänger (Liga-Admins); Dubletten zum To entfernen.
  const bcc = dedupe(bccRecipients).filter(e => !to.includes(e));
  if (to.length === 0) return { status: 'failed', error: 'no_recipient' };

  const subject = `MDU Kontaktformular: ${msg.subject?.trim() || 'Neue Nachricht'}`;
  const text =
    `Neue Nachricht über das Kontaktformular der MDU-Plattform.\n\n` +
    `Name:   ${msg.name.trim()}\n` +
    `E-Mail: ${msg.email.trim()}\n` +
    (msg.subject?.trim() ? `Betreff: ${msg.subject.trim()}\n` : '') +
    `\nNachricht:\n${msg.message.trim()}\n\n` +
    `— Auf diese E-Mail kann direkt geantwortet werden (Reply-To gesetzt).`;

  // Kein Provider → ehrlich überspringen.
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[contact:skipped_no_provider] An: ${to.join(', ')}\n${subject}\n${text}`);
    }
    return { status: 'skipped_no_provider' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, ...(bcc.length ? { bcc } : {}), subject, text, reply_to: msg.email.trim() }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { status: 'failed', error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { status: 'sent' };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'unknown' };
  }
}
