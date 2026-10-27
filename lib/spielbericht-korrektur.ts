// ============================================================
// Korrektur eines bestätigten Spielberichts — reine Logik (Migration 0061)
// ============================================================
//
// Betreiber, 27.10.2026: Ein TC (Heim ODER Gast) fragt bis 7 Tage nach dem
// Spiel eine Korrektur an — Aufstellung (Namen), Spieler je Spiel,
// Ergebnisse, Highlights — nur mit Begründung. Der andere TC bestätigt oder
// lehnt ab, die Ligaleitung ist informiert und entscheidet, wenn niemand
// antwortet. Erst die Bestätigung schreibt den neuen Stand.
//
// Hier steht, was Browser UND Server brauchen: Stand vereinheitlichen,
// prüfen, Frist, und die Unterschiede in Worten (Anzeige + Benachrichtigung).
// ============================================================

import { GAME_SCHEDULE, HIGHLIGHT_TYPES, HIGHLIGHT_TYPE_LABELS, HIGHLIGHT_VALUE_CONFIG, type HighlightEntry, type ReportGame } from '@/lib/supabase/match-reports';
import { legResults, bestOfFuerLiga } from '@/lib/legs';

/** Tage nach dem Spiel, bis zu denen eine Korrektur angefragt werden kann. */
export const KORREKTUR_TAGE = 7;
/** Mindestlänge der Begründung (wie beim Protest). */
export const KORREKTUR_MIN = 15;

export type KorrekturStatus = 'offen' | 'bestaetigt' | 'abgelehnt' | 'zurueckgezogen';

export interface KorrekturSpieler { side: 'home' | 'guest'; slot: number; name: string; pass_no: string | null; player_id: string | null }
export interface KorrekturStand { players: KorrekturSpieler[]; games: ReportGame[]; highlights: HighlightEntry[] }

/** Wie der Server eine Anfrage ausliefert (ohne Interna wie Nutzer-IDs). */
export interface Korrektur {
  id: string;
  status: KorrekturStatus;
  reason: string;
  requested_team_id: string | null;
  confirm_team_id: string | null;
  changes: KorrekturStand;
  base: KorrekturStand;
  decision_note: string | null;
  created_at: string;
  decided_at: string | null;
  /** Darf der Aufrufer bestätigen/ablehnen bzw. zurückziehen? (rechnet der Server) */
  darfEntscheiden?: boolean;
  darfZurueckziehen?: boolean;
}

const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : null);
const slotOk = (v: unknown) => { const n = int(v); return n != null && n >= 1 && n <= 8 ? n : null; };

/** Einheitliche Form (sortiert, leere Plätze raus) — Grundlage für Vergleich und Speichern. */
export function vereinheitliche(s: KorrekturStand): KorrekturStand {
  return {
    players: (s.players ?? [])
      .filter(p => (p.name ?? '').trim())
      .map(p => ({ side: p.side, slot: p.slot, name: p.name.trim().slice(0, 80), pass_no: (p.pass_no ?? '').trim() || null, player_id: p.player_id && !p.player_id.startsWith('name:') ? p.player_id : null }))
      .sort((a, b) => (a.side === b.side ? a.slot - b.slot : a.side === 'home' ? -1 : 1)),
    games: (s.games ?? [])
      .map(g => ({
        game_no: g.game_no, game_type: g.game_type,
        home_slot: g.home_slot ?? null, guest_slot: g.guest_slot ?? null, home_slot2: g.home_slot2 ?? null, guest_slot2: g.guest_slot2 ?? null,
        legs_home: g.legs_home ?? null, legs_guest: g.legs_guest ?? null,
      }))
      .sort((a, b) => a.game_no - b.game_no),
    highlights: (s.highlights ?? [])
      .map(h => ({ side: h.side, slot: h.slot, type: h.type, value: h.value ?? null }))
      .sort((a, b) => hlKey(a).localeCompare(hlKey(b))),
  };
}

