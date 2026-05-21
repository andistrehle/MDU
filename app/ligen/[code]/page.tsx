import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { StandingsTable } from '@/components/mdu/standings-table';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';
import { A1_STANDINGS, EXTENDED_TEAMS } from '@/lib/data';

const TABS = ['Übersicht', 'Tabelle', 'Spielplan', 'Ergebnisse', 'Statistiken', 'Teams'];
const TEAM_TABS = ['Übersicht', 'Kader', 'Spielplan', 'Ergebnisse', 'Statistiken'];

const LAST_RESULTS = [
  { date: '18.05.2024', home: 'DC Bavaria',   away: 'Night Flights', hs: 8, as: 4 },
  { date: '11.05.2024', home: 'Dart Wizards', away: 'DC Bavaria',    hs: 5, as: 7 },
  { date: '04.05.2024', home: 'DC Bavaria',   away: 'Close Call',    hs: 9, as: 3 },
];

export default async function LeagueDetailPage(props: PageProps<'/ligen/[code]'>) {
  const { code } = await props.params;
  const leagueName = code.toUpperCase() === 'A1' ? 'A1 Liga' : `${code.toUpperCase()} Liga`;
  const featuredTeam = EXTENDED_TEAMS['db'];

  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/ligen" />

      {/* Banner */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #0D1117 0%, #05070A 100%)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div aria-hidden style={{
          position: 'absolute', right: -260, top: '50%', transform: 'translateY(-50%)',
          width: 680, height: 680, pointerEvents: 'none', opacity: 0.7,
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        }}>
          <Image src="/hero-dartboard.png" alt="" width={680} height={680} style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, #05070A 30%, rgba(5,7,10,0.4) 65%, rgba(5,7,10,0.7))' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '34px 28px 24px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2', marginBottom: 16 }}>
            <Link href="/" style={{ color: '#9AA4B2', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/ligen" style={{ color: '#9AA4B2', textDecoration: 'none' }}>Ligen</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: '#F5F6FA' }}>{leagueName}</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, lineHeight: 0.92,
            letterSpacing: '-0.005em', color: '#FFFFFF', margin: 0, textTransform: 'uppercase',
            paddingBottom: 14, borderBottom: '3px solid #D40000', display: 'inline-block',
          }}>{leagueName}</h1>
        </div>

        {/* Tabs */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,17,23,0.6)', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', gap: 36 }}>
            {TABS.map((tab, i) => (
              <div key={tab} style={{
                padding: '16px 0', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                color: i === 1 ? '#D40000' : '#9AA4B2',
                borderBottom: i === 1 ? '2px solid #D40000' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>{tab}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 22 }}>
        <StandingsTable rows={A1_STANDINGS} showU={true} />

        {/* Team Profile Card */}
        <div style={{ background: '#121821', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2', marginBottom: 16 }}>
            <Link href="/" style={{ color: '#9AA4B2', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={10} />
            <span>Teams</span>
            <Icon name="chevron" size={10} />
            <span style={{ color: '#F5F6FA' }}>DC Bavaria</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div style={{
              width: 62, height: 72, position: 'relative', flexShrink: 0,
              background: 'linear-gradient(180deg, #2C313F, #14161E)',
              clipPath: 'polygon(50% 0, 100% 18%, 100% 70%, 50% 100%, 0 70%, 0 18%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 46, height: 54, position: 'absolute',
                background: 'linear-gradient(180deg, #F59E0B, #A06D08)',
                clipPath: 'polygon(50% 0, 100% 18%, 100% 70%, 50% 100%, 0 70%, 0 18%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, color: '#fff', fontSize: 13 }}>DCB</span>
              </div>
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, letterSpacing: '0.03em', color: '#FFFFFF', margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>DC Bavaria</h2>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#9AA4B2', marginTop: 6 }}>{leagueName}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 18 }}>
            {TEAM_TABS.map((tab, i) => (
              <div key={tab} style={{
                padding: '10px 0', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                color: i === 0 ? '#D40000' : '#9AA4B2',
                borderBottom: i === 0 ? '2px solid #D40000' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>{tab}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12 }}>Team Info</div>
              {[
                { k: 'Gegründet', v: '2018' },
                { k: 'Spielstätte', v: 'Maxvorstadt Treff' },
                { k: 'Kapitän', v: 'Max Mustermann' },
                { k: 'E-Mail', v: 'kontakt@dcbavaria.de' },
              ].map(row => (
                <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, alignItems: 'start', marginBottom: 10 }}>
                  <span style={{ color: '#9AA4B2', fontSize: 12, fontFamily: 'var(--font-manrope)' }}>{row.k}</span>
                  <span style={{ color: '#F5F6FA', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-manrope)' }}>{row.v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12 }}>Kurzinfo</div>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6', lineHeight: 1.55, margin: 0 }}>
                Wir sind der DC Bavaria und spielen seit der Saison 2019 in der {leagueName} der Münchner Dart Union.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12 }}>Letzte Ergebnisse</div>
            {LAST_RESULTS.map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '82px 1fr 50px 1fr',
                padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2' }}>{r.date}</span>
                <span style={{ color: '#F5F6FA', textAlign: 'right', fontWeight: r.home === 'DC Bavaria' ? 700 : 500 }}>{r.home}</span>
                <span style={{ textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: '#F5F6FA' }}>{r.hs}:{r.as}</span>
                <span style={{ color: '#F5F6FA', fontWeight: r.away === 'DC Bavaria' ? 700 : 500 }}>{r.away}</span>
              </div>
            ))}
          </div>

          <Link href={`/teams/db`} style={{
            display: 'block', marginTop: 18, width: '100%', padding: '13px', background: '#D40000',
            color: '#fff', borderRadius: 6, fontFamily: 'var(--font-manrope)', fontWeight: 800,
            fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none',
            textAlign: 'center', boxShadow: '0 6px 14px rgba(212,0,0,0.32)',
          }}>
            Zum Spielplan
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
