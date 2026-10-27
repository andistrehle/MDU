// ============================================================
// Spieltagsbericht 2026/27 — reine Rechnung (ohne DB)
// ============================================================
//
// Betreiber, 25.10.2026: Nach jedem Spielwochenende ein News-Beitrag mit
// Highlights, knappen Ergebnissen (mit Spielverlauf), deutlichen Siegen,
// Spieler des Spieltages (ligaübergreifend), allen Ergebnissen und den
// Auswirkungen auf die Tabellen.
//
// Spieltag-Nummern sind je Liga verschieden (La Liga spielt seltener) — der
// Bericht läuft deshalb je PLAN-WOCHENENDE (Freitag–Sonntag).
//
// Welche Begegnungen gehören hinein?
//   • gespielt: Ergebnis da, Spieldatum im Fenster (Montag nach dem vorigen
//     Plan-Wochenende bis Sonntag dieses Wochenendes) — so landen auch
//     vorgezogene und nachgeholte Spiele genau einmal in einem Bericht.
//   • nachgereicht: Ergebnis da, Spieldatum VOR dem Fenster, aber in keinem
//     früheren Bericht enthalten (Bericht kam erst nach dem Sonntag).
//   • offen: Spiel dieses Wochenendes oder mit Termin im Fenster, aber noch
//     ohne Ergebnis — „verlegt auf …“ oder „Bericht steht noch aus“.
//
// Spieler des Spieltages (Betreiber, 27.10.2026): wer im Einzel am meisten
//   gewonnen hat — mehr Siege, dann weniger Niederlagen (4:0 vor 3:1); erst bei
//   Gleichstand entscheiden die Highlights, dann die Legdifferenz. Eigens dazu:
//   „die meisten Highlights“ (Anzahl: jeder 180er/171er, jedes High Finish,
//   jedes Short Leg), dazu im Highlight-Abschnitt das höchste Finish, jedes
//   Finish ab 140, jedes Short Leg bis 15 Darts und 180er/171er ab zwei.
// Highlight-Punkte (nur für Gleichstände): 180er/171er = 3 · High Finish
//   100–129 = 2 / 130–159 = 3 / 160+ = 4 · Short Leg 9–12 = 3 / 13–15 = 2 /
//   16–20 = 1. La Liga (Best of 5) × ⅔ — dort fallen je Spiel rund anderthalbmal
//   so viele Legs, also mehr Gelegenheiten.
// Die Wertung ist intern — sie steht weder im Beitrag noch in der FAQ.
// ============================================================

import type { Ergebnis27, TabellenZeile } from './tabelle-2027';

export interface BerichtSpieler { side: 'home' | 'guest'; slot: number; name: string; playerId: string | null }
export interface BerichtSpiel { nr: number; doppel: boolean; heim: number[]; gast: number[]; legsHeim: number | null; legsGast: number | null }
export interface BerichtHighlight { side: 'home' | 'guest'; slot: number; type: string; value: number | null }

export interface BegegnungDaten {
  key: string;
  liga: string;
  spieltag: number;
  e: Ergebnis27;
  /** leer bei Wertungen (Nichtantritt/kein Bericht) */
  spieler: BerichtSpieler[];
  spiele: BerichtSpiel[];
  highlights: BerichtHighlight[];
}

export const HF_PUNKTE = (v: number) => (v >= 160 ? 4 : v >= 130 ? 3 : v >= 100 ? 2 : 0);
export const SL_PUNKTE = (darts: number) => (darts <= 12 ? 3 : darts <= 15 ? 2 : darts <= 20 ? 1 : 0);
/** Gewicht der Highlights je Liga: La Liga spielt Best of 5 (3 Gewinn-Legs statt 2). */
export const HIGHLIGHT_GEWICHT = (liga: string) => (liga === 'la' ? 2 / 3 : 1);

// ── Spielverlauf ─────────────────────────────────────────────

