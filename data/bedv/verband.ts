// ============================================================
// BeDV-Demo — Angaben zum Verband
// ============================================================
//
// ACHTUNG: Die Kontaktdaten sind PLATZHALTER. Es stehen bewusst keine
// echten Adressen, Telefonnummern oder Namen von Verbandsverantwortlichen
// hier — die Demo ist nicht vom BeDV beauftragt, und erfundene Angaben unter
// echtem Verbandsnamen wären schlicht falsch.
//
// Was hier steht, ist der Rahmen: welche Angaben eine Verbandsseite braucht
// und wo sie stehen. Beim echten Auftrag werden die Felder befüllt.
// ============================================================

import { BEDV_NAME_KURZ, BEDV_NAME_LANG } from '@/lib/bedv/site';

export const VERBAND = {
  name: BEDV_NAME_LANG,
  kurz: BEDV_NAME_KURZ,
  gegruendet: 1983,
  zweck:
    'Der Bayerische Elektronik-Dart Verein organisiert den Ligaspielbetrieb im '
    + 'Elektronik-Dart in Bayern: Winter- und Sommerliga, Verbandspokal und die '
    + 'bayerischen Einzelmeisterschaften.',
  /** Zahlen dieser Demo — sie ergeben sich aus den Demo-Daten, nicht aus echten Meldungen. */
  kennzahlen: [
    { wert: '12', label: 'Staffeln' },
    { wert: '86', label: 'Mannschaften' },
    { wert: '516', label: 'Spielberechtigte' },
    { wert: '32', label: 'Spielstätten' },
  ],
  kontakt: {
    hinweis: 'Platzhalter — in der echten Plattform stehen hier die Angaben des Verbands.',
    email: 'kontakt@beispiel-verband.de',
    postanschrift: ['Geschäftsstelle (Platzhalter)', 'Musterstraße 1', '80331 München'],
  },
  /**
   * Ansprechpartner als FUNKTION, nicht als Person. Die Demo zeigt damit den
   * Aufbau der Seite, ohne Namen zu erfinden, die es beim BeDV wirklich gibt
   * oder eben gerade nicht gibt.
   */
  ansprechpartner: [
    { funktion: 'Vorsitz', aufgabe: 'Vertretung des Verbands, Verbandstag, Satzungsfragen' },
    { funktion: 'Spielleitung Winterliga', aufgabe: 'Staffeleinteilung, Spielpläne, Spielberichte, Proteste' },
    { funktion: 'Spielleitung Sommerliga', aufgabe: 'Meldungen und Spielbetrieb der Sommerstaffeln' },
    { funktion: 'Pokalleitung', aufgabe: 'Auslosung, Termine und Austragung des Verbandspokals' },
    { funktion: 'Kassenführung', aufgabe: 'Meldegebühren, Ordnungsgelder, Jahresabschluss' },
    { funktion: 'Schiedsstelle', aufgabe: 'Protestverfahren und Ordnungsmaßnahmen' },
  ],
} as const;

/** Die Eckdaten des Spielbetriebs — sie stehen auf mehreren Seiten. */
export const SPIELBETRIEB = [
  { label: 'Spielmodus', wert: '501 Double-Out' },
  { label: 'Spiele je Begegnung', wert: '18 (12 Einzel, 6 Doppel)' },
  { label: 'Gewinnlegs je Spiel', wert: '3' },
  { label: 'Wertung', wert: 'Sieg 2 Punkte · Unentschieden 1 · Niederlage 0' },
  { label: 'Höhe Bulls-Eye', wert: '1,73 m' },
  { label: 'Abwurflinie', wert: '2,37 m' },
] as const;
