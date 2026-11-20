'use client';

// Suchfeld über einer vom Server gerenderten Kartenliste (Spielstätten, Betreiber 20.11.2026):
// tippen → nur Karten, deren Suchtext alle Wörter enthält. Umlaute auch ohne Punkte.

import { useState, type ReactNode } from 'react';

const glatt = (s: string) => s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

export function SuchListe({ eintraege, platzhalter, leer, className, style }: {
  eintraege: { id: string; text: string; karte: ReactNode }[];
  platzhalter: string; leer: string; className?: string; style?: React.CSSProperties;
}) {
  const [q, setQ] = useState('');
  const woerter = glatt(q).split(/\s+/).filter(Boolean);
  const treffer = woerter.length ? eintraege.filter(e => { const t = glatt(e.text); return woerter.every(w => t.includes(w)); }) : eintraege;
  return (
    <>
      <div style={{ position: 'relative', maxWidth: 520, marginBottom: 8 }}>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={platzhalter} aria-label={platzhalter} style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, fontSize: 16,
          fontFamily: 'var(--font-manrope)', color: 'var(--th-text-strong)', background: 'var(--th-bg-card)',
          border: '1px solid var(--th-line-10)',
        }} />
      </div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginBottom: 16, minHeight: 16 }}>
        {woerter.length > 0 && (treffer.length ? `${treffer.length} von ${eintraege.length}` : leer)}
      </div>
      <div className={className} style={style}>
        {treffer.map(e => <div key={e.id} style={{ display: 'contents' }}>{e.karte}</div>)}
      </div>
    </>
  );
}
