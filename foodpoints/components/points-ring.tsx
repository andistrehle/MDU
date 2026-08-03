'use client';

/**
 * Kreisförmige Fortschrittsanzeige für die Tagespunkte.
 * Zeigt verbleibende Punkte groß in der Mitte.
 */
export function PointsRing({
  used,
  budget,
  size = 168,
}: {
  used: number;
  budget: number;
  size?: number;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = budget > 0 ? Math.min(1, used / budget) : 0;
  const remaining = budget - used;
  const over = remaining < 0;

  return (
    <div className="relative" style={{ width: size, height: size }} role="img"
      aria-label={`${Math.abs(remaining)} Punkte ${over ? 'über dem Budget' : 'übrig'} von ${budget}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--fp-ring-track)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={over ? 'var(--fp-danger)' : 'var(--fp-brand)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold ${over ? 'text-danger' : 'text-ink'}`}>
          {Math.abs(remaining)}
        </span>
        <span className="text-xs font-medium text-mut">
          {over ? 'über Budget' : 'Punkte übrig'}
        </span>
        <span className="mt-0.5 text-xs text-mut">
          {used} / {budget} genutzt
        </span>
      </div>
    </div>
  );
}
