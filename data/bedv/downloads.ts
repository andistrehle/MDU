// ============================================================
// BeDV-Demo — Download-Bereich
// ============================================================
//
// Die Einträge sind Demo-Angaben; es liegen KEINE Dateien dahinter. Statt
// eines Verweises ins Leere („Coming Soon" oder 404) klappt jede Karte eine
// Erläuterung auf: was in der echten Plattform an dieser Stelle läge.
//
// Das ist bewusst so gelöst — ein toter Download-Knopf mitten in einer
// Verkaufsdemo wäre schlimmer als gar keiner.
// ============================================================

import { heute, plusTage } from '@/lib/bedv/format';
import type { Download } from './typen';

interface Roh extends Omit<Download, 'stand' | 'demo'> {
  vorTagen: number;
}

const ROH: Roh[] = [
  {
    slug: 'spielbericht-formular', vorTagen: 40,
    titel: 'Spielbericht (Papierformular)',
    beschreibung: 'Der klassische Bogen für eine Begegnung über 18 Spiele, mit Feldern für Highlights. Zum Ausdrucken auf einer Seite.',
    kategorie: 'Spielbetrieb', dateityp: 'PDF', groesseKb: 184,
  },
  {
    slug: 'mannschaftsmeldung', vorTagen: 40,
    titel: 'Mannschaftsmeldung',
    beschreibung: 'Meldebogen für eine neue oder bestehende Mannschaft: Spielstätte, Spieltag, Kader, Mannschaftsführer.',
    kategorie: 'Meldung', dateityp: 'PDF', groesseKb: 142,
  },
  {
    slug: 'spielernachmeldung', vorTagen: 33,
    titel: 'Spielernachmeldung',
    beschreibung: 'Für Zugänge im laufenden Spieljahr. Die Spielberechtigung beginnt mit der Freigabe durch die Ligaleitung.',
    kategorie: 'Meldung', dateityp: 'PDF', groesseKb: 96,
  },
  {
    slug: 'spielordnung', vorTagen: 220,
    titel: 'Spielordnung',
    beschreibung: 'Spielmodus, Automateneinstellungen, Spielberechtigung, Protestverfahren, Wertung und Strafen.',
    kategorie: 'Regelwerk', dateityp: 'PDF', groesseKb: 612,
  },
  {
    slug: 'checkliste-automat', vorTagen: 33,
    titel: 'Checkliste Automateneinstellung',
    beschreibung: 'Höhe, Abstand, Modus — die drei Werte, die vor jedem Heimspiel geprüft werden. Eine Seite.',
    kategorie: 'Spielbetrieb', dateityp: 'PDF', groesseKb: 78,
  },
  {
    slug: 'gebuehrenordnung', vorTagen: 220,
    titel: 'Gebührenordnung',
    beschreibung: 'Meldegebühren, Nachmeldungen, Ordnungsgelder bei Nichtantritt und Fristen für die Zahlung.',
    kategorie: 'Verband', dateityp: 'PDF', groesseKb: 204,
  },
  {
    slug: 'satzung', vorTagen: 400,
    titel: 'Satzung',
    beschreibung: 'Zweck, Mitgliedschaft, Organe, Verbandstag und Kassenprüfung in der zuletzt beschlossenen Fassung.',
    kategorie: 'Verband', dateityp: 'PDF', groesseKb: 288,
  },
  {
    slug: 'kaderliste-vorlage', vorTagen: 40,
    titel: 'Kaderliste (Vorlage)',
    beschreibung: 'Tabelle zum Ausfüllen für die Saisonmeldung — Name, Passnummer, Wertungsklasse, Mannschaftsführer.',
    kategorie: 'Meldung', dateityp: 'XLSX', groesseKb: 46,
  },
];

export const DOWNLOADS: Download[] = ROH.map(({ vorTagen, ...rest }) => ({
  ...rest,
  stand: plusTage(heute(), -vorTagen),
  demo: true as const,
}));

export const DOWNLOAD_KATEGORIEN: Download['kategorie'][] =
  ['Spielbetrieb', 'Meldung', 'Regelwerk', 'Verband'];
