import type { Metadata, Viewport } from 'next';

// Eingabeseite fürs Tablet im Lokal — gehört in keinen Suchindex. Eigenes Manifest
// (app/kiosk-app.webmanifest): Vom Home-Bildschirm startet die App direkt hier.
export const metadata: Metadata = {
  title: 'Spielbericht – Tablet',
  robots: { index: false, follow: false },
  manifest: '/kiosk-app.webmanifest',
  appleWebApp: { capable: true, title: 'MDU Tablet', statusBarStyle: 'black' },
};
export const viewport: Viewport = { themeColor: '#0B0E14' };

// Diagnose für alte Geräte (19.11.2026): Next liefert Skripte für Safari ab 16.4 /
// Chrome ab 111. Auf älteren Tablets bleibt die Seite bei „Lädt …“ stehen, ohne dass
// man sieht, warum. Dieses kleine Skript (bewusst altes JavaScript) schreibt den
// ersten Fehler und die Browser-Kennung unten auf den Bildschirm — nur dann, wenn
// die Seite nach 6 Sekunden noch nicht gestartet ist.
const DIAGNOSE = `(function(){var f=[];function m(t){if(f.length<2)f.push(t);}
window.addEventListener('error',function(e){var t=e&&e.target;if(t&&t.src){m('Datei: '+String(t.src).split('/').pop());}else{m((e.message||'Fehler')+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||'?'));}},true);
window.addEventListener('unhandledrejection',function(e){m('Promise: '+(e.reason&&e.reason.message||e.reason));});
setTimeout(function(){if(window.__kioskLaeuft)return;var d=document.createElement('div');d.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#7a1c1c;color:#fff;font:14px/1.4 sans-serif;padding:12px;word-break:break-all';
d.appendChild(document.createTextNode('Die Seite startet auf diesem Ger\\u00e4t nicht. Bitte ein Foto davon schicken. | '+navigator.userAgent+' | '+(f.length?f.join(' | '):'kein Fehler gemeldet')));document.body.appendChild(d);},6000);})();`;

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DIAGNOSE }} />
      {children}
    </>
  );
}
