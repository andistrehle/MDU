// ============================================================
// Service Worker der MDU-Web-App (Migration 0056, lib/push.ts)
// ============================================================
// Nur Push: zeigt die Nachricht an und öffnet beim Antippen die passende
// Seite. Bewusst KEIN Offline-Zwischenspeicher — Tabellen und Spielberichte
// sollen nie aus einem alten Stand kommen.
// ============================================================

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data ? event.data.text() : '' }; }
  const title = d.title || 'Münchner Dart Union';
  // Zahl am App-Symbol (iPhone-Web-App ab iOS 16.4, Chrome/Edge am Computer).
  // Nur wenn der Server sie mitschickt — der Spieltagsbericht lässt sie stehen.
  const zahl = typeof d.anzahl === 'number' && 'setAppBadge' in self.navigator
    ? (d.anzahl > 0 ? self.navigator.setAppBadge(d.anzahl) : self.navigator.clearAppBadge()).catch(() => {})
    : Promise.resolve();
  event.waitUntil(Promise.all([zahl, self.registration.showNotification(title, {
    body: d.body || '',
    icon: '/app/icon-192.png',
    badge: '/app/icon-192.png',
    tag: d.tag || undefined,
    data: { url: d.url || '/' },
    lang: 'de',
  })]));
});

function seiteOeffnet(f, url) {
  return new Promise((fertig) => {
    const kanal = new MessageChannel();
    const t = setTimeout(() => fertig(false), 1000);
    kanal.port1.onmessage = () => { clearTimeout(t); fertig(true); };
    try { f.postMessage({ typ: 'mdu-oeffnen', url }, [kanal.port2]); } catch { clearTimeout(t); fertig(false); }
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const ziel = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const f of fenster) {
      if (new URL(f.url).origin === self.location.origin && 'focus' in f) {
        await f.focus().catch(() => {});
        // Zuerst die offene Seite selbst navigieren lassen (die Glocke hört zu und
        // öffnet auch /news#<id> auf derselben Seite). WindowClient.navigate kann das
        // nicht zuverlässig (iPhone), deshalb nur als Rückfall ohne Antwort.
        if (await seiteOeffnet(f, ziel)) return;
        if ('navigate' in f) { const ok = await f.navigate(ziel).then(() => true, () => false); if (ok) return; }
        break;
      }
    }
    await self.clients.openWindow(ziel);
  })());
});
