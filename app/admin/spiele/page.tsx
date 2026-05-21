import { Pill } from '@/components/mdu/pill';
import { Icon } from '@/components/mdu/icon';

const MATCHES = [
  // Playoff-Phase Saison 2026 — Spielpläne auf dartunion.de
  { id: 'PL-A-11', date: '28.05 · 20:00', home: 'Alptraum',          away: 'Silberpfeile II',    score: '—',   venue: 'Noch nicht verfügbar', status: 'Geplant' },
  { id: 'PL-A-12', date: '28.05 · 20:00', home: 'DC Animals II',     away: 'Treff Nix Freimann', score: '—',   venue: 'Noch nicht verfügbar', status: 'Geplant' },
  { id: 'PL-B-09', date: '28.05 · 20:00', home: 'Belfort Evolution', away: 'Flying Fighters',    score: '—',   venue: 'Noch nicht verfügbar', status: 'Geplant' },
  { id: 'PL-A-10', date: '21.05 · 20:00', home: 'Gambas',            away: 'Jolly Pirates V',    score: '9:9', venue: 'Noch nicht verfügbar', status: 'Final'   },
  { id: 'PL-B-08', date: '21.05 · 20:00', home: 'Fiaker Deife',      away: 'Master of Desaster', score: '12:6',venue: 'Noch nicht verfügbar', status: 'Final'   },
  // Pokal Fight 2026 · Runde 1 Hinspiel (01.12–07.12.2025)
  { id: 'PK-B-01', date: '07.12 · 2025',  home: 'Lucky Darts One',   away: "De Vogelwuid'n",     score: '10:8',venue: 'Noch nicht verfügbar', status: 'Final'   },
  { id: 'PK-A-01', date: '07.12 · 2025',  home: 'Game Over',         away: 'Treff Nix Freimann', score: '12:6',venue: 'Noch nicht verfügbar', status: 'Final'   },
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
