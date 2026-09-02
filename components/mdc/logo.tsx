// ============================================================
// MDC — Zeichen und Schriftzug
// ============================================================
//
// Nachgezeichnet nach dem Logo des Betreibers: runder Rahmen aus blauem
// Ring und rotem Innenbogen, darin die Münchner Skyline in Blau, darunter
// der Schriftzug. Der Dartwerfer sitzt unter dem Kreis.
//
// Die Skyline folgt der Vorlage: Propyläen, Frauenkirche, Theatinerkirche,
// Olympiaturm, Olympia-Zeltdach. Kein Riesenrad — das hat die neue Vorlage
// nicht.
//
// GENAUER GEHT ES MIT DER ORIGINALDATEI: `LOGO_IMAGE` unten setzen, dann
// tritt diese Zeichnung zurück. Solange keine Datei vorliegt, ist das hier
// die beste Annäherung — die Blautöne sind aus der Vorlage geschätzt, nicht
// gemessen.
// ============================================================

/** Blau des Logos — geschätzt aus der Vorlage, aus der Datei nachmessen. */
const LOGO_BLUE = '#17479B';
const LOGO_RED = '#E1251B';

// Die Originaldateien werden im Layout gesucht (`lib/mdc/brand.ts`) und als
// `src` hereingereicht. Ohne Datei greift die Zeichnung weiter unten.

interface MarkProps {
  className?: string;
  /** Höhe des Ovals in Pixeln. */
  size?: number;
}

interface BadgeProps extends MarkProps {
  /**
   * Schriftzug im Kreis mitzeichnen. Unter etwa 64 Pixeln wird er zu Matsch —
   * dort trägt der Schriftzug daneben den Namen.
   */
  withText?: boolean;
  /**
   * Pfad zur Original-Logodatei. Ist er gesetzt, wird sie unverändert
   * angezeigt — die Zeichnung tritt vollständig zurück.
   */
  src?: string | null;
}

/** Rundes Zeichen: blauer Ring, roter Innenbogen, Skyline, Schriftzug. */
export function MdcMark({ className, size = 46, withText, src }: BadgeProps) {
  const showText = withText ?? size >= 64;
  const LOGO_IMAGE = src ?? null;

  if (LOGO_IMAGE) {
    return (
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className={className}
        role="img"
        aria-label="Munich Darts Challenge"
      >
        <image href={LOGO_IMAGE} x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid meet" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Munich Darts Challenge"
    >
      {/* Äußerer blauer Ring und roter Innenbogen — beides aus der Vorlage */}
      <circle cx="60" cy="60" r="56" fill="#FFFFFF" />
      <circle cx="60" cy="60" r="56" fill="none" stroke={LOGO_BLUE} strokeWidth="3" />
      <path
        d="M11 60a49 49 0 0 1 98 0"
        fill="none"
        stroke={LOGO_RED}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Ohne Schriftzug sitzt die Skyline mittig und etwas größer — sonst
          bliebe die untere Kreishälfte leer. Mit Schriftzug bleibt sie oben,
          genau wie in der Vorlage. */}
      <g transform={showText ? undefined : 'translate(60 60) scale(1.24) translate(-60 -38)'}>
        <DrawnSkyline />
        <rect x="26" y="53" width="68" height="2" fill={LOGO_BLUE} />
      </g>

      {showText && (
        <g textAnchor="middle" fontFamily="var(--mdc-font-display, sans-serif)" fontWeight="800">
          <text x="60" y="72" fontSize="15" fill={LOGO_BLUE} letterSpacing="0.5">MUNICH</text>
          <text x="60" y="87" fontSize="15" fill={LOGO_RED} letterSpacing="1.5">DARTS</text>
          <text x="60" y="98" fontSize="7.5" fill={LOGO_BLUE} letterSpacing="1.2">– CHALLENGE –</text>
        </g>
      )}
    </svg>
  );
}

/**
 * Münchner Silhouette für den Kreis — Bauwerke wie in der Vorlage, von links
 * nach rechts: Propyläen, Frauenkirche, Theatinerkirche, Olympiaturm,
 * Olympia-Zeltdach. Alles in einem Blau, ohne Binnenzeichnung: So bleibt sie
 * auch klein als Stadtsilhouette lesbar.
 */
