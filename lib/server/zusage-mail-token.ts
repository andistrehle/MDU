// Signierter Abmelde-Link für die E-Mail-Erinnerung (ohne Login nutzbar).
// Schlüssel = HMAC(Benutzer-ID) mit einem server-only Geheimnis; ohne Geheimnis
// gibt es keinen Link und die Route lehnt alles ab.
import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

const geheimnis = () => process.env.ZUSAGE_MAIL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function abmeldeSchluessel(userId: string): string | null {
  const g = geheimnis();
  return g ? createHmac('sha256', g).update('zusage-mail:' + userId).digest('base64url').slice(0, 32) : null;
}

export function schluesselPasst(userId: string, t: string): boolean {
  const soll = abmeldeSchluessel(userId);
  if (!soll || t.length !== soll.length) return false;
  return timingSafeEqual(Buffer.from(soll), Buffer.from(t));
}
