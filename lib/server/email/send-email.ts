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
import { ROLE_LABELS, type UserRole } from '@/lib/auth/roles';

/** Kurzbeschreibung der Rechte je Rolle — für die Freischalt-Mail. */
const ROLE_RIGHTS: Record<UserRole, string> = {
  guest:        'Es sind noch keine besonderen Rechte hinterlegt.',
  player:       'Damit kannst du dich einloggen, dein Spielerprofil pflegen (Spitzname, „Über mich") und deine persönlichen Statistiken einsehen.',
  team_captain: 'Damit kannst du zusätzlich zu den Spielerrechten dein Team verwalten (Beschreibung, Logo, Kader), Mannschaften zur Saison anmelden und den Status deiner Anmeldungen verfolgen.',
  league_admin: 'Damit hast du Verwaltungsrechte: Teams freigeben, Benutzer einsehen, Saisonanmeldungen und Spielberichte bearbeiten sowie News pflegen.',
  super_admin:  'Damit hast du volle Administratorrechte inklusive Benutzer- und Rollenverwaltung sowie Systemeinstellungen.',
};

export type EmailType =
  | 'registration_submitted'
  | 'registration_approved'
  | 'registration_rejected'
  | 'registration_changes_requested'
  | 'account_activated'
  | 'new_user_admin'
  | 'link_reset_request'
  | 'login_help_request'
  | 'draft_reminder'
  | 'draft_reminder_final';

export type EmailStatus = 'sent' | 'failed' | 'skipped_no_provider';

