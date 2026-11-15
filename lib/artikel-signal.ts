// ============================================================
// Signal „News-Artikel offen / zu Ende gelesen / geschlossen“
// ============================================================
// Die Website-Umfrage soll einen offenen Bericht nicht mitten im Lesen überdecken (Betreiber 15.11.2026):
// kommt jemand per Link direkt in einen Bericht, fragt das Popup VORHER („Erst den Bericht lesen“ möglich)
// und danach am ENDE des Berichts noch einmal. Die Artikel-Karte meldet dafür ihren Zustand über ein
// Fenster-Ereignis; ohne Zuhörer passiert nichts.
// ============================================================

export type ArtikelSignal = 'auf' | 'ende' | 'zu';
const NAME = 'mdu-artikel';

type Fenster = Window & { __mduArtikelOffen?: boolean };

export function meldeArtikel(art: ArtikelSignal) {
  if (typeof window === 'undefined') return;
  if (art === 'auf') (window as Fenster).__mduArtikelOffen = true;
  if (art === 'zu') (window as Fenster).__mduArtikelOffen = false;
  window.dispatchEvent(new CustomEvent<ArtikelSignal>(NAME, { detail: art }));
}

export const artikelOffen = () => typeof window !== 'undefined' && !!(window as Fenster).__mduArtikelOffen;

export function beiArtikel(fn: (art: ArtikelSignal) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<ArtikelSignal>).detail);
  window.addEventListener(NAME, h);
  return () => window.removeEventListener(NAME, h);
}
