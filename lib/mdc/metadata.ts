// ============================================================
// MDC — Seitenangaben für Browser UND geteilte Links
// ============================================================
//
// WARUM ES DAS GIBT: In Next erbt eine Unterseite `openGraph` und `twitter`
// als GANZEN BLOCK vom Layout. Wer nur `title` setzt, ändert damit den Reiter
// im Browser — der geteilte Link behält den Titel des Layouts. Genau das war
// bis September 2026 der Fall: Jeder Verweis, der in die Facebook-Gruppe oder
// per WhatsApp ging, hieß „Munich Darts Challenge (MDC)", ganz gleich ob ein
// Spielerprofil, ein Turnierergebnis oder die Rangliste dahinterstand.
//
// Für die MDC ist das teuer: Geteilte Links SIND der Verteilweg. Deshalb setzt
// `mdcSeite()` beides zusammen — und zwar so, dass die Bestandteile, die im
// Layout stehen und stimmen (Vorschaubild, Sprache, Seitenname), erhalten
// bleiben. Dass sie hier wiederholt werden, ist kein Versehen: Sie gingen
// sonst verloren, sobald eine Seite ihren eigenen `openGraph`-Block bekommt.
//
// Der Titel wird für den Reiter vom Layout ergänzt (`%s · Munich Darts
// Challenge`); für den geteilten Link muss das hier von Hand passieren, weil
// die Vorlage auf `openGraph.title` NICHT wirkt.
// ============================================================

import type { Metadata } from 'next';
import { MDC_ORIGIN, MDC_STANDALONE } from './site';

const ANHANG = ' · Munich Darts Challenge';

export interface SeitenAngaben {
  /** Kurzer Titel der Seite — ohne „· Munich Darts Challenge". */
  title: string;
  description: string;
  /**
   * Von Suchmaschinen fernhalten. Gebraucht für Profile von Leuten, die noch
   * kein Turnier gespielt haben: Dort steht nur ein Name, und dafür trägt die
   * Veröffentlichung keine Begründung.
   */
  noindex?: boolean;
}

export function mdcSeite({ title, description, noindex }: SeitenAngaben): Metadata {
  const voll = title.endsWith(ANHANG) ? title : title + ANHANG;
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      siteName: 'Munich Darts Challenge',
      ...(MDC_STANDALONE ? { url: MDC_ORIGIN } : {}),
      title: voll,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: voll,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
