import { Pill } from '@/components/mdu/pill';
import { Icon } from '@/components/mdu/icon';

// MDU contact persons from dartunion.de/kontakt.php
// Player/member data is not publicly listed — to be added once provided by teams
const MEMBERS = [
  { initials: 'DK', color: '#D40000', name: 'Dimo Katsikas',    email: 'info@dartunion.de',      role: 'Präsident',  status: 'Aktiv', lastSeen: '—' },
  { initials: 'MD', color: '#3B82F6', name: 'Manfred Domandl',  email: 'manfred@domandl.com',    role: 'Technik',    status: 'Aktiv', lastSeen: '—' },
];

export default function AdminMitgliederPage() {
  return (
    <div style={{ color: '#F5F6FA' }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#5A5F6C', textTransform: 'uppercase', marginBottom: 6 }}>Admin · Verwaltung</div>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0 }}>Mitglieder</h1>
        </div>
        <button style={{ padding: '11px 18px', background: '#D40000', color: '#fff', border: '1px solid #FF1F1F', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} /> Mitglied hinzufügen
        </button>
      </div>

      <div style={{ background: 'linear-gradient(180deg, #14161E, #11141B)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '42px 1fr 100px 80px 90px 70px 44px',
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase', gap: 14,
        }}>
          <span></span><span>Mitglied</span><span>Rolle</span><span>Status</span>
          <span>Zuletzt</span><span style={{ textAlign: 'right' }}></span><span></span>
        </div>
        <div style={{ padding: '0 20px' }}>
          {MEMBERS.map((m, i) => (
            <div key={m.name} className="mdu-row-hover" style={{
              display: 'grid', gridTemplateColumns: '42px 1fr 100px 80px 90px 70px 44px',
              padding: '14px 0', borderBottom: i < MEMBERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${m.color}, ${m.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 12, color: '#fff' }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: '#F5F6FA' }}>{m.name}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>{m.email}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6' }}>{m.role}</span>
              <Pill tone={m.status === 'Aktiv' ? 'green' : 'neutral'}>{m.status}</Pill>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>{m.lastSeen}</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13, color: '#9AA4B2' }}>—</span>
              <button style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9AA4B2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="edit" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