function DrawnSkyline() {
  return (
    <g fill={LOGO_BLUE}>
      {/* Propyläen — Säulenbau links */}
      <rect x="26" y="42" width="15" height="11" />
      <rect x="26" y="39.5" width="15" height="2.5" />
      <g fill="#FFFFFF">
        <rect x="28.5" y="44" width="1.6" height="9" />
        <rect x="31.7" y="44" width="1.6" height="9" />
        <rect x="34.9" y="44" width="1.6" height="9" />
        <rect x="38.1" y="44" width="1.6" height="9" />
      </g>

      {/* Frauenkirche — die beiden Zwiebeltürme */}
      <rect x="43" y="40" width="14" height="13" />
      <rect x="44" y="26" width="5.2" height="27" />
      <rect x="51.4" y="26" width="5.2" height="27" />
      <path d="M44 26c-0.4-3.8 1.3-4.5 1.7-7.4 0.4-1.3 2-1.3 2.4 0 0.4 2.9 2.1 3.6 1.7 7.4z" />
      <path d="M51.4 26c-0.4-3.8 1.3-4.5 1.7-7.4 0.4-1.3 2-1.3 2.4 0 0.4 2.9 2.1 3.6 1.7 7.4z" />
      <rect x="46.3" y="15.5" width="0.6" height="3" />
      <rect x="53.7" y="15.5" width="0.6" height="3" />

      {/* Theatinerkirche — Kuppel mit zwei Türmen */}
      <rect x="60" y="38" width="9" height="15" />
      <path d="M59 38c0-6.5 11-6.5 11 0z" />
      <rect x="63.9" y="28.5" width="1.2" height="4" />
      <circle cx="64.5" cy="27.6" r="1" />
      <rect x="57.4" y="36" width="2.6" height="17" />
      <rect x="69" y="36" width="2.6" height="17" />
      <path d="M57.4 36l1.3-4 1.3 4zM69 36l1.3-4 1.3 4z" />

      {/* Häuserzeile */}
      <rect x="72" y="45" width="6" height="8" />

      {/* Olympiaturm */}
      <rect x="81" y="24" width="2.2" height="29" />
      <ellipse cx="82.1" cy="29" rx="5.2" ry="2.4" />
      <ellipse cx="82.1" cy="32.8" rx="3.9" ry="1.8" />
      <rect x="81.5" y="16" width="1.2" height="8" />

      {/* Olympia-Zeltdach */}
      <path d="M86 53q5-13 9-4 2.5-4 5 4z" />
    </g>
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
export function MdcThrower({ className, size = 34, src }: MarkProps & { src?: string | null }) {
  return (
    <svg
      viewBox="0 0 62 96"
      width={(size * 62) / 96}
      height={size}
      className={className}
      role="img"
      aria-label="Dartwerfer"
    >
      {src ? (
        <image href={src} x="0" y="0" width="62" height="96" preserveAspectRatio="xMidYMid meet" />
      ) : (
        <DrawnThrower />
      )}
    </svg>
  );
}

/** Gezeichneter Werfer — Rückfallebene ohne eigene Grafikdatei. */
function DrawnThrower() {
  return (
    <>
      <g stroke={LOGO_BLUE} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
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
      <circle cx="40" cy="17" r="10.5" fill={LOGO_BLUE} />

      {/* Ein echter Dart, in seine vier Teile gezeichnet — von der Spitze
          nach hinten: Nadel, Barrel (dick, in der Faust), Schaft, Flight.
          Genau diese Abstufung macht die Form als Dart lesbar; ein
          gleichmäßiger Strich mit Dreieck sieht aus wie ein Wimpel. */}
      <g strokeLinecap="round">
        {/* Nadel */}
        <path d="M4 7.5L9.4 11.6" stroke={LOGO_BLUE} strokeWidth="1.8" />
        {/* Barrel — liegt in der Wurfhand */}
        <path d="M9.8 11.9L17 17.3" stroke={LOGO_RED} strokeWidth="5" />
        {/* Schaft */}
        <path d="M17.4 17.6L21.6 20.8" stroke={LOGO_RED} strokeWidth="2.2" />
        {/* Flight */}
        <path d="M21.5 20.6l3.6 6.7 3.8-5.1z" fill={LOGO_RED} />
      </g>
    </>
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
