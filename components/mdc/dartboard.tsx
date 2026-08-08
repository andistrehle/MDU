// ============================================================
// MDC — Dartscheibe als SVG
// ============================================================
//
// Wird als Hintergrundmotiv und als kleines Zeichen benutzt. Bewusst
// gezeichnet statt als Bild: Sie ist gestochen scharf auf jedem Display,
// wiegt ein paar Kilobyte und lässt sich einfärben.
//
// Die Geometrie folgt der echten Scheibe — Segmentfolge, Doppel- und
// Trippelring, Bull. Kein Rendering hängt von Zufall oder Uhrzeit ab.
// ============================================================

/** Segmentfolge im Uhrzeigersinn, beginnend oben. */
const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const R_OUTER = 100;   // Zahlenring außen
const R_NUMBER = 92.5; // Mitte des Zahlenrings
const R_BOARD = 85;    // Doppelring außen
const R_DOUBLE = 81;   // Doppelring innen
const R_TRIPLE_OUT = 53.5;
const R_TRIPLE_IN = 49.5;
const R_BULL_OUT = 8;
const R_BULL = 3.4;

const STEP = 360 / SEGMENTS.length;

function polar(radius: number, degrees: number): [number, number] {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return [100 + radius * Math.cos(rad), 100 + radius * Math.sin(rad)];
}

/** Ringsegment zwischen zwei Radien und zwei Winkeln. */
function ringSegment(rInner: number, rOuter: number, from: number, to: number): string {
  const [x1, y1] = polar(rOuter, from);
  const [x2, y2] = polar(rOuter, to);
  const [x3, y3] = polar(rInner, to);
  const [x4, y4] = polar(rInner, from);
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

const BLACK = '#141414';
const CREAM = '#DED3B4';
const RED = '#D61A1A';
const GREEN = '#1E7A3C';

interface DartboardProps {
  className?: string;
  /** Zahlenring mitzeichnen — bei kleinen Größen besser aus. */
  showNumbers?: boolean;
  title?: string;
}

export function Dartboard({ className, showNumbers = true, title }: DartboardProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}

      <circle cx="100" cy="100" r={R_OUTER} fill="#0D0D0D" />
      <circle cx="100" cy="100" r={R_BOARD} fill={BLACK} />

      {SEGMENTS.map((value, index) => {
        const from = index * STEP - STEP / 2;
        const to = from + STEP;
        const even = index % 2 === 0;
        const single = even ? BLACK : CREAM;
        const ring = even ? RED : GREEN;
        return (
          <g key={value}>
            <path d={ringSegment(R_DOUBLE, R_BOARD, from, to)} fill={ring} />
            <path d={ringSegment(R_TRIPLE_OUT, R_DOUBLE, from, to)} fill={single} />
            <path d={ringSegment(R_TRIPLE_IN, R_TRIPLE_OUT, from, to)} fill={ring} />
            <path d={ringSegment(R_BULL_OUT, R_TRIPLE_IN, from, to)} fill={single} />
          </g>
        );
      })}

      {/* Spinnennetz — die Drahtstege */}
      <g stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" fill="none">
        {SEGMENTS.map((value, index) => {
          const angle = index * STEP - STEP / 2;
          const [x1, y1] = polar(R_BULL_OUT, angle);
          const [x2, y2] = polar(R_BOARD, angle);
          return <line key={value} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {[R_BULL_OUT, R_TRIPLE_IN, R_TRIPLE_OUT, R_DOUBLE, R_BOARD].map(r => (
          <circle key={r} cx="100" cy="100" r={r} />
        ))}
      </g>

      <circle cx="100" cy="100" r={R_BULL_OUT} fill={GREEN} />
      <circle cx="100" cy="100" r={R_BULL} fill={RED} />

      {showNumbers && (
        <g
          fill="#E5E5E5"
          fontFamily="var(--mdc-font-display, sans-serif)"
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {SEGMENTS.map((value, index) => {
            const [x, y] = polar(R_NUMBER, index * STEP);
            return (
              <text key={value} x={x.toFixed(2)} y={y.toFixed(2)}>
                {value}
              </text>
            );
          })}
        </g>
      )}
    </svg>
  );
}
