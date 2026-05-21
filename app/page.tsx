import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';
import { MatchCard } from '@/components/mdu/match-card';
import { NewsCard } from '@/components/mdu/news-card';
import { HOME_MATCHES, HOME_NEWS } from '@/lib/data';

export default function HomePage() {
  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/" />

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', background: '#05070A', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Hero dartboard photo — absolutely positioned, feathered into background */}
        <div aria-hidden style={{
          position: 'absolute', right: -180, top: '50%', transform: 'translateY(-50%)',
          width: 880, height: 880, pointerEvents: 'none',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 70%, transparent 92%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 70%, transparent 92%)',
        }}>
          <Image
            src="/hero-dartboard.png"
            alt=""
            width={880}
            height={880}
            priority
            style={{ width: 880, height: 880, objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        {/* Left-to-right dark gradient for text contrast */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, #05070A 28%, rgba(5,7,10,0.5) 55%, transparent 80%)',
        }} />

        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '80px 28px 84px', position: 'relative',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', minHeight: 520,
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 96,
              lineHeight: 0.92, letterSpacing: '-0.005em', color: '#FFFFFF', margin: 0,
              textTransform: 'uppercase',
            }}>
              Münchner<br />Dart Union
            </h1>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 22, color: '#F5F6FA', marginTop: 18, letterSpacing: '0.01em' }}>
              Dart. Leidenschaft. Gemeinschaft.
            </div>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 15, color: '#9AA4B2', margin: '14px 0 0', maxWidth: 440, lineHeight: 1.6 }}>
              Die offizielle Liga-Seite für den organisierten Dartsport in München.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
              <Link href="/ligen" style={{
                padding: '14px 28px', background: '#D40000', color: '#fff',
                borderRadius: 6, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                boxShadow: '0 8px 22px rgba(212,0,0,0.4)', textDecoration: 'none', display: 'inline-block',
              }}>
                Ligen Übersicht
              </Link>
              <Link href="/ergebnisse" style={{
                padding: '14px 28px', background: 'transparent', color: '#F5F6FA',
                border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 6,
                fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
                letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block',
              }}>
                Aktuelle Ergebnisse
              </Link>
            </div>
          </div>
          <div style={{ minHeight: 540 }} />
        </div>
      </section>

      {/* Quick Access Bar */}
      <div style={{ maxWidth: 1280, margin: '-46px auto 0', padding: '0 28px', position: 'relative', zIndex: 5 }}>
        <div style={{
          background: 'linear-gradient(180deg, #121821, #0D1117)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 8,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}>
          {[
            { icon: 'trophy',   title: 'Ligen',      d1: 'C2 bis La Liga',          d2: 'Alle Ligen im Überblick', href: '/ligen' },
            { icon: 'calendar', title: 'Spielplan',  d1: 'Alle kommenden Spiele',   d2: 'auf einen Blick',         href: '/spielplan' },
            { icon: 'bar',      title: 'Tabellen',   d1: 'Aktuelle Tabellenstände', d2: 'aller Ligen',             href: '/ligen' },
            { icon: 'flag',     title: 'Ergebnisse', d1: 'Alle Ergebnisse',         d2: 'der letzten Spieltage',   href: '/ergebnisse' },
          ].map((item, idx) => (
            <Link
              key={item.title}
              href={item.href}
              className="mdu-card-hover"
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', textDecoration: 'none',
                borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none', borderRadius: 10,
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                background: 'rgba(212,0,0,0.12)', border: '1px solid rgba(212,0,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B6B',
              }}>
                <Icon name={item.icon} size={22} stroke={2} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 16, color: '#FFFFFF' }}>{item.title}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#C9CCD6', marginTop: 2 }}>{item.d1}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B' }}>{item.d2}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Aktuelles + Nächste Spiele */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 28px 70px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 36 }}>
        <div>
          <div style={{ marginBottom: 18 }}>
            <h2 className="section-heading" style={{ margin: 0 }}>Aktuelles</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HOME_NEWS.map((n, i) => (
              <NewsCard key={i} date={n.date} tag={n.tag} tagTone={n.tagTone} title={n.title} />
            ))}
          </div>
          <Link href="/news" style={{
            marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#D40000', textDecoration: 'none',
          }}>
            Alle News anzeigen <Icon name="arrow-right" size={14} stroke={2.5} />
          </Link>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 className="section-heading" style={{ margin: 0 }}>Nächste Spiele</h2>
            <Link href="/spielplan" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#D40000', textDecoration: 'none' }}>
              Alle anzeigen
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HOME_MATCHES.map((m, i) => (
              <MatchCard key={i} league={m.league} home={m.home} away={m.away} date={m.date} time={m.time} venue={m.venue} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