export interface Verlauf {
  /** Zwischenstand nach jedem Spiel (Heim:Gast) */
  staende: [number, number][];
  fuehrungswechsel: number;
  /** größter Rückstand des späteren Siegers (bei Remis: größter Rückstand einer Seite) */
  groessterRueckstand: number;
  /** Nach welchem Spiel stand der Sieger fest? (null = erst im letzten oder Remis) */
  entschiedenNach: number | null;
}

export function spielverlauf(spiele: BerichtSpiel[]): Verlauf {
  const s = [...spiele].filter(g => g.legsHeim != null && g.legsGast != null).sort((a, b) => a.nr - b.nr);
  const staende: [number, number][] = [];
  let h = 0, g = 0, wechsel = 0, letzterFuehrender = 0;
  for (const x of s) {
    if (x.legsHeim! > x.legsGast!) h += 1; else if (x.legsGast! > x.legsHeim!) g += 1;
    staende.push([h, g]);
    const f = Math.sign(h - g);
    if (f !== 0 && letzterFuehrender !== 0 && f !== letzterFuehrender) wechsel += 1;
    if (f !== 0) letzterFuehrender = f;
  }
  const sieger = Math.sign(h - g); // 1 Heim, -1 Gast, 0 Remis
  const rueck = staende.map(([a, b]) => (sieger === 1 ? b - a : sieger === -1 ? a - b : Math.abs(a - b)));
  const gesamt = s.length;
  let entschieden: number | null = null;
  if (sieger !== 0) {
    for (let i = 0; i < staende.length; i++) {
      const [a, b] = staende[i];
      const rest = gesamt - (i + 1);
      const vorsprung = sieger === 1 ? a - b : b - a;
      if (vorsprung > rest) { entschieden = i + 1; break; }
    }
    if (entschieden === gesamt) entschieden = null;
  }
  return { staende, fuehrungswechsel: wechsel, groessterRueckstand: Math.max(0, ...rueck), entschiedenNach: entschieden };
}

// ── Spieler des Spieltages ───────────────────────────────────

export interface SpielerWertung {
  name: string;
  teamId: string;
  /** gewichtete Highlight-Punkte (nur für Gleichstände) */
  highlightPunkte: number;
  /** Zahl der Highlights (jeder 180er/171er, jedes HF, jedes Short Leg) */
  highlightAnzahl: number;
  einzelSiege: number;
  einzelNiederlagen: number;
  legsFor: number;
  legsAgainst: number;
  b180: number;
  b171: number;
  hf: number[];
  sl: number[];
}

export function spielerWertung(begegnungen: BegegnungDaten[]): SpielerWertung[] {
  const m = new Map<string, SpielerWertung>();
  for (const b of begegnungen) {
    const find = (side: 'home' | 'guest', slot: number) => b.spieler.find(p => p.side === side && p.slot === slot);
    const ensure = (side: 'home' | 'guest', slot: number) => {
      const p = find(side, slot);
      if (!p) return null;
      const teamId = side === 'home' ? b.e.home : b.e.away;
      const key = p.playerId ?? `name:${teamId}:${p.name.toLowerCase()}`;
      let z = m.get(key);
      if (!z) { z = { name: p.name, teamId, highlightPunkte: 0, highlightAnzahl: 0, einzelSiege: 0, einzelNiederlagen: 0, legsFor: 0, legsAgainst: 0, b180: 0, b171: 0, hf: [], sl: [] }; m.set(key, z); }
      return z;
    };
    for (const g of b.spiele) {
      if (g.doppel || g.legsHeim == null || g.legsGast == null) continue;
      for (const [side, slots, f, a] of [['home', g.heim, g.legsHeim, g.legsGast], ['guest', g.gast, g.legsGast, g.legsHeim]] as const) {
        if (slots[0] == null) continue;
        const z = ensure(side, slots[0]);
        if (!z) continue;
        z.legsFor += f; z.legsAgainst += a;
        if (f > a) z.einzelSiege += 1; else z.einzelNiederlagen += 1;
      }
    }
    for (const h of b.highlights) {
      if (h.value == null) continue;
      const z = ensure(h.side, h.slot);
      if (!z) continue;
      let p = 0, n = 0;
      if (h.type === '180') { z.b180 += h.value; p = 3 * h.value; n = h.value; }
      else if (h.type === '171') { z.b171 += h.value; p = 3 * h.value; n = h.value; }
      else if (h.type === 'high_finish') { z.hf.push(h.value); p = HF_PUNKTE(h.value); n = 1; }
      else if (h.type === 'short_leg') { z.sl.push(h.value); p = SL_PUNKTE(h.value); n = 1; }
      z.highlightPunkte += p * HIGHLIGHT_GEWICHT(b.liga); z.highlightAnzahl += n;
    }
  }
  return [...m.values()].filter(z => z.einzelSiege > 0 || z.highlightAnzahl > 0).sort((a, b) => vglSpieler(a, b) || a.name.localeCompare(b.name, 'de'));
}

