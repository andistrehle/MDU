'use client';

import { printSpielortAktuell } from '@/lib/spielplan/druck-aktuell';

// Druckt den Spielort-Plan mit den aktuellen Terminen (lib/spielplan/druck-aktuell.ts:
// Masterplan + Heimrechttausch + Verlegungen — dieselben Daten wie die Seite).
export function SpielortDruck({ venueId }: { venueId: string }) {
  return (
    <button type="button" onClick={() => printSpielortAktuell(venueId)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
      background: 'var(--th-accent)', color: '#fff', border: '1.5px solid var(--th-accent)',
    }}>
      Plan drucken / als PDF
    </button>
  );
}
