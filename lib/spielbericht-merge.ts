// ============================================================
// Spielbericht an zwei Geräten zugleich — Zusammenführen (Betreiber, 20.11.2026)
// ============================================================
// Formular am Handy und Tablet im Lokal schreiben in DENSELBEN Entwurf. Bisher
// galt „wer zuletzt speichert, verliert“: Das zweite Gerät bekam einen Konflikt
// und verlor seine letzten Eingaben. Jetzt führt jedes Gerät zusammen:
//
//   basis  = der Stand vom Server, den das Gerät zuletzt gesehen/geschrieben hat
//   meins  = der Stand auf dem Gerät (basis + eigene Eingaben)
//   deins  = der neue Stand vom Server (basis + Eingaben des anderen Geräts)
//
// Je Feld gilt: Habe ICH es seit der Basis geändert, gilt meins — sonst deins.
// So kommen die Eingaben beider Geräte zusammen. Haben beide DASSELBE Feld
// geändert (gleiches Spiel, verschiedenes Ergebnis), gewinnt das Gerät, das
// gerade zusammenführt — das ist der einzige Fall, in dem etwas verloren geht.
//
// Felder: je Seite und Platz der Spieler · je Spiel die vier Spielerfelder und
// das Ergebnis (Legs als EIN Feld) · Highlights als Mengen (180er/171er je
// Spieler und Spiel als Zähler, High Finish/Short Leg je Eintrag).
// Reine Rechnung, getestet (lib/spielbericht-merge.test.ts).
// ============================================================

import { HIGHLIGHT_VALUE_CONFIG, type HighlightEntry, type ReportGame } from '@/lib/supabase/match-reports';

export interface PlatzLike { slot: number; name: string; player_id?: string | null }
export interface MergeStand<P extends PlatzLike = PlatzLike> {
  heim: P[];
  gast: P[];
  games: ReportGame[];
  highlights: HighlightEntry[];
}

const platzKey = (p: PlatzLike | undefined) => p && p.name.trim() ? `${p.name.trim()}|${p.player_id ?? ''}` : '';

function seite<P extends PlatzLike>(b: P[], m: P[], t: P[]): P[] {
  const slots = [...new Set([...m, ...t].map(p => p.slot))].sort((x, y) => x - y);
  const out: P[] = [];
  for (const s of slots) {
    const pb = b.find(p => p.slot === s), pm = m.find(p => p.slot === s), pt = t.find(p => p.slot === s);
    const wahl = platzKey(pm) !== platzKey(pb) ? pm : (pt ?? pm);
    if (wahl) out.push(wahl);
  }
  return out;
}

type SlotFeld = 'home_slot' | 'guest_slot' | 'home_slot2' | 'guest_slot2';
const SLOT_FELDER: SlotFeld[] = ['home_slot', 'guest_slot', 'home_slot2', 'guest_slot2'];
const legs = (g: ReportGame | undefined) => (g ? `${g.legs_home ?? ''}:${g.legs_guest ?? ''}` : ':');

function spiele(b: ReportGame[], m: ReportGame[], t: ReportGame[]): ReportGame[] {
  const nummern = [...new Set([...m, ...t].map(g => g.game_no))].sort((x, y) => x - y);
  return nummern.map(no => {
    const gb = b.find(g => g.game_no === no), gm = m.find(g => g.game_no === no), gt = t.find(g => g.game_no === no);
    if (!gm) return gt!;
    if (!gt) return gm;
    const neu: ReportGame = { ...gt };
    for (const f of SLOT_FELDER) neu[f] = (gb?.[f] ?? null) !== gm[f] ? gm[f] : gt[f];
    if (legs(gb) !== legs(gm)) { neu.legs_home = gm.legs_home; neu.legs_guest = gm.legs_guest; }
    return neu;
  });
}

const istZaehler = (h: HighlightEntry) => !!HIGHLIGHT_VALUE_CONFIG[h.type]?.isCount;
const hlKey = (h: HighlightEntry) => `${h.side}|${h.slot}|${h.type}|${h.game_no ?? ''}${istZaehler(h) ? '' : `|${h.value ?? ''}`}`;
/** Je Schlüssel: Zähler = Summe der Anzahl; sonst = wie oft der Eintrag vorkommt. */
function zaehle(liste: HighlightEntry[]): Map<string, { n: number; muster: HighlightEntry }> {
  const m = new Map<string, { n: number; muster: HighlightEntry }>();
  for (const h of liste) {
    const k = hlKey(h);
    const n = istZaehler(h) ? (h.value ?? 0) : 1;
    const alt = m.get(k);
    m.set(k, { n: (alt?.n ?? 0) + n, muster: alt?.muster ?? h });
  }
  return m;
}

function highlights(b: HighlightEntry[], m: HighlightEntry[], t: HighlightEntry[]): HighlightEntry[] {
  const zb = zaehle(b), zm = zaehle(m), zt = zaehle(t);
  // Reihenfolge: wie beim anderen Gerät, eigene neue Einträge hinten an.
  const keys = [...new Set([...zt.keys(), ...zm.keys()])];
  const out: HighlightEntry[] = [];
  for (const k of keys) {
    const n = Math.max(0, (zt.get(k)?.n ?? 0) + (zm.get(k)?.n ?? 0) - (zb.get(k)?.n ?? 0));
    if (!n) continue;
    const muster = (zt.get(k) ?? zm.get(k))!.muster;
    if (istZaehler(muster)) out.push({ ...muster, value: Math.min(n, HIGHLIGHT_VALUE_CONFIG[muster.type].max) });
    else for (let i = 0; i < n; i++) out.push({ ...muster });
  }
  return out;
}

/** Führt den eigenen Stand mit dem neuen Server-Stand zusammen (siehe Kopf). */
export function zusammenfuehren<P extends PlatzLike>(basis: MergeStand<P>, meins: MergeStand<P>, deins: MergeStand<P>): MergeStand<P> {
  return {
    heim: seite(basis.heim, meins.heim, deins.heim),
    gast: seite(basis.gast, meins.gast, deins.gast),
    games: spiele(basis.games, meins.games, deins.games),
    highlights: highlights(basis.highlights, meins.highlights, deins.highlights),
  };
}

/** Gleich im Sinne der Zusammenführung (gleiche Spieler, Spiele, Highlights)? */
export function gleicherStand(a: MergeStand, b: MergeStand): boolean {
  const s = (x: MergeStand) => JSON.stringify({
    h: x.heim.filter(p => p.name.trim()).map(p => [p.slot, platzKey(p)]).sort(),
    g: x.gast.filter(p => p.name.trim()).map(p => [p.slot, platzKey(p)]).sort(),
    s: [...x.games].sort((p, q) => p.game_no - q.game_no).map(g => [g.game_no, ...SLOT_FELDER.map(f => g[f] ?? null), legs(g)]),
    l: [...zaehle(x.highlights).entries()].map(([k, v]) => [k, v.n]).sort(),
  });
  return s(a) === s(b);
}
