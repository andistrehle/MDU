// ============================================================
// Push-Benachrichtigungen (Server) — Migration 0056
// ============================================================
// Versand über das Web-Push-Protokoll (Bibliothek web-push) an die Push-Dienste
// von Apple/Google/Mozilla. Schlüssel (VAPID) aus der ENV:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…)
// Fehlt etwas, wird nichts geschickt — ehrlich als 'nicht_eingerichtet'.
// Abgelaufene Abos (404/410 vom Push-Dienst) werden gelöscht.
// ============================================================

import 'server-only';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface PushNachricht {
  titel: string;
  text: string;
  /** Ziel beim Antippen (relativ, z. B. /mein-team/spielplan) */
  url?: string | null;
  /** Gleiches Tag ersetzt eine ältere Nachricht statt sie zu stapeln */
  tag?: string;
}

let bereit: boolean | null = null;
export function pushBereit(): boolean {
  if (bereit !== null) return bereit;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv || !supabaseAdmin) return (bereit = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:kontakt@mdudarts.de', pub, priv);
  return (bereit = true);
}

interface Abo { id: string; endpoint: string; p256dh: string; auth: string }

/** An alle Geräte der genannten Nutzer. Gibt zurück, wie viele Geräte erreicht wurden. */
export async function pushAn(userIds: string[], n: PushNachricht): Promise<{ status: 'ok' | 'nicht_eingerichtet'; gesendet: number }> {
  if (!pushBereit() || !supabaseAdmin) return { status: 'nicht_eingerichtet', gesendet: 0 };
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return { status: 'ok', gesendet: 0 };
  const { data } = await supabaseAdmin.from('push_subscriptions').select('id, endpoint, p256dh, auth').in('user_id', ids);
  const abos = (data ?? []) as Abo[];
  const payload = JSON.stringify({ title: n.titel, body: n.text, url: n.url || '/', tag: n.tag });
  let gesendet = 0;
  const weg: string[] = [], ok: string[] = [];
  await Promise.all(abos.map(async a => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, payload, { TTL: 24 * 3600, urgency: 'normal' });
      gesendet += 1; ok.push(a.id);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) weg.push(a.id);
    }
  }));
  if (weg.length) await supabaseAdmin.from('push_subscriptions').delete().in('id', weg);
  if (ok.length) await supabaseAdmin.from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).in('id', ok);
  return { status: 'ok', gesendet };
}
