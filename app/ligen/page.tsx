import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { LEAGUES } from '@/lib/data';

const regularLeagues = LEAGUES.filter(l => l.type !== 'playoff');
const playoffGroups  = LEAGUES.filter(l => l.type === 'playoff');

function LeagueCard({ league }: { league: typeof LEAGUES[number] }) {
  return (
    <Link
      key={league.code}
      href={`/ligen/${league.code.toLowerCase()}`}
      className="mdu-card-hover"
      style={{
        display: 'block', textDecoration: 'none', padding: '22px 24px', borderRadius: 14,
        background: 'linear-gradient(180deg, #14161E 0%, #11141B 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 28px rgba(0,0,0,0.25)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: league.color, borderRadius: '14px 0 0 14px' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: league.color, textTransform: 'uppercase' }}>{league.tier}</span>
        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#5A5F6C' }}>{league.season}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, color: '#F5F6FA', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{league.name}</div>
      <div style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#9AA4B2' }}>
        {league.teams > 0 ? `${league.teams} Teams` : 'Teilnehmer folgen'}
      </div>
    </Link>
  );
}

export default function LigenPage() {
  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/ligen" />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8 }}>Saison 2025/26</div>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block' }}>
            Ligen Übersicht
          </h1>
        </div>

        {/* Playoff groups — shown first */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#9AA4B2', textTransform: 'uppercase', marginBottom: 8 }}>Saison 2026</div>
          <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>
            Playoffs
          </h2>
        </div>

        <div className="mdu-league-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 48 }}>
          {playoffGroups.map(league => (
            <LeagueCard key={league.code} league={league} />
          ))}
        </div>

        {/* Regular leagues */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#9AA4B2', textTransform: 'uppercase', marginBottom: 8 }}>Saison 2025/26</div>
          <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>
            Ligen
          </h2>
        </div>

        <div className="mdu-league-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {regularLeagues.map(league => (
            <LeagueCard key={league.code} league={league} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
