// ============================================================
// MDC — Zeichen und Schriftzug
// ============================================================
//
// Aufgeräumte Fassung des vorhandenen MDC-Logos. Das Hauptmotiv ist — wie im
// Original — die Münchner Skyline im blau gerahmten Oval, darunter die rote
// Linie. Die Wahrzeichen von links nach rechts:
//
//   Rathausturm · Alter Peter · Frauenkirche · Riesenrad ·
//   Theatinerkirche · Olympiaturm · Olympia-Zeltdach
//
// Selbst gezeichnet, nicht nachgezeichnet: Die Formen folgen den Bauwerken,
// nicht einer fremden Vorlage.
//
// Neu gegenüber dem Original: keine Schlagschatten, keine Spiegelung, klare
// Kanten — damit das Zeichen auch 46 Pixel hoch in der Kopfleiste steht.
// ============================================================

const SKYLINE = '#16233D';

/**
 * Eigene Skyline-Grafik statt der gezeichneten Silhouette.
 *
 * Sobald eine lizenzierte Datei vorliegt (SVG bevorzugt, PNG mit
 * durchsichtigem Hintergrund geht auch), hier den Pfad eintragen:
 *
 *   1. Datei nach `public/mdc/skyline.svg` legen
 *   2. hier `'/mdc/skyline.svg'` eintragen
 *
 * Mehr ist nicht nötig — das Oval, die rote Linie und alle Größen bleiben.
 * Wichtig: Nur Dateien einsetzen, für die eine Lizenz vorliegt. Eine
 * Stock-Vorschau trägt ein Wasserzeichen und ist dafür nicht geeignet.
 */
const SKYLINE_IMAGE: string | null = null;

interface MarkProps {
  className?: string;
  /** Höhe des Ovals in Pixeln. */
  size?: number;
}

/** Ovales Zeichen mit der Münchner Skyline. */
export function MdcMark({ className, size = 46 }: MarkProps) {
  return (
    <svg
      viewBox="0 0 168 104"
      width={(size * 168) / 104}
      height={size}
      className={className}
      role="img"
      aria-label="Munich Darts Challenge"
    >
      <defs>
        <linearGradient id="mdc-ring" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#8FB6DE" />
          <stop offset="100%" stopColor="#1F3B73" />
        </linearGradient>
      </defs>

      <ellipse cx="84" cy="52" rx="82" ry="50" fill="#FFFFFF" />
      <ellipse cx="84" cy="52" rx="82" ry="50" fill="none" stroke="url(#mdc-ring)" strokeWidth="3.5" />

      {SKYLINE_IMAGE ? (
        <image
          href={SKYLINE_IMAGE}
          x="16" y="22" width="136" height="54"
          preserveAspectRatio="xMidYMax meet"
        />
      ) : (
        <DrawnSkyline />
      )}

      {/* Rote Grundlinie */}
      <rect x="14" y="76" width="142" height="2.8" fill="#D61A1A" />
    </svg>
  );
}

