// ============================================================
// MDC — erkannten Namen einem Spieler zuordnen
// ============================================================
//
// Auf dem Zettel steht „Micky", im Stamm steht „Micky Schul" mit Passnummer 53.
// Diese Brücke schlägt dieses Modul — als VORSCHLAG mit Sicherheitsgrad, nie
// als Entscheidung.
//
// Warum kein stilles Zuordnen: Die MDC führt mehrere Spieler mit gleichem
// Vornamen, ein paar ohne Nachnamen und einige unter ihrem Stammlokal. Ein
// automatisch gesetzter falscher Treffer würde Punkte an die falsche Person
// buchen und fiele monatelang niemandem auf. Deshalb gilt:
//
//   sicher = true   nur bei eindeutigem Treffer OHNE zweiten ernsthaften
//                   Kandidaten. Die Seite markiert die Zeile trotzdem als
//                   „zugeordnet" und zeigt, WER gemeint ist.
//   sicher = false  alles andere — die Zeile muss von Hand bestätigt werden.
//
// Die Passnummer schlägt den Namen: Sie ist der eindeutige Schlüssel. Passt
// der Name nicht dazu, ist das ein Hinweis, kein Grund, sie zu verwerfen —
// beides wird angezeigt, entschieden wird am Bildschirm.
// ============================================================

import { PLAYERS, playerName, getPlayerByPassNr } from '@/data/players';
import type { Player } from '@/data/types';

export interface Zuordnung {
  playerId: string;
  passNr: number | null;
  name: string;
  nickname: string | null;
  /** 0 bis 1 — wie gut der erkannte Name auf diesen Spieler passt. */
  score: number;
}

export interface ZuordnungsErgebnis {
  /** Bester Treffer, falls es überhaupt einen gibt. */
  treffer: Zuordnung | null;
  /** Weitere Kandidaten für die Auswahlliste, absteigend nach Güte. */
  alternativen: Zuordnung[];
  /** Ohne Nachfrage übernehmbar? Siehe Kopf dieser Datei. */
  sicher: boolean;
  /** Kurzer Grund für die Anzeige — auch wenn es gut lief. */
  hinweis: string | null;
}

