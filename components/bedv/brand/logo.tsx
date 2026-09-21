// ============================================================
// BeDV-Emblem und Schriftzug
// ============================================================
//
// EIGENE GESTALTUNG, kein Nachbau des bestehenden Verbandslogos.
//
// Das ist bewusst so: Die bestehende BeDV-Seite war beim Bauen dieser Demo
// nicht abrufbar, und ein aus dem Gedächtnis „nachempfundenes" Logo wäre
// das Schlechteste von beidem — weder das echte noch ein ehrlicher Entwurf.
// Was hier steht, ist ein Vorschlag, wie eine Bildmarke aussehen könnte, die
// zwei Dinge zugleich sagt:
//
//   BAYERN   — die Rautenfläche im Inneren (Weiß-Blau, um 45° gekippt)
//   DART     — der Sektorenring außen, in der Teilung einer Dartscheibe
//
// Beim echten Auftrag tritt an diese Stelle das Verbandslogo. Weil jede
// Seite den Baustein benutzt statt eine Bilddatei einzubinden, ist das
// genau eine Datei Arbeit.
// ============================================================

import { bedvPath, BEDV_NAME_KURZ, BEDV_NAME_LANG } from '@/lib/bedv/site';
import Link from 'next/link';

export function BedvEmblem({ groesse = 40, className }: { groesse?: number; className?: string }) {
  // Eigene Kennung je Einbindung wäre sauberer, ist hier aber unnötig: Die
  // Verläufe und Masken sind in allen Einbindungen identisch, doppelte IDs
  // mit gleichem Inhalt stören nicht.
  return (
    <svg viewBox="0 0 100 100" width={groesse} height={groesse} className={className} aria-hidden="true">
      <defs>
        <clipPath id="bedv-emblem-innen">
          <circle cx="50" cy="50" r="31" />
        </clipPath>
        <linearGradient id="bedv-emblem-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E7BE8" />
          <stop offset="100%" stopColor="#10408F" />
        </linearGradient>
      </defs>

      {/* Außenring */}
      <circle cx="50" cy="50" r="48" fill="url(#bedv-emblem-ring)" />

      {/* Sektorenteilung wie auf einer Scheibe — jeder zweite Abschnitt
          in der Signalfarbe, damit der Dartbezug sofort lesbar ist. */}
      {Array.from({ length: 20 }, (_, i) => {
        if (i % 2 === 1) return null;
        const von = (-90 + i * 18 - 9) * (Math.PI / 180);
        const bis = (-90 + i * 18 + 9) * (Math.PI / 180);
        const p = (w: number, r: number) => `${(50 + Math.cos(w) * r).toFixed(2)} ${(50 + Math.sin(w) * r).toFixed(2)}`;
        return (
          <path
            key={i}
            d={`M ${p(von, 48)} A 48 48 0 0 1 ${p(bis, 48)} L ${p(bis, 38)} A 38 38 0 0 0 ${p(von, 38)} Z`}
            fill="#F0A81C"
          />
        );
      })}

      {/* Innenfläche: bayerische Rauten. Zwei gekippte Streifensätze ergeben
          das Muster ohne ein einziges Bild. */}
      <circle cx="50" cy="50" r="34" fill="#F2F6FC" />
      <g clipPath="url(#bedv-emblem-innen)">
        <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
        <g transform="rotate(45 50 50)">
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={`h${i}`} x="-20" y={-20 + i * 20} width="140" height="10" fill="#1657C4" opacity="0.9" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={`v${i}`} x={-20 + i * 20} y="-20" width="10" height="140" fill="#1657C4" opacity="0.9" />
          ))}
        </g>
      </g>

      {/* Bull in der Mitte — der Punkt, auf den alles zeigt. */}
      <circle cx="50" cy="50" r="10" fill="#0A1B35" />
      <circle cx="50" cy="50" r="4.5" fill="#F0A81C" />
    </svg>
  );
}

/**
 * Der Schriftzug. `hell` für dunkle Flächen (Kopf- und Fußzeile),
 * `dunkel` für weiße.
 */
export function BedvWortmarke({
  variante = 'hell',
  mitUntertitel = true,
}: {
  variante?: 'hell' | 'dunkel';
  mitUntertitel?: boolean;
}) {
  const hell = variante === 'hell';
  return (
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span
        style={{
          fontFamily: 'var(--bedv-font-display)',
          fontSize: '1.32rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: hell ? '#FFFFFF' : 'var(--bedv-navy-900)',
        }}
      >
        Be<span style={{ color: 'var(--bedv-accent)' }}>D</span>V
      </span>
      {mitUntertitel && (
        <span
          style={{
            fontSize: '0.585rem',
            fontWeight: 600,
            letterSpacing: '0.055em',
            textTransform: 'uppercase',
            marginTop: 3,
            color: hell ? 'var(--bedv-on-dark-dim)' : 'var(--bedv-ink-dim)',
            whiteSpace: 'nowrap',
          }}
        >
          Elektronik-Dart Bayern
        </span>
      )}
    </span>
  );
}

/** Emblem plus Schriftzug als Verweis auf die Startseite. */
export function BedvLogo({
  variante = 'hell',
  groesse = 38,
  mitUntertitel = true,
}: {
  variante?: 'hell' | 'dunkel';
  groesse?: number;
  mitUntertitel?: boolean;
}) {
  return (
    <Link
      href={bedvPath()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}
      aria-label={`${BEDV_NAME_KURZ} — ${BEDV_NAME_LANG} (Startseite der Demo)`}
    >
      <BedvEmblem groesse={groesse} />
      <BedvWortmarke variante={variante} mitUntertitel={mitUntertitel} />
    </Link>
  );
}
