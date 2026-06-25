// ============================================================
// SeasonTeamView — Teamseite für die selbstverwaltete (aktive) Saison
// ============================================================
//
// Leichtgewichtige Teamseite aus Supabase-Saisondaten (Team + Kader). Bei
// Saison-Start gibt es noch keinen Spielplan/keine Tabelle — diese folgen mit
// den Phasen B2/B3. Archivierte Saisons nutzen weiterhin die reiche statische
// Teamseite.
// ============================================================

import Link from 'next/link';
import { DesktopHeader } from './desktop-header';
import { Footer } from './footer';
import { Icon } from './icon';
import type { SeasonTeam, SeasonRosterPlayer } from '@/lib/server/season-data';

export function SeasonTeamView({ seasonName, team, roster }: {
  seasonName: string;
  team: SeasonTeam;
  roster: SeasonRosterPlayer[];
}) {
  const captain = roster.find(p => p.isCaptain);
  return (
    <div style={{ background: 'var(--th-bg-deep)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/teams" />

      {/* Hero */}
      <div style={{ borderBottom: '1px solid var(--th-line-6)', background: 'var(--th-bg-deep)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '34px 32px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-dim)', marginBottom: 22, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/teams" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Teams</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: 'var(--th-text-strong)' }}>{team.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '24%', flexShrink: 0, overflow: 'hidden',
              background: team.logoUrl ? 'var(--th-bg-inset)' : 'linear-gradient(135deg, var(--th-accent), var(--th-accent-hover))',
              border: '2px solid var(--th-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 44, color: '#fff',
            }}>
              {team.logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={team.logoUrl} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : (team.shortName ?? team.name.slice(0, 3)).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 8 }}>
                {seasonName}
              </div>
              <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 56, lineHeight: 0.95, margin: 0, textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>
                {team.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', flexWrap: 'wrap' }}>
                {team.leagueName && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="trophy" size={14} stroke={2} /> {team.leagueName}</span>}
                {team.venueName && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14} stroke={2} /> {team.venueName}</span>}
                {captain && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="user" size={14} stroke={2} /> TC: {captain.firstName} {captain.lastName}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 20 }} className="mdu-two-col">
          {/* Kader */}
          <Card title={`Kader · ${seasonName}`}>
            {roster.length === 0
              ? <Empty>Noch kein Kader übernommen.</Empty>
              : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {roster.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < roster.length - 1 ? '1px solid var(--th-line-4)' : 'none', fontFamily: 'var(--font-manrope)', fontSize: 13.5 }}>
                      <span style={{ flex: 1, color: 'var(--th-text-strong)', fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
                      {p.licenseNumber && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-faint)' }}>{p.licenseNumber}</span>}
                      {p.isCaptain && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--th-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TC</span>}
                      {p.status === 'pending_review' && <span style={{ fontSize: 9, fontWeight: 700, color: '#A77A00', textTransform: 'uppercase' }}>neu</span>}
                    </div>
                  ))}
                </div>
              )}
          </Card>

          {/* Saison-Start-Hinweis */}
          <Card title="Saison">
            <Empty>
              Die Saison startet in Kürze. Spielplan, Ergebnisse und Tabelle erscheinen hier,
              sobald die ersten Spiele angesetzt bzw. gespielt sind.
            </Empty>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)', fontStyle: 'italic', lineHeight: 1.6 }}>{children}</div>;
}