export interface RegistrationEmailInput {
  type: EmailType;
  to: string;
  /** Anrede-Name (Kontaktperson / Team Captain / Benutzer). */
  name: string;
  /** Nur für Mannschafts-Mails relevant (bzw. verknüpftes Team bei Konto-Mail). */
  teamName?: string;
  /** Pflicht bei rejected / changes_requested. */
  reason?: string | null;
  /** Nur für account_activated: zugewiesene Rolle + verknüpfter Spieler. */
  role?: string;
  playerName?: string;
  /** Nur für registration_approved: zugewiesene Liga + Ligawunsch (Labels). */
  assignedLeague?: string | null;
  requestedLeague?: string | null;
  relatedEntityId?: string | null;
  /** Nur für new_user_admin: Angaben zum neu registrierten Benutzer. */
  newUserName?: string;
  newUserEmail?: string;
  intent?: string;
  actionUrl?: string;
  /** Nur für link_reset_request / login_help_request: anfragende Person. */
  requesterName?: string;
  requesterEmail?: string;
  /** Optionale Freitext-Nachricht (login_help_request). */
  note?: string;
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
    case 'registration_approved': {
      const assigned = (input.assignedLeague ?? '').trim();
      const requested = (input.requestedLeague ?? '').trim();
      const ligaLine = assigned ? `\n\nZugewiesene Liga: ${assigned}` : '';
      const divergence = assigned && requested && assigned !== requested
        ? `\n\nHinweis: Die zugewiesene Liga weicht von eurer Anmeldung (${requested}) ab.`
        : '';
      return {
        subject: 'MDU Mannschaftsanmeldung freigegeben',
        text:
          `Hallo ${name},\n\n` +
          `deine Mannschaftsanmeldung für ${team} wurde erfolgreich freigegeben.` +
          ligaLine + divergence +
          `\n\nDie Mannschaft ist damit für die weitere Saisonplanung berücksichtigt.` + SIGNATURE,
      };
    }
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
    case 'account_activated': {
      const roleKey = (input.role ?? 'player') as UserRole;
      const roleLabel = ROLE_LABELS[roleKey] ?? ROLE_LABELS.player;
      const rights = ROLE_RIGHTS[roleKey] ?? ROLE_RIGHTS.player;
      const links: string[] = [];
      if (input.playerName) links.push(`Verknüpftes Spielerprofil: ${input.playerName}`);
      if (input.teamName) links.push(`Team: ${input.teamName}`);
      const linkBlock = links.length ? `\n${links.join('\n')}\n` : '';
      return {
        subject: 'Dein MDU-Konto wurde freigeschaltet',
        text:
          `Hallo ${name},\n\n` +
          `dein Konto bei der Münchner Dart Union wurde von der Ligaleitung geprüft und freigeschaltet.\n\n` +
          `Zugewiesene Rolle: ${roleLabel}\n` +
          `${rights}\n` +
          linkBlock +
          `\nDu kannst dich jetzt im Mitgliederbereich anmelden und deinen persönlichen Bereich nutzen.` + SIGNATURE,
      };
    }
    case 'link_reset_request':
      return {
        subject: 'MDU: Anfrage zum Zurücksetzen einer Spieler-Verknüpfung',
        text:
          `Hallo ${name},\n\n` +
          `bei einer Registrierung wurde erkannt, dass ein Spieler bereits mit einem Konto verknüpft ist. ` +
          `Die anfragende Person bittet darum, das bestehende Konto bzw. die Verknüpfung zu löschen oder zurückzusetzen, ` +
          `damit sie sich (neu) anmelden kann.\n\n` +
          `Betroffener Spieler: ${input.playerName?.trim() || '—'}\n` +
          `Anfrage von: ${input.requesterName?.trim() || '—'}${input.requesterEmail ? ` (${input.requesterEmail})` : ''}\n\n` +
          `Bitte in der Benutzerverwaltung prüfen und das betroffene Konto bzw. die Verknüpfung entfernen oder zurücksetzen.` + SIGNATURE,
      };
    case 'login_help_request':
      return {
        subject: 'MDU: Hilfe beim Login (E-Mail-Adresse vergessen)',
        text:
          `Hallo ${name},\n\n` +
          `eine Person kann sich nicht anmelden und kennt ihre Login-E-Mail-Adresse nicht mehr. ` +
          `Sie bittet die Ligaleitung um Hilfe bei der Zuordnung ihres Kontos.\n\n` +
          `Name: ${input.requesterName?.trim() || '—'}\n` +
          (input.note?.trim() ? `Nachricht: ${input.note.trim()}\n` : '') +
          `\nBitte das Konto in der Benutzerverwaltung heraussuchen und der Person die hinterlegte ` +
          `E-Mail-Adresse mitteilen bzw. das Konto zurücksetzen.` + SIGNATURE,
      };
    case 'new_user_admin': {
      const intentLabel = input.intent === 'team_captain' ? 'Teamkapitän / TC' : input.intent === 'player' ? 'Spieler' : null;
      const note = input.note?.trim();
      const lines = [
        `Name: ${input.newUserName?.trim() || '—'}`,
        `E-Mail: ${input.newUserEmail?.trim() || '—'}`,
        intentLabel ? `Wunsch bei Registrierung: ${intentLabel}` : null,
        input.playerName
          ? `Automatisch erkannt: ${input.playerName}`
          : 'Automatisch erkannt: kein Spielerprofil gefunden',
        note ? `Angaben des Nutzers (Team / Lokal / Liga):\n${note}` : null,
      ].filter(Boolean).join('\n');
      return {
        subject: 'Neue MDU-Registrierung – Rolle/Spieler zuordnen',
        text:
          `Hallo ${name},\n\n` +
          `ein neuer Benutzer hat sich auf der MDU-Plattform registriert und wartet auf die ` +
          `Zuordnung von Rolle und Spielerprofil:\n\n` +
          `${lines}\n\n` +
          `Bitte in der Benutzerverwaltung prüfen und zuordnen:\n${input.actionUrl ?? ''}` + SIGNATURE,
      };
    }
    case 'draft_reminder': {
      const link = input.actionUrl ? `\n\nDirekt zur Anmeldung: ${input.actionUrl}` : '';
      return {
        subject: 'Eure MDU-Anmeldung 26/27 ist noch ein Entwurf',
        text:
          `Servus ${name},\n\n` +
          `ich wollte nur kurz nachhaken: Eure Mannschaftsanmeldung für die Saison 2026/2027 ` +
          `(${team}) liegt bei uns aktuell noch als Entwurf – also noch nicht endgültig abgeschickt.\n\n` +
          `Kann natürlich sein, dass ihr noch mittendrin seid – kein Stress, ihr habt ja noch bis ` +
          `Mitte September Zeit. Ich wollte nur sichergehen, dass ihr nicht aus Versehen auf halbem ` +
          `Weg stecken geblieben seid.\n\n` +
          `Falls ihr die Anmeldung abschließen wollt: einfach unter „Mein Bereich → Mannschaft ` +
          `anmelden" den Entwurf öffnen, vervollständigen und absenden. Danach steht der Status ` +
          `auf „eingereicht" und wir kümmern uns um die Freigabe.\n\n` +
          `Wenn du Fragen hast, meld dich einfach kurz.` + link + SIGNATURE,
      };
    }
    case 'draft_reminder_final': {
      const link = input.actionUrl ? `\n\nDirekt zur Anmeldung: ${input.actionUrl}` : '';
      return {
        subject: 'Wichtig: Eure MDU-Anmeldung 26/27 ist noch nicht abgeschickt',
        text:
          `Servus ${name},\n\n` +
          `eine wichtige Erinnerung: Eure Mannschaftsanmeldung für die Saison 2026/2027 ` +
          `(${team}) liegt bei uns immer noch als Entwurf – also noch nicht endgültig abgeschickt.\n\n` +
          `Jetzt drängt die Zeit: Bitte schließt die Anmeldung zeitnah ab, damit wir eure ` +
          `Mannschaft sicher für die neue Saison einplanen können. Ohne abgeschickte Anmeldung ` +
          `können wir euch leider nicht berücksichtigen.\n\n` +
          `So geht's: unter „Mein Bereich → Mannschaft anmelden" den Entwurf öffnen, ` +
          `vervollständigen und absenden. Danach steht der Status auf „eingereicht".\n\n` +
          `Wenn etwas unklar ist oder ihr Hilfe braucht, meld dich bitte kurz – wir helfen gern.` + link + SIGNATURE,
      };
    }
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
