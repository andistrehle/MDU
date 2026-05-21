import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { RESULTS, getExtendedTeam } from '@/lib/data';

export default function ErgebnissePage() {
  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/ergebnisse" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8 }}>Letzte Spieltage</div>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA', margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block' }}>
            Ergebnisse
          </h1>
        </div>

        {/* Desktop table */}
        <div className="mdu-desktop-only mdu-table-scroll">
        <div className="mdu-results-inner" style={{ background: '#121821', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
          {/* header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '70px 120px 1fr 100px 1fr 130px',
            padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
            color: '#9AA4B2', textTransform: 'uppercase', gap: 12,
          }}>
            <span>Datum</span><span>Liga</span><span style={{ textAlign: 'right' }}>Heim</span>
            <span style={{ textAlign: 'center' }}>Ergebnis</span><span>Auswärts</span><span>MVP</span>
          </div>

          {RESULTS.map((r, i) => {
            const home = getExtendedTeam(r.home);
            const away = getExtendedTeam(r.away);
            return (
              <div key={i} className="mdu-row-hover" style={{
                display: 'grid', gridTemplateColumns: '70px 120px 1fr 100px 1fr 130px',
                padding: '14px 20px', borderBottom: i < RESULTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center', gap: 12, cursor: 'pointer',
              }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#9AA4B2' }}>{r.date}</span>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#D40000', textTransform: 'uppercase' }}>{r.league}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{home.name}</span>
                  <TeamBadge initials={home.short.slice(0, 3)} color={home.color} size={28} />
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: '#F5F6FA', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 0' }}>
                  {r.hs}:{r.as}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamBadge initials={away.short.slice(0, 3)} color={away.color} size={28} />
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{away.name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>{r.mvp}</span>
              </div>
            );
          })}
        </div>
        </div>

        {/* Mobile stacked cards */}
        <div className="mdu-mobile-only">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RESULTS.map((r, i) => {
            const home = getExtendedTeam(r.home);
            const away = getExtendedTeam(r.away);
            return (
              <div key={i} style={{
                background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                {/* League + Date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', color: '#D40000', textTransform: 'uppercase' }}>{r.league}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2' }}>{r.date}</span>
                </div>
                {/* Teams + Score */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', alignItems: 'center', gap: 8 }}>
                  {/* Home */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <TeamBadge initials={home.short.slice(0, 3)} color={home.color} size={28} />
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{home.name}</span>
                  </div>
                  {/* Score */}
                  <div style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: '#F5F6FA', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 0' }}>
                    {r.hs}:{r.as}
                  </div>
                  {/* Away */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, textAlign: 'right' }}>{away.name}</span>
                    <TeamBadge initials={away.short.slice(0, 3)} color={away.color} size={28} />
                  </div>
                </div>
                {/* MVP */}
                {r.mvp && (
                  <div style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2' }}>
                    <span style={{ color: '#6A6E7B', marginRight: 4 }}>MVP:</span>{r.mvp}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
