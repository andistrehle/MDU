// ============================================================
// MDC — Wege innerhalb der Turnierverwaltung
// ============================================================
//
// Die Verwaltung hat inzwischen vier Seiten. Ohne diese Leiste käme man von
// „Ergebnis hochladen" nur über die Übersicht zu „News schreiben" — am Handy
// heißt das: zurück, scrollen, weiter. Deshalb steht auf jeder Seite, was es
// sonst noch gibt.
//
// Bewusst kein Eintrag in der Hauptnavigation der Seite: Die Verwaltung geht
// Besucher nichts an.
// ============================================================

import Link from 'next/link';
import { Camera, KeyRound, LayoutGrid, Newspaper } from 'lucide-react';
import { mdcPath } from '@/lib/mdc/site';

const SEITEN = [
  { key: 'uebersicht', href: mdcPath('/admin'), label: 'Übersicht', icon: LayoutGrid },
  { key: 'ergebnis', href: mdcPath('/admin/ergebnis'), label: 'Ergebnis hochladen', icon: Camera },
  { key: 'news', href: mdcPath('/admin/news'), label: 'News schreiben', icon: Newspaper },
  { key: 'passnummern', href: mdcPath('/admin/passnummern'), label: 'Passnummern', icon: KeyRound },
] as const;

export type AdminSeite = (typeof SEITEN)[number]['key'];

export function AdminNav({ aktiv }: { aktiv: AdminSeite }) {
  return (
    <nav
      aria-label="Turnierverwaltung"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
    >
      {SEITEN.map(seite => {
        const Icon = seite.icon;
        const hier = seite.key === aktiv;
        return (
          <Link
            key={seite.key}
            href={seite.href}
            aria-current={hier ? 'page' : undefined}
            className={`mdc-btn mdc-btn-sm ${hier ? 'mdc-btn-primary' : 'mdc-btn-ghost'}`}
          >
            <Icon size={15} />
            {seite.label}
          </Link>
        );
      })}
    </nav>
  );
}
