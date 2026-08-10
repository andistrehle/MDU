'use client';

// ============================================================
// Tennis Kail — Kopfzeile
// ============================================================
//
// Mobile first: auf dem Telefon nur Wortmarke, Platzstatus und der
// Buchen-Knopf — mehr passt nicht in eine Daumenbreite. Die Navigation
// liegt unten in der Leiste und hinter dem Menü. Ab 1024 px wandert sie
// nach oben.
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { BRAND } from '@/data/tk/facility';
import { useTkStore } from '@/lib/tk/store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/tk/buchen', label: 'Platz buchen' },
  { href: '/tk/training', label: 'Training' },
  { href: '/tk/anlage', label: 'Anlage' },
  { href: '/tk/preise', label: 'Preise' },
  { href: '/tk/camps', label: 'Camps' },
  { href: '/tk/events', label: 'Events' },
  { href: '/tk/shop', label: 'Shop' },
];

const MENU_EXTRA = [
  { href: '/tk/kids', label: 'Kinder und Jugend' },
  { href: '/tk/spielpartner', label: 'Spielpartner finden' },
  { href: '/tk/turniere', label: 'Turniere' },
  { href: '/tk/gutscheine', label: 'Gutscheine' },
  { href: '/tk/kontakt', label: 'Kontakt und Anfahrt' },
  { href: '/tk/konto', label: 'Mein Konto' },
  { href: '/tk/dashboard', label: 'Betreiber-Dashboard' },
  { href: '/tk/datenherkunft', label: 'Was ist echt, was ist Demo?' },
];

export function SiteHeader({ statusLabel }: { statusLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { cart } = useTkStore();
  const reduce = useReducedMotion();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="tk-header">
      <div className="tk-shell flex h-[62px] items-center gap-3">
        <Link href="/tk" className="tk-wordmark flex-none" aria-label="Tennis Kail — Startseite">
          Tennis<span className="tk-wordmark__ball" aria-hidden />Kail
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex" aria-label="Hauptnavigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="tk-nav-link"
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/tk/platzstatus"
            className="hidden items-center gap-2 rounded-full border border-[var(--tk-line-dark)] px-3 py-1.5 text-[0.78rem] font-semibold text-[var(--tk-on-dark-dim)] transition-colors hover:text-[var(--tk-on-dark)] sm:flex"
          >
            <span className="tk-dot" aria-hidden />
            {statusLabel}
          </Link>

          <Link href="/tk/buchen" className="tk-btn tk-btn--ball tk-btn--sm">
            Buchen
            {cart.length > 0 ? (
              <span className="ml-1 rounded-full bg-[#23260A] px-1.5 text-[0.7rem] text-[var(--tk-ball)]">
                {cart.length}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="tk-menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--tk-line-dark)] text-[var(--tk-on-dark)]"
          >
            <span className="tk-sr">Menü {open ? 'schließen' : 'öffnen'}</span>
            <span aria-hidden className="flex flex-col gap-[3px]">
              <span className={cn('block h-[1.5px] w-4 bg-current transition-transform', open && 'translate-y-[4.5px] rotate-45')} />
              <span className={cn('block h-[1.5px] w-4 bg-current transition-opacity', open && 'opacity-0')} />
              <span className={cn('block h-[1.5px] w-4 bg-current transition-transform', open && '-translate-y-[4.5px] -rotate-45')} />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="tk-menu"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[var(--tk-line-dark)]"
          >
            <div className="tk-shell grid gap-1 py-4 sm:grid-cols-2">
              {[...NAV, ...MENU_EXTRA].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-[0.95rem] text-[var(--tk-on-dark-dim)] transition-colors hover:bg-[rgba(244,241,233,0.08)] hover:text-[var(--tk-on-dark)]"
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={`tel:${BRAND.phoneHref}`}
                className="rounded-xl px-3 py-2.5 text-[0.95rem] text-[var(--tk-ball)]"
              >
                Anrufen: {BRAND.phone}
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
