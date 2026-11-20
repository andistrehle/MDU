// ============================================================
// Eigenes Web-App-Manifest fürs Tablet im Lokal (Betreiber, 20.11.2026)
// ============================================================
// /kiosk verweist auf dieses Manifest statt auf das der MDU (app/manifest.ts):
// „Zum Home-Bildschirm“ von /kiosk aus ergibt eine eigene App „MDU Tablet“, die
// direkt in /kiosk startet, ohne Adressleiste, und /kiosk nicht verlässt.
// ACHTUNG iPhone/iPad: Eine Web-App vom Home-Bildschirm hat einen EIGENEN
// Speicher (Cookies, localStorage) — sie muss einmal neu gekoppelt werden.
// ============================================================

export const dynamic = 'force-static';

export function GET() {
  return new Response(JSON.stringify({
    id: '/kiosk',
    name: 'MDU Tablet – Spielbericht',
    short_name: 'MDU Tablet',
    description: 'Spielbericht am Spieltag live eintragen – Tablet im Lokal.',
    lang: 'de',
    start_url: '/kiosk',
    scope: '/kiosk',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#0B0E14',
    theme_color: '#0B0E14',
    icons: [
      { src: '/app/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }), { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } });
}
