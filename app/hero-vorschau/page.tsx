import type { Metadata } from 'next';
import { HomeContent } from '@/components/mdu/home-content';
import { DesignToggle } from '@/components/mdu/design-toggle';

// ============================================================
// DESIGN-VORSCHAU (nicht verlinkt, noindex)
// ============================================================
// Zeigt die GANZE Startseite mit der alternativen Full-bleed-Hero-Variante,
// durchgängig im New Design (dunkel) — damit nichts mit dem Old-School-Hell-
// Theme vermischt wird. Die echte Startseite (app/page.tsx) bleibt unberührt;
// beide teilen sich <HomeContent>, nur die Hero-Variante unterscheidet sich.
// Wenn die Variante gefällt, wird sie in app/page.tsx übernommen und diese
// Datei kann weg.
// ============================================================

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Design-Vorschau · Hero',
  robots: { index: false, follow: false },
};

export default function HeroVorschauPage() {
  return (
    <>
      {/* Vor dem Paint auf Old School (hell) stellen — Standard der Vorschau;
          per Umschalter unten links auf New Design (dunkel) wechselbar. */}
      <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme='light';}catch(e){}` }} />
      <DesignToggle initial="light" />
      <HomeContent hero="fullbleed" />
    </>
  );
}
