'use client';

// Hinweis „Verlegung angefragt“ an einem Spiel im Spielplan — solange ein TC
// einen neuen Termin vorgeschlagen hat und er noch nicht bestätigt ist
// (vom Betreiber so gewünscht: alter Termin bleibt sichtbar, mit Hinweis).

import { useEffect, useState } from 'react';
import { offeneVerlegungen } from '@/lib/supabase/verlegung';

export function VerlegungEtikett({ k }: { k: string }) {
  const [an, setAn] = useState(false);
  useEffect(() => { let weg = false; void offeneVerlegungen().then(s => { if (!weg) setAn(s.has(k)); }); return () => { weg = true; }; }, [k]);
  if (!an) return null;
  return (
    <span title="Ein Teamcaptain hat einen neuen Termin vorgeschlagen, der Gegner hat noch nicht bestätigt." style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800,
      letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(78,125,189,0.14)', color: '#3C6AA8',
    }}>Verlegung angefragt</span>
  );
}
