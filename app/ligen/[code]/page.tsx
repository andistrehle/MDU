import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { StandingsTable } from '@/components/mdu/standings-table';
import { Icon } from '@/components/mdu/icon';
import { findLeague, getStandings } from '@/lib/data';

const TABS = ['Übersicht', 'Tabelle', 'Spielplan', 'Ergebnisse', 'Statistiken', 'Teams'];
const TEAM_TABS = ['Übersicht', 'Kader', 'Spielplan', 'Ergebnisse', 'Statistiken'];

export default async function LeagueDetailPage(props: PageProps<'/ligen/[code]'>) {
  const { code } = await props.params;
  const league = findLeague(code);
  const leagueName = league?.name ?? `${code.toUpperCase()} Liga`;
  const standings = getStandings(code);

  // Feature the league leader (first row in standings)
  const leaderRow = standings[0];
  const leaderName = leaderRow?.name ?? 'Noch nicht verfügbar';
  // Strip withdrawal marker (*) for display
  const leaderDisplayName = leaderName.replace(' *', '');
  // Short badge code: first letter of each word, max 3
  const leaderShort = leaderDisplayName
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .join('')
    .slice(0, 3)
    .toUpperCase();
  const leaderColor = league?.color ?? '#9AA4B2';
  const leaderTeamId = leaderRow?.team ?? '';

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
            paddingBottom: 14, borderBottom: `3px solid ${league?.color ?? '#D40000'}`, display: 'inline-block',
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
        <StandingsTable rows={standings} showU={true} />

        {/* Featured Team Card — league leader */}
        <div style={{ background: '#121821', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2', marginBottom: 16 }}>
            <Link href="/" style={{ color: '#9AA4B2', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={10} />
            <span>Teams</span>
            <Icon name="chevron" size={10} />
            <span style={{ color: '#F5F6FA' }}>{leaderDisplayName}</span>
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
                background: `linear-gradient(180deg, ${leaderColor}, ${leaderColor}99)`,
                clipPath: 'polygon(50% 0, 100% 18%, 100% 70%, 50% 100%, 0 70%, 0 18%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, color: '#fff', fontSize: 13 }}>{leaderShort}</span>
              </div>
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, letterSpacing: '0.03em', color: '#FFFFFF', margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>{leaderDisplayName}</h2>
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
                { k: 'Liga',       v: leagueName },
                { k: 'Saison',     v: league?.season ?? '2026' },
                { k: 'Tabellenplatz', v: leaderRow ? `Platz ${leaderRow.pos}` : '—' },
                { k: 'Punkte',     v: leaderRow ? `${leaderRow.pts} Pkt.` : '—' },
                { k: 'Spielstätte',v: 'Noch nicht verfügbar' },
                { k: 'Kapitän',    v: 'Noch nicht verfügbar' },
              ].map(row => (
                <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, alignItems: 'start', marginBottom: 10 }}>
                  <span style={{ color: '#9AA4B2', fontSize: 12, fontFamily: 'var(--font-manrope)' }}>{row.k}</span>
                  <span style={{ color: '#F5F6FA', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-manrope)' }}>{row.v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12 }}>Kurzinfo</div>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6', lineHeight: 1.55, margin: 0 }}>
                {leaderRow
                  ? `${leaderDisplayName} führt die ${leagueName} nach ${leaderRow.sp} Spielen mit ${leaderRow.pts} Punkten an (${leaderRow.s}S / ${leaderRow.u}U / ${leaderRow.n}N).`
                  : 'Teamdaten werden aktualisiert.'}
              </p>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6A6E7B', lineHeight: 1.55, margin: '10px 0 0' }}>
                Vollständige Informationen auf{' '}
                <span style={{ color: '#9AA4B2' }}>dartunion.de</span>
              </p>
            </div>
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12 }}>Top 3</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {standings.slice(0, 3).map((r) => (
                <div key={r.pos} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, padding: '10px 12px',
                }}>
                  <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: r.pos <= 2 ? '#E8B84A' : '#F5F6FA' }}>{r.pos}.</div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: '#F5F6FA', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.name.replace(' *', '')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2', marginTop: 2 }}>{r.pts} Pkt.</div>
                </div>
              ))}
            </div>
          </div>

          <Link href={`/teams/${leaderTeamId}`} style={{
            display: 'block', marginTop: 18, width: '100%', padding: '13px', background: '#D40000',
            color: '#fff', borderRadius: 6, fontFamily: 'var(--font-manrope)', fontWeight: 800,
            fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none',
            textAlign: 'center', boxShadow: '0 6px 14px rgba(212,0,0,0.32)',
          }}>
            Team-Profil ansehen
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