/** Reihenfolge Spieler des Spieltages: Siege ↓, Niederlagen ↑, Highlights ↓, Legdifferenz ↓. */
const vglSpieler = (a: SpielerWertung, b: SpielerWertung) =>
  (b.einzelSiege - a.einzelSiege) || (a.einzelNiederlagen - b.einzelNiederlagen)
  || (b.highlightPunkte - a.highlightPunkte) || ((b.legsFor - b.legsAgainst) - (a.legsFor - a.legsAgainst));

/** Alle mit derselben Wertung wie der Erste (geteilter Titel). */
export function spielerDesSpieltages(liste: SpielerWertung[]): SpielerWertung[] {
  if (!liste.length) return [];
  return liste.filter(z => vglSpieler(z, liste[0]) === 0);
}

/** Die meisten Highlights (Anzahl; Gleichstand → Highlight-Punkte, sonst geteilt). */
export function meisteHighlights(liste: SpielerWertung[]): SpielerWertung[] {
  const mit = liste.filter(z => z.highlightAnzahl > 0)
    .sort((a, b) => (b.highlightAnzahl - a.highlightAnzahl) || (b.highlightPunkte - a.highlightPunkte));
  if (!mit.length) return [];
  return mit.filter(z => z.highlightAnzahl === mit[0].highlightAnzahl && z.highlightPunkte === mit[0].highlightPunkte);
}

// ── Tabellen vorher/nachher ──────────────────────────────────

export interface TabellenAenderung { teamId: string; vorher: number; nachher: number; punkte: number; spiele: number }

/** Platz vorher (0 = hatte noch nicht gespielt) und nachher je Team. */
export function tabellenAenderung(vorher: TabellenZeile[], nachher: TabellenZeile[]): TabellenAenderung[] {
  const pos = new Map(vorher.map(z => [z.team, z]));
  return nachher.map(z => {
    const v = pos.get(z.team);
    return { teamId: z.team, vorher: v && v.sp > 0 ? v.pos : 0, nachher: z.pos, punkte: z.pts, spiele: z.sp };
  });
}

// ── Fenster je Plan-Wochenende ───────────────────────────────

const tagDanach = (iso: string) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

/** Fenster (von–bis, inkl.) des Berichts für das Wochenende `fri` aus der Liste aller Plan-Wochenenden. */
export function fenster(wochenenden: { fri: string; sun: string }[], fri: string): { von: string; bis: string } | null {
  const s = [...wochenenden].sort((a, b) => a.fri.localeCompare(b.fri));
  const i = s.findIndex(w => w.fri === fri);
  if (i < 0) return null;
  return { von: i === 0 ? '0000-01-01' : tagDanach(s[i - 1].sun), bis: s[i].sun };
}
