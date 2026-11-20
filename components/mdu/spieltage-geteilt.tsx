'use client';

// Spielplan einer Liga: der aktuelle Spieltag oben, die kommenden darunter, die gespielten hinter
// „Frühere Spieltage anzeigen (n)“ (Betreiber, 20.11.2026). Die Karten rendert der Server; hier wird
// nur nach dem HEUTIGEN Datum geteilt — die Seite ist statisch und wird nicht jeden Tag neu gebaut.
// `bis` = letzter Tag, an dem an diesem Spieltag noch etwas offen ist (Sonntag des Wochenendes bzw.
// der Termin eines verlegten Spiels ohne Ergebnis).

import { useEffect, useState, type ReactNode } from 'react';

export type SpieltagEintrag = { nr: number; bis: string; karte: ReactNode };

const berlinHeute = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

const raster = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 12 } as const;
const etikett = {
  display: 'inline-block', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: 'var(--th-text-body)', margin: '0 0 10px', padding: '4px 10px', borderRadius: 6,
  background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
} as const;

export function SpieltageGeteilt({ eintraege, heute: heuteBau }: { eintraege: SpieltagEintrag[]; heute: string }) {
  const [heute, setHeute] = useState(heuteBau);
  const [offen, setOffen] = useState(false);
  useEffect(() => { setHeute(berlinHeute()); }, []);

  const kommend = eintraege.filter(e => e.bis >= heute);
  const frueher = eintraege.filter(e => e.bis < heute).reverse();   // neuester zuerst

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {kommend.length > 0 ? (
        <div>
          <div style={etikett}>Aktuell und kommend</div>
          <div className="mdu-spieltag-grid" style={raster}>{kommend.map(e => <div key={e.nr}>{e.karte}</div>)}</div>
        </div>
      ) : (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: 0 }}>Alle Spieltage sind gespielt.</p>
      )}
      {frueher.length > 0 && (
        <div>
          <button type="button" onClick={() => setOffen(o => !o)} aria-expanded={offen} style={{
            width: '100%', padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-accent)',
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)',
          }}>
            {offen ? '▾ Frühere Spieltage ausblenden' : `▸ Frühere Spieltage anzeigen (${frueher.length})`}
          </button>
          {offen && (
            <div className="mdu-spieltag-grid" style={{ ...raster, marginTop: 12 }}>{frueher.map(e => <div key={e.nr}>{e.karte}</div>)}</div>
          )}
        </div>
      )}
    </div>
  );
}