/** Gezeichnete Münchner Silhouette — Rückfallebene ohne eigene Grafikdatei. */
function DrawnSkyline() {
  return (
    <>
      <g fill={SKYLINE}>
        {/* Durchgehendes Häuserband — es trägt die Wahrzeichen und macht aus
            einzelnen Bauwerken eine Stadtsilhouette. */}
        <rect x="18" y="70" width="134" height="6" />
        <rect x="18" y="64" width="8" height="12" />
        <rect x="27" y="66" width="5" height="10" />
        <rect x="57.6" y="62" width="2.6" height="14" />
        <path d="M57.6 62l1.3-6 1.3 6z" />
        <rect x="84" y="64" width="5" height="12" />
        <rect x="101" y="60" width="4.6" height="16" />
        <path d="M101 60l2.3-7 2.3 7z" />
        <rect x="130" y="64" width="4" height="12" />
        <rect x="139.5" y="68" width="4" height="8" />

        {/* Rathausturm mit Ecktürmchen */}
        <rect x="32" y="62" width="16" height="14" />
        <rect x="36" y="42" width="8" height="34" />
        <path d="M35 42L40 18l5 24z" />
        <rect x="33.5" y="52" width="2.4" height="24" />
        <rect x="44.1" y="52" width="2.4" height="24" />
        <path d="M33.5 52l1.2-6 1.2 6zM44.1 52l1.2-6 1.2 6z" />

        {/* Alter Peter */}
        <rect x="51" y="56" width="6" height="20" />
        <path d="M51 56l3-10 3 10z" />

        {/* Frauenkirche — die beiden Zwiebeltürme, das Wahrzeichen schlechthin */}
        <rect x="60" y="60" width="22" height="16" />
        <rect x="61" y="40" width="9" height="36" />
        <rect x="72" y="40" width="9" height="36" />
        <path d="M61 40C58.8 36.5 59.5 32 63.2 29.6c0.7-1 3.9-1 4.6 0C71.5 32 72.2 36.5 70 40z" />
        <path d="M72 40C69.8 36.5 70.5 32 74.2 29.6c0.7-1 3.9-1 4.6 0C82.5 32 83.2 36.5 81 40z" />
        <rect x="65.1" y="24.5" width="0.9" height="5" />
        <rect x="76.1" y="24.5" width="0.9" height="5" />
        <circle cx="65.55" cy="23.6" r="1.3" />
        <circle cx="76.55" cy="23.6" r="1.3" />

        {/* Theatinerkirche — Kuppel mit Laterne und zwei Türmen */}
        <rect x="113" y="58" width="10" height="18" />
        <path d="M111.5 58c0-10 13-10 13 0z" />
        <rect x="117.2" y="44" width="1.6" height="4.5" />
        <circle cx="118" cy="43" r="1.4" />
        <rect x="107.4" y="56" width="3.6" height="20" />
        <rect x="125.2" y="56" width="3.6" height="20" />
        <path d="M107.4 56l1.8-6 1.8 6zM125.2 56l1.8-6 1.8 6z" />

        {/* Olympiaturm */}
        <rect x="132.6" y="26" width="3" height="50" />
        <ellipse cx="134.1" cy="34" rx="8" ry="3.6" />
        <ellipse cx="134.1" cy="39.6" rx="6" ry="2.8" />
        <rect x="133.5" y="14" width="1.2" height="12" />

      </g>

      {/* Olympia-Zeltdach — geschwungenes Seildach am Mast */}
      <g stroke={SKYLINE} fill="none" strokeLinecap="round">
        <path d="M139 76Q147 51 155 74" strokeWidth="2" />
        <path d="M142.5 76q4.5-11 9 0" strokeWidth="1.2" />
        <path d="M147 76V53" strokeWidth="1.3" />
      </g>

      {/* Riesenrad */}
      <g stroke={SKYLINE} fill="none">
        <circle cx="95" cy="56" r="12" strokeWidth="1.9" />
        <g strokeWidth="1.1">
          <line x1="95" y1="44" x2="95" y2="68" />
          <line x1="83" y1="56" x2="107" y2="56" />
          <line x1="86.5" y1="47.5" x2="103.5" y2="64.5" />
          <line x1="103.5" y1="47.5" x2="86.5" y2="64.5" />
        </g>
        <path d="M89 76l6-20M101 76l-6-20" strokeWidth="1.9" />
      </g>
      <circle cx="95" cy="56" r="2.3" fill={SKYLINE} />
    </>
  );
}

/**
 * Dartwerfer aus dem MDC-Logo — Silhouette im Wurf, Dartpfeil in der Hand.
 *
 * Nah am Original: aufrechte Haltung, Wurfarm angewinkelt mit der Hand auf
 * Kopfhöhe, Stützarm vor dem Körper, Standschritt mit gebeugtem vorderem
 * Bein. Der Pfeil ist kurz und gedrungen wie ein echter Dart — Schaft plus
 * rotes Flight —, nicht der lange Pfeil von vorher.
 */
export function MdcThrower({ className, size = 34 }: MarkProps) {
  return (
    <svg
      viewBox="0 0 62 96"
      width={(size * 62) / 96}
      height={size}
      className={className}
      role="img"
      aria-label="Dartwerfer"
    >
      <g stroke={SKYLINE} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Rumpf */}
        <path d="M38 30v26" />
        {/* Wurfarm: Schulter, Ellbogen, Hand auf Kopfhöhe */}
        <path d="M38 34l-12-3-4-10" />
        {/* Stützarm vor dem Körper */}
        <path d="M38 39l11 7-5 9" />
        {/* Standschritt: vorderes Bein gebeugt, hinteres gestreckt */}
        <path d="M38 56l-9 18 2 16" />
        <path d="M38 56l9 34" />
      </g>
      <circle cx="40" cy="17" r="10.5" fill={SKYLINE} />

      {/* Dartpfeil in der Wurfhand: Spitze nach vorn, schlanker Schaft,
          kleines Flight hinter der Faust. Erst das Flight macht aus dem
          roten Strich erkennbar einen Dart. */}
      <g fill="#D61A1A">
        <path d="M22.8 21.8L14.5 16" stroke="#D61A1A" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M15 16.6L7.6 11.4l1 6.6z" />
        <path d="M23.4 22.6l4.6 3.2-1.2-4z" />
      </g>
    </svg>
  );
}

interface WordmarkProps {
  className?: string;
  /** Kompakt = „MDC" für sehr enge Stellen. */
  compact?: boolean;
}

/** Schriftzug „Munich Darts Challenge" mit roten Initialen — wie im Oval. */
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
        <span style={{ color: 'var(--mdc-red)' }}>D</span>arts
      </span>
      <span style={lineStyle}>
        <span style={{ color: 'var(--mdc-red)' }}>C</span>hallenge
      </span>
    </span>
  );
}
