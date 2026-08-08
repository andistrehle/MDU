// ============================================================
// MDC — Zeichen und Schriftzug
// ============================================================
//
// Angelehnt an das vorhandene MDC-Logo (ovaler Rahmen, Münchner Skyline,
// Dart-Motiv, rote Initialen M · D · C), aber neu gezeichnet: eigene Proportionen,
// ruhigere Formen, ohne Spiegelung — damit es klein im Kopfbereich funktioniert
// und auf dunklem Grund sauber steht.
// ============================================================

interface MarkProps {
  className?: string;
  /** Größe in Pixeln (Höhe des Ovals). */
  size?: number;
}

/** Ovales Zeichen mit Münchner Skyline und Dartpfeil. */
export function MdcMark({ className, size = 40 }: MarkProps) {
  return (
    <svg
      viewBox="0 0 120 96"
      width={(size * 120) / 96}
      height={size}
      className={className}
      role="img"
      aria-label="Munich Dart Challenge"
    >
      <defs>
        <linearGradient id="mdc-mark-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#D61A1A" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="48" rx="57" ry="45" fill="#111111" />
      <ellipse
        cx="60" cy="48" rx="57" ry="45"
        fill="none" stroke="url(#mdc-mark-ring)" strokeWidth="3"
      />

      {/* Skyline: Olympiaturm, Frauenkirche, Rathausturm */}
      <g fill="#E5E5E5">
        {/* Olympiaturm */}
        <rect x="25" y="34" width="3" height="30" />
        <ellipse cx="26.5" cy="35" rx="7" ry="3.6" />
        <rect x="24" y="24" width="5" height="9" rx="2" />

        {/* Frauenkirche — zwei Türme mit Zwiebelhauben */}
        <rect x="49" y="40" width="9" height="24" />
        <rect x="63" y="40" width="9" height="24" />
        <path d="M49 40c0-6 2-7 4.5-11 2.5 4 4.5 5 4.5 11z" />
        <path d="M63 40c0-6 2-7 4.5-11 2.5 4 4.5 5 4.5 11z" />

        {/* Rathausturm */}
        <rect x="86" y="42" width="7" height="22" />
        <path d="M86 42l3.5-13 3.5 13z" />

        {/* Häuserzeile */}
        <rect x="34" y="52" width="11" height="12" />
        <rect x="76" y="55" width="7" height="9" />
        <rect x="96" y="50" width="9" height="14" />
        <rect x="14" y="56" width="8" height="8" />
      </g>

      <rect x="12" y="64" width="96" height="1.6" fill="#D61A1A" />

      {/* Dartpfeil, der auf die Mitte zeigt */}
      <g>
        <circle cx="60" cy="78" r="6.5" fill="none" stroke="#E5E5E5" strokeWidth="1.4" />
        <circle cx="60" cy="78" r="2" fill="#D61A1A" />
        <path d="M66 78h22" stroke="#E5E5E5" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M88 74l8 4-8 4z" fill="#D61A1A" />
      </g>
    </svg>
  );
}

interface WordmarkProps {
  className?: string;
  /** Kompakt = einzeilig „MDC" für sehr enge Stellen. */
  compact?: boolean;
}

/** Schriftzug „Munich Dart Challenge" mit roten Initialen. */
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
          color: 'var(--mdc-white)',
          lineHeight: 1,
        }}
      >
        <span style={{ color: 'var(--mdc-red)' }}>M</span>
        <span style={{ color: 'var(--mdc-red)' }}>D</span>
        <span style={{ color: 'var(--mdc-red)' }}>C</span>
      </span>
    );
  }

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
      <span style={{ fontWeight: 900, fontSize: '1.18rem', letterSpacing: '0.02em', color: 'var(--mdc-white)' }}>
        <span style={{ color: 'var(--mdc-red)' }}>M</span>unich{' '}
        <span style={{ color: 'var(--mdc-red)' }}>D</span>art
      </span>
      <span style={{ fontWeight: 900, fontSize: '1.18rem', letterSpacing: '0.02em', color: 'var(--mdc-white)' }}>
        <span style={{ color: 'var(--mdc-red)' }}>C</span>hallenge
      </span>
    </span>
  );
}
