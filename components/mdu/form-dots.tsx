interface FormDotsProps {
  form: ('W' | 'L')[];
}

export function FormDots({ form }: FormDotsProps) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {form.map((r, i) => (
        <div
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: r === 'W' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${r === 'W' ? '#22C55E' : '#EF4444'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-jetbrains-mono)',
            fontWeight: 700,
            fontSize: 9,
            color: r === 'W' ? '#5BE08C' : '#FF6B6B',
          }}
        >
          {r}
        </div>
      ))}
    </div>
  );
}
