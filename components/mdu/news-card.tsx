import { Icon } from './icon';

type TagTone = 'red' | 'gold' | 'blue' | 'green' | 'neutral';

interface NewsCardProps {
  date: string;
  tag: string;
  tagTone?: TagTone;
  title: string;
}

const toneColor: Record<TagTone, string> = {
  red:     'var(--th-accent)',
  gold:    'var(--th-gold)',
  blue:    '#3B82F6',
  green:   '#22C55E',
  neutral: 'var(--th-text-muted)',
};

export function NewsCard({ date, tag, tagTone = 'neutral', title }: NewsCardProps) {
  return (
    <div
      className="mdu-card-hover"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 18px', borderRadius: 12,
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: 'var(--th-line-4)', border: '1px solid var(--th-line-8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-text-muted)',
      }}>
        <Icon name="calendar" size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)' }}>{date}</span>
          <span style={{
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.18em', color: toneColor[tagTone], textTransform: 'uppercase',
          }}>{tag}</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14,
          color: 'var(--th-text-strong)', lineHeight: 1.4, marginTop: 6,
        }}>
          {title}
        </div>
      </div>
    </div>
  );
}