const hlKey = (h: HighlightEntry) => `${h.side}:${h.slot}:${h.type}:${h.value ?? ''}`;

/** Gleicher Inhalt? (beide vorher vereinheitlicht) */
export const gleicherStand = (a: KorrekturStand, b: KorrekturStand) => JSON.stringify(vereinheitliche(a)) === JSON.stringify(vereinheitliche(b));

/** Prüft einen Stand vom Browser. Gibt den Fehler in Worten zurück oder null. */
export function pruefeStand(s: KorrekturStand, ligaLabel: string | null): string | null {
  if (!s || !Array.isArray(s.players) || !Array.isArray(s.games) || !Array.isArray(s.highlights)) return 'Unvollständige Angaben.';
  const plaetze = new Set<string>();
  for (const p of s.players) {
    if ((p.side !== 'home' && p.side !== 'guest') || slotOk(p.slot) == null) return 'Ungültige Aufstellung.';
    const k = `${p.side}:${p.slot}`;
    if (plaetze.has(k)) return 'Ein Platz der Aufstellung ist doppelt.';
    plaetze.add(k);
  }
  const besetzt = (side: 'home' | 'guest', slot: number | null) => slot != null && s.players.some(p => p.side === side && p.slot === slot && (p.name ?? '').trim());
  for (let i = 1; i <= 4; i++) {
    if (!besetzt('home', i)) return `Heimspieler H${i} fehlt.`;
    if (!besetzt('guest', i)) return `Gastspieler G${i} fehlt.`;
  }
  if (s.games.length !== GAME_SCHEDULE.length) return 'Es müssen alle 18 Spiele dabei sein.';
  const erlaubt = legResults(bestOfFuerLiga(ligaLabel)) as readonly string[];
  for (const plan of GAME_SCHEDULE) {
    const g = s.games.find(x => x.game_no === plan.no);
    if (!g || g.game_type !== plan.type) return `Spiel ${plan.no} fehlt.`;
    const doppel = plan.type === 'double';
    for (const [side, slot] of [['home', g.home_slot], ['guest', g.guest_slot], ...(doppel ? [['home', g.home_slot2], ['guest', g.guest_slot2]] : [])] as ['home' | 'guest', number | null][]) {
      if (slotOk(slot) == null || !besetzt(side, slot)) return `Spiel ${plan.no}: Bitte für beide Seiten die Spieler zuordnen.`;
    }
    if (doppel && (g.home_slot === g.home_slot2 || g.guest_slot === g.guest_slot2)) return `Spiel ${plan.no} (Doppel): Pro Seite müssen zwei verschiedene Spieler stehen.`;
    if (!erlaubt.includes(`${g.legs_home}:${g.legs_guest}`)) return `Spiel ${plan.no}: Ergebnis fehlt oder passt nicht.`;
  }
  for (const h of s.highlights) {
    if (!HIGHLIGHT_TYPES.includes(h.type) || slotOk(h.slot) == null || (h.side !== 'home' && h.side !== 'guest')) return 'Ungültiges Highlight.';
    const c = HIGHLIGHT_VALUE_CONFIG[h.type];
    if (h.value != null && (int(h.value) == null || h.value < c.min || h.value > c.max)) return `Highlight ${HIGHLIGHT_TYPE_LABELS[h.type]}: Wert ${h.value} passt nicht.`;
    if (!besetzt(h.side, h.slot)) return 'Ein Highlight gehört zu einem leeren Platz.';
  }
  return null;
}

