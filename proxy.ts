// ============================================================
// Proxy (früher „middleware") — serverseitiger Route-Guard + Security-Header
// ============================================================
//
// Guard (REV-002): Gäste (ohne Anmelde-Marker) werden von /admin und
// /mein-bereich schon am Server auf /login?next=… umgeleitet, statt erst
// clientseitig. Der Marker „mdu-auth" wird nach dem Login gesetzt (siehe
// auth-context) und enthält KEINE Tokens — die eigentliche Autorisierung
// (welche Rolle darf was) bleibt bei der Supabase-RLS und den Server-APIs
// (z. B. /api/admin/users). Dieser Guard ist die Zugangs-Vorstufe (kein
// Aufblitzen geschützter Seiten für Gäste), nicht die Sicherheitsgrenze selbst.
//
// Zusätzlich setzt der Proxy defensive Security-Header auf alle Antworten.

import { NextResponse, type NextRequest } from 'next/server';
import { COMING_SOON, PREVIEW_KEY } from '@/lib/site-config';
import { MDC_STANDALONE, MDC_ORIGIN } from '@/lib/mdc/site';

/**
 * Ist die MDC auf ihre eigene Domain umgezogen? Dann führt `mdudarts.de/mdc`
 * dorthin, statt die Seiten ein zweites Mal auszuliefern (doppelte Inhalte).
 *
 * Bewusst über eine Umgebungsvariable und nicht fest im Code: Die Weiterleitung
 * darf erst greifen, wenn mdc-ranking.de wirklich läuft — sonst schickt sie
 * Besucher auf eine Platzhalterseite. Im Vercel-Projekt der MDU setzen:
 * `NEXT_PUBLIC_MDC_MOVED=1`.
 */
const MDC_MOVED = process.env.NEXT_PUBLIC_MDC_MOVED === '1';

const PROTECTED_PREFIXES = ['/admin', '/mein-bereich', '/mein-profil', '/mein-team'];
const PREVIEW_COOKIE = 'mdu-preview';

// Zweitdomain(s), die dauerhaft auf die Hauptdomain umgeleitet werden. Greift,
// sobald die Domain auf Vercel zeigt und im Projekt hinterlegt ist — dann fängt
// die Middleware jeden Aufruf ab und schickt ihn per 308 auf www.mdudarts.de
// (Pfad/Query bleiben erhalten).
const REDIRECT_HOSTS = new Set(['mdu-darts.de', 'www.mdu-darts.de']);
const CANONICAL_ORIGIN = 'https://www.mdudarts.de';

/**
 * Passwort für den Verwaltungsbereich der MDC (`/admin`). Server-only, kein
 * `NEXT_PUBLIC_` — es darf nicht im Browser-Bündel landen.
 *
 * Ist es NICHT gesetzt, bleibt `/admin` die reine Oberflächen-Demo: Der
 * Ergebnis-Upload meldet sich dann selbst als nicht eingerichtet, es gibt also
 * nichts zu schützen. Sobald es gesetzt ist, verlangt die Seite es — über die
 * Passwortabfrage des Browsers (HTTP Basic).
 *
 * Warum Basic und keine Anmeldeseite: Eine Anmeldung bräuchte eine Sitzung und
 * damit ein Cookie. Die MDC setzt keine Cookies, und das steht so in den
 * Datenschutzhinweisen. Die Passwortabfrage des Browsers kommt ohne aus — sie
 * schickt die Zugangsdaten bei jedem Aufruf selbst mit.
 */
const MDC_ADMIN_PASSWORD = (process.env.MDC_ADMIN_PASSWORD ?? '').trim();

/** Vergleich ohne frühen Abbruch — gleiche Laufzeit bei gleicher Länge. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Das Passwort aus der `Authorization`-Kopfzeile — richtig entschlüsselt.
 *
 * `atob` allein genügt NICHT: Es liefert eine Byte-Kette, kein UTF-8. Ein
 * Passwort mit Umlaut käme dann als „GrÃ¼Ã-di" an und könnte nie passen —
 * niemand mit so einem Passwort käme jemals hinein, ganz gleich wie sorgfältig
 * er tippt. Deshalb Bytes einsammeln und ausdrücklich als UTF-8 lesen.
 */
