// ============================================================
// MDC — Wer sitzt gerade davor?
// ============================================================
//
// Seit 17.10.2026 gibt es ZWEI Passwörter, nicht mehr eines:
//
//   MDC_ADMIN_PASSWORD    Die Turnierleitung. Darf alles — Ergebnisse
//                         freigeben, Passnummern vergeben, News schreiben.
//   MDC_TERMIN_PASSWORD   Die Wirte. Darf GENAU EINES: ein Ranking ansetzen
//                         und einen selbst angesetzten Termin wieder
//                         zurücknehmen (`/admin/ansetzen`).
//
// Warum überhaupt ein zweites: Das Ranking am Freitag, Samstag oder Sonntag
// ist kein fester Abend, es wird von Lokal zu Lokal verabredet. Bisher musste
// jeder Wirt dafür bei der Turnierleitung anrufen. Mit dem zweiten Passwort
// trägt er es selbst ein — ohne dass er an die Ergebnisse kommt.
//
// Warum kein Konto je Wirt: Ein Konto bräuchte eine Anmeldung, eine Sitzung
// und damit ein Cookie und eine Datenbank. Die MDC hat beides nicht, und das
// steht so in den Datenschutzhinweisen. Der Preis ist Ehrlichkeit wert: Das
// Passwort ist für alle Lokale dasselbe, ein Eintrag lässt sich also NICHT
// einem bestimmten Wirt zuordnen. Wer es hat, kann für jedes Lokal ansetzen.
// Die Turnierleitung sieht unter `/admin/kalender` jeden Eintrag und kann
// jeden zurücknehmen — das ist die Gegenprobe.
//
// Geprüft wird hier UND im Proxy (`proxy.ts`). Doppelt mit Absicht: Der Proxy
// schützt die Seite, diese Prüfung die Server-Aktionen. Eine Aktion ist eine
// eigene Adresse im Netz; sie darf sich nicht darauf verlassen, dass vor ihr
// jemand aufgepasst hat.
// ============================================================

import 'server-only';
import { headers } from 'next/headers';

/** Wer darf hier gerade etwas — und was. */
export type Rolle = 'leitung' | 'wirt';

function wert(name: string): string {
  return (process.env[name] ?? '').trim();
}

/** Vergleich ohne frühen Abbruch — gleiche Laufzeit bei gleicher Länge. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Das Passwort aus der `Authorization`-Kopfzeile, als UTF-8 gelesen.
 *
 * Der Benutzername ist gleichgültig und wird nicht geprüft — es gibt keine
 * Benutzer, nur zwei Passwörter.
 */
async function passwort(): Promise<string | null> {
  const header = (await headers()).get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return null;
  try {
    const text = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
    return text.slice(text.indexOf(':') + 1);
  } catch {
    return null;
  }
}

/**
 * Wer ist da? `null` heißt: niemand, den die Seite kennt.
 *
 * Die Turnierleitung gewinnt: Wer das Admin-Passwort schickt, ist `leitung`,
 * auch wenn beide Passwörter zufällig gleich wären.
 */
export async function werDaIst(): Promise<Rolle | null> {
  const geschickt = await passwort();
  if (geschickt === null) return null;

  const admin = wert('MDC_ADMIN_PASSWORD');
  if (admin && gleich(geschickt, admin)) return 'leitung';

  const termin = wert('MDC_TERMIN_PASSWORD');
  if (termin && gleich(geschickt, termin)) return 'wirt';

  return null;
}

/** Nur die Turnierleitung. */
export async function darfVerwalten(): Promise<boolean> {
  return (await werDaIst()) === 'leitung';
}

/** Turnierleitung ODER ein Lokal mit dem Termin-Passwort. */
export async function darfAnsetzen(): Promise<boolean> {
  return (await werDaIst()) !== null;
}

/**
 * Ist das Passwort für die Wirte überhaupt vergeben? Wenn nicht, kommt dort
 * niemand hinein außer der Turnierleitung — und die Seite sagt das auch,
 * statt eine Einladung auszusprechen, die ins Leere läuft.
 */
export function terminPasswortGesetzt(): boolean {
  return wert('MDC_TERMIN_PASSWORD').length > 0;
}
