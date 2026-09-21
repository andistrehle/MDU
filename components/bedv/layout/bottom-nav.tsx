'use client';

// ============================================================
// Untere Navigationsleiste (Handy und kleines Tablet)
// ============================================================
//
// Die wichtigste mobile Entscheidung dieser Demo. Viele Spieler öffnen die
// Seite ausschließlich am Telefon — meist einhändig, oft in einem Lokal.
// Deshalb liegen die fünf Wege, die zählen, unten am Daumen statt oben
// hinter einem Menüknopf:
//
//   Start · Ligen · Suche · Mein Bereich · Mehr
//
// „Mehr" fährt ein Blatt hoch statt in eine Zwischenseite zu führen — ein
// Klick hin, ein Klick zurück, ohne die Seite zu verlieren, auf der man
// gerade war.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Search, UserRound, Menu, X } from 'lucide-react';
import { bedvPath, bedvRelativePath, BEDV_DISCLAIMER } from '@/lib/bedv/site';
import { GlobalSearch } from '../search/global-search';
import { HAUPT_NAV, WEITERE_NAV, istAktiv } from './navigation';
import { useDemoAuth } from './demo-auth';
import { kontoVon } from '@/data/bedv/demo-konten';

export function BottomNav() {
  const pfad = bedvRelativePath(usePathname() ?? '/');
  const [sucheOffen, setSucheOffen] = useState(false);
  // Wie in der Kopfzeile: Gemerkt wird die Seite, auf der geöffnet wurde.
  // Beim Seitenwechsel schließt sich das Blatt dadurch von selbst.
  const [mehrOffenAuf, setMehrOffenAuf] = useState<string | null>(null);
  const mehrOffen = mehrOffenAuf === pfad;
  const setMehrOffen = (offen: boolean) => setMehrOffenAuf(offen ? pfad : null);
  const { rolle, bereit } = useDemoAuth();

  // Solange das Blatt offen ist, soll die Seite darunter nicht mitscrollen.
  useEffect(() => {
    if (!mehrOffen) return;
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = vorher; };
  }, [mehrOffen]);

  const schliesseSuche = useCallback(() => setSucheOffen(false), []);
  const konto = bereit && rolle ? kontoVon(rolle) : null;

  return (
    <>
      <nav className="bedv-bottomnav" aria-label="Hauptnavigation">
        <Link href={bedvPath()} data-aktiv={istAktiv('/', pfad)}>
          <Home size={19} aria-hidden="true" />
          Start
        </Link>
        <Link href={bedvPath('/ligen')} data-aktiv={istAktiv('/ligen', pfad)}>
          <Trophy size={19} aria-hidden="true" />
          Ligen
        </Link>
        <button onClick={() => setSucheOffen(true)} aria-label="Suche öffnen">
          <Search size={19} aria-hidden="true" />
          Suche
        </button>
        <Link href={bedvPath(konto ? '/mein-bereich' : '/login')} data-aktiv={istAktiv('/mein-bereich', pfad) || istAktiv('/login', pfad)}>
          <UserRound size={19} aria-hidden="true" />
          {konto ? 'Mein Bereich' : 'Login'}
        </Link>
        <button onClick={() => setMehrOffen(true)} aria-label="Weitere Seiten" aria-expanded={mehrOffen}>
          <Menu size={19} aria-hidden="true" />
          Mehr
        </button>
      </nav>

      {mehrOffen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Weitere Seiten"
          onMouseDown={e => { if (e.target === e.currentTarget) setMehrOffen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 150,
            background: 'rgba(6, 16, 31, 0.5)', display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%', background: 'var(--bedv-card)',
              borderTopLeftRadius: 18, borderTopRightRadius: 18,
              padding: '14px 16px calc(18px + env(safe-area-inset-bottom))',
              maxHeight: '82vh', overflowY: 'auto',
              animation: 'bedv-sheet-up 0.22s cubic-bezier(0.2, 0.8, 0.3, 1) both',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontFamily: 'var(--bedv-font-display)', fontSize: '1.05rem' }}>Alle Bereiche</strong>
              <button onClick={() => setMehrOffen(false)} aria-label="Schließen" className="bedv-btn bedv-btn--quiet bedv-btn--sm">
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="bedv-grid bedv-grid--2 bedv-grid--keep2" style={{ gap: 8 }}>
              {[...HAUPT_NAV, ...WEITERE_NAV].map(p => (
                <Link
                  key={p.pfad}
                  href={bedvPath(p.pfad)}
                  style={{
                    padding: '12px 13px', borderRadius: 11,
                    border: '1px solid var(--bedv-line)',
                    background: istAktiv(p.pfad, pfad) ? 'var(--bedv-blue-mist)' : 'var(--bedv-tint)',
                    color: istAktiv(p.pfad, pfad) ? 'var(--bedv-blue-deep)' : 'var(--bedv-ink)',
                    fontWeight: 600, fontSize: '0.92rem',
                  }}
                >
                  {p.label}
                </Link>
              ))}
            </div>

            <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--bedv-ink-faint)', lineHeight: 1.5 }}>
              {BEDV_DISCLAIMER}
            </p>
          </div>
        </div>
      )}

      {/* Nur eingehängt, solange die Suche offen ist: Dann setzt sich ihr
          Zustand (Suchbegriff, Markierung) beim Schließen von selbst
          zurück, ohne dass ein Effekt ihn aufräumen muss. */}
      {sucheOffen && <GlobalSearch schliessen={schliesseSuche} />}
    </>
  );
}
