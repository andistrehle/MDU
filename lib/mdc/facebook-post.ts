// ============================================================
// MDC — die aktuelle Rangliste als Facebook-Beitrag
// ============================================================
//
// Facebook kennt keine Tabellen und keine Formatierung: Ein Beitrag ist
// Fließtext. Deshalb wird hier bewusst mit festen Breiten und Zeilenumbrüchen
// gearbeitet statt mit Spalten — und die Zeile bleibt kurz genug, dass sie am
// Handy nicht umbricht.
//
// Der Text wird GERECHNET, nicht abgetippt: Jeder Aufruf bildet den Stand von
// heute ab. Wer ihn abschickt, sieht ihn vorher — abgeschickt wird nie etwas
// ungefragt (`app/mdc/admin/facebook`).
//
// Keine Euro-Beträge je Platz im Beitrag. Die verschieben sich mit jedem
// Turnier, und eine Zahl, die drei Tage später nicht mehr stimmt, steht bei
// Facebook für immer. Der Jackpot als Ganzes steht dabei, der ist eine Angabe
// über den Topf und keine Zusage an einen Spieler.
// ============================================================

import type { Division, RankingEntry } from '@/data/types';
import { getPlayer, playerName } from '@/data/players';
import { runningRankingOf, RUNNING_HAS_RESULTS } from '@/data/ranking';
import { RUNNING_SEASON, todayInMunich } from '@/data/season';
import { RUNNING_STATS } from '@/data/tournament-results';
import { jackpotStand, MINDEST_TEILNAHMEN } from './jackpot';
import { MDC_ORIGIN } from './site';

export interface PostSpieler {
  rank: number;
  sharedRank: boolean;
  name: string;
  points: number;
  tournaments: number;
}

export interface PostDaten {
  /** Saisonbezeichnung, z. B. „2026/27". */
  saison: string;
  /** Tag, an dem der Stand gilt — ISO. */
  stand: string;
  turniere: number;
  men: PostSpieler[];
  women: PostSpieler[];
  /** Jackpot der beiden Wertungen in Euro; `null` = nicht ausweisen. */
  jackpot: Record<Division, number> | null;
  mindestTeilnahmen: number;
  /** Vollständige Adresse der Rangliste. */
  link: string;
}

/** Wie viele Plätze der Beitrag zeigt. Vom Betreiber so festgelegt. */
export const PLAETZE: Record<Division, number> = { men: 32, women: 16 };

const zahl = new Intl.NumberFormat('de-DE');
const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

