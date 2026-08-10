// ============================================================
// Tennis Kail — Rahmen der Demo-Anwendung
// ============================================================
//
// Eigenständiges Projekt neben MDU und MDC: eigene Schriften, eigenes
// Designsystem (tk.css), eigene Datenschicht (data/tk), eigene Navigation.
// Gemeinsam ist nur der Next.js-Rahmen.
//
// Die Demo ist bewusst nicht indexierbar. Sie zeigt eine fremde Marke zur
// Abstimmung mit deren Betreiber — sie darf nicht als offizielle Seite von
// Tennis Kail in Suchmaschinen auftauchen.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Fraunces, Inter } from 'next/font/google';
import './tk.css';
import { SiteHeader } from '@/components/tk/chrome/site-header';
import { SiteFooter } from '@/components/tk/chrome/site-footer';
import { TabBar } from '@/components/tk/chrome/tabbar';
import { BRAND, COURTS } from '@/data/tk/facility';
import { TkStoreProvider } from '@/lib/tk/store';
import { today } from '@/lib/tk/format';
import { summariseStatus } from '@/lib/tk/weather';

// Beide Schriften als Variable Font: eine Datei je Familie statt einer je
// Schnitt. Auf dieser Route liegen ohnehin schon die drei MDU-Schriften des
// Wurzel-Layouts im Vorladen — jede weitere Datei kostet direkt LCP.
// Auf die Zusatzachsen von Fraunces (SOFT, WONK) ist deshalb verzichtet:
// Sie sind hübsch, aber im Layout nirgends nötig.
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Tennis Kail — Halle und Sandplätze in München',
    template: '%s · Tennis Kail',
  },
  description:
    'Demo einer Buchungsplattform für Tennis Kail: Plätze und Trainerstunden online buchen, ' +
    'Platzstatus nach Wetter, Camps, Events und ein Dashboard für den Betrieb.',
  robots: { index: false, follow: false },
};

/** Statusleiste in der Kopfzeile braucht den aktuellen Tag vom Server. */
export const revalidate = 900;

export default function TkLayout({ children }: { children: React.ReactNode }) {
  const todayIso = today();
  const outdoor = COURTS.filter((c) => c.kind === 'freiplatz');
  const status = summariseStatus(outdoor, todayIso);

  return (
    <div className={`tk-root ${fraunces.variable} ${inter.variable}`}>
      <a href="#tk-main" className="tk-skip">
        Zum Inhalt springen
      </a>

      {/* Kein Zweifel daran, was das hier ist. */}
      <div className="tk-demo-bar">
        <div className="tk-shell">
          Demo-Entwurf für {BRAND.name} — Buchungen sind nicht echt.{' '}
          <Link href="/tk/datenherkunft">Was ist echt, was ist Demo?</Link>
        </div>
      </div>

      <TkStoreProvider>
        <SiteHeader statusLabel={status.headline} />
        <main id="tk-main">{children}</main>
        <SiteFooter />
        <TabBar />
      </TkStoreProvider>
    </div>
  );
}
