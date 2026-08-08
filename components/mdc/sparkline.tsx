// ============================================================
// MDC — Formkurve
// ============================================================
//
// Kleine Linie über die letzten Turnierergebnisse. Bewusst ohne Achsen und
// Gitter: Sie soll den Verlauf zeigen, nicht Werte ablesen lassen — die
// genauen Zahlen stehen direkt darunter in der Tabelle.
// ============================================================

interface SparklineProps {
  /** Werte in zeitlicher Reihenfolge (ältester zuerst). */
  values: number[];
  /** Beschriftung für Screenreader. */
  label: string;
  width?: number;
  height?: number;
}

export function Sparkline({ values, label, width = 320, height = 64 }: SparklineProps) {
  if (values.length < 2) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * stepX;
    // 6 px Luft oben und unten, damit die Punkte nicht am Rand kleben.
    const y = height - 6 - ((value - min) / span) * (height - 12);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="mdc-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D61A1A" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#D61A1A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#mdc-spark-fill)" />
      <path d={line} fill="none" stroke="#D61A1A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={index === points.length - 1 ? 4 : 2.5}
          fill={index === points.length - 1 ? '#D61A1A' : '#1F3B73'}
        />
      ))}
    </svg>
  );
}
