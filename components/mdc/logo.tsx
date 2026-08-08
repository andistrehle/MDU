// ============================================================
// MDC — Zeichen und Schriftzug
// ============================================================
//
// Aufgeräumte Fassung des vorhandenen MDC-Logos. Wiedererkennbar bleiben die
// vier Merkmale, an denen man es festmacht:
//
//   • das blau gerahmte Oval,
//   • die Münchner Skyline darin (Olympiaturm, Frauenkirche, Riesenrad),
//   • die roten Initialen M · D · C im Schriftzug,
//   • der Dartpfeil.
//
// Neu ist die Ausführung: klare Kanten statt Schlagschatten, keine
// Spiegelung, ruhigere Proportionen — damit es auch 40 Pixel hoch in der
// Kopfleiste steht und auf Weiß sauber wirkt.
// ============================================================

interface MarkProps {
  className?: string;
  /** Höhe des Ovals in Pixeln. */
  size?: number;
}

/** Ovales Zeichen mit Münchner Skyline und Dartpfeil. */
export function MdcMark({ className, size = 44 }: MarkProps) {
  return (
    <svg
      viewBox="0 0 128 96"
      width={(size * 128) / 96}
      height={size}
      className={className}
      role="img"
      aria-label="Munich Dart Challenge"
    >
      <defs>
        <linearGradient id="mdc-ring" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#8FB6DE" />
          <stop offset="100%" stopColor="#1F3B73" />
        </linearGradient>
      </defs>

      <ellipse cx="64" cy="48" rx="61" ry="45" fill="#FFFFFF" />
      <ellipse cx="64" cy="48" rx="61" ry="45" fill="none" stroke="url(#mdc-ring)" strokeWidth="3.5" />

      {/* Münchner Skyline */}
      <g fill="#16233D">
        {/* Olympiaturm */}
        <rect x="25.5" y="36" width="3" height="28" />
        <ellipse cx="27" cy="37" rx="7.5" ry="3.8" />
        <rect x="24.5" y="25" width="5" height="10" rx="2.5" />

        {/* Riesenrad */}
        <circle cx="45" cy="49" r="9.5" fill="none" stroke="#16233D" strokeWidth="1.6" />
        <g stroke="#16233D" strokeWidth="1.1">
          <line x1="45" y1="39.5" x2="45" y2="58.5" />
          <line x1="35.5" y1="49" x2="54.5" y2="49" />
          <line x1="38.3" y1="42.3" x2="51.7" y2="55.7" />
          <line x1="51.7" y1="42.3" x2="38.3" y2="55.7" />
        </g>
        <path d="M41.5 64l3.5-9 3.5 9z" />

        {/* Frauenkirche — zwei Türme mit Zwiebelhauben */}
        <rect x="63" y="42" width="8.5" height="22" />
        <rect x="76" y="42" width="8.5" height="22" />
        <path d="M63 42c0-5.6 2-6.6 4.25-10.4C69.5 35.4 71.5 36.4 71.5 42z" />
        <path d="M76 42c0-5.6 2-6.6 4.25-10.4C82.5 35.4 84.5 36.4 84.5 42z" />

        {/* Rathausturm */}
        <rect x="95" y="44" width="6.5" height="20" />
        <path d="M95 44l3.25-12 3.25 12z" />

        {/* Häuserzeile */}
        <rect x="88" y="54" width="5.5" height="10" />
        <rect x="104" y="52" width="8" height="12" />
        <rect x="15" y="56" width="7.5" height="8" />
      </g>

      {/* Rote Grundlinie — die Trennlinie aus dem Logo */}
      <rect x="14" y="64" width="100" height="2.4" fill="#D61A1A" />

      {/* Dartpfeil auf die Mitte */}
      <g>
        <circle cx="64" cy="78" r="7" fill="none" stroke="#1F3B73" strokeWidth="1.6" />
        <circle cx="64" cy="78" r="2.2" fill="#D61A1A" />
        <path d="M71 78h20" stroke="#1F3B73" strokeWidth="2" strokeLinecap="round" />
        <path d="M91 73.5l8 4.5-8 4.5z" fill="#D61A1A" />
      </g>
    </svg>
  );
}

interface WordmarkProps {
  className?: string;
  /** Kompakt = „MDC" für sehr enge Stellen. */
  compact?: boolean;
}

/** Schriftzug „Munich Dart Challenge" mit roten Initialen — wie im Oval. */
export function MdcWordmark({ className, compact = false }: WordmarkProps) {
  if (compact) {
    return (
      <span
        className={className}
        style={{
          fontFamily: 'var(--mdc-font-display)',
          fontWeight: 900,
          letterSpacing: '0.04em',
          fontSize: '1.5rem',
          color: 'var(--mdc-red)',
          lineHeight: 1,
        }}
      >
        MDC
      </span>
    );
  }

  const lineStyle: React.CSSProperties = {
    fontWeight: 900,
    fontSize: '1.2rem',
    letterSpacing: '0.015em',
    color: 'var(--mdc-navy-deep)',
  };

  return (
    <span
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 0.94,
        fontFamily: 'var(--mdc-font-display)',
        textTransform: 'uppercase',
      }}
    >
      <span style={lineStyle}>
        <span style={{ color: 'var(--mdc-red)' }}>M</span>unich{' '}
        <span style={{ color: 'var(--mdc-red)' }}>D</span>art
      </span>
      <span style={lineStyle}>
        <span style={{ color: 'var(--mdc-red)' }}>C</span>hallenge
      </span>
    </span>
  );
}
