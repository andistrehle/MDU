// ============================================================
// Serverseitige E-Mail-Utility — Sprint Benachrichtigungen
// ============================================================
//
// NUR Server-Code (import 'server-only'). Liest Secrets aus server-only ENV
// (RESEND_API_KEY, EMAIL_FROM) — NIEMALS NEXT_PUBLIC.
//
// Ehrlichkeitsprinzip:
//   • Ist KEIN Provider konfiguriert → status 'skipped_no_provider'.
//     Es wird NICHT behauptet, die Mail sei versendet worden.
//   • Schlägt der Versand fehl → status 'failed' + error_message.
//   • Erfolg → status 'sent'.
// Jeder Versuch wird (falls supabaseAdmin verfügbar) in email_logs protokolliert.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type EmailType =
  | 'registration_submitted'
  | 'registration_approved'
  | 'registration_rejected'
  | 'registration_changes_requested'
  | 'account_activated';

export type EmailStatus = 'sent' | 'failed' | 'skipped_no_provider';

export interface RegistrationEmailInput {
  type: EmailType;
  to: string;
  /** Anrede-Name (Kontaktperson / Team Captain / Benutzer). */
  name: string;
  /** Nur für Mannschafts-Mails relevant. */
  teamName?: string;
  /** Pflicht bei rejected / changes_requested. */
  reason?: string | null;
  relatedEntityId?: string | null;
}

interface RenderedEmail {
  subject: string;
  text: string;
}

const SIGNATURE = '\n\nViele Grüße\nMünchner Dart Union';

/** Erzeugt Betreff + Textkörper aus festen Vorlagen. */
export function renderRegistrationEmail(input: RegistrationEmailInput): RenderedEmail {
  const name = input.name?.trim() || 'Team Captain';
  const team = input.teamName?.trim() || 'deine Mannschaft';
  const reason = (input.reason ?? '').trim();

  switch (input.type) {
    case 'registration_submitted':
      return {
        subject: 'MDU Mannschaftsanmeldung eingegangen',
        text:
          `Hallo ${name},\n\n` +
          `deine Mannschaftsanmeldung für ${team} ist bei der MDU eingegangen.\n\n` +
          `Die Ligaleitung prüft die Angaben. Du erhältst eine weitere Nachricht, ` +
          `sobald die Anmeldung freigegeben wurde oder Rückfragen bestehen.\n\n` +
          `Status: Eingereicht` + SIGNATURE,
      };
    case 'registration_approved':
      return {
        subject: 'MDU Mannschaftsanmeldung freigegeben',
        text:
          `Hallo ${name},\n\n` +
          `deine Mannschaftsanmeldung für ${team} wurde erfolgreich freigegeben.\n\n` +
          `Die Mannschaft ist damit für die weitere Saisonplanung berücksichtigt.` + SIGNATURE,
      };
    case 'registration_rejected':
      return {
        subject: 'MDU Mannschaftsanmeldung abgelehnt',
        text:
          `Hallo ${name},\n\n` +
          `deine Mannschaftsanmeldung für ${team} wurde leider abgelehnt.\n\n` +
          `Begründung:\n${reason}\n\n` +
          `Bitte wende dich bei Fragen an die Ligaleitung.` + SIGNATURE,
      };
    case 'registration_changes_requested':
      return {
        subject: 'MDU Mannschaftsanmeldung: Nachbesserung erforderlich',
        text:
          `Hallo ${name},\n\n` +
          `für deine Mannschaftsanmeldung ${team} ist noch eine Nachbesserung erforderlich.\n\n` +
          `Hinweis der Ligaleitung:\n${reason}\n\n` +
          `Bitte prüfe deine Anmeldung und reiche sie anschließend erneut ein.` + SIGNATURE,
      };
    case 'account_activated':
      return {
        subject: 'Dein MDU-Konto wurde freigeschaltet',
        text:
          `Hallo ${name},\n\n` +
          `dein Konto bei der Münchner Dart Union wurde von der Ligaleitung geprüft und freigeschaltet.\n\n` +
          `Du kannst dich jetzt im Mitgliederbereich anmelden und deinen persönlichen Bereich nutzen.` + SIGNATURE,
      };
  }
}

async function logEmail(params: {
  to: string;
  subject: string;
  type: EmailType;
  relatedEntityId?: string | null;
  status: EmailStatus | 'pending';
  errorMessage?: string | null;
  sentAt?: string | null;
}): Promise<void> {
  if (!supabaseAdmin) return; // kein Server-Key → kein DB-Log (ehrlich, kein Crash)
  try {
    await supabaseAdmin.from('email_logs').insert({
      to_email: params.to,
      subject: params.subject,
      type: params.type,
      related_entity_type: 'team_registration',
      related_entity_id: params.relatedEntityId ?? null,
      status: params.status,
      error_message: params.errorMessage ?? null,
      sent_at: params.sentAt ?? null,
    });
  } catch {
    // Logging darf den Versand nie zum Absturz bringen.
  }
}

/**
 * Versendet eine Registrierungs-E-Mail. Gibt den tatsächlichen Status zurück —
 * kein Fake-Erfolg.
 */
export async function sendRegistrationEmail(
  input: RegistrationEmailInput,
): Promise<{ status: EmailStatus; subject: string; error?: string }> {
  const { subject, text } = renderRegistrationEmail(input);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  // Kein Provider → ehrlich überspringen.
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[email:skipped_no_provider] An: ${input.to}\nBetreff: ${subject}\n${text}\n` +
          `(RESEND_API_KEY / EMAIL_FROM nicht gesetzt — Mail NICHT versendet.)`,
      );
    }
    await logEmail({ to: input.to, subject, type: input.type, relatedEntityId: input.relatedEntityId, status: 'skipped_no_provider' });
    return { status: 'skipped_no_provider', subject };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [input.to], subject, text }),
    });

    if (!res.ok) {
      const body = await res.text();
      const error = `Resend ${res.status}: ${body.slice(0, 300)}`;
      await logEmail({ to: input.to, subject, type: input.type, relatedEntityId: input.relatedEntityId, status: 'failed', errorMessage: error });
      return { status: 'failed', subject, error };
    }

    await logEmail({ to: input.to, subject, type: input.type, relatedEntityId: input.relatedEntityId, status: 'sent', sentAt: new Date().toISOString() });
    return { status: 'sent', subject };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unbekannter Fehler beim Versand.';
    await logEmail({ to: input.to, subject, type: input.type, relatedEntityId: input.relatedEntityId, status: 'failed', errorMessage: error });
    return { status: 'failed', subject, error };
  }
}
