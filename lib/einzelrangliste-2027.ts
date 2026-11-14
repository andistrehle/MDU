// ============================================================
// Einzelrangliste 2026/27 aus den Spielberichten — reine Rechnung
// ============================================================
//
// Regeln (Spielbedingungen Ziffer 10): Nur Einzel zählen, 2:0 = 3 · 2:1 = 2 ·
// 1:2 = 1 · 0:2 = 0 Punkte; La Liga (Best of 5) 3:0 = 5 · 3:1 = 4 · 3:2 = 3 ·
// 2:3 = 2 · 1:3 = 1 · 0:3 = 0 (lib/legs.ts). Doppel zählen nicht für die Einzelrangliste.
// Reihenfolge wie in der Auswertung des Spielberichts: Punkte → Legdifferenz,
// danach mehr Siege; ist auch das gleich, teilen sich die Spieler den Platz.
// Gezählt werden dieselben Berichte wie in der Tabelle (ab dem Einreichen;
// Wertungen ohne gespielte Partien liefern keine Einzel).
// Highlights (180er, 171er, High Finish, Short Leg) aus dem Bericht.
// ============================================================

import { pointsForLegs } from '@/lib/legs';

export interface EinzelBericht {
  id: string;
  homeTeam: string;
  guestTeam: string;
  bestaetigt: boolean;
  datum: string | null;
  /** Begegnung (Heim|Gast) — Link aufs Spielerprofil → /spielbericht/<slug> */
  begegnung?: string;
  players: { side: 'home' | 'guest'; slot: number; name: string; player_id: string | null }[];
  games: { game_no?: number; game_type: string; home_slot: number | null; guest_slot: number | null; legs_home: number | null; legs_guest: number | null }[];
  highlights: { side: 'home' | 'guest'; slot: number; type: string; value: number | null }[];
}

/** Highlights eines Abends (gezählt wie in der Rangliste: 180/171 nach Anzahl, HF/SL je Eintrag einer). */
export interface HighlightsAbend { b180: number; b171: number; hf: number; sl: number }

export interface EinzelZeile {
  /** players.id, sonst „name:<Team>:<Name>" (Spieler ohne Profil) */
  key: string;
  playerId: string | null;
  name: string;
  /** Team des letzten Einsatzes */
  teamId: string;
  singles: number; wins: number; losses: number;
  legsWon: number; legsLost: number;
  points: number;
  /** Begegnungen mit mindestens einem Einzel */
  einsaetze: number;
  b180: number; b171: number;
  /** höchstes Finish (100–170) */
  highFinish: number | null;
  /** Anzahl High Finishes / Short Legs (je Eintrag im Bericht einer) */
  hfAnzahl: number;
  slAnzahl: number;
  /** kürzestes Leg (Darts) */
  shortLeg: number | null;
  /** Highlight-Punkte (`highlightPunkte`), ungewichtet — Reiter „Highlights“ */
  hlPunkte: number;
  /** Highlights je Begegnung (Kennung Heim|Gast) — Diagramm im Spielerprofil (04.11.2026) */
  hlJeBegegnung: Record<string, HighlightsAbend>;
  /** Davon aus noch nicht bestätigten Berichten */
  offen: number;
  pos: number;
  /** Alle Einzel in zeitlicher Reihenfolge (älteste zuerst) — Formkurve + letzte Ergebnisse */
  verlauf: EinzelSpiel[];
}

export interface EinzelSpiel {
  datum: string | null;
  /** Begegnung (Heim|Gast) und Spiel-Nr. im Bericht, falls bekannt */
  begegnung: string | null;
  spielNr: number | null;
  gegner: string;
  gegnerTeam: string;
  legs: number;
  legsGegner: number;
  /** aus noch nicht bestätigtem Bericht */
  offen: boolean;
}


const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Highlight-Rangliste (Betreiber, 01.11.2026): 180er/171er je 3 · High Finish
 * 100–129 = 2, 130–159 = 3, 160+ = 4 · Short Leg bis 12 Darts = 4, 13–15 = 3,
 * 16–20 = 2. Bei „Alle Ligen“ zählt La Liga × ⅔ (Best of 5, mehr Legs).
 * Steht so auch unter der Liste. Bewusst getrennt von der internen Wertung des
 * Spieltagsberichts (lib/spieltag-bericht.ts).
 */
export function highlightPunkte(typ: string, wert: number): number {
  if (typ === '180' || typ === '171') return 3 * wert;
  if (typ === 'high_finish') return wert >= 160 ? 4 : wert >= 130 ? 3 : wert >= 100 ? 2 : 0;
  if (typ === 'short_leg') return wert <= 12 ? 4 : wert <= 15 ? 3 : wert <= 20 ? 2 : 0;
  return 0;
}
export const LA_LIGA_GEWICHT = 2 / 3;

/**
 * „Alle Ligen“ – unterschiedlich viele Spiele (Betreiber, 14.11.2026): Die Ligen sind verschieden groß
 * (Begegnungen je Team in der Saison: La Liga 10, A Liga 16, B1 14, B2/C 12). Highlight-Punkte werden mit
 * (meiste Begegnungen je Team einer Liga) ÷ (Begegnungen je Team der eigenen Liga) hochgerechnet — fest
 * aus dem Spielplan, NICHT nach bisher gespielten Abenden (die schwanken am Saisonanfang zu stark).
 * Zusätzlich gilt das ⅔ der La Liga (Best of 5). Liga = Team des letzten Einsatzes.
 */
