import { Icon } from '@/components/mdu/icon';
import { Pill } from '@/components/mdu/pill';
import { TeamBadge } from '@/components/mdu/team-badge';

const KPI_CARDS = [
  { kicker: 'Ligen Saison 2026',   value: '6',  delta: '0',  deltaPos: true,  sub: 'LA · A1 · A2 · B1 · B2 · C', c: '#D40000' },
  { kicker: 'Teams gesamt',        value: '36', delta: '0',  deltaPos: true,  sub: 'alle Spielklassen',           c: '#3B82F6' },
  { kicker: 'Playoff-Phase',       value: 'Aktiv', delta: '', deltaPos: true, sub: 'Aufstieg & Abstieg laufen',   c: '#E8B84A' },
  { kicker: 'Offene Tickets',      value: '—',  delta: '',   deltaPos: true,  sub: 'Noch nicht verfügbar',        c: '#22C55E' },
];

const MATCH_TABLE = [
  { id: 'PL-A-11', date: '28.05 · 20:00', home: 'Alptraum',         away: 'Silberpfeile II',   score: '—',   venue: 'Noch nicht verfügbar', status: 'Geplant' },
  { id: 'PL-B-09', date: '28.05 · 20:00', home: 'Belfort Evolution', away: 'Flying Fighters',  score: '—',   venue: 'Noch nicht verfügbar', status: 'Geplant' },
  { id: 'PL-A-10', date: '21.05 · 20:00', home: 'Gambas',            away: 'Jolly Pirates V',   score: '9:9', venue: 'Noch nicht verfügbar', status: 'Final'   },
  { id: 'PL-B-08', date: '21.05 · 20:00', home: 'Fiaker Deife',      away: 'Master of Desaster',score: '12:6',venue: 'Noch nicht verfügbar', status: 'Final'   },
];

const TODO_ITEMS = [
  { dot: '#D40000', text: 'Spielstätten aller Teams in der Datenbank ergänzen' },
  { dot: '#E8B84A', text: 'Playoff-Spielpläne für A Liga und B Liga eintragen' },
  { dot: '#3B82F6', text: 'Kader-Daten von Vereinen anfordern und pflegen' },
  { dot: '#22C55E', text: 'Rückzug De Wolperdinga (A2) offiziell verarbeiten' },
];

// Real MDU contacts from dartunion.de/kontakt.php
const MEMBERS = [
  { initials: 'DK', name: 'Dimo Katsikas',   email: 'info@dartunion.de',   role: 'Präsident', status: 'Aktiv', lastSeen: '—' },
  { initials: 'MD', name: 'Manfred Domandl', email: 'manfred@domandl.com', role: 'Technik',   status: 'Aktiv', lastSeen: '—' },
];

export default function AdminDashboard() {
  return (
    <div style={{ color: '#F5F6FA' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#5A5F6C', textTransform: 'uppercase', marginBottom: 6 }}>Admin · Übersicht</div>
        <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0 }}>Dashboard</h1>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {KPI_CARDS.map(kpi => (
          <div key={kpi.kicker} style={{
            background: 'linear-gradient(180deg, #14161E, #11141B)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${kpi.c}33, transparent 70%)` }} />
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#8A8F9C', textTransform: 'uppercase' }}>{kpi.kicker}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 12 }}>
              <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40, color: '#F5F6FA', lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, fontWeight: 700, color: kpi.deltaPos ? '#5BE08C' : '#FF6B6B', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon name="arrow-up" size={11} stroke={3} style={{ transform: kpi.deltaPos ? 'none' : 'rotate(180deg)' }} />
                {kpi.delta}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#5A5F6C', marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 24 }}>
        {/* Match table */}
        <div style={{ background: 'linear-gradient(180deg, #14161E, #11141B)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Spiele</span>
            <button style={{ padding: '8px 14px', background: '#D40000', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="plus" size={14} /> Neues Spiel
            </button>
          </div>
          <div style={{ padding: '0 20px' }}>
            {MATCH_TABLE.map((m, i) => (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '70px 120px 1fr 80px 1fr 140px 80px 36px',
                padding: '14px 0', borderBottom: i < MATCH_TABLE.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center', gap: 12, fontFamily: 'var(--font-manrope)', fontSize: 12,
              }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#5A5F6C' }}>{m.id}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2' }}>{m.date}</span>
                <span style={{ color: '#F5F6FA', fontWeight: 600 }}>{m.home}</span>
                <span style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 16, color: '#F5F6FA' }}>{m.score}</span>
                <span style={{ color: '#F5F6FA', fontWeight: 600 }}>{m.away}</span>
                <span style={{ color: '#9AA4B2', fontSize: 11 }}>{m.venue}</span>
                <Pill tone={m.status === 'LIVE' ? 'live' : m.status === 'Final' ? 'green' : 'neutral'}>{m.status}</Pill>
                <button style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#9AA4B2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="edit" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* To-Do */}
        <div style={{ background: 'linear-gradient(180deg, #14161E, #11141B)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Aufgaben</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {TODO_ITEMS.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', cursor: 'pointer' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6', lineHeight: 1.4 }}>{item.text}</span>
                <Icon name="chevron" size={14} style={{ color: '#5A5F6C', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{ background: 'linear-gradient(180deg, #14161E, #11141B)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mitglieder</span>
          <button style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', color: '#C9CCD6', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Alle anzeigen
          </button>
        </div>
        <div style={{ padding: '0 20px' }}>
          {MEMBERS.map((m, i) => (
            <div key={m.name} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 100px 80px 80px 70px 36px',
              padding: '14px 0', borderBottom: i < MEMBERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#D40000,#8A0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 12, color: '#fff' }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: '#F5F6FA' }}>{m.name}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>{m.email}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6' }}>{m.role}</span>
              <Pill tone={m.status === 'Aktiv' ? 'green' : 'neutral'}>{m.status}</Pill>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>{m.lastSeen}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13, color: '#9AA4B2' }}>—</span>
              <button style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#9AA4B2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="edit" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
