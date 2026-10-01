'use client';

import { printVenue } from '@/lib/spielplan/printing';
import { spielplanDaten27 } from '@/lib/data/saison-2027';

/** Druckt das Spielort-Blatt (alle Heimspiele des Lokals, Felder für Datum/Uhrzeit). */
export function SpielortDruck({ venueName }: { venueName: string }) {
  return (
    <button type="button" onClick={() => printVenue(spielplanDaten27(), venueName)} style={{
      padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
      background: 'var(--th-accent)', color: '#fff', border: '1.5px solid var(--th-accent)',
    }}>
      Plan drucken / als PDF
    </button>
  );
}
