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
import { MdcMark, MdcThrower, MdcWordmark } from './logo';
import type { BrandImage } from '@/lib/mdc/brand';
import { mdcPath, mdcRelativePath } from '@/lib/mdc/site';

const NAV = [
  { href: mdcPath(), label: 'Start' },
  { href: mdcPath('/rangliste'), label: 'Rangliste' },
  { href: mdcPath('/turniere'), label: 'Turniere' },
  { href: mdcPath('/spieler'), label: 'Spieler' },
  { href: mdcPath('/spielorte'), label: 'Spielorte' },
  { href: mdcPath('/regeln'), label: 'Regeln' },
];

interface SiteHeaderProps {
  /** Kurztext fürs nächste Ranking-Turnier, z. B. „Mo, 10.08. · Legendary". */
  nextRankingLabel: string;
  nextRankingHref: string;
  /** Originaldateien, falls hinterlegt — sonst greift die Zeichnung. */
  logo?: BrandImage | null;
  thrower?: BrandImage | null;
}

export function SiteHeader({ nextRankingLabel, nextRankingHref, logo, thrower }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Beide Seiten des Vergleichs ohne `/mdc`-Präfix: Auf der eigenen Domain
  // schreibt der Proxy intern auf `/mdc/…` um, im Browser steht der Pfad ohne.
  // Ohne diese Normalisierung würde nach dem Laden ein anderer Punkt leuchten
  // als im ausgelieferten HTML.
  const aktuell = mdcRelativePath(pathname);
  const isActive = (href: string) => {
    const ziel = mdcRelativePath(href);
    return ziel === '/' ? aktuell === '/' : aktuell.startsWith(ziel);
  };

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
          {/* Ein breiter Banner trägt den Schriftzug bereits — dann steht er
              nicht noch einmal daneben. */}
          <Link href={mdcPath()} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MdcMark size={logo?.wide ? 54 : 40} src={logo} />
            {!logo?.wide && <MdcWordmark />}
          </Link>

          {!logo?.wide && <MdcThrower className="mdc-header-figure" size={34} src={thrower} />}

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

      {/* Das Menü hängt per Portal an `.mdc-root` — und zwar aus zwei Gründen
          gleichzeitig, die sich fast widersprechen:

          • NICHT im <header>: Der trägt `backdrop-filter` (Glas-Effekt), und
            ein Element mit Filter wird zum Bezugsrahmen für `position: fixed`.
            Im Kopfbereich wäre das Menü nur kopfzeilenhoch statt
            bildschirmfüllend (Safari setzt das um, Chromium nicht).
          • NICHT am <body>: Sämtliche Farb- und Schriftvariablen sind auf
            `.mdc-root` definiert. Außerhalb fehlen sie — die Schrift fiele auf
            System-Sans zurück und `background: var(--mdc-red)` würde
            durchsichtig.

          `.mdc-root` erfüllt beides: kein Filter, aber alle Variablen. */}
      {/* `document` ist hier immer da: Das Menü geht nur per Klick auf, also
          niemals beim Rendern auf dem Server. */}
      {menuOpen && createPortal((
        <div className="mdc-mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <MdcMark size={40} src={logo} />
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
      ), document.querySelector('.mdc-root') ?? document.body)}
    </>
  );
}