function datum(iso: string): string {
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

/**
 * Medaille für die ersten drei, sonst die Platzzahl. Bei geteilten Plätzen
 * steht dieselbe Zahl mehrfach — genau wie in der Wertung.
 */
function platz(spieler: PostSpieler): string {
  if (spieler.rank === 1) return '🥇';
  if (spieler.rank === 2) return '🥈';
  if (spieler.rank === 3) return '🥉';
  return `${spieler.rank}.`.padStart(3, ' ');
}

function block(titel: string, spieler: PostSpieler[]): string[] {
  if (!spieler.length) return [`${titel}`, 'Noch keine Wertung.', ''];
  return [
    titel,
    ...spieler.map(s =>
      `${platz(s)} ${s.name} — ${zahl.format(s.points)} Pkt. `
      + `(${s.tournaments} ${s.tournaments === 1 ? 'Turnier' : 'Turniere'})`),
    '',
  ];
}

/** Baut den fertigen Beitrag. Reiner Text, nichts wird dabei verschickt. */
export function baueFacebookPost(daten: PostDaten): string {
  const zeilen: string[] = [
    `🎯 MDC-Rangliste — Stand ${datum(daten.stand)}`,
    `Saison ${daten.saison} · ${zahl.format(daten.turniere)} Turniere gespielt`,
    '',
    ...block(`🏆 HERREN — Top ${Math.min(PLAETZE.men, daten.men.length)}`, daten.men),
    ...block(`🏆 DAMEN — Top ${Math.min(PLAETZE.women, daten.women.length)}`, daten.women),
  ];

  if (daten.jackpot) {
    zeilen.push(
      `💰 Jackpot: Herren ${euro.format(daten.jackpot.men)} · `
      + `Damen ${euro.format(daten.jackpot.women)}`,
      `Ausgeschüttet wird ab ${daten.mindestTeilnahmen} Teilnahmen.`,
      '',
    );
  }

  zeilen.push(
    '👉 Komplette Rangliste, alle Turniere und jedes Ergebnis:',
    daten.link,
  );

  return zeilen.join('\n');
}

/**
 * Die kurze Fassung: Sie steht ÜBER den Bildern, nicht statt ihrer.
 *
 * Die Namen stehen im Bild, deshalb hier keine Liste — ein Beitrag, der die
 * Rangliste zweimal enthält, liest sich niemand durch. Was bleibt, ist die
 * Einordnung (Saison, Stand, Jackpot) und der Verweis.
 */
export function kurzerFacebookText(daten: PostDaten): string {
  const zeilen = [
    `🎯 MDC-Rangliste — Stand ${datum(daten.stand)}`,
    `Saison ${daten.saison} · ${zahl.format(daten.turniere)} Turniere gespielt`,
    '',
    `🏆 Top ${daten.men.length} Herren und Top ${daten.women.length} Damen im Bild.`,
  ];

  if (daten.jackpot) {
    zeilen.push(
      '',
      `💰 Jackpot: Herren ${euro.format(daten.jackpot.men)} · `
      + `Damen ${euro.format(daten.jackpot.women)}`,
      `Ausgeschüttet wird ab ${daten.mindestTeilnahmen} Teilnahmen.`,
    );
  }

  zeilen.push(
    '',
    '👉 Komplette Rangliste, alle Turniere und jedes Ergebnis:',
    daten.link,
  );

  return zeilen.join('\n');
}

/**
 * Ranglisteneinträge in die Form bringen, die der Beitrag braucht — gekürzt
 * auf die vereinbarte Zahl von Plätzen.
 *
 * Geschnitten wird nach ZEILEN, nicht nach Platzzahl: Bei geteilten Plätzen
 * stünden sonst mehr Namen im Beitrag als angekündigt. Wer den letzten Platz
 * teilt, steht trotzdem drin — jemanden bei gleicher Punktzahl wegzulassen
 * wäre willkürlich.
 */
export function kuerze(
  eintraege: RankingEntry[],
  namen: (playerId: string) => string | null,
  anzahl: number,
): PostSpieler[] {
  const zeilen = eintraege.flatMap(e => {
    const name = namen(e.playerId);
    return name
      ? [{
        rank: e.rank,
        sharedRank: e.sharedRank,
        name,
        points: e.points,
        tournaments: e.tournaments,
      }]
      : [];
  });
  if (zeilen.length <= anzahl) return zeilen;

  const grenze = zeilen[anzahl - 1].rank;
  return zeilen.filter((s, i) => i < anzahl || s.rank === grenze);
}

/**
 * Der Beitrag zum heutigen Stand — eine Zeile Aufruf für Verwaltungsseite und
 * Wochenlauf, damit beide garantiert dasselbe erzeugen.
 *
 * Gibt `null` zurück, solange die laufende Saison keine Wertung hat. Ein
 * Beitrag mit leerer Tabelle wäre schlechter als gar keiner.
 */
export function aktuellerFacebookPost():
  { text: string; kurz: string; daten: PostDaten } | null {
  if (!RUNNING_HAS_RESULTS) return null;

  const name = (playerId: string) => {
    const player = getPlayer(playerId);
    return player ? playerName(player) : null;
  };
  const jackpot = jackpotStand();

  const daten: PostDaten = {
    saison: RUNNING_SEASON.label,
    stand: todayInMunich(),
    turniere: RUNNING_STATS.tournaments,
    men: kuerze(runningRankingOf('men'), name, PLAETZE.men),
    women: kuerze(runningRankingOf('women'), name, PLAETZE.women),
    jackpot: { men: jackpot.men.jackpot, women: jackpot.women.jackpot },
    mindestTeilnahmen: MINDEST_TEILNAHMEN,
    // Immer die vollständige Adresse: Der Beitrag steht bei Facebook, ein
    // relativer Pfad zeigte dort ins Leere.
    link: `${MDC_ORIGIN}/rangliste`,
  };

  return { text: baueFacebookPost(daten), kurz: kurzerFacebookText(daten), daten };
}
