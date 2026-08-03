'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ChefHat, House, ScanLine, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Heute', icon: House },
  { href: '/tagebuch', label: 'Tagebuch', icon: BookOpen },
  { href: '/scannen', label: 'Scannen', icon: ScanLine, prominent: true },
  { href: '/rezepte', label: 'Rezepte', icon: ChefHat },
  { href: '/profil', label: 'Profil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-card/95 backdrop-blur"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon, prominent }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          if (prominent) {
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 py-2"
              >
                <span
                  className={cn(
                    '-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
                    active ? 'bg-brand-ink text-white' : 'bg-brand text-white',
                  )}
                >
                  <Icon size={26} aria-hidden />
                </span>
                <span className={cn('text-[11px] font-semibold', active ? 'text-brand-ink' : 'text-mut')}>
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 py-2',
                active ? 'text-brand-ink' : 'text-mut hover:text-body',
              )}
            >
              <Icon size={22} aria-hidden />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