export function spieleJeTeam(ligen: { code: string; teams: number; begegnungen: number }[]): Record<string, number> {
  return Object.fromEntries(ligen.filter(l => l.teams > 0).map(l => [l.code, (2 * l.begegnungen) / l.teams]));
}
export function ligaFaktor(spiele: Record<string, number>, liga: string | undefined): number {
  const max = Math.max(0, ...Object.values(spiele));
  const eigen = liga ? spiele[liga] ?? 0 : 0;
  return eigen > 0 && max > 0 ? max / eigen : 1;
}
/** Highlight-Punkte für „Alle Ligen“: La Liga × ⅔ und × Liga-Faktor. */
export function hlGesamtWert(punkte: number, liga: string | undefined, faktor: number): number {
  return punkte * (liga === 'la' ? LA_LIGA_GEWICHT : 1) * faktor;
}

export function berechneEinzel(berichte: EinzelBericht[]): Map<string, EinzelZeile> {
  const out = new Map<string, EinzelZeile>();
  // ältere Berichte zuerst, damit „Team des letzten Einsatzes" stimmt
  const sorted = [...berichte].sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''));
  for (const r of sorted) {
    const keyOf = (side: 'home' | 'guest', slot: number | null) => {
      if (slot == null) return null;
      const p = r.players.find(x => x.side === side && x.slot === slot);
      if (!p || !p.name.trim()) return null;
      const team = side === 'home' ? r.homeTeam : r.guestTeam;
      return { key: p.player_id ?? `name:${team}:${norm(p.name)}`, p, team };
    };
    const ensure = (k: NonNullable<ReturnType<typeof keyOf>>) => {
      let z = out.get(k.key);
      if (!z) {
        z = { key: k.key, playerId: k.p.player_id, name: k.p.name.trim(), teamId: k.team, singles: 0, wins: 0, losses: 0, legsWon: 0, legsLost: 0, points: 0, einsaetze: 0, b180: 0, b171: 0, highFinish: null, hfAnzahl: 0, shortLeg: null, slAnzahl: 0, hlPunkte: 0, hlJeBegegnung: {}, offen: 0, pos: 0, verlauf: [] };
        out.set(k.key, z);
      }
      z.teamId = k.team; z.name = k.p.name.trim();
      return z;
    };
    const imBericht = new Set<string>();
    for (const g of r.games) {
      if (g.game_type !== 'single' || g.legs_home == null || g.legs_guest == null) continue;
      for (const [side, slot, f, a] of [['home', g.home_slot, g.legs_home, g.legs_guest], ['guest', g.guest_slot, g.legs_guest, g.legs_home]] as const) {
        const k = keyOf(side, slot);
        if (!k) continue;
        const z = ensure(k);
        z.singles += 1; z.legsWon += f; z.legsLost += a;
        if (f > a) z.wins += 1; else z.losses += 1;
        z.points += pointsForLegs(f, a);
        if (!r.bestaetigt) z.offen += 1;
        const gegen = keyOf(side === 'home' ? 'guest' : 'home', side === 'home' ? g.guest_slot : g.home_slot);
        z.verlauf.push({ datum: r.datum ?? null, begegnung: r.begegnung ?? null, spielNr: g.game_no ?? null, gegner: gegen?.p.name.trim() ?? 'Unbekannt', gegnerTeam: side === 'home' ? r.guestTeam : r.homeTeam, legs: f, legsGegner: a, offen: !r.bestaetigt });
        imBericht.add(z.key);
      }
    }
    for (const key of imBericht) out.get(key)!.einsaetze += 1;
    for (const h of r.highlights ?? []) {
      const k = keyOf(h.side, h.slot);
      if (!k || h.value == null) continue;
      const z = ensure(k);
      z.hlPunkte += highlightPunkte(h.type, h.value);
      if (r.begegnung) {
        const a = (z.hlJeBegegnung[r.begegnung] ??= { b180: 0, b171: 0, hf: 0, sl: 0 });
        if (h.type === '180') a.b180 += h.value;
        else if (h.type === '171') a.b171 += h.value;
        else if (h.type === 'high_finish') a.hf += 1;
        else if (h.type === 'short_leg') a.sl += 1;
      }
      if (h.type === '180') z.b180 += h.value;
      else if (h.type === '171') z.b171 += h.value;
      else if (h.type === 'high_finish') { z.highFinish = Math.max(z.highFinish ?? 0, h.value); z.hfAnzahl += 1; }
      else if (h.type === 'short_leg') { z.shortLeg = z.shortLeg == null ? h.value : Math.min(z.shortLeg, h.value); z.slAnzahl += 1; }
    }
  }
  return out;
}

const vgl = (a: EinzelZeile, b: EinzelZeile) =>
  (b.points - a.points) || ((b.legsWon - b.legsLost) - (a.legsWon - a.legsLost)) || (b.wins - a.wins);

/** Rangliste einer Gruppe (z. B. einer Liga); nur Spieler mit mindestens einem Einzel. */
export function rangliste(zeilen: EinzelZeile[]): EinzelZeile[] {
  const s = zeilen.filter(z => z.singles > 0).sort((a, b) => vgl(a, b) || a.name.localeCompare(b.name, 'de'));
  return s.map((z, i) => ({ ...z, pos: i > 0 && vgl(s[i - 1], z) === 0 ? 0 : i + 1 }))
    .map((z, i, arr) => ({ ...z, pos: z.pos || arr.slice(0, i).reverse().find(x => x.pos)!.pos }));
}
