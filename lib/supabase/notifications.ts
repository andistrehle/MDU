// ============================================================
// Client-Datenzugriff: E-Mail-Trigger
// ============================================================
//
// Der E-Mail-Versand läuft serverseitig über /api/notifications/email; hier
// wird nur der Aufruf mit dem Session-Token gekapselt. Keine Secrets im
// Client. Die UI-Benachrichtigungen (Glocke/Dropdown) liegen in
// user-notifications.ts (Tabelle public.notifications).
// ============================================================

import { supabase } from './client';
import type { EmailStatus, EmailType } from '@/lib/server/email/send-email';

export interface RegistrationEmailRequest {
  type: EmailType;
  to: string;
  name: string;
  teamName?: string;
  reason?: string | null;
  role?: string;
  playerName?: string;
  registrationId?: string | null;
}

/**
 * Stößt serverseitigen E-Mail-Versand an. Gibt den echten Status zurück
 * (sent | failed | skipped_no_provider) — kein Fake-Erfolg. Wirft nicht;
 * Fehler werden als status 'failed' zurückgemeldet, damit der Workflow
 * (Statuswechsel) nicht blockiert wird.
 */
export async function triggerRegistrationEmail(
  req: RegistrationEmailRequest,
): Promise<{ status: EmailStatus; error?: string }> {
  if (!supabase) return { status: 'failed', error: 'Supabase ist nicht konfiguriert.' };
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { status: 'failed', error: 'Keine aktive Sitzung.' };

  try {
    const res = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req),
    });
    const data = (await res.json()) as { status?: EmailStatus; error?: string };
    if (!res.ok) return { status: 'failed', error: data.error ?? `Fehler ${res.status}` };
    return { status: data.status ?? 'failed', error: data.error };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'Netzwerkfehler.' };
  }
}

/** Schickt die „Konto freigeschaltet"-Mail an einen Benutzer (best-effort). */
export async function triggerAccountActivatedEmail(
  to: string,
  name: string,
  opts: { role?: string; playerName?: string; teamName?: string; profileId?: string | null } = {},
): Promise<{ status: EmailStatus; error?: string }> {
  return triggerRegistrationEmail({
    type: 'account_activated',
    to,
    name,
    role: opts.role,
    playerName: opts.playerName,
    teamName: opts.teamName,
    registrationId: opts.profileId ?? null,
  });
}

/**
 * Benachrichtigt die Super-Admins per E-Mail über eine neue Registrierung
 * (Rolle/Spieler-Zuordnung nötig). Best-effort, ohne Session/Token — der
 * Server prüft, dass ein frisch registriertes Profil existiert.
 */
export async function notifyNewUserToAdmins(email: string): Promise<void> {
  try {
    await fetch('/api/notifications/new-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch { /* best-effort — blockiert die Registrierung nicht */ }
}

/** Menschlich lesbarer Hinweis zum Mail-Status (für UI). */
export const EMAIL_STATUS_HINT: Record<EmailStatus, string> = {
  sent: 'Eine E-Mail wurde an den Team Captain versendet.',
  failed: 'Die E-Mail konnte nicht versendet werden (im E-Mail-Log einsehbar).',
  skipped_no_provider: 'E-Mail vorbereitet — es ist noch kein E-Mail-Anbieter konfiguriert, daher wurde keine Mail versendet.',
};
