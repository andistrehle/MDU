// ============================================================
// Tennis Kail — Fußzeile
// ============================================================

import Link from 'next/link';
import { BRAND, LOCATIONS, hoursSummary } from '@/data/tk/facility';

const COLUMNS = [
  {
    title: 'Spielen',
    links: [
      { href: '/tk/buchen', label: 'Platz buchen' },
      { href: '/tk/training', label: 'Trainerstunde buchen' },
      { href: '/tk/platzstatus', label: 'Platzstatus und Wetter' },
      { href: '/tk/spielpartner', label: 'Spielpartner finden' },
      { href: '/tk/preise', label: 'Preise' },
    ],
  },
  {
    title: 'Angebot',
    links: [
      { href: '/tk/kids', label: 'Kinder und Jugend' },
      { href: '/tk/camps', label: 'Ferien-Camps' },
      { href: '/tk/events', label: 'Events' },
      { href: '/tk/turniere', label: 'Turniere' },
      { href: '/tk/shop', label: 'Pro-Shop' },
      { href: '/tk/gutscheine', label: 'Gutscheine' },
    ],
  },
  {
    title: 'Anlage',
    links: [
      { href: '/tk/anlage', label: 'Plätze und Halle' },
      { href: '/tk/trainer', label: 'Trainerteam' },
      { href: '/tk/kontakt', label: 'Kontakt und Anfahrt' },
      { href: '/tk/konto', label: 'Mein Konto' },
      { href: '/tk/dashboard', label: 'Betreiber-Dashboard' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="tk-section--dark pt-14 pb-24 lg:pb-14">
      <div className="tk-shell grid gap-10 lg:grid-cols-[1.2fr_2fr]">
        <div className="flex flex-col gap-4">
          <span className="tk-wordmark text-[var(--tk-on-dark)]">
            Tennis<span className="tk-wordmark__ball" aria-hidden />Kail
          </span>
          <p className="max-w-[40ch] text-sm text-[var(--tk-on-dark-dim)]">{BRAND.claim}</p>
          <div className="flex flex-col gap-1 text-sm text-[var(--tk-on-dark-dim)]">
            <a href={`tel:${BRAND.phoneHref}`} className="text-[var(--tk-ball)]">
              {BRAND.phone}
            </a>
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5">
              <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--tk-moss)]">
                {col.title}
              </h2>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-[var(--tk-on-dark-dim)] transition-colors hover:text-[var(--tk-on-dark)]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className="tk-shell mt-12 grid gap-6 border-t border-[var(--tk-line-dark)] pt-8 sm:grid-cols-2">
        {LOCATIONS.map((loc) => (
          <div key={loc.id} className="text-sm text-[var(--tk-on-dark-dim)]">
            <h2 className="mb-1 text-[0.95rem] font-semibold text-[var(--tk-on-dark)]">{loc.name}</h2>
            <p>
              {loc.street}, {loc.zip} {loc.city}
            </p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[0.82rem]">
              {hoursSummary(loc).map((row) => (
                <div key={row.days} className="contents">
                  <dt className="font-medium text-[var(--tk-on-dark)]">{row.days}</dt>
                  <dd>{row.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="tk-shell mt-10 flex flex-col gap-3 border-t border-[var(--tk-line-dark)] pt-6 text-[0.78rem] text-[var(--tk-on-dark-dim)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Unverbindliche Demo — kein Buchungssystem im Echtbetrieb.{' '}
          <Link href="/tk/datenherkunft" className="text-[var(--tk-ball)] underline underline-offset-2">
            Was ist echt, was ist Demo?
          </Link>
        </p>
        <div className="flex gap-4">
          <Link href="/tk/impressum">Impressum</Link>
          <Link href="/tk/datenschutz">Datenschutz</Link>
        </div>
      </div>
    </footer>
  );
}
