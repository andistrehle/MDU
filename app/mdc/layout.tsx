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
import { iconSrc, logoSrc, throwerSrc } from '@/lib/mdc/brand';
import { mdcPath, MDC_INDEXABLE, MDC_ORIGIN, MDC_STANDALONE } from '@/lib/mdc/site';

// Liegt ein quadratisches Zeichen unter `public/mdc/`, wird es zum Tab-Symbol.
// Ohne Datei bleibt das der MDU (`app/icon.png`) — siehe `iconSrc`.
const MDC_ICON = iconSrc();

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
  // MUSS hier stehen, auch wenn Titel und Beschreibung schon oben stehen:
  // `openGraph` wird als Ganzes vom Wurzel-Layout geerbt, wenn eine Unterseite
  // keinen eigenen Block hat. Ohne diesen Abschnitt bot WhatsApp die
  // MDC-Adresse als „Münchner Dart Union (MDU) – Dart-Liga München" an, samt
  // MDU-Dartscheibe als Bild. Das Vorschaubild liefert
  // `opengraph-image.png` in diesem Ordner.
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Munich Darts Challenge',
    ...(MDC_STANDALONE ? { url: MDC_ORIGIN } : {}),
    title: 'Munich Darts Challenge (MDC) — Münchens Ranking-Serie für Einzelspieler',
    description:
      'Ranglisten, Turnierergebnisse, Spieler und Spielorte der Munich Darts Challenge — ' +
      'Münchens Ranking-Serie für Einzelspieler.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Munich Darts Challenge (MDC)',
    description: 'Münchens Ranking-Serie für Einzelspieler.',
  },
  // Mit Größe und Typ, nicht nur mit Pfad: Aus dem Wurzelverzeichnis kommt
  // zusätzlich `favicon.ico` der MDU (48 × 48) — das lässt sich für einen
  // Unterordner nicht abschalten. Browser wählen unter mehreren Symbolen das
  // am besten passende, und ein ausgewiesenes 512er PNG sticht ein 48er ICO.
  ...(MDC_ICON
    ? {
      icons: {
        icon: [{ url: MDC_ICON.src, sizes: '512x512', type: 'image/png' }],
        shortcut: [{ url: MDC_ICON.src, sizes: '512x512', type: 'image/png' }],
        apple: [{ url: MDC_ICON.src, sizes: '512x512', type: 'image/png' }],
      },
    }
    : {}),
  robots: MDC_INDEXABLE
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

/**
 * Die MDC-Seiten sind statisch — ohne diese Zeile würde „heute" beim Bauen
 * eingefroren und der Wochenplan zeigte für immer den Tag des letzten
 * Deployments.
 *
 * EINMAL AM TAG, nicht mehr halbstündlich. Der Wert gilt für ALLE Seiten
 * darunter, und das sind über 1.300: jedes Spielerprofil, jedes Turnier der
 * beiden Saisons. Bei 30 Minuten kann jede einzelne davon 48-mal am Tag neu
 * gerendert werden — Vercel zählt jedes Rendern als „ISR Write", und im
 * September 2026 war das Freikontingent von 200.000 Schreibvorgängen dadurch
 * binnen Tagen aufgebraucht (danach pausiert Vercel die Projekte).
 *
 * Die wenigen Seiten, die wirklich am Tagesdatum hängen, setzen sich selbst
 * einen kürzeren Wert: Startseite und `/turniere` (Wochenplan) sowie die
 * Spielort-Seiten (nächste Termine). Von zwei Werten gilt in Next der
 * kleinere, also gewinnt dort der der Seite.
 *
 * Ein Spielerprofil braucht das nicht: Dort steht kein Datum, das von selbst
 * altert. Einzig der Knopf „Nächstes Ranking" in der Kopfzeile kann dort
 * einen Tag hinterherhinken — beim ersten Aufruf des Tages steht er wieder
 * richtig.
 */
export const revalidate = 86400;

export default function MdcLayout({ children }: { children: React.ReactNode }) {
  // Der nächste Spieltag ergibt sich aus den Spielorten (fester Wochentag je
  // Lokal), nicht aus einer Terminliste — damit stimmt der Knopf immer mit
  // dem Wochenplan auf der Startseite überein.
  const heute = todayInMunich();
  const next = nextPlayDay(heute);
  // Wird heute gespielt, ist „Heute" die klarere Angabe als das Datum.
  // Abgesagte Termine zählen hier nicht mit — der Knopf soll sagen, wo
  // wirklich gespielt wird.
  const offen = next?.eintraege.filter(e => !e.abgesagt) ?? [];
  const nextLabel = next
    ? `${next.date === heute ? 'Heute' : formatDateShort(next.date)} · ${
        offen.length === 1 ? offen[0].venue.name : `${offen.length} Lokale`
      }`
    : 'Spielorte ansehen';
  // Der Knopf führt zu den Turnieren DIESES Tages, nicht in eine allgemeine
  // Übersicht: Wer draufdrückt, will wissen, wo an dem Abend gespielt wird.
  // Die Sprungmarke setzt `app/mdc/turniere/page.tsx` je Tag.
  const nextHref = next
    ? `${mdcPath('/turniere')}#tag-${next.date}`
    : mdcPath('/turniere');

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