/** Vergleichsform: klein, ohne Umlaute, ohne Satzzeichen. */
function normalisiere(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Levenshtein-Abstand, iterativ (zwei Zeilen genügen). */
function abstand(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let vorher = Array.from({ length: b.length + 1 }, (_, i) => i);
  let aktuell = new Array<number>(b.length + 1);

  for (let i = 0; i < a.length; i++) {
    aktuell[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const kosten = a[i] === b[j] ? 0 : 1;
      aktuell[j + 1] = Math.min(aktuell[j] + 1, vorher[j + 1] + 1, vorher[j] + kosten);
    }
    [vorher, aktuell] = [aktuell, vorher];
  }
  return vorher[b.length];
}

/** Ähnlichkeit zweier Zeichenketten, 0 bis 1. */
function aehnlichkeit(a: string, b: string): number {
  if (!a || !b) return 0;
  const laenge = Math.max(a.length, b.length);
  return 1 - abstand(a, b) / laenge;
}

/**
 * Wie gut passt der erkannte Name auf diesen Spieler? Verglichen wird gegen
 * alle Schreibweisen, unter denen er auf einem Zettel stehen könnte:
 * „Vorname Nachname", „Nachname Vorname", nur der Vorname, der Spitzname.
 */
function bewerte(erkannt: string, spieler: Player): number {
  const voll = normalisiere(`${spieler.firstName} ${spieler.lastName}`.trim());
  const umgedreht = normalisiere(`${spieler.lastName} ${spieler.firstName}`.trim());
  const vorname = normalisiere(spieler.firstName);
  const nachname = normalisiere(spieler.lastName);
  const spitzname = spieler.nickname ? normalisiere(spieler.nickname) : '';

  const kandidaten: { form: string; gewicht: number }[] = [
    { form: voll, gewicht: 1 },
    { form: umgedreht, gewicht: 0.98 },
    // Nur ein Namensteil ist schwächer: „Michael" gibt es mehrfach.
    { form: vorname, gewicht: 0.86 },
    { form: nachname, gewicht: 0.86 },
    { form: spitzname, gewicht: 0.92 },
  ];

  let beste = 0;
  for (const { form, gewicht } of kandidaten) {
    if (!form) continue;
    // Ein enthaltener vollständiger Namensteil zählt fast wie ein Volltreffer:
    // „Micky S." enthält „micky".
    const enthalten = erkannt.includes(form) || form.includes(erkannt);
    const wert = Math.max(aehnlichkeit(erkannt, form), enthalten ? 0.9 : 0) * gewicht;
    if (wert > beste) beste = wert;
  }
  return beste;
}

/** Ab hier gilt ein Name als überhaupt vorschlagbar. */
const SCHWELLE = 0.62;
/** Ab hier — und mit deutlichem Abstand zum Zweiten — gilt er als sicher. */
const SICHER_AB = 0.88;
const MINDESTABSTAND = 0.12;

function alsZuordnung(spieler: Player, score: number): Zuordnung {
  return {
    playerId: spieler.id,
    passNr: spieler.passNr,
    name: playerName(spieler),
    nickname: spieler.nickname,
    score: Math.round(score * 100) / 100,
  };
}

/**
 * Ordnet eine erkannte Zeile zu. `passNr` hat Vorrang; ohne sie entscheidet
 * der Name. Gibt immer auch Alternativen zurück — die Auswahlliste am
 * Bildschirm lebt davon.
 */
export function ordneSpielerZu(
  erkannt: { name: string | null; passNr: number | null },
): ZuordnungsErgebnis {
  // ── Weg 1: über die Passnummer ──
  if (erkannt.passNr !== null) {
    const spieler = getPlayerByPassNr(erkannt.passNr);
    if (spieler) {
      const passtName = erkannt.name
        ? bewerte(normalisiere(erkannt.name), spieler) >= SCHWELLE
        : true;
      return {
        treffer: alsZuordnung(spieler, 1),
        alternativen: [],
        sicher: passtName,
        hinweis: passtName
          ? null
          : `Passnummer ${erkannt.passNr} gehört zu ${playerName(spieler)} — auf dem Zettel steht „${erkannt.name}". Bitte prüfen.`,
      };
    }
    // Nummer unbekannt: nicht verwerfen, sondern über den Namen weitersuchen.
  }

  // ── Weg 2: über den Namen ──
  if (!erkannt.name?.trim()) {
    return {
      treffer: null, alternativen: [], sicher: false,
      hinweis: 'Kein Name erkannt — bitte von Hand auswählen.',
    };
  }

  const gesucht = normalisiere(erkannt.name);
  const bewertet = PLAYERS
    .map(spieler => ({ spieler, score: bewerte(gesucht, spieler) }))
    .filter(k => k.score >= SCHWELLE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (!bewertet.length) {
    return {
      treffer: null, alternativen: [], sicher: false,
      hinweis: `„${erkannt.name}" steht in keiner Wertung. Entweder ist die Schreibweise anders — oder es ist jemand Neues.`,
    };
  }

  const [beste, zweite] = bewertet;
  const eindeutig = !zweite || beste.score - zweite.score >= MINDESTABSTAND;
  const sicher = beste.score >= SICHER_AB && eindeutig;

  const unbekannteNummer = erkannt.passNr !== null;
  return {
    treffer: alsZuordnung(beste.spieler, beste.score),
    alternativen: bewertet.slice(1).map(k => alsZuordnung(k.spieler, k.score)),
    sicher: sicher && !unbekannteNummer,
    hinweis: unbekannteNummer
      ? `Passnummer ${erkannt.passNr} ist keinem Spieler zugeordnet — Vorschlag stammt aus dem Namen.`
      : sicher
        ? null
        : eindeutig
          ? 'Name nur ungefähr getroffen — bitte prüfen.'
          : `Mehrdeutig: ${bewertet.slice(0, 3).map(k => playerName(k.spieler)).join(', ')}`,
  };
}
