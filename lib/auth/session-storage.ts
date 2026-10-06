// ============================================================
// Sitzungsspeicher für den Supabase-Browser-Client
// ============================================================
//
// Warum nicht einfach localStorage (Standard von supabase-js)?
// Auf iPhone/iPad (WebKit — gilt für Safari, jede iOS-App mit WebView und
// die Web-App vom Home-Bildschirm) ist alles, was ein Skript schreibt,
// flüchtig: localStorage kann nach 7 Tagen ohne Besuch gelöscht werden,
// per `document.cookie` gesetzte Cookies laufen nach spätestens 7 Tagen
// ab (Intelligent Tracking Prevention). Nur Cookies, die der SERVER per
// Set-Cookie setzt, halten so lange wie angegeben.
//
// Deshalb liegt die Sitzung doppelt:
//   • in Cookies `mdu-sb.0`, `mdu-sb.1`, … (in Stücke geteilt, ein Cookie
//     darf höchstens ~4 KB groß sein). `proxy.ts` setzt sie einmal am Tag
//     per Set-Cookie neu — damit gelten sie als Server-Cookies und bleiben
//     90 Tage ab der letzten Nutzung.
//   • weiter im localStorage — so bleibt niemand beim Umstieg hängen, und
//     fällt eine der beiden Quellen weg, trägt die andere.
//
// Beim Lesen gewinnt die NEUERE Sitzung (`expires_at`). Das ist wichtig:
// Supabase tauscht das Refresh-Token bei jeder Erneuerung aus, ein altes
// ist danach ungültig. Käme ein veralteter Stand zurück (z. B. ein Cookie,
// das der Server mit dem Stand von vor einer Sekunde neu gesetzt hat),
// würde die nächste Erneuerung scheitern und die Sitzung beenden.
//
// HttpOnly geht hier bewusst NICHT: Die Seite fragt die Datenbank direkt
// aus dem Browser ab (RLS mit dem Zugangs-Token), der Client muss das
// Token also lesen können. Die Tokens sind dieselben wie bisher im
// localStorage — es wird nichts zusätzlich offengelegt.
// ============================================================

/** Präfix der Sitzungs-Cookies; `proxy.ts` erkennt sie daran. */
export const SESSION_COOKIE_PREFIX = 'mdu-sb.';
/** Lebensdauer der Sitzungs-Cookies (90 Tage, ab letzter Nutzung). */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

/** Höchstlänge je Cookie-Wert (Browser-Grenze ~4096 Byte inkl. Name/Attribute). */
const CHUNK = 3000;
/** Mehr Stücke gibt es nie — Schutz vor Endlosschleifen bei kaputten Cookies. */
const MAX_CHUNKS = 10;

function isBrowser() {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

// ── Kodierung: UTF-8 → base64url (nur Zeichen, die im Cookie unbedenklich sind) ──

function encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(b64: string): string | null {
  try {
    const norm = b64.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(norm + '='.repeat((4 - (norm.length % 4)) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

// ── Cookies ──

function readCookies(): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of document.cookie.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    if (name.startsWith(SESSION_COOKIE_PREFIX)) map.set(name, part.slice(i + 1).trim());
  }
  return map;
}

function cookieAttrs(maxAge: number) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  return `; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function readSessionCookie(): string | null {
  const jar = readCookies();
  let joined = '';
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const part = jar.get(SESSION_COOKIE_PREFIX + i);
    if (part === undefined) break;
    joined += part;
  }
  return joined ? decode(joined) : null;
}

function writeSessionCookie(value: string) {
  const encoded = encode(value);
  const parts: string[] = [];
  for (let i = 0; i < encoded.length; i += CHUNK) parts.push(encoded.slice(i, i + CHUNK));
  if (parts.length > MAX_CHUNKS) return; // zu groß — dann trägt der localStorage allein
  parts.forEach((p, i) => { document.cookie = `${SESSION_COOKIE_PREFIX}${i}=${p}${cookieAttrs(SESSION_COOKIE_MAX_AGE)}`; });
  // Überzählige Stücke einer früheren, längeren Sitzung entfernen.
  for (const name of readCookies().keys()) {
    const idx = Number(name.slice(SESSION_COOKIE_PREFIX.length));
    if (Number.isInteger(idx) && idx >= parts.length) document.cookie = `${name}=${cookieAttrs(0)}`;
  }
}

function clearSessionCookie() {
  for (const name of readCookies().keys()) document.cookie = `${name}=${cookieAttrs(0)}`;
}

// ── localStorage (kann in privaten Fenstern/WebViews werfen) ──

function lsGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* nicht verfügbar */ }
}
function lsRemove(key: string) {
  try { window.localStorage.removeItem(key); } catch { /* nicht verfügbar */ }
}

/** Ablaufzeit einer gespeicherten Sitzung (Sekunden) — 0, wenn unlesbar. */
function expiresAt(raw: string | null): number {
  if (!raw) return 0;
  try {
    const v = JSON.parse(raw) as { expires_at?: number } | null;
    return typeof v?.expires_at === 'number' ? v.expires_at : 0;
  } catch {
    return 0;
  }
}

/** Nur der Sitzungsschlüssel geht ins Cookie; Hilfswerte (z. B. PKCE) bleiben im localStorage. */
function isSessionKey(key: string) {
  return key.endsWith('-auth-token');
}

/** Speicher-Adapter im Format, das supabase-js als `auth.storage` erwartet. */
export const sessionStorageAdapter = {
  getItem(key: string): string | null {
    if (!isBrowser()) return null;
    const local = lsGet(key);
    if (!isSessionKey(key)) return local;
    const cookie = readSessionCookie();
    if (!cookie) {
      // Umstieg/Ausfall: Sitzung nur im localStorage → Cookie nachziehen.
      if (local) writeSessionCookie(local);
      return local;
    }
    if (!local) { lsSet(key, cookie); return cookie; }
    if (cookie === local) return cookie;
    // Unterschiedlich: die neuere gilt, die andere wird angeglichen.
    if (expiresAt(local) > expiresAt(cookie)) { writeSessionCookie(local); return local; }
    lsSet(key, cookie);
    return cookie;
  },
  setItem(key: string, value: string): void {
    if (!isBrowser()) return;
    lsSet(key, value);
    if (isSessionKey(key)) writeSessionCookie(value);
  },
  removeItem(key: string): void {
    if (!isBrowser()) return;
    lsRemove(key);
    if (isSessionKey(key)) clearSessionCookie();
  },
};
