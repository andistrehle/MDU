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
// Spieler des Spieltages (Vorgabe des Betreibers): Highlights + Einzel.
//   180er = 3 · 171er = 3 · High Finish 100–129 = 2 / 130–159 = 3 / 160+ = 4 ·
//   Short Leg 15 Darts = 1 / 13–14 = 2 / ≤ 12 = 3 · gewonnenes Einzel ohne
//   Legverlust = 3, mit Legverlust = 2. Gleichstand → Einzelbilanz (Siege −
//   Niederlagen), dann Highlight-Punkte; sonst teilen sie sich den Titel.
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
export const SL_PUNKTE = (darts: number) => (darts <= 12 ? 3 : darts <= 14 ? 2 : darts === 15 ? 1 : 0);
export const EINZEL_PUNKTE = (f: number, a: number) => (f > a ? (a === 0 ? 3 : 2) : 0);
export const FORMEL_TEXT =
  'So wird gezählt: 180er und 171er je 3 Punkte · High Finish 100–129 = 2, 130–159 = 3, ab 160 = 4 · Short Leg mit 15 Darts = 1, 13–14 = 2, bis 12 = 3 · gewonnenes Einzel ohne Legverlust = 3, mit Legverlust = 2. Bei Gleichstand entscheidet die Einzelbilanz.';

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
  punkte: number;
  highlightPunkte: number;
  einzelSiege: number;
  einzelNiederlagen: number;
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
      if (!z) { z = { name: p.name, teamId, punkte: 0, highlightPunkte: 0, einzelSiege: 0, einzelNiederlagen: 0, b180: 0, b171: 0, hf: [], sl: [] }; m.set(key, z); }
      return z;
    };
    for (const g of b.spiele) {
      if (g.doppel || g.legsHeim == null || g.legsGast == null) continue;
      for (const [side, slots, f, a] of [['home', g.heim, g.legsHeim, g.legsGast], ['guest', g.gast, g.legsGast, g.legsHeim]] as const) {
        if (slots[0] == null) continue;
        const z = ensure(side, slots[0]);
        if (!z) continue;
        z.punkte += EINZEL_PUNKTE(f, a);
        if (f > a) z.einzelSiege += 1; else z.einzelNiederlagen += 1;
      }
    }
    for (const h of b.highlights) {
      if (h.value == null) continue;
      const z = ensure(h.side, h.slot);
      if (!z) continue;
      let p = 0;
      if (h.type === '180') { z.b180 += h.value; p = 3 * h.value; }
      else if (h.type === '171') { z.b171 += h.value; p = 3 * h.value; }
      else if (h.type === 'high_finish') { z.hf.push(h.value); p = HF_PUNKTE(h.value); }
      else if (h.type === 'short_leg') { z.sl.push(h.value); p = SL_PUNKTE(h.value); }
      z.highlightPunkte += p; z.punkte += p;
    }
  }
  const vgl = (a: SpielerWertung, b: SpielerWertung) =>
    (b.punkte - a.punkte) || ((b.einzelSiege - b.einzelNiederlagen) - (a.einzelSiege - a.einzelNiederlagen)) || (b.highlightPunkte - a.highlightPunkte);
  return [...m.values()].filter(z => z.punkte > 0).sort((a, b) => vgl(a, b) || a.name.localeCompare(b.name, 'de'));
}

/** Alle mit derselben Wertung wie der Erste (geteilter Titel). */
export function spielerDesSpieltages(liste: SpielerWertung[]): SpielerWertung[] {
  if (!liste.length) return [];
  const [a] = liste;
  return liste.filter(z => z.punkte === a.punkte && (z.einzelSiege - z.einzelNiederlagen) === (a.einzelSiege - a.einzelNiederlagen) && z.highlightPunkte === a.highlightPunkte);
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
