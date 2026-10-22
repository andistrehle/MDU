// ============================================================
// Admin → Erfassung (Browser-Seite; Server: lib/server/erfassung.ts)
// ============================================================

import { mitAnmeldung } from '@/lib/auth/mit-anmeldung';
import type { Erfassung, Erfassungsweg, ErfassungZeile } from '@/lib/server/erfassung';

export type { Erfassung, Erfassungsweg, ErfassungZeile };

export const WEG: Record<Erfassungsweg, { label: string; farbe: string; icon: string }> = {
  live:          { label: 'Live',          farbe: 'var(--th-win)',      icon: '⚡' },
  foto:          { label: 'Foto',          farbe: '#3b82f6',            icon: '📷' },
  abgeschrieben: { label: 'Abgeschrieben', farbe: 'var(--th-gold)',     icon: '📝' },
};
export const WEGE: Erfassungsweg[] = ['live', 'foto', 'abgeschrieben'];

export async function ladeErfassung(): Promise<{ data: Erfassung | null; error: string | null }> {
  try {
    const r = await mitAnmeldung('/api/admin/erfassung', { cache: 'no-store' });
    const j = await r.json() as Erfassung & { error?: string };
    return r.ok ? { data: j, error: null } : { data: null, error: j.error ?? 'Laden fehlgeschlagen.' };
  } catch { return { data: null, error: 'Keine Verbindung – bitte noch einmal versuchen.' }; }
}

/** Anzahl je Weg. */
export function zaehle(zeilen: ErfassungZeile[]): Record<Erfassungsweg, number> {
  const z: Record<Erfassungsweg, number> = { live: 0, foto: 0, abgeschrieben: 0 };
  for (const r of zeilen) z[r.weg] += 1;
  return z;
}
