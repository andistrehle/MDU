'use client';

// ============================================================
// „‹ Zurück“ oben auf Unterseiten (Betreiber, 16.11.2026)
// ============================================================
// Die festen Verweise „‹ Team Manager“ / „‹ Alle Spiele“ führten immer auf DIE
// eine Seite — auch wenn man von woanders kam (Spielplan, Gegneranalyse, Statistik),
// und immer an den Seitenanfang. Jetzt: Gibt es in dieser Sitzung eine Seite davor,
// geht es dorthin ZURÜCK (wie der Browser-Pfeil, mit Scroll-Position, siehe
// scroll-merker.tsx); der Text heißt dann „Zurück“, außer die Seite davor ist
// ohnehin das feste Ziel. Ohne Vorgeschichte (Direktlink, Push) bleibt das feste Ziel.
// ============================================================

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icon';
import { seiteDavor } from './app-zurueck';

export function ZurueckLink({ href, text, style }: { href: string; text: string; style?: React.CSSProperties }) {
  const router = useRouter();
  const [davor, setDavor] = useState<string | null>(null);
  useEffect(() => { queueMicrotask(() => setDavor(seiteDavor())); }, []);
  return (
    <Link href={href} onClick={e => { if (seiteDavor()) { e.preventDefault(); router.back(); } }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800,
        letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none', ...style,
      }}>
      <Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> {davor && davor !== href ? 'Zurück' : text}
    </Link>
  );
}

/** Verweis-Leiste: kleine Knöpfe zu verwandten Seiten (Kader, Tabelle, Spielbericht …). */
export function Querverweise({ links, style }: { links: ({ href: string; text: string } | null | false | undefined)[]; style?: React.CSSProperties }) {
  const l = links.filter((x): x is { href: string; text: string } => !!x);
  if (!l.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, ...style }}>
      {l.map(x => (
        <Link key={x.href + x.text} href={x.href} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 999, textDecoration: 'none',
          fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 800, color: 'var(--th-accent)',
          background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)',
        }}>{x.text} <span aria-hidden>›</span></Link>
      ))}
    </div>
  );
}
