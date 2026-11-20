// ============================================================
// Live-Ansicht des Spielberichts (Monitor im Lokal)
// ============================================================
// Vom Betreiber festgelegt (13.10.2026): KEIN öffentlicher Link, nur fürs
// Spiel vor Ort — alle schauen auf dem Monitor mit, während der Kapitän den
// Bericht erfasst. Das Formular schickt seinen Stand bei JEDER Eingabe an ein
// zweites Fenster desselben Browsers (BroadcastChannel); dazu liegt der letzte
// Stand im localStorage, damit ein neu geöffnetes Fenster sofort etwas zeigt.
// Nichts davon geht über den Server oder in die Datenbank.
// ============================================================

import type { HighlightEntry, ReportGame, ReportPlayer } from '@/lib/supabase/match-reports';

export interface LiveStand {
  homeTeamId: string | null;
  guestTeamId: string | null;
  homeName: string;
  guestName: string;
  liga: string;
  datum: string | null;
  ort: string;
  homePlayers: ReportPlayer[];
  guestPlayers: ReportPlayer[];
  games: ReportGame[];
  highlights: HighlightEntry[];
  bestOf: 3 | 5;
  zeit: number;
  /** Darf im zweiten Fenster geklickt werden? (Formular offen und bearbeitbar) */
  bearbeitbar?: boolean;
}

const KANAL = 'mdu-spielbericht-live';
const SPEICHER = 'mdu-spielbericht-live';

let kanal: BroadcastChannel | null = null;
const holeKanal = () => {
  if (typeof BroadcastChannel === 'undefined') return null;
  return (kanal ??= new BroadcastChannel(KANAL));
};

export function sendeLive(stand: LiveStand) {
  try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch { /* privat / voll */ }
  try { holeKanal()?.postMessage(stand); } catch { /* egal */ }
}

export function letzterLiveStand(): LiveStand | null {
  try { const s = localStorage.getItem(SPEICHER); return s ? JSON.parse(s) as LiveStand : null; } catch { return null; }
}

/** Abonniert Änderungen (BroadcastChannel + storage-Ereignis als Rückfall). */
export function abonniereLive(cb: (s: LiveStand) => void): () => void {
  const k = holeKanal();
  const onMsg = (e: MessageEvent<LiveStand>) => cb(e.data);
  const onStorage = (e: StorageEvent) => { if (e.key === SPEICHER && e.newValue) { try { cb(JSON.parse(e.newValue)); } catch { /* egal */ } } };
  k?.addEventListener('message', onMsg);
  window.addEventListener('storage', onStorage);
  return () => { k?.removeEventListener('message', onMsg); window.removeEventListener('storage', onStorage); };
}

// ── Eingaben aus dem zweiten Fenster zurück ins Formular (Betreiber, 20.11.2026) ──
// Das zweite Fenster steht oft am Monitor/Fernseher, bedient mit einer Funkmaus. Es ändert selbst
// nichts, sondern schickt jede Eingabe ans Formular desselben Browsers; das Formular führt sie aus,
// speichert wie sonst und schickt den neuen Stand zurück. Ohne offenes Formular passiert nichts.
type Feld = 'home_slot' | 'guest_slot' | 'home_slot2' | 'guest_slot2';
export type LiveAktion =
  | { typ: 'legs'; no: number; res: string }
  | { typ: 'slot'; no: number; feld: Feld; slot: number | null }
  | { typ: 'highlight'; h: HighlightEntry }
  | { typ: 'highlight_weg'; index: number };

const AKTION_KANAL = 'mdu-spielbericht-aktion';
const AKTION_SPEICHER = 'mdu-spielbericht-aktion';
let aktionKanal: BroadcastChannel | null = null;
const holeAktionKanal = () => {
  if (typeof BroadcastChannel === 'undefined') return null;
  return (aktionKanal ??= new BroadcastChannel(AKTION_KANAL));
};

export function sendeAktion(a: LiveAktion) {
  const k = holeAktionKanal();
  if (k) { try { k.postMessage(a); return; } catch { /* Rückfall unten */ } }
  // Rückfall ohne BroadcastChannel: storage-Ereignis (Zeit macht jeden Eintrag neu).
  try { localStorage.setItem(AKTION_SPEICHER, JSON.stringify({ a, t: Date.now() + Math.random() })); } catch { /* egal */ }
}

export function abonniereAktionen(cb: (a: LiveAktion) => void): () => void {
  const k = holeAktionKanal();
  const onMsg = (e: MessageEvent<LiveAktion>) => cb(e.data);
  const onStorage = (e: StorageEvent) => { if (e.key === AKTION_SPEICHER && e.newValue) { try { cb((JSON.parse(e.newValue) as { a: LiveAktion }).a); } catch { /* egal */ } } };
  k?.addEventListener('message', onMsg);
  window.addEventListener('storage', onStorage);
  return () => { k?.removeEventListener('message', onMsg); window.removeEventListener('storage', onStorage); };
}
