import { Icon } from '@/components/mdu/icon';
import { Pill } from '@/components/mdu/pill';
import { TeamBadge } from '@/components/mdu/team-badge';

const KPI_CARDS = [
  { kicker: 'Aktive Spiele heute', value: '6', delta: '+2', deltaPos: true,  sub: 'davon 2 live',          c: '#D40000' },
  { kicker: 'Spieler online',      value: '47', delta: '+12', deltaPos: true, sub: 'letzte 24 Stunden',    c: '#3B82F6' },
  { kicker: 'Saison-180er',        value: '284', delta: '+18', deltaPos: true, sub: 'diese Saison gesamt', c: '#E8B84A' },
  { kicker: 'Offene Tickets',      value: '3',  delta: '-1', deltaPos: false,  sub: '2 dringend',          c: '#22C55E' },
];

const MATCH_TABLE = [
  { id: 'A1-047', date: '22.05 · 19:30', home: 'DC Bavaria',      away: 'Flying Arrows',  score: '—',  venue: 'Maxvorstadt Treff',    status: 'Geplant' },
  { id: 'B2-023', date: '22.05 · 18:00', home: 'Super Bulls',     away: 'Dart Crew',      score: '5:3', venue: 'Zum Roten Pfeil',     status: 'LIVE' },
  { id: 'C2-011', date: '21.05 · 20:00', home: 'Triple Trouble',  away: 'Schwabing Fly.', score: '7:5', venue: 'Dart Base',           status: 'Final' },
  { id: 'A1-046', date: '18.05 · 19:30', home: 'DC Bavaria',      away: 'Night Flights',  score: '8:4', venue: 'Maxvorstadt Treff',   status: 'Final' },
];

const TODO_ITEMS = [
  { dot: '#D40000', text: 'Spielbericht A1-047 prüfen und freigeben' },
  { dot: '#E8B84A', text: 'Neue Spielstätte "Olympia Bar" bestätigen' },
  { dot: '#3B82F6', text: 'Saison-Endspurt News veröffentlichen' },
  { dot: '#22C55E', text: 'Kader-Update Freibad Bazis abschließen' },
];

const MEMBERS = [
  { initials: 'MA', name: 'Markus Achatz',    email: 'achatz@dartunion.de', role: 'Captain',  status: 'Aktiv',  lastSeen: 'Heute',     avg: 92.4 },
  { initials: 'SB', name: 'Stefan Brandl',    email: 'brandl@dartunion.de', role: 'Spieler',  status: 'Aktiv',  lastSeen: 'Gestern',   avg: 88.1 },
  { initials: 'LR', name: 'Lisa Reiter',      email: 'reiter@dartunion.de', role: 'Spieler',  status: 'Aktiv',  lastSeen: '20.05',     avg: 86.7 },
  { initials: 'TH', name: 'Thomas Huber',     email: 'huber@dartunion.de',  role: 'Reserve',  status: 'Inaktiv',lastSeen: '15.05',     avg: 84.2 },
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
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{m.avg}</span>
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
