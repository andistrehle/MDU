// ============================================================
// Kiosk-Eingabe (Tablet im Lokal) — reine Regeln
// ============================================================
// Stand 19.11.2026: NUR die Probe unter /kiosk?probe=1 (rechnet im Gerät,
// schickt nichts an den Server). Gerätebindung, Server-Route und Speichern
// folgen erst nach Freigabe des Konzepts durch den Betreiber.
//
// Die Regeln hier sind dieselben wie im Formular
// (app/mein-bereich/spielberichte/page.tsx): Ersatzspieler binden sich an eine
// Position, ein Wechsel gilt für die folgenden Einzel dieser Position.
// ============================================================

import { GAME_SCHEDULE, type ReportGame, type ReportPlayer } from '@/lib/supabase/match-reports';

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
