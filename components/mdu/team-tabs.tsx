'use client';

// Reiterleiste der Teamseite 2026/27 — sieht aus wie die im Archiv
// (team-detail-client.tsx), die Inhalte rendert der Server.

import { useEffect, useState } from 'react';

const anker = (label: string) => label.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '-');

export function TeamTabs({ color, tabs }: { color: string; tabs: { label: string; content: React.ReactNode }[] }) {
  const [aktiv, setAktiv] = useState(0);
  // Reiter steht als #anker in der Adresse (Betreiber 16.11.2026): Verweise wie /teams/<id>#kader öffnen
  // gleich den Kader, und „Zurück“ landet im Reiter, aus dem man abgesprungen ist.
  const marken = tabs.map(t => anker(t.label)).join('|');
  useEffect(() => {
    const lies = () => { const i = marken.split('|').indexOf(window.location.hash.slice(1)); if (i >= 0) setAktiv(i); return i >= 0; };
    // Direktverweis (#kader): gleich zur Reiterleiste springen — beim „Zurück“ setzt der ScrollMerker danach die alte Stelle.
    queueMicrotask(() => { if (lies()) document.getElementById('team-reiter')?.scrollIntoView(); });
    window.addEventListener('hashchange', lies);
    return () => window.removeEventListener('hashchange', lies);
  }, [marken]);
  const waehle = (i: number) => {
    setAktiv(i);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${anker(tabs[i].label)}`);
  };
  return (
    <>
      {/* klebt unter dem 70px hohen Site-Header (wie im Archiv) */}
      <div id="team-reiter" style={{ borderTop: '1px solid var(--th-line-6)', background: 'var(--th-bg-tabbar2)', position: 'sticky', top: 70, zIndex: 10, scrollMarginTop: 70 }}>
        <div className="mdu-tabs-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 36, overflowX: 'auto' }}>
          {tabs.map((t, i) => (
            <button key={t.label} type="button" onClick={() => waehle(i)} style={{
              padding: '18px 0', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
              color: i === aktiv ? 'var(--th-text-strong)' : 'var(--th-text-dim)',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: i === aktiv ? `2px solid ${color}` : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer', background: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>
        {tabs[aktiv]?.content}
      </div>
    </>
  );
}
