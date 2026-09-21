'use client';

// ============================================================
// Kopfzeile der BeDV-Demo
// ============================================================
//
// Dunkel und klebend: Sie trägt das Verbandszeichen durch die ganze Sitzung
// und hebt sich vom weißen Inhalt ab, ohne ihn zu erdrücken.
//
// Auf dem Handy trägt sie nur Zeichen, Glocke und Anmeldung — die
// Navigation sitzt unten am Daumen (`bottom-nav.tsx`). Das ist die
// wichtigste mobile Entscheidung dieser Demo: Wer sie am Telefon vorführt,
// soll mit einer Hand durch alle Ebenen kommen.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ChevronDown, LogIn, UserRound } from 'lucide-react';
import { bedvPath, bedvRelativePath } from '@/lib/bedv/site';
import { BedvLogo } from '../brand/logo';
import { GlobalSearch } from '../search/global-search';
import { Glocke } from './benachrichtigungen';
import { useDemoAuth } from './demo-auth';
import { HAUPT_NAV, WEITERE_NAV, istAktiv } from './navigation';
import { kontoVon } from '@/data/bedv/demo-konten';

export function SiteHeader() {
  const pfad = bedvRelativePath(usePathname() ?? '/');
  const [sucheOffen, setSucheOffen] = useState(false);
  // Gemerkt wird NICHT „offen/zu", sondern AUF WELCHER SEITE geöffnet wurde.
  // Dadurch schließt sich das Menü beim Seitenwechsel von selbst — ohne
  // Effekt, der auf den Pfad horcht und den Zustand nachträgt.
  const [mehrOffenAuf, setMehrOffenAuf] = useState<string | null>(null);
  const mehrOffen = mehrOffenAuf === pfad;
  // Stabil gehalten, damit der Effekt unten sie als Abhängigkeit angeben
  // kann, ohne bei jedem Durchgang neu zu binden.
  const setMehrOffen = useCallback(
    (offen: boolean) => setMehrOffenAuf(offen ? pfad : null),
    [pfad],
  );
  const { rolle, bereit } = useDemoAuth();
  const mehrHuelle = useRef<HTMLDivElement>(null);

  // Strg/⌘ + K öffnet die Suche — auf jeder Seite, wie man es erwartet.
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSucheOffen(o => !o);
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, []);

  useEffect(() => {
    if (!mehrOffen) return;
    const ausserhalb = (e: MouseEvent) => {
      if (mehrHuelle.current && !mehrHuelle.current.contains(e.target as Node)) setMehrOffen(false);
    };
    document.addEventListener('mousedown', ausserhalb);
    return () => document.removeEventListener('mousedown', ausserhalb);
  }, [mehrOffen, setMehrOffen]);

  const schliesseSuche = useCallback(() => setSucheOffen(false), []);
  const konto = rolle ? kontoVon(rolle) : null;

  return (
    <>
      <header className="bedv-header">
        <div
          className="bedv-shell"
          style={{ display: 'flex', alignItems: 'center', gap: 12, height: 62 }}
        >
          <BedvLogo variante="hell" groesse={36} />

          <nav className="bedv-nav-desktop" style={{ display: 'none', alignItems: 'center', gap: 2, marginLeft: 14, flex: 1 }}>
            {HAUPT_NAV.map(p => (
              <Link
                key={p.pfad}
                href={bedvPath(p.pfad)}
                className="bedv-navlink"
                data-aktiv={istAktiv(p.pfad, pfad)}
              >
                {p.label}
              </Link>
            ))}
            <div ref={mehrHuelle} style={{ position: 'relative' }}>
              <button
                className="bedv-navlink"
                onClick={() => setMehrOffen(!mehrOffen)}
                aria-expanded={mehrOffen}
                data-aktiv={WEITERE_NAV.some(p => istAktiv(p.pfad, pfad))}
                style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Mehr
                <ChevronDown size={14} aria-hidden="true" style={{ transform: mehrOffen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }} />
              </button>
              {mehrOffen && (
                <div
                  className="bedv-card bedv-pop-down"
                  style={{ position: 'absolute', top: 38, left: 0, width: 220, padding: 6, zIndex: 120, boxShadow: 'var(--bedv-shadow-lg)' }}
                >
                  {WEITERE_NAV.map(p => (
                    <Link
                      key={p.pfad}
                      href={bedvPath(p.pfad)}
                      style={{
                        display: 'block', padding: '8px 10px', borderRadius: 8,
                        fontSize: '0.9rem', fontWeight: 500,
                        background: istAktiv(p.pfad, pfad) ? 'var(--bedv-blue-mist)' : undefined,
                        color: istAktiv(p.pfad, pfad) ? 'var(--bedv-blue-deep)' : 'var(--bedv-ink)',
                      }}
                    >
                      {p.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setSucheOffen(true)}
              className="bedv-suchknopf"
              aria-label="Team oder Spieler suchen"
            >
              <Search size={16} aria-hidden="true" />
              <span className="bedv-suchknopf-text">Team oder Spieler suchen …</span>
              <kbd className="bedv-suchknopf-kbd">⌘K</kbd>
            </button>

            <Glocke />

            {/* Erst nach dem Lesen des Speichers rendern — sonst stünde im
                ersten Bild „Demo-Login", obwohl schon eine Rolle gewählt ist. */}
            {bereit && (konto ? (
              <Link
                href={bedvPath('/mein-bereich')}
                className="bedv-btn bedv-btn--ondark bedv-btn--sm"
                style={{ gap: 7 }}
              >
                <UserRound size={15} aria-hidden="true" />
                <span className="bedv-nur-breit">{konto.titel}</span>
              </Link>
            ) : (
              <Link href={bedvPath('/login')} className="bedv-btn bedv-btn--accent bedv-btn--sm" style={{ gap: 7 }}>
                <LogIn size={15} aria-hidden="true" />
                <span className="bedv-nur-breit">Demo-Login</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Nur eingehängt, solange die Suche offen ist: Dann setzt sich ihr
          Zustand (Suchbegriff, Markierung) beim Schließen von selbst
          zurück, ohne dass ein Effekt ihn aufräumen muss. */}
      {sucheOffen && <GlobalSearch schliessen={schliesseSuche} />}
    </>
  );
}
