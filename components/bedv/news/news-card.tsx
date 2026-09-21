// ============================================================
// Beitragskarten
// ============================================================
//
// Es gibt keine Beitragsbilder — und Stockfotos kämen nicht infrage. Statt
// eines grauen Platzhalters bekommt jeder Beitrag eine gezeichnete Fläche
// aus seinen beiden Farben, mit dem Sektorenmuster einer Dartscheibe als
// Relief. Das wirkt gewollt statt „Bild fehlt noch", und es lädt nichts nach.
// ============================================================

import Link from 'next/link';
import type { NewsBeitrag } from '@/data/bedv/typen';
import { bedvPath } from '@/lib/bedv/site';
import { datum } from '@/lib/bedv/format';
import { Badge } from '../ui/bausteine';

/** Sektorenfächer als Bildfläche — dieselbe Teilung wie auf der Scheibe. */
export function BeitragsBild({
  farben, hoehe = 150, klein = false,
}: {
  farben: [string, string]; hoehe?: number; klein?: boolean;
}) {
  const [vorn, hinten] = farben;
  return (
    <div
      aria-hidden="true"
      style={{
        height: hoehe, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${vorn} 0%, ${hinten} 100%)`,
      }}
    >
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.22 }}
      >
        {Array.from({ length: 20 }, (_, i) => {
          if (i % 2 === 1) return null;
          const a = (-90 + i * 18 - 9) * (Math.PI / 180);
          const b = (-90 + i * 18 + 9) * (Math.PI / 180);
          const r = 160;
          return (
            <path
              key={i}
              d={`M 168 96 L ${168 + Math.cos(a) * r} ${96 + Math.sin(a) * r} A ${r} ${r} 0 0 1 ${168 + Math.cos(b) * r} ${96 + Math.sin(b) * r} Z`}
              fill="#fff"
            />
          );
        })}
        <circle cx="168" cy="96" r={klein ? 14 : 20} fill="none" stroke="#fff" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function NewsCard({ beitrag, gross = false }: { beitrag: NewsBeitrag; gross?: boolean }) {
  return (
    <Link
      href={bedvPath(`/news/${beitrag.slug}`)}
      className="bedv-card bedv-card--link"
      style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <BeitragsBild farben={beitrag.bildFarben} hoehe={gross ? 190 : 140} klein={!gross} />
      <div style={{ padding: gross ? '16px 18px 18px' : '14px 15px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <Badge ton="blau">{beitrag.kategorie}</Badge>
          <span className="bedv-kicker">{datum(beitrag.datum)}</span>
        </div>
        <h3 style={{ fontSize: gross ? '1.22rem' : '1.05rem', lineHeight: 1.22 }}>{beitrag.titel}</h3>
        <p
          style={{
            color: 'var(--bedv-ink-dim)', fontSize: '0.88rem', marginTop: 8,
            lineHeight: 1.55, flex: 1,
          }}
        >
          {beitrag.teaser}
        </p>
        <span
          style={{
            marginTop: 12, color: 'var(--bedv-blue-deep)', fontWeight: 600,
            fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          Weiterlesen <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

/**
 * Fließtext eines Beitrags. Die einzige Auszeichnung ist `**fett**` — mehr
 * braucht eine Verbandsmeldung nicht, und mehr kann in einem Redaktionsfeld
 * auch nichts kaputtmachen.
 */
export function Absatz({ text }: { text: string }) {
  const teile = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p>
      {teile.map((t, i) =>
        t.startsWith('**') && t.endsWith('**')
          ? <strong key={i}>{t.slice(2, -2)}</strong>
          : <span key={i}>{t}</span>)}
    </p>
  );
}
