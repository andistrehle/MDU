'use client';

// ============================================================
// Suche in der Kopfzeile (Betreiber, 20.11.2026, per Klick-Umfrage)
// ============================================================
// Lupe auf jeder Seite → Suchfeld über die ganze Breite: Teams, Spieler (Archiv markiert),
// Spielstätten, Seiten, FAQ. Der Index kommt EINMAL von /api/suche (erst beim Öffnen),
// gefiltert wird im Browser (lib/suche.ts). Als Portal an <body>: die Kopfzeile hat
// `backdrop-filter`, darin wäre `position: fixed` an die Kopfzeile gebunden.

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';
import { suche, ART_TITEL, MIN_ZEICHEN, type SuchEintrag } from '@/lib/suche';

let merker: Promise<SuchEintrag[]> | null = null;
const ladeIndex = () => (merker ??= fetch('/api/suche').then(r => { if (!r.ok) throw new Error('index'); return r.json(); })
  .then(j => (j.index ?? []) as SuchEintrag[]).catch(e => { merker = null; throw e; }));

const M = 'var(--font-manrope)';

export function SucheKnopf({ gross = false }: { gross?: boolean }) {
  const [offen, setOffen] = useState(false);
  return (
    <>
      <button type="button" className="mdu-suche-knopf" aria-label="Suchen" title="Suchen: Spieler, Team, Lokal" onClick={() => setOffen(true)} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
        width: gross ? 40 : 36, height: gross ? 40 : 36, borderRadius: 8, padding: 0,
        background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)',
      }}>
        <Icon name="search" size={gross ? 18 : 16} stroke={2.2} />
      </button>
      {offen && <SuchFenster onZu={() => setOffen(false)} />}
    </>
  );
}

function SuchFenster({ onZu }: { onZu: () => void }) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<SuchEintrag[] | null>(null);
  const [fehler, setFehler] = useState(false);
  const feld = useRef<HTMLInputElement>(null);
  const pfad = usePathname();
  const start = useRef(pfad);

  useEffect(() => { ladeIndex().then(setIndex).catch(() => setFehler(true)); }, []);
  useEffect(() => { feld.current?.focus(); }, []);
  // Seite gewechselt (Treffer angetippt) → zu.
  useEffect(() => { if (pfad !== start.current) onZu(); }, [pfad, onZu]);
  useEffect(() => {
    const taste = (e: KeyboardEvent) => { if (e.key === 'Escape') onZu(); };
    window.addEventListener('keydown', taste);
    const alt = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', taste); document.body.style.overflow = alt; };
  }, [onZu]);

  const gruppen = useMemo(() => (index ? suche(index, q) : []), [index, q]);
  const tippt = q.trim().length >= MIN_ZEICHEN;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Suche" onClick={onZu} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,16,28,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--th-bg-card)', borderRadius: '0 0 16px 16px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 12px 16px', borderBottom: '1px solid var(--th-line-6)' }}>
          <Icon name="search" size={18} stroke={2.2} style={{ color: 'var(--th-text-faint)', flexShrink: 0 }} />
          <input ref={feld} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Spieler, Team oder Lokal suchen" aria-label="Suchbegriff" enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false}
            style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontFamily: M, fontSize: 17, color: 'var(--th-text-strong)', padding: '8px 0' }} />
          <button type="button" onClick={onZu} style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: M, fontWeight: 700, fontSize: 14, color: 'var(--th-accent)', padding: '8px 6px' }}>Schließen</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '6px 8px 14px', WebkitOverflowScrolling: 'touch' }}>
          {fehler && <Hinweis>Die Suche ist gerade nicht erreichbar. Probier es gleich noch einmal.</Hinweis>}
          {!fehler && !index && <Hinweis>Lädt …</Hinweis>}
          {index && !tippt && <Hinweis>Tippe mindestens {MIN_ZEICHEN} Buchstaben – zum Beispiel einen Namen, ein Team oder ein Lokal.</Hinweis>}
          {index && tippt && !gruppen.length && <Hinweis>Nichts gefunden zu „{q.trim()}“. Probier einen Teil des Namens.</Hinweis>}
          {gruppen.map(g => (
            <div key={g.art}>
              <div style={{ fontFamily: M, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--th-text-faint)', padding: '12px 8px 4px' }}>{ART_TITEL[g.art]}</div>
              {g.eintraege.map(e => (
                <Link key={e.h} href={e.h} onClick={() => { if (e.h.split('#')[0] === pfad) onZu(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, textDecoration: 'none' }} className="mdu-card-hover">
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: M, fontWeight: 700, fontSize: 15, color: 'var(--th-text-strong)' }}>{e.t}</span>
                    {e.u && <span style={{ display: 'block', fontFamily: M, fontSize: 12.5, color: 'var(--th-text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.u}</span>}
                  </span>
                  {e.archiv && <span style={{ fontFamily: M, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 5, background: 'var(--th-line-8)', color: 'var(--th-text-muted)', flexShrink: 0 }}>Archiv</span>}
                  <Icon name="arrow-right" size={14} stroke={2} style={{ color: 'var(--th-text-faint)', flexShrink: 0 }} />
                </Link>
              ))}
              {g.mehr > 0 && <div style={{ fontFamily: M, fontSize: 12, color: 'var(--th-text-faint)', padding: '4px 8px' }}>und {g.mehr} weitere – tippe mehr Buchstaben.</div>}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Hinweis({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: M, fontSize: 13.5, lineHeight: 1.5, color: 'var(--th-text-muted)', padding: '14px 8px 6px' }}>{children}</div>;
}
