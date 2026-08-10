'use client';

// ============================================================
// Tennis Kail — untere Leiste (nur Telefon und Tablet)
// ============================================================
//
// Fünf Ziele, mehr nicht: Was auf einer Anlage wirklich gebraucht wird,
// ist Buchen, Status, Training, Konto — und der Weg zurück nach Hause.
// Symbole sind reine Zeichnungen (kein Icon-Paket), damit die Leiste
// keine zusätzliche Abhängigkeit lädt.
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/tk', label: 'Start', icon: 'home' },
  { href: '/tk/buchen', label: 'Buchen', icon: 'grid' },
  { href: '/tk/platzstatus', label: 'Status', icon: 'sun' },
  { href: '/tk/training', label: 'Training', icon: 'racket' },
  { href: '/tk/konto', label: 'Konto', icon: 'user' },
] as const;

function Icon({ name }: { name: (typeof ITEMS)[number]['icon'] }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case 'racket':
      return (
        <svg {...common}>
          <ellipse cx="10.5" cy="9" rx="6" ry="7" transform="rotate(-30 10.5 9)" />
          <path d="M14.5 14.5 20 21" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
        </svg>
      );
  }
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tk-tabbar" aria-label="Schnellzugriff">
      {ITEMS.map((item) => {
        const active = item.href === '/tk' ? pathname === '/tk' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
