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
  /** Zahl am App-Symbol (Badging API, sw.js) auf die ungelesenen Glocken-
   *  Benachrichtigungen des Empfängers setzen; `plus` zählt etwas dazu, das
   *  (noch) keine Zeile in `notifications` hat (Zusagen-Erinnerung). */
  anzahl?: { plus?: number };
}

let bereit: boolean | null = null;
export function pushBereit(): boolean {
  if (bereit !== null) return bereit;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv || !supabaseAdmin) return (bereit = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:kontakt@mdudarts.de', pub, priv);
  return (bereit = true);
}

interface Abo { id: string; user_id?: string; endpoint: string; p256dh: string; auth: string }

/** Ungelesene Glocken-Benachrichtigungen je Nutzer (wie der Zähler an der Glocke). */
async function ungelesen(ids: string[]): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  const { data } = await supabaseAdmin!.from('notifications').select('recipient_user_id').in('recipient_user_id', ids).is('read_at', null).limit(5000);
  for (const r of (data ?? []) as { recipient_user_id: string }[]) m.set(r.recipient_user_id, (m.get(r.recipient_user_id) ?? 0) + 1);
  return m;
}

/** An alle Geräte der genannten Nutzer. Gibt zurück, wie viele Geräte erreicht wurden. */
export async function pushAn(userIds: string[], n: PushNachricht): Promise<{ status: 'ok' | 'nicht_eingerichtet'; gesendet: number }> {
  if (!pushBereit() || !supabaseAdmin) return { status: 'nicht_eingerichtet', gesendet: 0 };
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return { status: 'ok', gesendet: 0 };
  const { data } = await supabaseAdmin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').in('user_id', ids);
  const abos = (data ?? []) as Abo[];
  const zahl = n.anzahl && abos.length ? await ungelesen(ids) : null;
  return { status: 'ok', gesendet: await senden(abos, n, zahl ? (a => (zahl.get(a.user_id!) ?? 0) + (n.anzahl?.plus ?? 0)) : undefined) };
}

/** An ALLE Geräte mit eingeschaltetem Push (Spieltagsbericht, Betreiber 25.10.2026). */
export async function pushAlle(n: PushNachricht): Promise<{ status: 'ok' | 'nicht_eingerichtet'; gesendet: number; geraete: number }> {
  if (!pushBereit() || !supabaseAdmin) return { status: 'nicht_eingerichtet', gesendet: 0, geraete: 0 };
  const abos: Abo[] = [];
  for (let von = 0; ; von += 1000) {
    const { data } = await supabaseAdmin.from('push_subscriptions').select('id, endpoint, p256dh, auth').range(von, von + 999);
    abos.push(...((data ?? []) as Abo[]));
    if (!data || data.length < 1000) break;
  }
  const gesendet = await senden(abos, n);
  return { status: 'ok', gesendet, geraete: abos.length };
}

async function senden(abos: Abo[], n: PushNachricht, anzahl?: (a: Abo) => number): Promise<number> {
  const db = supabaseAdmin!;
  const basis = { title: n.titel, body: n.text, url: n.url || '/', tag: n.tag };
  const payloadFuer = (a: Abo) => JSON.stringify(anzahl ? { ...basis, anzahl: anzahl(a) } : basis);
  let gesendet = 0;
  const weg: string[] = [], ok: string[] = [];
  // In Blöcken, damit bei vielen Geräten nicht hunderte Verbindungen gleichzeitig offen sind.
  for (let i = 0; i < abos.length; i += 50) {
    await Promise.all(abos.slice(i, i + 50).map(async a => {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, payloadFuer(a), { TTL: 24 * 3600, urgency: 'normal' });
        gesendet += 1; ok.push(a.id);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) weg.push(a.id);
      }
    }));
  }
  if (weg.length) await db.from('push_subscriptions').delete().in('id', weg);
  if (ok.length) await db.from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).in('id', ok);
  return gesendet;
}
