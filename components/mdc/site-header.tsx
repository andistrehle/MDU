'use client';

// ============================================================
// MDC — Kopfzeile mit mobiler Navigation
// ============================================================
//
// Klebt oben, helles Glas, roter Unterstrich beim aktiven Punkt. Ab Tablet
// abwärts klappt die Navigation als Vollbildmenü auf — große Ziele, damit man
// sie in der Kneipe auch mit einer Hand trifft.
// ============================================================

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarClock, ChevronRight, Menu, X } from 'lucide-react';
import { MdcMark, MdcWordmark } from './logo';

const NAV = [
  { href: '/mdc', label: 'Start' },
  { href: '/mdc/rangliste', label: 'Rangliste' },
  { href: '/mdc/turniere', label: 'Turniere' },
  { href: '/mdc/spieler', label: 'Spieler' },
  { href: '/mdc/spielorte', label: 'Spielorte' },
  { href: '/mdc/regeln', label: 'Regeln' },
];

interface SiteHeaderProps {
  /** Kurztext fürs nächste Ranking-Turnier, z. B. „Mo, 10.08. · Legendary". */
  nextRankingLabel: string;
  nextRankingHref: string;
}

export function SiteHeader({ nextRankingLabel, nextRankingHref }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/mdc' ? pathname === '/mdc' : pathname.startsWith(href);

  // Solange das Menü offen ist, soll der Hintergrund nicht mitscrollen.
  // (Geschlossen wird es beim Klick auf einen Eintrag — kein Effekt nötig.)
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  return (
    <>
      <header className="mdc-header mdc-glass">
        <div className="mdc-shell mdc-header-inner">
          <Link href="/mdc" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MdcMark size={40} />
            <MdcWordmark />
          </Link>

          <nav className="mdc-nav" aria-label="Hauptnavigation">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="mdc-nav-link"
                data-active={isActive(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href={nextRankingHref}
            className="mdc-btn mdc-btn-primary mdc-btn-sm mdc-header-cta"
            style={{ marginLeft: 8 }}
          >
            <CalendarClock size={16} strokeWidth={2.4} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span>Nächstes Ranking</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', opacity: 0.85 }}>
                {nextRankingLabel}
              </span>
            </span>
          </Link>

          <button
            type="button"
            className="mdc-burger"
            aria-label="Menü öffnen"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Das Menü hängt per Portal direkt am <body>.
          Grund: Ein Vorfahre mit `filter`, `backdrop-filter`, `transform`
          oder `perspective` wird zum Bezugsrahmen für `position: fixed` —
          das Menü wäre dann nur so hoch wie dieser Vorfahre statt
          bildschirmfüllend. Genau das passierte im Kopfbereich mit seinem
          Glas-Effekt: In Safari kippte das Menü auf Kopfzeilenhöhe, in
          Chromium nicht (dort ist `backdrop-filter` headless inaktiv).
          Am <body> kann kein Vorfahre mehr dazwischenfunken. */}
      {/* `document` ist hier immer da: Das Menü geht nur per Klick auf, also
          niemals beim Rendern auf dem Server. */}
      {menuOpen && createPortal((
        <div className="mdc-mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <MdcMark size={40} />
            <button
              type="button"
              className="mdc-burger"
              style={{ display: 'inline-flex', marginLeft: 0 }}
              aria-label="Menü schließen"
              onClick={() => setMenuOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href)}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              <ChevronRight size={24} strokeWidth={2} />
            </Link>
          ))}

          <Link
            href={nextRankingHref}
            className="mdc-btn mdc-btn-primary mdc-btn-block"
            style={{ marginTop: 26 }}
            onClick={() => setMenuOpen(false)}
          >
            <CalendarClock size={18} strokeWidth={2.4} />
            Nächstes Ranking · {nextRankingLabel}
          </Link>
        </div>
      ), document.body)}
    </>
  );
}
