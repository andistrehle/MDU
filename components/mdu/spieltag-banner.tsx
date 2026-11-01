'use client';

// Laufband „Spieltag“ (Breaking-News-Stil) ganz oben auf der Startseite —
// Titel + Ergebnisse des neuesten Spieltagsberichts, Tippen öffnet ihn.
// × blendet es auf diesem Gerät aus, bis der nächste Bericht kommt
// (localStorage `mdu-banner-zu` = Kennung des Berichts). Bei „weniger
// Bewegung“ läuft nichts — dann lässt es sich seitlich schieben.

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { Icon } from './icon';
import type { SpieltagBanner as Daten } from '@/lib/server/spieltag-banner';

const ZU = 'mdu-banner-zu';
const zuGelesen = () => { try { return localStorage.getItem(ZU); } catch { return null; } };

export function SpieltagBanner({ daten }: { daten: Daten }) {
  const gespeichert = useSyncExternalStore(() => () => {}, zuGelesen, () => null);
  const [zu, setZu] = useState(false);
  if (zu || gespeichert === daten.id) return null;

  const schliessen = () => {
    try { localStorage.setItem(ZU, daten.id); } catch { /* egal */ }
    setZu(true);
  };

  // Tempo gleich halten: je länger der Text, desto länger die Runde.
  const zeichen = daten.titel.length + daten.ligen.reduce((n, l) => n + l.name.length + l.ergebnisse.reduce((m, e) => m + e.heim.length + e.gast.length + 8, 0), 0);
  const dauer = `${Math.max(20, Math.round(zeichen * 0.15))}s`;

  const teile = (
    <>
      <span className="mdu-tk-teil" style={{ fontWeight: 800, color: '#fff' }}>{daten.titel}</span>
      {daten.ligen.map(l => (
        <span key={l.name} className="mdu-tk-teil">
          <span style={{ fontWeight: 800, color: l.farbe }}>{l.name}</span>
          {l.ergebnisse.map((e, i) => (
            <span key={i} style={{ marginLeft: 14 }}>
              {e.heim} <strong style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#fff' }}>{e.erg}</strong> {e.gast}
            </span>
          ))}
        </span>
      ))}
    </>
  );

  return (
    <div role="region" aria-label="Neuester Spieltagsbericht" style={{
      display: 'flex', alignItems: 'stretch', background: '#141414', color: 'rgba(255,255,255,0.82)',
      fontFamily: 'var(--font-manrope)', fontSize: 13, borderBottom: '2px solid #D40000', position: 'relative', zIndex: 1,
    }}>
      <Link href={`/news#${daten.id}`} style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
        background: '#D40000', color: '#fff', textDecoration: 'none',
        fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <span className="mdu-tk-punkt" aria-hidden /> Spieltag
      </Link>
      <Link href={`/news#${daten.id}`} className="mdu-tk-fenster" aria-label={`${daten.titel} – Bericht öffnen`}
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', color: 'inherit', textDecoration: 'none', padding: '9px 0', ['--mdu-tk-dauer' as string]: dauer }}>
        <span className="mdu-tk-band">
          <span className="mdu-tk-runde">{teile}</span>
          <span className="mdu-tk-runde" aria-hidden>{teile}</span>
        </span>
      </Link>
      <button type="button" onClick={schliessen} aria-label="Laufband ausblenden" style={{
        flexShrink: 0, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0 12px',
        display: 'flex', alignItems: 'center',
      }}>
        <Icon name="close" size={16} />
      </button>
      <style>{`
        .mdu-tk-band { display: inline-flex; white-space: nowrap; animation: mdu-tk-lauf var(--mdu-tk-dauer, 60s) linear infinite; }
        .mdu-tk-fenster:hover .mdu-tk-band, .mdu-tk-fenster:focus-visible .mdu-tk-band { animation-play-state: paused; }
        .mdu-tk-runde { display: inline-flex; padding-right: 0; }
        .mdu-tk-teil { display: inline-flex; align-items: center; padding: 0 22px; }
        .mdu-tk-teil::after { content: '+++'; margin-left: 44px; color: #D40000; font-weight: 800; }
        .mdu-tk-punkt { width: 7px; height: 7px; border-radius: 50%; background: #fff; animation: mdu-tk-blink 1.4s ease-in-out infinite; }
        @keyframes mdu-tk-lauf { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes mdu-tk-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
        @media (prefers-reduced-motion: reduce) {
          .mdu-tk-band, .mdu-tk-punkt { animation: none; }
          .mdu-tk-fenster { overflow-x: auto !important; }
          .mdu-tk-runde[aria-hidden] { display: none; }
        }
      `}</style>
    </div>
  );
}
