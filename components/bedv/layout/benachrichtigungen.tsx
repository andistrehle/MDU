'use client';

// ============================================================
// Glocke mit Benachrichtigungen
// ============================================================
//
// Reine Oberfläche: Es wird nichts abgerufen und nichts als gelesen
// gespeichert. Der Zähler ist die Zahl der Einträge zur aktuellen Rolle —
// wer im Gespräch die Rolle wechselt, sieht die Liste sofort mitwechseln,
// und genau das ist der Punkt.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Info, AlertCircle } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { benachrichtigungenFuer } from '@/data/bedv/benachrichtigungen';
import { useDemoAuth } from './demo-auth';

const SYMBOL = { erfolg: Check, aktion: AlertCircle, info: Info } as const;
const FARBE = {
  erfolg: 'var(--bedv-green)', aktion: 'var(--bedv-accent-deep)', info: 'var(--bedv-blue)',
} as const;
const HINTERGRUND = {
  erfolg: 'var(--bedv-green-soft)', aktion: 'var(--bedv-accent-soft)', info: 'var(--bedv-blue-mist)',
} as const;

function alter(vorTagen: number): string {
  if (vorTagen === 0) return 'heute';
  if (vorTagen === 1) return 'gestern';
  return `vor ${vorTagen} Tagen`;
}

export function Glocke() {
  const { rolle, bereit } = useDemoAuth();
  const [offen, setOffen] = useState(false);
  const huelle = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;
    const ausserhalb = (e: MouseEvent) => {
      if (huelle.current && !huelle.current.contains(e.target as Node)) setOffen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    document.addEventListener('mousedown', ausserhalb);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', ausserhalb);
      document.removeEventListener('keydown', esc);
    };
  }, [offen]);

  if (!bereit || !rolle) return null;
  const liste = benachrichtigungenFuer(rolle);

  return (
    <div ref={huelle} style={{ position: 'relative' }}>
      <button
        onClick={() => setOffen(o => !o)}
        aria-label={`Benachrichtigungen (${liste.length})`}
        aria-expanded={offen}
        style={{
          position: 'relative', background: 'rgba(255,255,255,0.09)', border: 'none',
          width: 36, height: 36, borderRadius: 9, cursor: 'pointer',
          display: 'grid', placeItems: 'center', color: 'var(--bedv-on-dark)',
        }}
      >
        <Bell size={17} aria-hidden="true" />
        {liste.length > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17,
              borderRadius: 999, background: 'var(--bedv-accent)', color: '#3A2600',
              fontSize: '0.64rem', fontWeight: 800, display: 'grid', placeItems: 'center',
              padding: '0 4px', fontFamily: 'var(--bedv-font-display)',
              border: '2px solid var(--bedv-navy-900)',
            }}
          >
            {liste.length}
          </span>
        )}
      </button>

      {offen && (
        <div
          className="bedv-card bedv-pop-down"
          style={{
            position: 'absolute', top: 44, right: 0, width: 340, maxWidth: 'calc(100vw - 24px)',
            padding: 0, zIndex: 120, boxShadow: 'var(--bedv-shadow-lg)', overflow: 'hidden',
          }}
        >
          <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--bedv-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontFamily: 'var(--bedv-font-display)', fontSize: '0.92rem' }}>Benachrichtigungen</strong>
            <span className="bedv-badge bedv-badge--demo">Demo</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {liste.map(b => {
              const Symbol = SYMBOL[b.art];
              const inhalt = (
                <>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 28, height: 28, borderRadius: 8, flex: 'none',
                      display: 'grid', placeItems: 'center',
                      background: HINTERGRUND[b.art], color: FARBE[b.art],
                    }}
                  >
                    <Symbol size={15} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.35 }}>{b.titel}</span>
                    <span style={{ display: 'block', color: 'var(--bedv-ink-dim)', fontSize: '0.8rem', marginTop: 2, lineHeight: 1.45 }}>{b.text}</span>
                    <span style={{ display: 'block', color: 'var(--bedv-ink-faint)', fontSize: '0.72rem', marginTop: 3 }}>{alter(b.vorTagen)}</span>
                  </span>
                </>
              );
              const stil: React.CSSProperties = {
                display: 'flex', gap: 10, padding: '11px 14px',
                borderBottom: '1px solid var(--bedv-line-soft)', alignItems: 'flex-start',
              };
              return b.ziel
                ? <Link key={b.id} href={bedvPath(b.ziel)} onClick={() => setOffen(false)} style={stil}>{inhalt}</Link>
                : <div key={b.id} style={stil}>{inhalt}</div>;
            })}
          </div>
          <div style={{ padding: '9px 14px', background: 'var(--bedv-tint)', fontSize: '0.75rem', color: 'var(--bedv-ink-faint)' }}>
            In der echten Plattform zusätzlich als E-Mail oder Push.
          </div>
        </div>
      )}
    </div>
  );
}
