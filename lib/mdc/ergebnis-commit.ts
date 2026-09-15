// ============================================================
// MDC — freigegebenes Ergebnis ins Repository schreiben
// ============================================================
//
// Ein freigegebenes Turnier wird nicht in eine Datenbank geschrieben, sondern
// als Zeile in `data/results-uploaded.ts` — und, falls jemand Neues dabei war,
// zusätzlich in `data/players-uploaded.ts`. Beides in EINEM Commit über die
// Git-Data-API von GitHub. Der Push stößt den Neubau bei Vercel an; zwei
// Minuten später steht das Turnier online.
//
// Warum ein einziger Commit und nicht zwei Aufrufe der bequemeren Contents-API:
// Zwei Commits wären zwei Neubauten — und dazwischen läge ein Stand, in dem das
// Ergebnis auf einen Spieler zeigt, den es noch nicht gibt.
//
// Gelesen wird immer der Stand aus GitHub, nie der einkompilierte: Das
// laufende Deployment kann älter sein als `main`, und aus einem alten Stand
// heraus geschrieben würde jede Zeile verlieren, die seither dazukam.
// ============================================================


import 'server-only';
import { CommitFehler, committe, kontext, leseDatei } from './github';
/**
 * Ersetzt den Inhalt eines `string[]`-Literals in einer TypeScript-Datei.
 *
 * Bewusst schlicht: Die beiden Zieldateien enthalten je genau ein solches
 * Literal mit nichts als einfachen Zeichenketten darin. Ein Parser wäre hier
 * mehr Angriffsfläche als Nutzen. Passt die Form nicht, wird abgebrochen statt
 * geraten — lieber gar nicht schreiben als eine Datei zerlegen.
 */
export function ersetzeListe(quelle: string, konstante: string, eintraege: string[]): string {
  const anfang = new RegExp(`(export const ${konstante}[^=]*=\\s*\\[)`);
  const treffer = quelle.match(anfang);
  if (!treffer || treffer.index === undefined) {
    throw new CommitFehler(`In der Datei fehlt die Liste ${konstante}.`);
  }
  const von = treffer.index + treffer[0].length;
  const bis = quelle.indexOf('];', von);
  if (bis === -1) throw new CommitFehler(`Die Liste ${konstante} ist nicht abgeschlossen.`);

  const rumpf = eintraege.length
    ? `\n${eintraege.map(e => `  '${e.replace(/'/g, "\\'")}',`).join('\n')}\n`
    : '';
  return quelle.slice(0, von) + rumpf + quelle.slice(bis);
}

