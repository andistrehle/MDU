// ============================================================
// Kiosk-Eingabe (Tablet im Lokal) — reine Regeln
// ============================================================
// Betreiber, 19.11.2026. Das Tablet hat KEIN Konto: Es weist sich mit einem
// Geräte-Schlüssel aus (Migration 0072, lib/server/kiosk.ts) und darf nur den
// ENTWURF des heutigen Heimspiels seines Teams führen und absenden.
// Hier steht alles, was sich ohne Datenbank rechnen lässt (getestet).
// Probe unter /kiosk?probe=1: rechnet im Gerät, schickt nichts an den Server.
//
// Die Regeln hier sind dieselben wie im Formular
// (app/mein-bereich/spielberichte/page.tsx): Ersatzspieler binden sich an eine
// Position, ein Wechsel gilt für die folgenden Einzel dieser Position.
// ============================================================

import {
  GAME_SCHEDULE, HIGHLIGHT_TYPES, HIGHLIGHT_VALUE_CONFIG, legResults,
  type BestOf, type HighlightEntry, type ReportGame, type ReportPlayer,
} from '@/lib/supabase/match-reports';

export type Seite = 'home' | 'guest';
export type SlotFeld = 'home_slot' | 'guest_slot' | 'home_slot2' | 'guest_slot2';

export const KIOSK_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const leereSpieler = (side: Seite): ReportPlayer[] =>
  KIOSK_SLOTS.map(slot => ({ side, slot, pass_no: '', name: '', player_id: null, points: 0 }));

export const leereSpiele = (): ReportGame[] => GAME_SCHEDULE.map(s => ({
  game_no: s.no, game_type: s.type,
  home_slot: s.homeSlot ?? null, guest_slot: s.guestSlot ?? null,
  home_slot2: null, guest_slot2: null, legs_home: null, legs_guest: null,
}));

/** Ergebnis „2:1“ setzen, leer = wieder offen. */
export function legsSetzen(games: ReportGame[], no: number, res: string): ReportGame[] {
  return games.map(g => {
    if (g.game_no !== no) return g;
    if (!res) return { ...g, legs_home: null, legs_guest: null };
    const [a, b] = res.split(':').map(Number);
    return { ...g, legs_home: a, legs_guest: b };
  });
}

const position = (no: number, seite: Seite) => {
  const s = GAME_SCHEDULE.find(x => x.no === no);
  return (seite === 'home' ? s?.homeSlot : s?.guestSlot) ?? null;
};

/** Spieler in ein Spiel setzen; im Einzel gilt der Wechsel auch für die folgenden offenen Einzel der Position. */
export function slotSetzen(games: ReportGame[], no: number, feld: SlotFeld, v: number | null): ReportGame[] {
  const g0 = games.find(g => g.game_no === no);
  const seite: Seite = feld.startsWith('home') ? 'home' : 'guest';
  const folge = g0?.game_type === 'single' && (feld === 'home_slot' || feld === 'guest_slot') && v != null;
  const pos = folge ? position(no, seite) : null;
  return games.map(g => {
    if (g.game_no === no) return { ...g, [feld]: v };
    if (!folge || pos == null || g.game_type !== 'single' || g.game_no < no || g.legs_home != null) return g;
    return position(g.game_no, seite) === pos ? { ...g, [feld]: v } : g;
  });
}

const besetzt = (spieler: ReportPlayer[]) => spieler.filter(p => p.name.trim()).map(p => p.slot);

/** Erlaubte Spieler für ein Feld eines Spiels (Einzel: Stammspieler der Position + freie/dort gebundene Ersatzspieler). */
export function erlaubteSlots(games: ReportGame[], spieler: ReportPlayer[], no: number, feld: SlotFeld): number[] {
  const g = games.find(x => x.game_no === no);
  if (!g) return [];
  const seite: Seite = feld.startsWith('home') ? 'home' : 'guest';
  const aktiv = besetzt(spieler);
  if (g.game_type === 'single') {
    const pos = position(no, seite);
    if (pos == null) return aktiv;
    const gebunden = new Map<number, Set<number>>();
    for (const x of games) {
      if (x.game_type !== 'single') continue;
      const p = position(x.game_no, seite);
      const slot = seite === 'home' ? x.home_slot : x.guest_slot;
      if (p == null || slot == null || slot <= 4) continue;
      if (!gebunden.has(slot)) gebunden.set(slot, new Set());
      gebunden.get(slot)!.add(p);
    }
    return aktiv.filter(slot => {
      if (slot === pos) return true;
      if (slot <= 4) return false;
      const ps = gebunden.get(slot);
      return !ps || ps.size === 0 || (ps.size === 1 && ps.has(pos));
    });
  }
  const partner = feld === 'home_slot' ? g.home_slot2 : feld === 'home_slot2' ? g.home_slot : feld === 'guest_slot' ? g.guest_slot2 : g.guest_slot;
  const woanders = new Set<number>();
  for (const x of games) {
    if (x.game_type !== 'double' || x.game_no === no) continue;
    (seite === 'home' ? [x.home_slot, x.home_slot2] : [x.guest_slot, x.guest_slot2]).forEach(s => { if (s != null) woanders.add(s); });
  }
  return aktiv.filter(s => s !== partner && !woanders.has(s));
}

