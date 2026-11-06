'use client';

// Laufband „Team Manager ist da“ auf der Startseite (Betreiber, 06.11.2026) — gleicher
// Stil wie das Spieltag-Laufband, steht darunter. 7 Tage ab TM_START, Tipp → News-Beitrag
// mit Video, × blendet es je Gerät aus (`mdu-tm-banner-zu`). Theme-Farben, Akzent Gold.

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { Icon } from './icon';
import { TESTTAGE, TM_START } from '@/lib/premium';

const ZU = 'mdu-tm-banner-zu';
const zuGelesen = () => { try { return localStorage.getItem(ZU); } catch { return null; } };
const GOLD = '#E8B84A';

export function TeamManagerBanner() {
  const gespeichert = useSyncExternalStore(() => () => {}, zuGelesen, () => null);
  const [zu, setZu] = useState(false);
  if (zu || gespeichert === TM_START.datum) return null;
  const href = `/news#${TM_START.newsId}`;
  const teile = [
    'Der Team Manager ist da',
    'Zu- und Absagen, Aufstellung, Termine, Teamkasse und Statistik – alles fürs Team an einem Ort',
    `Jetzt ${TESTTAGE} Tage gratis testen`,
    'Video ansehen',
  ];
  const runde = teile.map((t, i) => <span key={i} className="mdu-tm-teil" style={i === 0 || i === 2 ? { fontWeight: 800, color: 'var(--th-text-strong)' } : undefined}>{t}</span>);
  return (
    <div role="region" aria-label="Neu: Team Manager" style={{
      display: 'flex', alignItems: 'stretch', background: 'var(--th-bg-card)', color: 'var(--th-text-body)',
      fontFamily: 'var(--font-manrope)', fontSize: 13, borderBottom: `2px solid ${GOLD}`, position: 'relative', zIndex: 1,
    }}>
      <Link href={href} style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', background: GOLD, color: '#3A2A00', textDecoration: 'none',
        fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>★ Neu</Link>
      <Link href={href} className="mdu-tm-fenster" aria-label="Der Team Manager ist da – Video ansehen"
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', color: 'inherit', textDecoration: 'none', padding: '9px 0' }}>
        <span className="mdu-tm-band">
          <span className="mdu-tm-runde">{runde}</span>
          <span className="mdu-tm-runde" aria-hidden>{runde}</span>
        </span>
      </Link>
      <button type="button" onClick={() => { try { localStorage.setItem(ZU, TM_START.datum); } catch { /* egal */ } setZu(true); }} aria-label="Laufband ausblenden" style={{
        flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--th-text-muted)', cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center',
      }}><Icon name="close" size={16} /></button>
      <style>{`
        .mdu-tm-band { display: inline-flex; white-space: nowrap; animation: mdu-tm-lauf 40s linear infinite; }
        .mdu-tm-fenster:hover .mdu-tm-band, .mdu-tm-fenster:focus-visible .mdu-tm-band { animation-play-state: paused; }
        .mdu-tm-runde { display: inline-flex; }
        .mdu-tm-teil { display: inline-flex; align-items: center; padding: 0 22px; }
        .mdu-tm-teil::after { content: '+++'; margin-left: 44px; color: ${GOLD}; font-weight: 800; }
        @keyframes mdu-tm-lauf { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (prefers-reduced-motion: reduce) {
          .mdu-tm-band { animation: none; }
          .mdu-tm-fenster { overflow-x: auto !important; }
          .mdu-tm-runde[aria-hidden] { display: none; }
        }
      `}</style>
    </div>
  );
}
