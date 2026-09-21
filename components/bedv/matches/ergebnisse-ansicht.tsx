'use client';

// ============================================================
// Ergebnisse mit Filter
// ============================================================
//
// Liga wechseln, ohne die Seite zu verlassen — das ist die Anforderung.
// Deshalb kommen ALLE Begegnungen der laufenden Spielzeit fertig
// aufbereitet vom Server, und hier wird nur ausgewählt. Kein Nachladen,
// kein Ladebalken mitten im Gespräch.
//
// Gezeigt werden standardmäßig die letzten drei Spieltage. Wer weiter
// zurück will, schaltet um — die Alternative wären 400 Karten beim Öffnen.
// ============================================================

import { useMemo, useState } from 'react';
import type { Begegnung } from '@/data/bedv/typen';
import { LeerZustand } from '../ui/bausteine';
import { Spielplan } from './spielplan';

export function ErgebnisseAnsicht({
  begegnungen, staffeln, hoechsterSpieltag,
}: {
  begegnungen: Begegnung[];
  staffeln: { slug: string; name: string }[];
  hoechsterSpieltag: number;
}) {
  const [staffel, setStaffel] = useState<string | null>(null);
  const [umfang, setUmfang] = useState<'letzte' | 'alle'>('letzte');
  const [spieltag, setSpieltag] = useState<number | null>(null);

  const gefiltert = useMemo(() => {
    const abSpieltag = umfang === 'letzte' ? Math.max(1, hoechsterSpieltag - 2) : 1;
    return begegnungen.filter(b =>
      (!staffel || b.ligaSlug === staffel)
      && (spieltag !== null ? b.spieltag === spieltag : b.spieltag >= abSpieltag));
  }, [begegnungen, staffel, umfang, spieltag, hoechsterSpieltag]);

  // Neueste zuerst — beim Blick auf Ergebnisse interessiert der letzte
  // Spieltag, nicht der erste.
  const sortiert = useMemo(
    () => gefiltert.slice().sort((a, b) => b.spieltag - a.spieltag || (a.datum < b.datum ? 1 : -1)),
    [gefiltert],
  );

  const knopf = (aktiv: boolean): React.CSSProperties => aktiv
    ? { background: 'var(--bedv-blue)', color: '#fff' }
    : { background: 'var(--bedv-tint-2)', color: 'var(--bedv-ink-dim)' };

  return (
    <>
      <div style={{ display: 'grid', gap: 11, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="bedv-btn bedv-btn--sm" style={knopf(staffel === null)} onClick={() => setStaffel(null)}>
            Alle Ligen
          </button>
          {staffeln.map(s => (
            <button key={s.slug} className="bedv-btn bedv-btn--sm" style={knopf(staffel === s.slug)} onClick={() => setStaffel(s.slug)}>
              {s.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="bedv-btn bedv-btn--sm"
            style={knopf(spieltag === null && umfang === 'letzte')}
            onClick={() => { setUmfang('letzte'); setSpieltag(null); }}
          >
            Letzte Spieltage
          </button>
          <button
            className="bedv-btn bedv-btn--sm"
            style={knopf(spieltag === null && umfang === 'alle')}
            onClick={() => { setUmfang('alle'); setSpieltag(null); }}
          >
            Ganze Spielzeit
          </button>
          <span aria-hidden="true" style={{ width: 1, height: 22, background: 'var(--bedv-line)', margin: '0 4px' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.84rem', color: 'var(--bedv-ink-dim)' }}>
            Spieltag
            <select
              className="bedv-select"
              style={{ width: 'auto', padding: '6px 10px' }}
              value={spieltag ?? ''}
              onChange={e => setSpieltag(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">alle</option>
              {Array.from({ length: hoechsterSpieltag }, (_, i) => hoechsterSpieltag - i).map(n => (
                <option key={n} value={n}>{n}. Spieltag</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {sortiert.length === 0 ? (
        <LeerZustand titel="Keine Ergebnisse" text="Für diese Auswahl liegt noch kein gewertetes Ergebnis vor." />
      ) : (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', marginBottom: 14 }}>
            {sortiert.length} {sortiert.length === 1 ? 'Begegnung' : 'Begegnungen'}
          </div>
          <Spielplan begegnungen={sortiert} mitLiga={staffel === null} />
        </>
      )}
    </>
  );
}