/** Anpfiff erst, wenn die vier Stammplätze beider Seiten besetzt sind. */
export const aufstellungFertig = (heim: ReportPlayer[], gast: ReportPlayer[]) =>
  [heim, gast].every(l => [1, 2, 3, 4].every(s => l.find(p => p.slot === s)?.name.trim()));

export const alleGespielt = (games: ReportGame[]) => games.every(g => g.legs_home != null && g.legs_guest != null);

// ── Probe ──────────────────────────────────────────────────────
// Erfundene Begegnung mit erkennbar erfundenen Namen — keine echten Teams,
// keine echten Personen, nichts davon erreicht den Server.
export const PROBE = {
  heim: 'Heimteam (Probe)',
  gast: 'Gastteam (Probe)',
  kaderHeim: ['Anna Beispiel', 'Bernd Muster', 'Clara Probe', 'Dieter Test', 'Emil Ersatz', 'Frieda Wechsel'],
  kaderGast: ['Gustav Gast', 'Hanna Auswärts', 'Ingo Gegner', 'Jana Fremd', 'Kurt Bank', 'Lena Reserve'],
} as const;

// ── Echtbetrieb: Freischaltung, Heimspiel des Tages, Prüfung der Eingabe ──

/** Not-Aus für die ganze Tablet-Eingabe (Probe bleibt). */
export const KIOSK_AN = true;
/** Zum Start nur diese Teams (Betreiber, 19.11.2026); `null` = alle Teams mit Team Manager. */
export const KIOSK_TEAMS: string[] | null = ['freibad-bazis'];
export const kioskErlaubt = (team: string | null | undefined) =>
  !!team && KIOSK_AN && (KIOSK_TEAMS === null || KIOSK_TEAMS.includes(team));

export interface KioskPlan { key: string; home: string; away: string; termin: { datum: string; uhrzeit?: string | null } | null }

/** Das Heimspiel des Teams an diesem Spieltag-Datum — nur Spiele mit festem Termin. */
export const heimspielAm = <T extends KioskPlan>(plan: T[], team: string, datum: string): T | null =>
  plan.find(b => b.home === team && b.termin?.datum === datum) ?? null;

/** Das nächste Heimspiel nach diesem Datum (für „Heute kein Spiel“). */
export const naechstesHeimspiel = <T extends KioskPlan>(plan: T[], team: string, datum: string): T | null =>
  plan.filter(b => b.home === team && !!b.termin && b.termin.datum > datum)
    .sort((a, b) => a.termin!.datum.localeCompare(b.termin!.datum))[0] ?? null;

/** Kopplungscode: acht Ziffern, Leerzeichen und Striche beim Tippen egal. */
export const CODE_LAENGE = 8;
export function codeNormal(s: string): string | null {
  const z = (s ?? '').replace(/[\s-]/g, '');
  return new RegExp(`^\\d{${CODE_LAENGE}}$`).test(z) ? z : null;
}
export const codeAnzeige = (c: string) => `${c.slice(0, 4)} ${c.slice(4)}`;

export interface KioskStand {
  heim: { slot: number; name: string }[];
  gast: { slot: number; name: string }[];
  games: ReportGame[];
  highlights: HighlightEntry[];
}

const ganz = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const slotOderLeer = (v: unknown): number | null | undefined => (v == null ? null : ganz(v, 1, 8) ? v : undefined);

/**
 * Was das Tablet schickt, wird NIE ungeprüft geschrieben: Aus der Eingabe
 * entsteht ein frischer Stand mit genau 18 Spielen in der Reihenfolge des
 * Bogens (Spielart kommt aus dem Plan, nicht vom Gerät), Plätzen 1–8, Namen
 * ohne Überlänge und nur Ergebnissen, die es in diesem Modus gibt.
 */
