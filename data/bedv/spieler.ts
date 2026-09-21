// ============================================================
// BeDV-Demo — Spielerinnen und Spieler
// ============================================================
//
// ALLE Personen sind erfunden (siehe `data/bedv/namen.ts`). Es wurden
// bewusst KEINE Namen von der bestehenden BeDV-Seite übernommen.
//
// Sechs Spieler je Mannschaft — so viele braucht eine Begegnung über
// 18 Einzelspiele (jeder dreimal). Der Kader ist damit die kleinste
// spielfähige Aufstellung; „Spieler nachmelden" im Kapitänsbereich zeigt,
// wie man ihn erweitert.
//
// Die SPIELSTÄRKE steckt nicht im Datensatz, sondern wird aus der Spieler-ID
// gerechnet (`staerke`). Das ist Absicht: Sie ist kein Stammdatum, sondern
// nur der Hebel, mit dem die Demo plausible Ergebnisse erzeugt. Kommt später
// eine echte Quelle, fällt die Funktion ersatzlos weg.
// ============================================================

import { rngOf, intBetween } from '@/lib/bedv/rng';
import { slug as slugify } from '@/lib/bedv/format';
import type { Spieler } from './typen';
import { TEAMS } from './teams';
import { NACHNAMEN, SPITZNAMEN, VORNAMEN_DAMEN, VORNAMEN_HERREN } from './namen';

/** Kadergröße je Mannschaft. */
export const KADERGROESSE = 6;

function initialenVon(vorname: string, nachname: string): string {
  return `${vorname[0]}${nachname[0]}`.toUpperCase();
}

function baueSpieler(): Spieler[] {
  const out: Spieler[] = [];
  const vergeben = new Set<string>();
  // Passnummern laufen durch, damit sie aussehen wie eine gewachsene
  // Verbandsliste: keine Lücken, keine Dopplungen.
  let passZaehler = 10_001;

  for (const team of TEAMS) {
    const rnd = rngOf(`kader:${team.id}`);
    // Etwa jede achte Mannschaft hat eine Spielerin im Kader — die Demo soll
    // nicht so tun, als spielten nur Männer.
    const damenImKader = rnd() < 0.34 ? intBetween(rnd, 1, 2) : 0;

    // Vornamen werden innerhalb einer Mannschaft NICHT wiederholt. Ohne diese
    // Sperre standen im Kader von Ghost Darts drei „Martin" von sechs — bei
    // 49 Vornamen und sechs Ziehungen ist das kein seltener Zufall, sieht
    // aber sofort nach erzeugten Daten aus. Genau davon lebt eine Demo nicht.
    const schonVergeben = new Set<string>();

    for (let i = 0; i < KADERGROESSE; i++) {
      const istDame = i < damenImKader;
      const vornamen = istDame ? VORNAMEN_DAMEN : VORNAMEN_HERREN;
      let vorname = vornamen[Math.floor(rnd() * vornamen.length)];
      // Höchstens so viele Versuche wie Namen zur Auswahl stehen — die Liste
      // ist deutlich länger als ein Kader, ein Treffer kommt also sicher.
      for (let versuch = 0; schonVergeben.has(vorname) && versuch < vornamen.length; versuch++) {
        vorname = vornamen[Math.floor(rnd() * vornamen.length)];
      }
      schonVergeben.add(vorname);

      const nachname = NACHNAMEN[Math.floor(rnd() * NACHNAMEN.length)];
      const name = `${vorname} ${nachname}`;

      // Gleiche Namen kommen in einem Pool dieser Größe vor. Die Adresse muss
      // trotzdem eindeutig sein, sonst zeigten zwei Profile auf dieselbe Seite.
      let id = slugify(name);
      if (vergeben.has(id)) {
        let n = 2;
        while (vergeben.has(`${id}-${n}`)) n++;
        id = `${id}-${n}`;
      }
      vergeben.add(id);

      out.push({
        id,
        vorname,
        nachname,
        name,
        // Nicht jeder hat einen Spitznamen — ungefähr jeder Dritte.
        spitzname: rnd() < 0.34 ? SPITZNAMEN[Math.floor(rnd() * SPITZNAMEN.length)] : undefined,
        teamId: team.id,
        ligaSlug: team.ligaSlug,
        saisonId: team.saisonId,
        passnummer: String(passZaehler++),
        wertung: istDame ? 'damen' : 'herren',
        // Der erste im Kader führt die Mannschaft. In der echten Plattform
        // wäre das ein Recht, kein Stammdatum — hier reicht die Markierung.
        kapitaen: i === 0,
        initialen: initialenVon(vorname, nachname),
        demo: true,
      });
    }
  }
  return out;
}

export const SPIELER: Spieler[] = baueSpieler();

const NACH_ID = new Map(SPIELER.map(s => [s.id, s]));
const NACH_TEAM = new Map<string, Spieler[]>();
for (const s of SPIELER) {
  const liste = NACH_TEAM.get(s.teamId);
  if (liste) liste.push(s); else NACH_TEAM.set(s.teamId, [s]);
}

export function spielerById(id: string): Spieler | undefined {
  return NACH_ID.get(id);
}

export function kaderVon(teamId: string): Spieler[] {
  return NACH_TEAM.get(teamId) ?? [];
}

export function kapitaenVon(teamId: string): Spieler | undefined {
  return kaderVon(teamId).find(s => s.kapitaen);
}

export function spielerDerLiga(ligaSlug: string): Spieler[] {
  return SPIELER.filter(s => s.ligaSlug === ligaSlug);
}

/**
 * Spielstärke von 0 bis 1 — der einzige Hebel hinter allen Demo-Ergebnissen.
 *
 * Gerechnet statt abgelegt, damit sie in jeder Rechnung dieselbe ist: Die
 * Tabelle, die Einzelrangliste und die Highlight-Listen greifen auf dieselbe
 * Zahl zu und widersprechen sich deshalb nie.
 */
export function staerke(spielerId: string): number {
  const rnd = rngOf(`staerke:${spielerId}`);
  // Zwei Ziehungen gemittelt: Das drückt die Verteilung zur Mitte und
  // verhindert, dass ein Kader nur aus Über- oder Unterfliegern besteht.
  return (rnd() + rnd()) / 2;
}

/** Spielstärke einer Mannschaft = Mittel ihres Kaders. */
export function teamStaerke(teamId: string): number {
  const kader = kaderVon(teamId);
  if (kader.length === 0) return 0.5;
  return kader.reduce((sum, s) => sum + staerke(s.id), 0) / kader.length;
}
