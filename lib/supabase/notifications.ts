// ============================================================
// Client-Datenzugriff: interne Hinweise + E-Mail-Trigger
// ============================================================
//
// admin_notifications werden per DB-Trigger erzeugt (migrations/0005) und
// per RLS nur für Ligaleitung/Super Admin sichtbar gemacht — hier nur Lesen
// und Quittieren. Der E-Mail-Versand läuft serverseitig über
// /api/notifications/email; hier wird nur der Aufruf mit dem Session-Token
// gekapselt. Keine Secrets im Client.
// ============================================================

import { supabase } from './client';
import type { EmailStatus, EmailType } from '@/lib/server/email/send-email';

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  target_roles: string[];
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: 'unread' | 'read';
  created_at: string;
  read_at: string | null;
  read_by: string | null;
}

/** Hinweise für Ligaleitung/Super Admin (RLS filtert auf Admin-Rechte). */
export async function listAdminNotifications(onlyUnread = false): Promise<AdminNotification[]> {
  if (!supabase) return [];
  let query = supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
  if (onlyUnread) query = query.eq('status', 'unread');
  const { data } = await query.limit(50);
  return (data ?? []) as AdminNotification[];
}

export async function countUnreadNotifications(): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'unread');
  return count ?? 0;
}

/** Hinweis als gelesen markieren (RLS prüft Admin-Recht). */
export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ status: 'read', read_at: new Date().toISOString(), read_by: auth.user?.id ?? null })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export interface RegistrationEmailRequest {
  type: EmailType;
  to: string;
  name: string;
  teamName?: string;
  reason?: string | null;
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
  profileId?: string | null,
): Promise<{ status: EmailStatus; error?: string }> {
  return triggerRegistrationEmail({
    type: 'account_activated',
    to,
    name,
    registrationId: profileId ?? null,
  });
}

/** Menschlich lesbarer Hinweis zum Mail-Status (für UI). */
export const EMAIL_STATUS_HINT: Record<EmailStatus, string> = {
  sent: 'Eine E-Mail wurde an den Team Captain versendet.',
  failed: 'Die E-Mail konnte nicht versendet werden (im E-Mail-Log einsehbar).',
  skipped_no_provider: 'E-Mail vorbereitet — es ist noch kein E-Mail-Anbieter konfiguriert, daher wurde keine Mail versendet.',
};
