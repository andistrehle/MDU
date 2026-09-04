// ============================================================
// Munich Darts Challenge — Rahmen der Demo-Anwendung
// ============================================================
//
// Eigenständiges Projekt neben der MDU: eigene Navigation, eigenes
// Erscheinungsbild, eigene Datenschicht (`/data`). Gemeinsam ist nur der
// Next.js-Rahmen — und ein Link in der jeweiligen Fußzeile.
//
// Die Demo ist bewusst nicht indexierbar: Sie zeigt echte Namen aus der
// MDC-Auswertung und ist zur Abstimmung mit dem Betreiber gedacht, nicht als
// öffentliche Seite.
// ============================================================

import type { Metadata } from 'next';
import './mdc.css';
import { SiteHeader } from '@/components/mdc/site-header';
import { SiteFooter } from '@/components/mdc/site-footer';
import { VENUES, nextPlayDay } from '@/data/venues';
import { todayInMunich } from '@/data/season';
import { formatDateShort } from '@/lib/mdc/format';
import { logoSrc, throwerSrc } from '@/lib/mdc/brand';

export const metadata: Metadata = {
  title: {
    default: 'Munich Darts Challenge (MDC) — Münchens Ranking-Serie für Einzelspieler',
    template: '%s · Munich Darts Challenge',
  },
  description:
    'Die Munich Darts Challenge ist Münchens Ranking-Serie für Einzelspieler: ' +
    `Turniere im Doppel-K.-o. in ${VENUES.length} Münchner Lokalen, Punkte für die Saisonrangliste.`,
  robots: { index: false, follow: false },
};

/**
 * Die MDC-Seiten sind statisch — ohne diese Zeile würde „heute" beim Bauen
 * eingefroren und der Wochenplan zeigte für immer den Tag des letzten
 * Deployments. Halbstündlich neu rendern reicht: Der Plan ändert sich nur
 * zum Tageswechsel.
 */
export const revalidate = 1800;

export default function MdcLayout({ children }: { children: React.ReactNode }) {
  // Der nächste Spieltag ergibt sich aus den Spielorten (fester Wochentag je
  // Lokal), nicht aus einer Terminliste — damit stimmt der Knopf immer mit
  // dem Wochenplan auf der Startseite überein.
  const heute = todayInMunich();
  const next = nextPlayDay(heute);
  // Wird heute gespielt, ist „Heute" die klarere Angabe als das Datum.
  const nextLabel = next
    ? `${next.date === heute ? 'Heute' : formatDateShort(next.date)} · ${
        next.venues.length === 1 ? next.venues[0].name : `${next.venues.length} Lokale`
      }`
    : 'Spielorte ansehen';
  const nextHref = next && next.venues.length === 1
    ? `/mdc/spielorte/${next.venues[0].id}`
    : '/mdc/spielorte';

  return (
    <div className="mdc-root">
      <SiteHeader
        nextRankingLabel={nextLabel}
        nextRankingHref={nextHref}
        logo={logoSrc()}
        thrower={throwerSrc()}
      />
      <main>{children}</main>
      <SiteFooter logo={logoSrc()} />
    </div>
  );
}
