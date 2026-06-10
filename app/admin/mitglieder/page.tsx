import { Pill } from '@/components/mdu/pill';
import { Icon } from '@/components/mdu/icon';

// MDU contact persons from dartunion.de/kontakt.php
// Player/member data is not publicly listed — to be added once provided by teams
const MEMBERS = [
  { initials: 'DK', color: 'var(--th-accent)', name: 'Dimo Katsikas',    email: 'info@dartunion.de',      role: 'Präsident',  status: 'Aktiv', lastSeen: '—' },
  { initials: 'MD', color: '#3B82F6', name: 'Manfred Domandl',  email: 'manfred@domandl.com',    role: 'Technik',    status: 'Aktiv', lastSeen: '—' },
];

export default function AdminMitgliederPage() {
  return (
    <div style={{ color: 'var(--th-text-strong)' }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--th-text-faint2)', textTransform: 'uppercase', marginBottom: 6 }}>Admin · Verwaltung</div>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: 0 }}>Mitglieder</h1>
        </div>
        <button style={{ padding: '11px 18px', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} /> Mitglied hinzufügen
        </button>
      </div>

      <div style={{ background: 'linear-gradient(180deg, var(--th-bg-card3), var(--th-bg-card2))', border: '1px solid var(--th-line-6)', borderRadius: 14 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '42px 1fr 100px 80px 90px 70px 44px',
          padding: '12px 20px', borderBottom: '1px solid var(--th-line-8)',
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: 'var(--th-text-muted)', textTransform: 'uppercase', gap: 14,
        }}>
          <span></span><span>Mitglied</span><span>Rolle</span><span>Status</span>
          <span>Zuletzt</span><span style={{ textAlign: 'right' }}></span><span></span>
        </div>
        <div style={{ padding: '0 20px' }}>
          {MEMBERS.map((m, i) => (
            <div key={m.name} className="mdu-row-hover" style={{
              display: 'grid', gridTemplateColumns: '42px 1fr 100px 80px 90px 70px 44px',
              padding: '14px 0', borderBottom: i < MEMBERS.length - 1 ? '1px solid var(--th-line-4)' : 'none',
              alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${m.color}, ${m.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 12, color: '#fff' }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)' }}>{m.name}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>{m.email}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>{m.role}</span>
              <Pill tone={m.status === 'Aktiv' ? 'green' : 'neutral'}>{m.status}</Pill>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>{m.lastSeen}</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-muted)' }}>—</span>
              <button style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--th-line-4)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="edit" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
