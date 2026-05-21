import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { MatchCard } from '@/components/mdu/match-card';
import { UPCOMING } from '@/lib/data';

export default function SpielplanPage() {
  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/spielplan" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8 }}>Liga-Kalender</div>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block' }}>
            Spielplan
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
          {UPCOMING.map((m, i) => (
            <MatchCard key={i} league={m.league} home={m.home} away={m.away} date={m.date} time={m.time} venue={m.venue} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
