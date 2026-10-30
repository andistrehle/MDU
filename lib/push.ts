// ============================================================
// Push-Benachrichtigungen — Browser-Seite (Server: lib/server/push.ts)
// ============================================================
// Zustand eines Geräts:
//   'nicht_moeglich' — Browser kann kein Push (oder Schlüssel fehlt)
//   'ios_installieren' — iPhone/iPad im Browser: Push gibt es erst, wenn die
//      Seite als App auf dem Home-Bildschirm liegt (iOS 16.4+)
//   'frage' — noch nie gefragt
//   'aktiv' — erlaubt und auf diesem Gerät eingeschaltet
//   'aus' — erlaubt, aber hier ausgeschaltet
//   'blockiert' — abgelehnt; die Seite darf nicht noch einmal fragen, das
//      geht nur in den Einstellungen des Browsers/Handys
// ============================================================

import { mitAnmeldung } from '@/lib/auth/mit-anmeldung';

export type PushZustand = 'nicht_moeglich' | 'ios_installieren' | 'frage' | 'aktiv' | 'aus' | 'blockiert';

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
/** Merker: auf diesem Gerät bewusst ausgeschaltet — dann nach dem Login nicht still wieder an. */
const AUS_KEY = 'mdu-push-aus';
const merke = (aus: boolean) => { try { if (aus) localStorage.setItem(AUS_KEY, '1'); else localStorage.removeItem(AUS_KEY); } catch { /* egal */ } };
const bewusstAus = () => { try { return localStorage.getItem(AUS_KEY) === '1'; } catch { return false; } };

/** Handy/Tablet (oder installierte Web-App)? Am Desktop blenden wir Push-Frage und -Karte aus (Betreiber, 30.10.2026). */
export const istHandy = () => typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod|Android|Mobile/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  || (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches));
export const istIos = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
export const istInstalliert = () => typeof window !== 'undefined'
  && (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

function unterstuetzt(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!VAPID;
}

async function registrierung(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  return navigator.serviceWorker.ready;
}

export async function pushZustand(): Promise<PushZustand> {
  if (!unterstuetzt()) return istIos() && !istInstalliert() ? 'ios_installieren' : 'nicht_moeglich';
  if (Notification.permission === 'denied') return 'blockiert';
  if (Notification.permission === 'default') return 'frage';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const abo = reg ? await reg.pushManager.getSubscription() : null;
  return abo ? 'aktiv' : 'aus';
}

function schluessel(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const roh = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(roh.length));
  for (let i = 0; i < roh.length; i++) out[i] = roh.charCodeAt(i);
  return out;
}

/** Fragt (falls nötig) um Erlaubnis und meldet dieses Gerät an. Muss aus einem Tipp heraus laufen (iOS). */
export async function pushEinschalten(): Promise<{ zustand: PushZustand; fehler: string | null }> {
  if (!unterstuetzt()) return { zustand: await pushZustand(), fehler: null };
  merke(false);
  const erlaubnis = await Notification.requestPermission();
  if (erlaubnis !== 'granted') return { zustand: erlaubnis === 'denied' ? 'blockiert' : 'frage', fehler: null };
  try {
    const reg = await registrierung();
    const abo = (await reg.pushManager.getSubscription())
      ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: schluessel(VAPID) });
    const r = await mitAnmeldung('/api/push/abo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(abo.toJSON()) });
    if (!r.ok) return { zustand: 'aus', fehler: ((await r.json().catch(() => ({}))) as { error?: string }).error ?? 'Anmelden hat nicht geklappt.' };
    return { zustand: 'aktiv', fehler: null };
  } catch {
    return { zustand: 'aus', fehler: 'Anmelden beim Push-Dienst hat nicht geklappt – bitte noch einmal versuchen.' };
  }
}

/** Abo auf diesem Gerät beenden. `bewusst` = vom Nutzer ausgeschaltet (sonst: Abmelden). */
export async function pushAusschalten(bewusst: boolean): Promise<void> {
  if (!unterstuetzt()) return;
  if (bewusst) merke(true);
  const reg = await navigator.serviceWorker.getRegistration('/');
  const abo = reg ? await reg.pushManager.getSubscription() : null;
  if (!abo) return;
  await fetch('/api/push/abo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: abo.endpoint }) }).catch(() => {});
  await abo.unsubscribe().catch(() => false);
}

/**
 * Nach dem Login: Ist Push auf dem Gerät erlaubt und nicht bewusst aus, das Abo
 * (neu) dem angemeldeten Nutzer zuordnen. Beim Abmelden wird es gelöscht
 * (pushAusschalten(false)) — so landet nie eine fremde Nachricht auf dem Gerät.
 */
export async function pushAboAuffrischen(): Promise<void> {
  if (!unterstuetzt() || Notification.permission !== 'granted' || bewusstAus()) return;
  const reg = await registrierung();
  const abo = (await reg.pushManager.getSubscription())
    ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: schluessel(VAPID) }).catch(() => null);
  if (!abo) return;
  await mitAnmeldung('/api/push/abo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(abo.toJSON()) }).catch(() => {});
}