function passwortAus(header: string): string | null {
  if (!header.startsWith('Basic ')) return null;
  try {
    const bytes = Uint8Array.from(atob(header.slice('Basic '.length)), z => z.charCodeAt(0));
    const text = new TextDecoder('utf-8').decode(bytes);
    // Benutzername ist gleichgültig — es gibt nur ein Passwort.
    return text.slice(text.indexOf(':') + 1);
  } catch {
    return null;   // kaputte Kodierung → wie ein falsches Passwort behandeln
  }
}

/**
 * Was bei einer Abweisung im Browser steht. Eine nackte Zeile Text hilft
 * niemandem, der abends im Lokal davorsteht — hier steht, dass der Browser
 * fragt, dass der Benutzername beliebig ist und wie man es noch einmal
 * versucht.
 */
const ABWEISUNG = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Turnierverwaltung — Zugang</title>
<style>
  body { margin:0; padding:32px 22px; font-family: system-ui, -apple-system, sans-serif;
         color:#141A24; background:#F3F7FC; line-height:1.6; }
  main { max-width:34rem; margin:0 auto; background:#fff; border:1px solid #DDE5F0;
         border-radius:14px; padding:26px 24px; }
  h1 { margin:0 0 14px; font-size:1.25rem; color:#1F3B73; }
  ul { padding-left:20px; } li { margin:6px 0; }
  a { color:#D61A1A; }
</style></head>
<body><main>
  <h1>Zugang nur für die Turnierverwaltung</h1>
  <p>Diese Seite ist mit einem Passwort geschützt. Der Browser fragt danach in
     einem eigenen kleinen Fenster.</p>
  <ul>
    <li><strong>Benutzername:</strong> beliebig — zum Beispiel <code>mdc</code>.
        Das Feld wird nicht geprüft.</li>
    <li><strong>Passwort:</strong> das von der Turnierleitung vergebene.</li>
  </ul>
  <p>Diese Meldung erscheint, wenn die Abfrage abgebrochen wurde oder das
     Passwort nicht gepasst hat. <strong>Seite neu laden</strong>, dann fragt
     der Browser erneut.</p>
  <p><a href="/">Zurück zur Startseite</a></p>
</main></body></html>`;

/**
 * Prüft den Zugang zum MDC-Verwaltungsbereich.
 * Gibt `null` zurück, wenn durchgelassen werden darf.
 */
function mdcAdminGuard(request: NextRequest): NextResponse | null {
  if (!MDC_ADMIN_PASSWORD) return null;   // nicht eingerichtet → nur die Demo

  const passwort = passwortAus(request.headers.get('authorization') ?? '');
  if (passwort !== null && gleich(passwort, MDC_ADMIN_PASSWORD)) return null;

  return withSecurityHeaders(new NextResponse(ABWEISUNG, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="MDC Turnierverwaltung", charset="UTF-8"',
      'Content-Type': 'text/html; charset=utf-8',
      // Nichts davon gehört in einen Zwischenspeicher.
      'Cache-Control': 'no-store',
    },
  }));
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase().split(':')[0];
  const { pathname, search } = request.nextUrl;

  // ── Eigenständige MDC-Seite (mdc-ranking.de) ──
  // Dieses Projekt kennt nur die MDC. Die Seiten liegen im Code unter
  // `app/mdc`, sollen aber ohne Präfix erreichbar sein — also wird jeder
  // Aufruf intern dorthin umgeschrieben. Von der MDU-Seite ist hier nichts
  // erreichbar, weil auch `/tabellen` in `/mdc/tabellen` läuft und dort ins
  // Leere greift.
  if (MDC_STANDALONE) {
    // Wer die alte Adresse mit Präfix aufruft (alte Verweise, Lesezeichen),
    // wird auf die kurze Form geschickt — eine Adresse je Seite.
    if (pathname === '/mdc' || pathname.startsWith('/mdc/')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice('/mdc'.length) || '/';
      return withSecurityHeaders(NextResponse.redirect(url, 308));
    }
    // Verwaltung: vor dem Umschreiben prüfen. Die Abfrage gilt auch für die
    // Formularsendungen der Upload-Seite — die laufen über dieselbe Adresse.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const abweisung = mdcAdminGuard(request);
      if (abweisung) return abweisung;
    }
    const url = request.nextUrl.clone();
    url.pathname = `/mdc${pathname === '/' ? '' : pathname}`;
    return withSecurityHeaders(NextResponse.rewrite(url));
  }

  // Zweitdomain → Hauptdomain (dauerhaft, Pfad/Query beibehalten).
  if (REDIRECT_HOSTS.has(host)) {
    const dest = new URL(pathname + search, CANONICAL_ORIGIN);
    return withSecurityHeaders(NextResponse.redirect(dest, 308));
  }

  // ── Munich Darts Challenge (`/mdc`) ──
  // Eigenständiges Projekt: Weder der Coming-Soon-Schalter der MDU noch ihr
  // Anmelde-Guard dürfen dort greifen. Sonst würde ein MDU-Wartungsmodus die
  // MDC gleich mit abschalten — und `/mdc/admin` fiele unter den Guard für
  // `/admin`, obwohl es damit nichts zu tun hat.
  // Die Sicherheits-Header bekommt die MDC weiterhin; die gelten für jede
  // Seite, die von hier ausgeliefert wird.
  if (pathname === '/mdc' || pathname.startsWith('/mdc/')) {
    // Nach dem Umzug wohnt die MDC unter mdc-ranking.de. Dann führt die alte
    // Adresse dauerhaft dorthin, statt dieselben Seiten zweimal auszuliefern.
    if (MDC_MOVED) {
      const ziel = new URL((pathname.slice('/mdc'.length) || '/') + search, MDC_ORIGIN);
      return withSecurityHeaders(NextResponse.redirect(ziel, 308));
    }
    // Solange die MDC hier noch ausgeliefert wird, gilt für ihre Verwaltung
    // dieselbe Abfrage wie auf der eigenen Domain.
    if (pathname === '/mdc/admin' || pathname.startsWith('/mdc/admin/')) {
      const abweisung = mdcAdminGuard(request);
      if (abweisung) return abweisung;
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // ── Coming-Soon-/Wartungsmodus (lib/site-config.ts) ──
  // Bei aktivem COMING_SOON wird JEDER Aufruf auf die Holding-Seite
  // umgeschrieben. Ausnahme: eine Vorschau-Sitzung (Cookie), damit man sich
  // nicht selbst aussperrt. Vorschau an/aus per `?vorschau=<KEY>` / `?vorschau=aus`.
  if (COMING_SOON) {
    const vorschau = request.nextUrl.searchParams.get('vorschau');

    // Vorschau beenden → Cookie löschen, sauber ohne Query weiterleiten.
    if (vorschau === 'aus') {
      const url = request.nextUrl.clone();
      url.searchParams.delete('vorschau');
      const res = NextResponse.redirect(url);
      res.cookies.set(PREVIEW_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'lax' });
      return withSecurityHeaders(res);
    }
    // Vorschau aktivieren → Cookie setzen, sauber ohne Query weiterleiten.
    if (vorschau === PREVIEW_KEY) {
      const url = request.nextUrl.clone();
      url.searchParams.delete('vorschau');
      const res = NextResponse.redirect(url);
      res.cookies.set(PREVIEW_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
      return withSecurityHeaders(res);
    }

    const hasPreview = request.cookies.get(PREVIEW_COOKIE)?.value === '1';
    // Ohne Vorschau: alles auf die Holding-Seite (kein Loop auf /coming-soon selbst).
    if (!hasPreview && pathname !== '/coming-soon') {
      const url = request.nextUrl.clone();
      url.pathname = '/coming-soon';
      url.search = '';
      return withSecurityHeaders(NextResponse.rewrite(url));
    }
    // mit Vorschau-Cookie: normal weiter (fällt in den Auth-Guard unten).
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isProtected && !request.cookies.get('mdu-auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Auf allen Seiten laufen (für die Header), außer Next-Interna und statischen
  // Assets — dort sind weder Guard noch Header nötig.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:webp|png|jpg|jpeg|svg|ico|txt|xml)$).*)'],
};
