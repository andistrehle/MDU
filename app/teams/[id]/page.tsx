import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Card } from '@/components/mdu/card';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Pill } from '@/components/mdu/pill';
import { Btn } from '@/components/mdu/button';
import { Icon } from '@/components/mdu/icon';
import { ROSTER, TEAMS, findTeam } from '@/lib/data';
import { shade, diffColor } from '@/lib/utils';

const TEAM_TABS = ['Übersicht', 'Kader', 'Spielplan', 'Ergebnisse', 'Statistik', 'Galerie'];
const RECENT_MATCHES = [
  { h: 'fb', a: 'fd', hs: 7, as: 2, w: true,  date: '15.05' },
  { h: 'be', a: 'fb', hs: 3, as: 6, w: true,  date: '08.05' },
  { h: 'fb', a: 'sw', hs: 8, as: 1, w: true,  date: '01.05' },
  { h: 'fa', a: 'fb', hs: 5, as: 4, w: false, date: '24.04' },
  { h: 'fb', a: 'gh', hs: 7, as: 2, w: true,  date: '17.04' },
];

export default async function TeamProfilePage(props: PageProps<'/teams/[id]'>) {
  const { id } = await props.params;
  const team = findTeam(id) ?? TEAMS[0];

  return (
    <div style={{ background: '#0A0B0F', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/teams" />

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, ${shade(team.color, -0.55)}22 0%, #0A0B0F 100%), #0A0B0F`,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -220, top: '50%', transform: 'translateY(-50%)',
          width: 680, height: 680, pointerEvents: 'none', opacity: 0.5,
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        }}>
          <Image src="/hero-dartboard.png" alt="" width={680} height={680} style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 20% 50%, ${team.color}20, transparent 50%)` }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, #0A0B0F 35%, rgba(10,11,15,0.4) 65%, rgba(10,11,15,0.75))' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '34px 32px 30px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#8A8F9C', marginBottom: 24 }}>
            <Link href="/" style={{ color: '#8A8F9C', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/teams" style={{ color: '#8A8F9C', textDecoration: 'none' }}>Teams</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: '#F5F6FA' }}>{team.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 30 }}>
            <div style={{
              width: 144, height: 144, borderRadius: '24%', flexShrink: 0,
              background: `linear-gradient(135deg, ${team.color}, ${shade(team.color, -0.5)})`,
              border: '2px solid #E8B84A', boxShadow: `0 24px 60px ${team.color}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, color: '#F5F6FA',
            }}>
              {team.short}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Pill tone="red">A Liga · Tabellenführer</Pill>
                <Pill tone="gold">Meister 2023/24</Pill>
              </div>
              <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 72, lineHeight: 0.9, letterSpacing: '-0.005em', color: '#F5F6FA', margin: 0, textTransform: 'uppercase' }}>
                {team.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: '#C9CCD6' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14} stroke={2} /> {team.venue}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="users" size={14} stroke={2} /> Captain Achatz · 8 Spieler</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={14} stroke={2} /> Mi · 19:30</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="outline" icon="star-o">Favorit</Btn>
              <Btn kind="outline" icon="mail">Kontakt</Btn>
              <Btn kind="primary" icon="users">Team folgen</Btn>
            </div>
          </div>

          {/* KPIs */}
          <div style={{
            marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { n: '1.', l: 'Tabellenplatz', c: '#E8B84A' },
              { n: '12', l: 'Siege' },
              { n: '2',  l: 'Niederlagen' },
              { n: '168:84', l: 'Legs', mono: true },
              { n: '+84', l: 'Differenz', c: '#5BE08C' },
              { n: '36', l: 'Punkte' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#14161E', padding: '18px 18px' }}>
                <div style={{
                  fontFamily: s.mono ? 'var(--font-jetbrains-mono)' : 'var(--font-saira-condensed)',
                  fontWeight: 900, fontSize: s.mono ? 22 : 32,
                  color: s.c ?? '#F5F6FA', lineHeight: 1,
                }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#8A8F9C', textTransform: 'uppercase', marginTop: 8 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
          {TEAM_TABS.map((tab, i) => (
            <div key={tab} style={{
              padding: '18px 0', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14,
              color: i === 0 ? '#F5F6FA' : '#8A8F9C',
              borderBottom: i === 0 ? '2px solid #D40000' : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer',
            }}>{tab}</div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Roster */}
          <Card padding={0}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F5F6FA' }}>Kader</span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#8A8F9C' }}>8 Spieler · Saison 2025/26</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 70px 90px 60px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#8A8F9C', textTransform: 'uppercase' }}>
              <span>#</span><span>Name</span><span>Rolle</span>
              <span style={{ textAlign: 'right' }}>Avg</span>
              <span style={{ textAlign: 'right' }}>180er</span>
              <span style={{ textAlign: 'right' }}>Sp</span>
            </div>
            {ROSTER.map((p, i) => (
              <div key={p.name} className="mdu-row-hover" style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 70px 90px 60px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontFamily: 'var(--font-manrope)', fontSize: 14 }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#5A5F6C', fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2C313F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 11, color: '#C9CCD6' }}>
                    {p.name.split(' ').map(x => x[0]).join('')}
                  </div>
                  <span style={{ fontWeight: 700, color: '#F5F6FA' }}>{p.name}</span>
                  {p.role === 'Captain' && <Pill tone="gold" style={{ padding: '2px 6px', fontSize: 9 }}>C</Pill>}
                </div>
                <span style={{ color: '#C9CCD6', fontSize: 13 }}>{p.role}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: '#F5F6FA' }}>{p.avg}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-jetbrains-mono)', color: '#E8B84A' }}>{p.hf}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-jetbrains-mono)', color: '#8A8F9C' }}>{p.games}</span>
              </div>
            ))}
          </Card>

          {/* Recent matches */}
          <Card padding={0}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F5F6FA' }}>Letzte Spiele</span>
            </div>
            {RECENT_MATCHES.map((g, i) => {
              const home = findTeam(g.h)!;
              const away = findTeam(g.a)!;
              return (
                <div key={i} className="mdu-row-hover" style={{ display: 'grid', gridTemplateColumns: '56px 1fr 96px 1fr 32px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#8A8F9C' }}>{g.date}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{home.short}</span>
                    <TeamBadge initials={home.short} color={home.color} size={24} />
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: '#F5F6FA', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 0' }}>
                    {g.hs} : {g.as}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamBadge initials={away.short} color={away.color} size={24} />
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{away.short}</span>
                  </div>
                  <span style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: g.w ? 'rgba(34,197,94,0.16)' : 'rgba(239,68,68,0.16)', color: g.w ? '#5BE08C' : '#FF6B6B', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 11 }}>
                    {g.w ? 'W' : 'L'}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Statistik</span>
            </div>
            {[
              { l: 'Team-Average',  v: '89.7', frac: 0.78, c: '#D40000' },
              { l: '180er / Spiel', v: '4.2',  frac: 0.62, c: '#E8B84A' },
              { l: 'Checkout %',    v: '38%',  frac: 0.38, c: '#3B82F6' },
              { l: 'High Finish Ø', v: '114',  frac: 0.71, c: '#22C55E' },
              { l: 'Leg-Quote',     v: '66%',  frac: 0.66, c: '#8B5CF6' },
            ].map(s => (
              <div key={s.l} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#C9CCD6' }}>
                  <span>{s.l}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: '#F5F6FA' }}>{s.v}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div style={{ width: `${s.frac * 100}%`, height: '100%', background: `linear-gradient(90deg, ${s.c}, ${shade(s.c, -0.3)})`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </Card>

          {/* Next match */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Nächstes Spiel</span>
              <Pill tone="red">In 3 Tagen</Pill>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {[team, null, findTeam('be')].map((t, i) => t ? (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <TeamBadge initials={t.short} color={t.color} size={46} />
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', textAlign: 'center' }}>{t.name}</span>
                </div>
              ) : (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, color: '#F5F6FA', letterSpacing: '0.04em' }}>VS</div>
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#8A8F9C', marginTop: 4 }}>22.05 · 19:30</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#8A8F9C', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Icon name="pin" size={13} stroke={2} /> {team.venue}
            </div>
          </Card>

          {/* Contact */}
          <Card>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Kontakt</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="user" size={14} stroke={2} /> Markus Achatz (Captain)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="mail" size={14} stroke={2} /> bazis@dartunion.de</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="phone" size={14} stroke={2} /> +49 89 1234 5678</div>
            </div>
          </Card>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
