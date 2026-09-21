// ============================================================
// BeDV-Demo — Vorgänge der Ligaleitung
// ============================================================
//
// Was in der echten Plattform aus Meldungen und Spielberichten entstünde:
// eine Arbeitsliste. In der Demo fest hinterlegt, damit im Gespräch immer
// etwas zu prüfen da ist — die Knöpfe „Freigeben", „Nachbesserung" und
// „Ablehnen" wirken nur im Browser und schreiben nichts.
//
// Die Namen sind wie überall in dieser Demo erfunden. Sie sind bewusst
// KEINE Platzhalter der Form „Demo-Spieler 1": Eine Arbeitsliste, die
// erkennbar unfertig aussieht, verkauft nichts — und erfunden sind beide
// Varianten gleichermaßen.
// ============================================================

import type { Wertungsklasse } from './typen';

export interface OffeneMeldung {
  id: string;
  mannschaft: string;
  art: 'Neumeldung' | 'Nachmeldung Spieler' | 'Spielstättenwechsel';
  ligaWunsch: string;
  spielstaette: string;
  spieltag: string;
  beginn: string;
  eingereichtVon: string;
  vorTagen: number;
  kader: { name: string; passnummer: string; wertung: Wertungsklasse; neu: boolean }[];
  /** Was der Prüfung auffällt — der Grund, warum ein Mensch draufschaut. */
  hinweise: string[];
}

export const OFFENE_MELDUNGEN: OffeneMeldung[] = [
  {
    id: 'm-2041',
    mannschaft: 'Lechfeld Lowriders',
    art: 'Neumeldung',
    ligaWunsch: 'C3-Liga',
    spielstaette: 'Sportsbar Triple 20, Augsburg',
    spieltag: 'Mittwoch',
    beginn: '20:00',
    eingereichtVon: 'Mannschaftsführer der meldenden Mannschaft',
    vorTagen: 1,
    kader: [
      { name: 'Korbinian Ammer', passnummer: '—', wertung: 'herren', neu: true },
      { name: 'Tobias Penzkofer', passnummer: '—', wertung: 'herren', neu: true },
      { name: 'Verena Stadlbauer', passnummer: '—', wertung: 'damen', neu: true },
      { name: 'Roland Hillmeier', passnummer: '11842', wertung: 'herren', neu: false },
      { name: 'Sven Trautner', passnummer: '11903', wertung: 'herren', neu: false },
      { name: 'Quirin Daxer', passnummer: '—', wertung: 'herren', neu: true },
    ],
    hinweise: [
      'Vier Spieler ohne Passnummer — Pässe wären auszustellen.',
      'Die Spielstätte führt bereits zwei Mannschaften am Mittwoch. Automatenzahl prüfen.',
    ],
  },
  {
    id: 'm-2042',
    mannschaft: 'Amper Aces Dachau',
    art: 'Nachmeldung Spieler',
    ligaWunsch: 'B1-Liga',
    spielstaette: 'Bulls Dachau',
    spieltag: 'Donnerstag',
    beginn: '20:00',
    eingereichtVon: 'Mannschaftsführung Amper Aces',
    vorTagen: 2,
    kader: [
      { name: 'Dominik Unterreiner', passnummer: '—', wertung: 'herren', neu: true },
      { name: 'Magdalena Kistler', passnummer: '10774', wertung: 'damen', neu: false },
    ],
    hinweise: [
      'Ein Zugang war in der Vorsaison für eine andere Mannschaft gemeldet — Wechselfrist prüfen.',
    ],
  },
  {
    id: 'm-2043',
    mannschaft: 'Coburger Chaoten',
    art: 'Spielstättenwechsel',
    ligaWunsch: 'C3-Liga',
    spielstaette: 'Coburger Dart-Eck (neu)',
    spieltag: 'Dienstag',
    beginn: '19:30',
    eingereichtVon: 'Mannschaftsführung Coburger Chaoten',
    vorTagen: 4,
    kader: [],
    hinweise: [
      'Wechsel im laufenden Spieljahr: Die Gastmannschaften der Rückrunde sind zu informieren.',
      'Neue Spielstätte hat zwei Automaten — für eine Begegnung ausreichend.',
    ],
  },
];

export interface OffenerBericht {
  id: string;
  liga: string;
  begegnung: string;
  datum: string;
  ergebnis: string;
  weg: 'digital erfasst' | 'Foto hochgeladen';
  vorTagen: number;
  hinweise: string[];
}

export const OFFENE_BERICHTE: OffenerBericht[] = [
  {
    id: 'b-8821',
    liga: 'B1-Liga',
    begegnung: 'Ghost Darts – Abwurf Astronauten',
    datum: 'letzter Spieltag',
    ergebnis: '11 : 7',
    weg: 'digital erfasst',
    vorTagen: 1,
    hinweise: ['Von beiden Mannschaften bestätigt.', 'Drei Highlights gemeldet (zwei 180er, ein Finish 121).'],
  },
  {
    id: 'b-8822',
    liga: 'C2-Liga',
    begegnung: 'Bamberger Bierdeckel – Landshuter Leichtsinn',
    datum: 'letzter Spieltag',
    ergebnis: '8 : 10',
    weg: 'Foto hochgeladen',
    vorTagen: 2,
    hinweise: [
      'Aus dem Foto erkannt — zwei Zeilen sind unsicher und stehen zur Prüfung.',
      'Die Unterschrift der Gastmannschaft fehlt auf dem Bogen.',
    ],
  },
];

/** Die Zahlen, die im Dashboard der Ligaleitung ganz oben stehen. */
export const VERWALTUNG_KENNZAHLEN = [
  { label: 'Offene Mannschaftsmeldungen', wert: OFFENE_MELDUNGEN.length, ziel: '/ligaleitung#meldungen' },
  { label: 'Spielberichte zur Prüfung', wert: OFFENE_BERICHTE.length, ziel: '/ligaleitung#berichte' },
  { label: 'Spielberechtigungen offen', wert: 5, ziel: '/ligaleitung#spieler' },
  { label: 'Proteste', wert: 1, ziel: '/ligaleitung#meldungen' },
];
