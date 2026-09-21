// ============================================================
// BeDV-Demo — Beiträge
// ============================================================
//
// ALLE Beiträge sind für diese Demo geschrieben. Es wurde KEIN Text von
// edart-bayern.de übernommen — die Seite war beim Bauen nicht erreichbar
// (Netzsperre der Session). Die Themen sind so gewählt, wie sie im
// Jahreslauf eines Ligaverbands anfallen: Spielplan, Pokalauslosung,
// Staffeleinteilung, Verbandstag, Regeländerungen.
//
// Das Datum steht nicht fest, sondern wird aus `vorTagen` gerechnet. Sonst
// stünde bei der Vorführung ein halbes Jahr alter „aktueller Hinweis" ganz
// oben — der erste Eindruck wäre eine veraltete Seite.
// ============================================================

import { heute, plusTage } from '@/lib/bedv/format';
import type { NewsBeitrag } from './typen';

interface Roh extends Omit<NewsBeitrag, 'datum' | 'demo'> {
  vorTagen: number;
}

const ROH: Roh[] = [
  {
    slug: 'spielbericht-wird-digital',
    vorTagen: 2,
    titel: 'Der Spielbericht wird digital',
    kategorie: 'Digitales',
    bildFarben: ['#1E5FBF', '#0B2E63'],
    teaser:
      'Ab der Rückrunde können Mannschaftsführer den Spielbericht direkt am Handy erfassen — '
      + 'mit automatischer Summenbildung und Freigabe durch beide Mannschaften.',
    absaetze: [
      'Der Papierbogen hat uns über Jahrzehnte gute Dienste geleistet. Er hat aber auch drei '
      + 'Nachteile, die jeder kennt: Er geht verloren, er ist schwer zu lesen, und bis die '
      + 'Ergebnisse in der Tabelle stehen, vergeht eine Woche.',
      'Ab der Rückrunde gibt es deshalb den **digitalen Spielbericht**. Der Mannschaftsführer '
      + 'trägt die Paarungen und Legs direkt am Telefon ein, der Gesamtstand rechnet sich von '
      + 'selbst mit, und beide Mannschaften bestätigen am Ende mit einem Klick.',
      'Wer lieber auf Papier schreibt, kann das weiter tun: Der ausgefüllte Bogen lässt sich '
      + 'abfotografieren und hochladen. Die Ligaleitung prüft die erkannten Werte, bevor sie '
      + 'in die Wertung gehen — übernommen wird nie ungeprüft.',
      'Eine Schulung für Mannschaftsführer findet vor dem Rückrundenstart statt. Die Termine '
      + 'stehen unter „Termine".',
    ],
  },
  {
    slug: 'pokal-halbfinale-ausgelost',
    vorTagen: 6,
    titel: 'Pokal: Halbfinale ausgelost',
    kategorie: 'Pokal',
    bildFarben: ['#C2410C', '#7C2D12'],
    teaser:
      'Vier Mannschaften sind noch im Verbandspokal. Die Hinspiele sind gespielt, '
      + 'die Rückspiele stehen in drei Wochen an.',
    absaetze: [
      'Der Verbandspokal ist in der entscheidenden Phase. Nach Achtel- und Viertelfinale '
      + 'stehen vier Mannschaften im Halbfinale — und wie so oft ist mindestens eine dabei, '
      + 'die man dort nicht erwartet hätte.',
      'Gespielt wird wie in den Vorrunden mit **Hin- und Rückspiel**. Gezählt werden beide '
      + 'Ergebnisse zusammen; steht es danach gleich, entscheidet ein Stechleg am Automaten '
      + 'der Heimmannschaft des Rückspiels.',
      'Das Finale findet an neutralem Ort statt. Ort und Termin stehen im Terminkalender.',
    ],
  },
  {
    slug: 'staffeleinteilung-rueckrunde',
    vorTagen: 11,
    titel: 'Staffeleinteilung und Nachmeldungen',
    kategorie: 'Ligabetrieb',
    bildFarben: ['#047857', '#064E3B'],
    teaser:
      'Zwei Mannschaften haben für die Rückrunde nachgemeldet. Die Spielpläne der '
      + 'betroffenen Staffeln wurden angepasst.',
    absaetze: [
      'Nachmeldungen sind im laufenden Spielbetrieb die Ausnahme, aber sie kommen vor — '
      + 'etwa wenn eine Mannschaft die Spielstätte wechselt oder sich zwei Teams '
      + 'zusammenschließen.',
      'Für die betroffenen Staffeln wurden die **Spielpläne neu erzeugt**. Bereits gespielte '
      + 'Begegnungen bleiben gewertet, die Termine der Rückrunde verschieben sich um bis zu '
      + 'eine Woche. Alle Mannschaftsführer wurden benachrichtigt.',
      'Wer einen Spieler nachmelden möchte, macht das künftig direkt im eigenen Bereich. '
      + 'Die Ligaleitung prüft die Meldung und gibt sie frei — in der Regel innerhalb von '
      + 'zwei Werktagen.',
    ],
  },
  {
    slug: 'verbandstag-einladung',
    vorTagen: 18,
    titel: 'Einladung zum Verbandstag',
    kategorie: 'Verband',
    bildFarben: ['#4338CA', '#312E81'],
    teaser:
      'Der ordentliche Verbandstag findet im Frühjahr statt. Anträge können bis vier Wochen '
      + 'vorher eingereicht werden.',
    absaetze: [
      'Alle Mitgliedsvereine sind herzlich eingeladen. Auf der Tagesordnung stehen der '
      + 'Bericht des Vorstands, der Kassenbericht, die Entlastung sowie Anträge zur '
      + 'Spielordnung.',
      'Anträge sind schriftlich einzureichen. Jeder Mitgliedsverein hat **eine Stimme**; '
      + 'Stimmübertragungen sind mit schriftlicher Vollmacht möglich.',
      'Die vollständige Tagesordnung und die Unterlagen liegen rechtzeitig im Download-Bereich.',
    ],
  },
  {
    slug: 'rekord-171-in-der-c2',
    vorTagen: 24,
    titel: 'Fünf 171er an einem Abend',
    kategorie: 'Ligabetrieb',
    bildFarben: ['#A16207', '#713F12'],
    teaser:
      'Eine Begegnung in der C2-Liga sorgte für die auffälligste Highlight-Bilanz des '
      + 'bisherigen Spieljahres.',
    absaetze: [
      'Fünf 171er in einer einzigen Begegnung sind selten — in einer C-Liga sind sie eine '
      + 'kleine Sensation. Beide Mannschaften kamen zusammen auf elf Maximum-Würfe.',
      'Die Highlight-Listen laufen über die ganze Spielzeit mit und sind auf jeder Ligaseite '
      + 'unter **„Highlights"** einsehbar: 180er und 171er, das höchste Finish und das '
      + 'kürzeste Leg.',
      'Gemeldet werden die Werte über den Spielbericht. Wer sie bisher nur handschriftlich '
      + 'notiert hat, bekommt sie mit der digitalen Erfassung automatisch in die Wertung.',
    ],
  },
  {
    slug: 'automaten-eichung-hinweis',
    vorTagen: 33,
    titel: 'Hinweis zur Automateneinstellung',
    kategorie: 'Ligabetrieb',
    bildFarben: ['#0E7490', '#164E63'],
    teaser:
      'Vor jedem Heimspiel prüft die Heimmannschaft Höhe, Abstand und Spielmodus. '
      + 'Eine kurze Checkliste fasst zusammen, worauf es ankommt.',
    absaetze: [
      'Unterschiedliche Einstellungen sind der häufigste Grund für Protestverfahren — und '
      + 'fast immer ist es keine Absicht, sondern ein Gerät, das nach einer Wartung anders '
      + 'zurückgestellt wurde.',
      'Maßgeblich sind: **Höhe Bulls-Eye 1,73 m**, **Abwurflinie 2,37 m**, Modus 501 '
      + 'Double-Out, drei Gewinnlegs. Die Heimmannschaft prüft das vor Spielbeginn, die '
      + 'Gastmannschaft kann jederzeit nachmessen.',
      'Die Checkliste liegt als PDF im Download-Bereich und passt auf eine Seite.',
    ],
  },
  {
    slug: 'sommerliga-abschluss',
    vorTagen: 47,
    titel: 'Sommerliga abgeschlossen',
    kategorie: 'Ligabetrieb',
    bildFarben: ['#15803D', '#14532D'],
    teaser:
      'Fünf Staffeln, 30 Mannschaften, ein kompletter Spielplan ohne Ausfall — die '
      + 'Sommerliga ist durch.',
    absaetze: [
      'Die Sommerliga ist das kleinere Format: kürzere Spielzeit, sechs Mannschaften je '
      + 'Staffel, kein Auf- und Abstieg. Genau deshalb ist sie für neue Mannschaften der '
      + 'beste Einstieg.',
      'Alle Tabellen, Spielpläne und Ranglisten bleiben im **Archiv** erreichbar. Wer in der '
      + 'Sommerliga gespielt hat, findet seine Ergebnisse weiterhin im eigenen Spielerprofil.',
      'Die Meldung für die nächste Sommerliga öffnet im Frühjahr.',
    ],
  },
  {
    slug: 'neue-spielstaetten',
    vorTagen: 58,
    titel: 'Drei neue Spielstätten im Verbandsgebiet',
    kategorie: 'Verband',
    bildFarben: ['#BE185D', '#831843'],
    teaser:
      'In Ober- und Niederbayern sind drei Lokale neu dazugekommen — mit insgesamt '
      + 'zehn Automaten.',
    absaetze: [
      'Spielstätten sind der Engpass im E-Dart: Ohne Automaten kein Heimspiel. Jede neue '
      + 'Adresse im Verbandsgebiet bedeutet kürzere Wege und Platz für neue Mannschaften.',
      'Wirte, die Interesse haben, können sich direkt beim Verband melden. Wichtig sind vor '
      + 'allem **Platz vor dem Automaten**, eine verlässliche Öffnungszeit am Spieltag und '
      + 'ein Gerät, das sich auf die Ligaeinstellungen bringen lässt.',
      'Alle Spielstätten mit Adresse und Automatenzahl stehen auf den jeweiligen '
      + 'Mannschaftsseiten.',
    ],
  },
];

export const NEWS: NewsBeitrag[] = ROH
  .map(({ vorTagen, ...rest }) => ({
    ...rest,
    datum: plusTage(heute(), -vorTagen),
    demo: true as const,
  }))
  .sort((a, b) => (a.datum < b.datum ? 1 : -1));

export function newsBySlug(slug: string): NewsBeitrag | undefined {
  return NEWS.find(n => n.slug === slug);
}

/** Die übrigen Beiträge — für „Weiterlesen" am Ende eines Beitrags. */
export function weitereNews(slug: string, anzahl = 3): NewsBeitrag[] {
  return NEWS.filter(n => n.slug !== slug).slice(0, anzahl);
}
