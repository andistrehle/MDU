// ============================================================
// Munich Darts Challenge — Rahmen der Demo-Anwendung
// ============================================================
//
// Eigenständiges Projekt neben der MDU: eigene Navigation, eigenes
// Erscheinungsbild, eigene Datenschicht (`/data`). Gemeinsam ist nur der
// Next.js-Rahmen — und ein Link in der jeweiligen Fußzeile.
//
// Indexiert wird nur auf der eigenen Domain (mdc-ranking.de) und nur, wenn die
// Pflichtangaben im Impressum stehen — siehe `lib/mdc/site.ts`. Unter
// mdudarts.de/mdc bleibt die Seite gesperrt: Dieselben Inhalte zweimal im
// Index wären für beide Adressen schlecht.
// ============================================================

import type { Metadata } from 'next';
import './mdc.css';
import { SiteHeader } from '@/components/mdc/site-header';
import { SiteFooter } from '@/components/mdc/site-footer';
import { VENUES, nextPlayDay } from '@/data/venues';
import { todayInMunich } from '@/data/season';
import { formatDateShort } from '@/lib/mdc/format';
import { logoSrc, throwerSrc } from '@/lib/mdc/brand';
import { mdcPath, MDC_INDEXABLE, MDC_ORIGIN, MDC_STANDALONE } from '@/lib/mdc/site';

export const metadata: Metadata = {
  // Auf der eigenen Domain lösen relative Angaben (z. B. Vorschaubilder)
  // gegen mdc-ranking.de auf. Bewusst OHNE `alternates.canonical`: Ein im
  // Layout gesetzter Wert gälte für jede Unterseite und würde alle Seiten als
  // Kopie der Startseite ausweisen. Doppelte Adressen gibt es ohnehin nicht —
  // `/mdc/...` leitet auf die kurze Form um.
  ...(MDC_STANDALONE ? { metadataBase: new URL(MDC_ORIGIN) } : {}),
  title: {
    default: 'Munich Darts Challenge (MDC) — Münchens Ranking-Serie für Einzelspieler',
    template: '%s · Munich Darts Challenge',
  },
  description:
    'Die Munich Darts Challenge ist Münchens Ranking-Serie für Einzelspieler: ' +
    `Turniere im Doppel-K.-o. in ${VENUES.length} Münchner Lokalen, Punkte für die Saisonrangliste.`,
  robots: MDC_INDEXABLE
    ? { index: true, follow: true }
    : { index: false, follow: false },
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
    ? mdcPath(`/spielorte/${next.venues[0].id}`)
    : mdcPath('/spielorte');

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
