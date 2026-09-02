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
import { nextTournament } from '@/data/tournaments';
import { getVenue } from '@/data/venues';
import { formatDateShort } from '@/lib/mdc/format';
import { logoSrc, throwerSrc } from '@/lib/mdc/brand';

export const metadata: Metadata = {
  title: {
    default: 'Munich Darts Challenge (MDC) — Münchens Ranking-Serie für Einzelspieler',
    template: '%s · Munich Darts Challenge',
  },
  description:
    'Die Munich Darts Challenge ist Münchens Ranking-Serie für Einzelspieler: ' +
    'Turniere im Doppel-K.-o. in zehn Münchner Lokalen, Punkte für die Saisonrangliste.',
  robots: { index: false, follow: false },
};

export default function MdcLayout({ children }: { children: React.ReactNode }) {
  const next = nextTournament();
  const venue = next ? getVenue(next.venueId) : undefined;
  const nextLabel = next && venue
    ? `${formatDateShort(next.date)} · ${venue.name}`
    : 'Termine ansehen';

  return (
    <div className="mdc-root">
      <SiteHeader
        nextRankingLabel={nextLabel}
        nextRankingHref={next ? `/mdc/turniere/${next.id}` : '/mdc/turniere'}
        logo={logoSrc()}
        thrower={throwerSrc()}
      />
      <main>{children}</main>
      <SiteFooter logo={logoSrc()} />
    </div>
  );
}
