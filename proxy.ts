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

const PROTECTED_PREFIXES = ['/admin', '/mein-bereich', '/mein-profil', '/mein-team'];
const PREVIEW_COOKIE = 'mdu-preview';

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── Munich Darts Challenge (`/mdc`) ──
  // Eigenständiges Projekt: Weder der Coming-Soon-Schalter der MDU noch ihr
  // Anmelde-Guard dürfen dort greifen. Sonst würde ein MDU-Wartungsmodus die
  // MDC gleich mit abschalten — und `/mdc/admin` fiele unter den Guard für
  // `/admin`, obwohl es damit nichts zu tun hat.
  // Die Sicherheits-Header bekommt die MDC weiterhin; die gelten für jede
  // Seite, die von hier ausgeliefert wird.
  if (pathname === '/mdc' || pathname.startsWith('/mdc/')) {
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