export function pruefeStand(roh: unknown, bestOf: BestOf): { stand: KioskStand; fehler: null } | { stand: null; fehler: string } {
  const nein = (fehler: string) => ({ stand: null, fehler });
  const r = roh as Partial<Record<keyof KioskStand, unknown>> | null;
  if (!r || typeof r !== 'object') return nein('Eingabe fehlt.');
  const seite = (liste: unknown): { slot: number; name: string }[] | null => {
    if (!Array.isArray(liste) || liste.length > 8) return null;
    const out: { slot: number; name: string }[] = [];
    for (const p of liste as { slot?: unknown; name?: unknown }[]) {
      if (!p || !ganz(p.slot, 1, 8) || typeof p.name !== 'string') return null;
      const name = p.name.replace(/\s+/g, ' ').trim();
      if (name.length > 60) return null;
      if (out.some(o => o.slot === p.slot)) return null;
      if (name) out.push({ slot: p.slot, name });
    }
    return out;
  };
  const heim = seite(r.heim), gast = seite(r.gast);
  if (!heim || !gast) return nein('Aufstellung ist nicht lesbar.');
  if (!Array.isArray(r.games)) return nein('Spiele fehlen.');
  const erlaubt = legResults(bestOf) as readonly string[];
  const games: ReportGame[] = [];
  for (const plan of GAME_SCHEDULE) {
    const g = (r.games as Partial<ReportGame>[]).find(x => x?.game_no === plan.no);
    if (!g) return nein(`Spiel ${plan.no} fehlt.`);
    const h1 = slotOderLeer(g.home_slot), g1 = slotOderLeer(g.guest_slot), h2 = slotOderLeer(g.home_slot2), g2 = slotOderLeer(g.guest_slot2);
    if (h1 === undefined || g1 === undefined || h2 === undefined || g2 === undefined) return nein(`Spiel ${plan.no}: Spieler nicht lesbar.`);
    const doppel = plan.type === 'double';
    const offen = g.legs_home == null && g.legs_guest == null;
    if (!offen && !erlaubt.includes(`${g.legs_home}:${g.legs_guest}`)) return nein(`Spiel ${plan.no}: Ergebnis gibt es nicht.`);
    games.push({
      game_no: plan.no, game_type: plan.type,
      home_slot: h1, guest_slot: g1, home_slot2: doppel ? h2 : null, guest_slot2: doppel ? g2 : null,
      legs_home: offen ? null : g.legs_home as number, legs_guest: offen ? null : g.legs_guest as number,
    });
  }
  const highlights: HighlightEntry[] = [];
  if (r.highlights != null) {
    if (!Array.isArray(r.highlights) || r.highlights.length > 100) return nein('Highlights sind nicht lesbar.');
    for (const h of r.highlights as Partial<HighlightEntry>[]) {
      if (!h || (h.side !== 'home' && h.side !== 'guest') || !ganz(h.slot, 1, 8) || !HIGHLIGHT_TYPES.includes(h.type as never)) return nein('Highlight ist nicht lesbar.');
      const k = HIGHLIGHT_VALUE_CONFIG[h.type!];
      if (!ganz(h.value, k.min, k.max)) return nein('Highlight: Wert passt nicht.');
      if (h.game_no != null && !ganz(h.game_no, 1, 18)) return nein('Highlight: Spiel passt nicht.');
      highlights.push({ side: h.side, slot: h.slot, type: h.type!, value: h.value, game_no: h.game_no ?? null });
    }
  }
  return { stand: { heim, gast, games, highlights }, fehler: null };
}

/** Darf abgesendet werden? Dieselben Regeln wie im Formular. Gibt den Grund zurück, sonst null. */
export function absendeFehler(s: KioskStand): string | null {
  for (let i = 1; i <= 4; i++) {
    if (!s.heim.some(p => p.slot === i)) return `Heimspieler H${i} fehlt.`;
    if (!s.gast.some(p => p.slot === i)) return `Gastspieler G${i} fehlt.`;
  }
  const da = (liste: { slot: number }[], slot: number | null) => slot != null && liste.some(p => p.slot === slot);
  for (const g of s.games) {
    const d = g.game_type === 'double';
    if (!da(s.heim, g.home_slot) || !da(s.gast, g.guest_slot) || (d && (!da(s.heim, g.home_slot2) || !da(s.gast, g.guest_slot2)))) {
      return `Spiel ${g.game_no}${d ? ' (Doppel)' : ''}: Bitte für beide Seiten die Spieler antippen.`;
    }
    if (d && (g.home_slot === g.home_slot2 || g.guest_slot === g.guest_slot2)) return `Spiel ${g.game_no} (Doppel): Pro Seite zwei verschiedene Spieler.`;
    if (g.legs_home == null || g.legs_guest == null) return `Spiel ${g.game_no}: Ergebnis fehlt.`;
  }
  return null;
}
