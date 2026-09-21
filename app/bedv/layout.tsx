// ============================================================
// BeDV-Demo — Rahmen der Anwendung
// ============================================================
//
// Eigenständiges Projekt neben MDU und MDC im selben Next-Rahmen: eigene
// Navigation, eigenes Erscheinungsbild, eigene Datenschicht (`data/bedv/`).
// Gemeinsam ist nur der Build.
//
// NIEMALS INDEXIERT. Die Demo trägt Verbandsnamen und Verbandsstruktur, ist
// aber nicht vom BeDV beauftragt — eine auffindbare zweite „BeDV-Seite" im
// Suchindex darf gar nicht erst entstehen (siehe `lib/bedv/site.ts`).
// ============================================================

import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './bedv.css';
import { SiteHeader } from '@/components/bedv/layout/site-header';
import { SiteFooter } from '@/components/bedv/layout/site-footer';
import { BottomNav } from '@/components/bedv/layout/bottom-nav';
import { DemoAuthProvider } from '@/components/bedv/layout/demo-auth';
import { BEDV_DISCLAIMER, BEDV_INDEXABLE, BEDV_NAME_LANG } from '@/lib/bedv/site';

// Bewusst andere Schriften als MDU (Saira Condensed / Manrope) und MDC:
// Outfit ist geometrisch und modern für Überschriften und Zahlen, Inter
// trägt die Tabellen — es hat als eine der wenigen Textschriften wirklich
// gleich breite Ziffern, und daran hängt jede Tabelle dieser Seite.
const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${BEDV_NAME_LANG} — Design- und Funktionsdemo`,
    template: '%s · BeDV-Demo',
  },
  description: BEDV_DISCLAIMER,
  robots: BEDV_INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

/**
 * Einmal am Tag neu bauen.
 *
 * Die Demo-Daten sind statisch, ABER der Spielplan hängt am heutigen Tag
 * (siehe `data/bedv/saison.ts`): „Nächste Spiele" und „Letzte Ergebnisse"
 * würden sonst im Build einfrieren und binnen Wochen falsch stehen.
 *
 * Ein Tag und nicht weniger: Der Wert gilt für ALLE Seiten darunter, und
 * das sind über 600 (516 Spielerprofile, 86 Mannschaften). Vercel zählt
 * jedes Neurendern als ISR-Schreibvorgang; bei 30 Minuten wären das im
 * schlimmsten Fall über 28.000 am Tag. Seiten, die wirklich am Datum
 * hängen, setzen sich selbst einen kürzeren Wert — von zwei Werten gilt in
 * Next der kleinere.
 */
export const revalidate = 86400;

export default function BedvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`bedv-root ${outfit.variable} ${inter.variable}`}>
      <DemoAuthProvider>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <BottomNav />
      </DemoAuthProvider>
    </div>
  );
}
