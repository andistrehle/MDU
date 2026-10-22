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
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: '/app/icon-192.png',
    badge: '/app/icon-192.png',
    tag: d.tag || undefined,
    data: { url: d.url || '/' },
    lang: 'de',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const ziel = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const f of fenster) {
      if (new URL(f.url).origin === self.location.origin && 'focus' in f) {
        await f.focus();
        if ('navigate' in f) await f.navigate(ziel).catch(() => {});
        return;
      }
    }
    await self.clients.openWindow(ziel);
  })());
});
