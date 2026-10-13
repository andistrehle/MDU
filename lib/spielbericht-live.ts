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
