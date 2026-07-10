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

const PROTECTED_PREFIXES = ['/admin', '/mein-bereich', '/mein-profil', '/mein-team'];

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
