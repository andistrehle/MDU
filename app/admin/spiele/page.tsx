import { Pill } from '@/components/mdu/pill';
import { Icon } from '@/components/mdu/icon';

const MATCHES = [
  { id: 'A1-047', date: '22.05 · 19:30', home: 'DC Bavaria',      away: 'Flying Arrows',   score: '—',  venue: 'Maxvorstadt Treff', status: 'Geplant' },
  { id: 'B2-023', date: '22.05 · 18:00', home: 'Super Bulls',     away: 'Dart Crew',       score: '5:3', venue: 'Zum Roten Pfeil',  status: 'LIVE' },
  { id: 'C2-011', date: '21.05 · 20:00', home: 'Triple Trouble',  away: 'Schwabing Fly.',  score: '7:5', venue: 'Dart Base',        status: 'Final' },
  { id: 'A1-046', date: '18.05 · 19:30', home: 'DC Bavaria',      away: 'Night Flights',   score: '8:4', venue: 'Maxvorstadt Treff', status: 'Final' },
  { id: 'LA-009', date: '17.05 · 20:00', home: 'Freibad Bazis',   away: 'Flying Arrows',   score: '7:2', venue: 'Fiaker Stüberl',   status: 'Final' },
];

export default function AdminSpielePage() {
  return (
    <div style={{ color: '#F5F6FA' }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#5A5F6C', textTransform: 'uppercase', marginBottom: 6 }}>Admin · Spielverwaltung</div>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0 }}>Spiele</h1>
        </div>
        <button style={{ padding: '11px 18px', background: '#D40000', color: '#fff', border: '1px solid #FF1F1F', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} /> Neues Spiel
        </button>
      </div>

      <div style={{ background: 'linear-gradient(180deg, #14161E, #11141B)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 130px 1fr 90px 1fr 160px 90px 44px',
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase', gap: 12,
        }}>
          <span>ID</span><span>Termin</span><span>Heim</span><span style={{ textAlign: 'center' }}>Score</span>
          <span>Auswärts</span><span>Spielstätte</span><span>Status</span><span></span>
        </div>
        <div style={{ padding: '0 20px' }}>
          {MATCHES.map((m, i) => (
            <div key={m.id} className="mdu-row-hover" style={{
              display: 'grid', gridTemplateColumns: '80px 130px 1fr 90px 1fr 160px 90px 44px',
              padding: '14px 0', borderBottom: i < MATCHES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#5A5F6C' }}>{m.id}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2' }}>{m.date}</span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{m.home}</span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: '#F5F6FA' }}>{m.score}</span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{m.away}</span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>{m.venue}</span>
              <Pill tone={m.status === 'LIVE' ? 'live' : m.status === 'Final' ? 'green' : 'neutral'}>{m.status}</Pill>
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
