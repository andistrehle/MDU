import { ReactNode } from 'react';

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  action?: ReactNode;
}

export function SectionHeader({ kicker, title, action }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        {kicker && (
          <div style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: '#D40000',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            {kicker}
          </div>
        )}
        <h2 className="section-heading" style={{ margin: 0 }}>{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