/** Letzter Tag, an dem noch angefragt werden kann (JJJJ-MM-TT). */
export function fristEnde(matchDate: string): string {
  const d = new Date(`${matchDate.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + KORREKTUR_TAGE);
  return d.toISOString().slice(0, 10);
}
/** Heute in Berlin (JJJJ-MM-TT). */
export const heuteBerlin = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
export const fristVorbei = (matchDate: string | null) => !matchDate || heuteBerlin() > fristEnde(matchDate);
export const datumDe = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}.${m}.${y}`; };

const P = (side: 'home' | 'guest') => (side === 'home' ? 'H' : 'G');

/** Unterschiede in Worten, z. B. „Spiel 15: Gast G3 Max → G6 Moritz“. */
export function unterschiede(alt: KorrekturStand, neu: KorrekturStand): string[] {
  const a = vereinheitliche(alt), n = vereinheitliche(neu);
  const name = (s: KorrekturStand, side: 'home' | 'guest', slot: number | null) =>
    slot == null ? '–' : `${P(side)}${slot}${(() => { const p = s.players.find(x => x.side === side && x.slot === slot); return p ? ` ${p.name}` : ''; })()}`;
  const out: string[] = [];

  for (const side of ['home', 'guest'] as const) {
    for (let slot = 1; slot <= 8; slot++) {
      const x = a.players.find(p => p.side === side && p.slot === slot)?.name ?? '';
      const y = n.players.find(p => p.side === side && p.slot === slot)?.name ?? '';
      if (x !== y) out.push(`Aufstellung ${P(side)}${slot}: ${x || 'leer'} → ${y || 'leer'}`);
    }
  }

  for (const g of n.games) {
    const v = a.games.find(x => x.game_no === g.game_no);
    if (!v) continue;
    const teile: string[] = [];
    if (v.legs_home !== g.legs_home || v.legs_guest !== g.legs_guest) teile.push(`Ergebnis ${v.legs_home ?? '–'}:${v.legs_guest ?? '–'} → ${g.legs_home ?? '–'}:${g.legs_guest ?? '–'}`);
    for (const side of ['home', 'guest'] as const) {
      const s1 = side === 'home' ? [v.home_slot, v.home_slot2] : [v.guest_slot, v.guest_slot2];
      const s2 = side === 'home' ? [g.home_slot, g.home_slot2] : [g.guest_slot, g.guest_slot2];
      const doppel = g.game_type === 'double';
      const txt = (st: KorrekturStand, sl: (number | null)[]) => (doppel ? sl : sl.slice(0, 1)).map(x => name(st, side, x)).join(' + ');
      const t1 = txt(a, s1), t2 = txt(n, s2);
      // Nur Platzwechsel zählen — ein neuer Name auf demselben Platz steht schon unter „Aufstellung“.
      if (JSON.stringify(doppel ? s1 : s1.slice(0, 1)) !== JSON.stringify(doppel ? s2 : s2.slice(0, 1))) teile.push(`${side === 'home' ? 'Heim' : 'Gast'} ${t1} → ${t2}`);
    }
    if (teile.length) out.push(`Spiel ${g.game_no}: ${teile.join(', ')}`);
  }

  const hlText = (s: KorrekturStand, h: HighlightEntry) => {
    const c = HIGHLIGHT_VALUE_CONFIG[h.type];
    return `${HIGHLIGHT_TYPE_LABELS[h.type]}${h.value != null ? (c.isCount ? ` ×${h.value}` : ` ${h.value}`) : ''} (${name(s, h.side, h.slot)})`;
  };
  const rest = [...n.highlights];
  for (const h of a.highlights) {
    const i = rest.findIndex(x => hlKey(x) === hlKey(h));
    if (i >= 0) rest.splice(i, 1);
    else out.push(`Highlight entfernt: ${hlText(a, h)}`);
  }
  for (const h of rest) out.push(`Highlight neu: ${hlText(n, h)}`);
  return out;
}

export const KORREKTUR_STATUS_TEXT: Record<KorrekturStatus, string> = {
  offen: 'Korrektur angefragt', bestaetigt: 'Korrektur bestätigt', abgelehnt: 'Korrektur abgelehnt', zurueckgezogen: 'Korrektur zurückgezogen',
};