/** Die Zeichenketten aus einem `string[]`-Literal. */
export function leseListe(quelle: string, konstante: string): string[] {
  const treffer = quelle.match(new RegExp(`export const ${konstante}[^=]*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!treffer) throw new CommitFehler(`In der Datei fehlt die Liste ${konstante}.`);
  return [...treffer[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
}

export interface NeuerSpieler {
  passNr: number;
  /** Nachname in Großbuchstaben, wie in der Auswertung. */
  lastName: string;
  /** Vorname, ggf. mit Spitzname in Klammern: „CHRISS (BONSAI)". */
  firstName: string;
  division: 'men' | 'women';
}

export interface Veroeffentlichung {
  /** Fertige Ergebniszeile: `Datum|Spielort|Passnr:Punkte,…` */
  zeile: string;
  /** Spieler, die es im Stamm noch nicht gibt. */
  neueSpieler: NeuerSpieler[];
  /** Für die Commit-Nachricht. */
  beschreibung: string;
}

const RESULTS_PFAD = 'data/results-uploaded.ts';
const PLAYERS_PFAD = 'data/players-uploaded.ts';

/**
 * Legt freigegebene Turniere ab — ALLE in EINEM Commit. Gibt die Adresse des
 * Commits zurück; damit ist nachprüfbar, was genau geschrieben wurde.
 *
 * WARUM EIN COMMIT FÜR DEN GANZEN STAPEL: An einem Abend kommen mehrere Zettel
 * zusammen (am 13.09.2026 waren es fünf). Je Turnier ein Commit hieße je
 * Turnier ein Neubau bei Vercel — fünf Wartezeiten, fünfmal ISR-Kontingent,
 * und dazwischen liegen Zwischenstände, in denen erst die Hälfte des Abends
 * online ist. Hier wird einmal gelesen, alles zusammengetragen, einmal
 * geschrieben.
 */
export async function veroeffentlicheTurniere(
  eingaben: Veroeffentlichung[],
): Promise<{ sha: string; url: string; ersetzt: string[] }> {
  if (!eingaben.length) throw new CommitFehler('Es gibt nichts abzulegen.');
  const ctx = kontext();

  const resultsQuelle = await leseDatei(ctx, RESULTS_PFAD);
  let liste = leseListe(resultsQuelle, 'RESULTS_UPLOADED_RAW');
  const ersetzt: string[] = [];

  for (const eingabe of eingaben) {
    const [datum, spielort] = eingabe.zeile.split('|');
    const kennung = `${datum}-${spielort}`;
    // Dasselbe Turnier zweimal wäre die Punkte doppelt: Die alte Zeile wird
    // ersetzt, nicht ergänzt. Das ist zugleich der Weg, ein Ergebnis zu
    // berichtigen — einfach noch einmal freigeben.
    const ohneAlte = liste.filter(
      z => !z.startsWith(`${kennung}|`) && !z.startsWith(`${datum}|${spielort}|`),
    );
    if (ohneAlte.length !== liste.length) ersetzt.push(eingabe.beschreibung);
    liste = [...ohneAlte, eingabe.zeile];
  }

  const dateien = [{
    pfad: RESULTS_PFAD,
    inhalt: ersetzeListe(resultsQuelle, 'RESULTS_UPLOADED_RAW', [...liste].sort()),
  }];

  const alleNeuen = eingaben.flatMap(e => e.neueSpieler);
  if (alleNeuen.length) {
    const playersQuelle = await leseDatei(ctx, PLAYERS_PFAD);
    let inhalt = playersQuelle;
    for (const division of ['men', 'women'] as const) {
      const dazu = alleNeuen.filter(s => s.division === division);
      if (!dazu.length) continue;
      const konstante = division === 'men'
        ? 'PLAYERS_UPLOADED_MEN_RAW'
        : 'PLAYERS_UPLOADED_WOMEN_RAW';
      const bisher = leseListe(inhalt, konstante);
      // `bekannt` wächst mit: Steht derselbe Neuling auf zwei Zetteln des
      // Stapels, darf er nicht zweimal in die Datei.
      const bekannt = new Set(bisher.map(z => z.split('|')[1]));
      const zeilen: string[] = [];
      for (const s of dazu) {
        if (bekannt.has(String(s.passNr))) continue;
        bekannt.add(String(s.passNr));
        zeilen.push(`0|${s.passNr}|${s.lastName}|${s.firstName}|0|0||`);
      }
      if (!zeilen.length) continue;
      inhalt = ersetzeListe(inhalt, konstante, [...bisher, ...zeilen]);
    }
    if (inhalt !== playersQuelle) dateien.push({ pfad: PLAYERS_PFAD, inhalt });
  }

  const commit = await committe(ctx, dateien, nachricht(eingaben, ersetzt, alleNeuen));
  return { ...commit, ersetzt };
}

/**
 * Die Commit-Nachricht.
 *
 * Absätze werden mit einer LEERZEILE verbunden, nicht mit einem Zeilenumbruch:
 * Git nimmt die erste Zeile als Betreff und braucht danach eine leere Zeile.
 * Ohne sie klebte in `git log --oneline` der ganze Text am Betreff — so stand
 * es bis zum 15.09.2026 in jedem Upload-Commit.
 *
 * Ein einzelnes Turnier behält den Wortlaut von früher: Die Historie soll
 * durch den Stapel nicht zweierlei Sprache sprechen.
 */
function nachricht(
  eingaben: Veroeffentlichung[],
  ersetzt: string[],
  neueSpieler: NeuerSpieler[],
): string {
  const neue = neueSpieler.length
    ? `Neu im Stamm: ${neueSpieler.map(s => `${s.firstName} ${s.lastName} (${s.passNr})`).join(', ')}.`
    : '';

  if (eingaben.length === 1) {
    return [
      `MDC: Ergebnis ${eingaben[0].beschreibung}`,
      ersetzt.length
        ? 'Ersetzt die zuvor hochgeladene Fassung desselben Turniers.'
        : 'Vom Ergebniszettel hochgeladen und vor der Freigabe geprüft.',
      neue,
    ].filter(Boolean).join('\n\n');
  }

  return [
    `MDC: ${eingaben.length} Ergebnisse vom Zettel`,
    eingaben.map(e => `- ${e.beschreibung}`).join('\n'),
    [
      'Vom Ergebniszettel hochgeladen und vor der Freigabe geprüft.',
      ersetzt.length ? `Ersetzt die zuvor hochgeladene Fassung von: ${ersetzt.join(', ')}.` : '',
    ].filter(Boolean).join('\n'),
    neue,
  ].filter(Boolean).join('\n\n');
}
