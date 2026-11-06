// Ziel einer Glocke/eines Pushs öffnen (Betreiber, 06.11.2026: „komme nicht zum Beitrag“).
// router.push('/news#id') auf /news ändert nur den Hash per pushState — dabei feuert
// kein `hashchange`, die News-Karte bekommt es nicht mit. Auf derselben Seite setzen wir
// den Hash deshalb selbst (bzw. melden ihn erneut, wenn er schon dasteht).
type Router = { push: (href: string) => void };

export function oeffneZiel(url: string, router: Router) {
  const z = new URL(url, window.location.href);
  if (z.origin !== window.location.origin) { window.location.href = z.href; return; }
  if (z.pathname === window.location.pathname && z.search === window.location.search && z.hash) {
    if (window.location.hash === z.hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else window.location.hash = z.hash;
    return;
  }
  router.push(z.pathname + z.search + z.hash);
}
