import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';
import { findPlayer, getPlayerDisplayName } from '@/lib/data';
import { getSeasonTeams, type SeasonTeam } from '@/lib/server/season-data';
import { SaisonUmschalter } from '@/components/mdu/saison-umschalter';
import { LIGEN_2027, NEUE_SAISON, team27 } from '@/lib/data/saison-2027';
import { CaptainContact } from '@/components/mdu/captain-contact';

// Saison 2026/2027: Teams aus den freigegebenen Anmeldungen (Supabase, live —
// Logos, Spielorte, Kapitäne), gruppiert nach den Ligen des Spielplans
// (B1/B2 gibt es nur dort). Archiv 2025/26: /teams/2025-26.
export const dynamic = 'force-dynamic';

/** Kapitänsname aus einem Spieler-Slug (für die selbstverwaltete Saison). */
function captainNameFor(playerId: string | null): string | null {
  if (!playerId) return null;
  const p = findPlayer(playerId);
  return p ? getPlayerDisplayName(p) : null;
}

export default async function TeamsPage() {
  const teams = await getSeasonTeams(NEUE_SAISON.id);
  return <SelfManagedTeams seasonName={NEUE_SAISON.name} teams={teams} />;
}

function SelfManagedTeams({ seasonName, teams }: { seasonName: string; teams: SeasonTeam[] }) {
  // Nach den Ligen des Spielplans gruppieren (B1/B2 stehen nur dort);
  // Teams ohne Platz im Plan landen unter „Noch keine Liga".
  const sections: { key: string; name: string; color: string; teams: SeasonTeam[] }[] =
    LIGEN_2027.map(l => ({ key: l.code, name: l.name, color: l.color, teams: [] as SeasonTeam[] }));
  const rest: SeasonTeam[] = [];
  for (const t of teams) {
    const s = sections.find(x => x.key === team27(t.teamId)?.league);
    (s ? s.teams : rest).push(t);
  }
  if (rest.length) sections.push({ key: 'none', name: 'Noch keine Liga', color: 'var(--th-accent)', teams: rest });
  for (const s of sections) s.teams.sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/teams" />
      <PageBanner eyebrow={seasonName} title="Teams" boardRight="max(28px, calc(50vw - 612px))" />
      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/teams" archivHref="/teams/2025-26" />

        {teams.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
            Für {seasonName} sind noch keine Mannschaften freigegeben.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {sections.filter(s => s.teams.length).map(({ key, name, color, teams: ts }) => {
              return (
                <section key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26, letterSpacing: '0.06em', color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase' }}>{name}</h2>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', fontWeight: 600, marginLeft: 4 }}>{ts.length} {ts.length === 1 ? 'Team' : 'Teams'}</span>
                  </div>
                  <div className="mdu-league-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                    {ts.map(t => (
                      <Link key={t.teamId} href={`/teams/${t.teamId}`} className="mdu-card-hover" style={{ display: 'block', textDecoration: 'none', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <TeamBadge initials={(t.shortName ?? t.name).slice(0, 3)} color={team27(t.teamId)?.color ?? '#9AA4B2'} size={40} logoUrl={t.logoUrl ?? undefined} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--th-text-strong)', letterSpacing: '0.03em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2, color }}>{name}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>
                            <Icon name="pin" size={12} stroke={2} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.venueName ?? 'Noch nicht verfügbar'}</span>
                          </div>
                          <CaptainContact teamId={t.teamId} captainName={captainNameFor(t.captainPlayerId)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          <Icon name="arrow-right" size={14} stroke={2} style={{ color: 'var(--th-text-faint)' }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
