'use client';

// Reiterleiste der Teamseite 2026/27 — sieht aus wie die im Archiv
// (team-detail-client.tsx), die Inhalte rendert der Server.

import { useState } from 'react';

export function TeamTabs({ color, tabs }: { color: string; tabs: { label: string; content: React.ReactNode }[] }) {
  const [aktiv, setAktiv] = useState(0);
  return (
    <>
      {/* klebt unter dem 70px hohen Site-Header (wie im Archiv) */}
      <div style={{ borderTop: '1px solid var(--th-line-6)', background: 'var(--th-bg-tabbar2)', position: 'sticky', top: 70, zIndex: 10 }}>
        <div className="mdu-tabs-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 36, overflowX: 'auto' }}>
          {tabs.map((t, i) => (
            <button key={t.label} type="button" onClick={() => setAktiv(i)} style={{
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
