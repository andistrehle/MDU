import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';
import { SaisonUmschalter, InfoZeile } from '@/components/mdu/saison-umschalter';
import { alleVenues27, alleTeams27, findLiga27, NEUE_SAISON } from '@/lib/data/saison-2027';

export const metadata: Metadata = { title: 'Spielstätten' };

// Saison 2026/2027 — je Lokal alle Teams, die dort Heimrecht haben (über alle
// Ligen). Archiv 2025/26 (nach Liga gruppiert): /spielstaetten/2025-26.
export default function SpielstaettenPage() {
  const teams = alleTeams27();
  const venues = alleVenues27()
    .map(v => ({ v, teams: teams.filter(t => t.venueId === v.id).sort((a, b) => a.name.localeCompare(b.name, 'de')) }))
    .filter(x => x.teams.length)
    .sort((a, b) => a.v.name.localeCompare(b.v.name, 'de'));

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/spielstaetten" />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Spielstätten" boardRight="max(28px, calc(50vw - 612px))" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/spielstaetten" archivHref="/spielstaetten/2025-26" />
        <InfoZeile>
          {venues.length} Spielstätten, {teams.length} Teams. Je Lokal alle Teams, die dort ihre Heimspiele austragen.
        </InfoZeile>

        <div className="mdu-league-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {venues.map(({ v, teams: ts }) => {
            const maps = v.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.name}, ${v.address}`)}` : null;
            return (
              <div key={v.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                  <Icon name="pin" size={14} stroke={2} style={{ color: 'var(--th-accent)', flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)' }}>{v.name}</div>
                    {v.address && maps && (
                      <a href={maps} target="_blank" rel="noopener noreferrer" title="In Google Maps öffnen" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7,
                        fontFamily: 'var(--font-manrope)', fontSize: 12, lineHeight: 1.5,
                        color: 'var(--th-text-body)', textDecoration: 'none',
                        background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)',
                        borderRadius: 7, padding: '4px 10px',
                      }}>
                        <Icon name="pin" size={11} stroke={2} style={{ color: 'var(--th-text-faint)' }} />
                        {v.address}
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--th-line-5)', marginBottom: 12 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ts.map(t => {
                    const liga = findLiga27(t.league);
                    return (
                      <Link key={t.id} href={`/teams/${t.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TeamBadge initials={t.short.slice(0, 3)} color={t.color} size={28} logoUrl={t.logoUrl ?? undefined} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                          {liga && <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: liga.color, marginTop: 1 }}>{liga.name}</div>}
                        </div>
                        <Icon name="arrow-right" size={13} stroke={2} style={{ color: 'var(--th-text-faint)', flexShrink: 0 }} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
