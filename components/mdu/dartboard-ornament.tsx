interface DartboardOrnamentProps {
  size?: number;
  intensity?: number;
  style?: React.CSSProperties;
}

export function DartboardOrnament({ size = 520, intensity = 1, style }: DartboardOrnamentProps) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        position: 'absolute',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: `radial-gradient(circle at 50% 50%,
          var(--th-accent) 0 ${3 * intensity}%,
          var(--th-bg-deep) ${3 * intensity}% ${6 * intensity}%,
          #1B1E28 ${6 * intensity}% ${7 * intensity}%,
          transparent ${7 * intensity}% ${17 * intensity}%,
          var(--th-accent-a35) ${17 * intensity}% ${18 * intensity}%,
          transparent ${18 * intensity}% ${32 * intensity}%,
          rgba(232,184,74,0.18) ${32 * intensity}% ${33 * intensity}%,
          transparent ${33 * intensity}% ${48 * intensity}%,
          var(--th-line-5) ${48 * intensity}% ${49 * intensity}%,
          transparent ${49 * intensity}%)`,
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'conic-gradient(from 9deg, var(--th-line-4) 0 0.6deg, transparent 0.6deg 18deg, var(--th-line-4) 18deg 18.6deg, transparent 18.6deg 36deg, var(--th-line-4) 36deg 36.6deg, transparent 36.6deg 54deg, var(--th-line-4) 54deg 54.6deg, transparent 54.6deg 72deg, var(--th-line-4) 72deg 72.6deg, transparent 72.6deg 90deg, var(--th-line-4) 90deg 90.6deg, transparent 90.6deg 108deg, var(--th-line-4) 108deg 108.6deg, transparent 108.6deg 126deg, var(--th-line-4) 126deg 126.6deg, transparent 126.6deg 144deg, var(--th-line-4) 144deg 144.6deg, transparent 144.6deg 162deg, var(--th-line-4) 162deg 162.6deg, transparent 162.6deg 180deg, var(--th-line-4) 180deg 180.6deg, transparent 180.6deg 198deg, var(--th-line-4) 198deg 198.6deg, transparent 198.6deg 216deg, var(--th-line-4) 216deg 216.6deg, transparent 216.6deg 234deg, var(--th-line-4) 234deg 234.6deg, transparent 234.6deg 252deg, var(--th-line-4) 252deg 252.6deg, transparent 252.6deg 270deg, var(--th-line-4) 270deg 270.6deg, transparent 270.6deg 288deg, var(--th-line-4) 288deg 288.6deg, transparent 288.6deg 306deg, var(--th-line-4) 306deg 306.6deg, transparent 306.6deg 324deg, var(--th-line-4) 324deg 324.6deg, transparent 324.6deg 342deg, var(--th-line-4) 342deg 342.6deg, transparent 342.6deg 360deg)',
        mask: 'radial-gradient(circle at 50% 50%, transparent 0 7%, #000 7% 49%, transparent 49%)',
        WebkitMask: 'radial-gradient(circle at 50% 50%, transparent 0 7%, #000 7% 49%, transparent 49%)',
      }} />
    </div>
  );
}
