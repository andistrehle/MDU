import { Icon } from './icon';

type TagTone = 'red' | 'gold' | 'blue' | 'green' | 'neutral';

interface NewsCardProps {
  date: string;
  tag: string;
  tagTone?: TagTone;
  title: string;
}

const toneColor: Record<TagTone, string> = {
  red:     '#D40000',
  gold:    '#E8B84A',
  blue:    '#3B82F6',
  green:   '#22C55E',
  neutral: '#9AA4B2',
};

export function NewsCard({ date, tag, tagTone = 'neutral', title }: NewsCardProps) {
  return (
    <div
      className="mdu-card-hover"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 18px', borderRadius: 12,
        background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA4B2',
      }}>
        <Icon name="calendar" size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2' }}>{date}</span>
          <span style={{
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.18em', color: toneColor[tagTone], textTransform: 'uppercase',
          }}>{tag}</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14,
          color: '#F5F6FA', lineHeight: 1.4, marginTop: 6,
        }}>
          {title}
        </div>
      </div>
    </div>
  );
}
