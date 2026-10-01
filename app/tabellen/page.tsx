import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';
import { TeamBadge } from '@/components/mdu/team-badge';
import { PageBanner } from '@/components/mdu/page-banner';
import { SaisonUmschalter, InfoZeile } from '@/components/mdu/saison-umschalter';
import { AufAbstiegUebersicht } from '@/components/mdu/auf-abstieg-27';
import { LIGEN_2027, NEUE_SAISON, team27, spieltage27, wochenendeText } from '@/lib/data/saison-2027';

export const metadata: Metadata = { title: 'Tabellen' };

// Saison 2026/2027 — vor dem ersten Spieltag stehen alle Teams bei null
// (alphabetisch). Archiv 2025/26: /tabellen/2025-26.
export default function TabellenPage() {
  const erster = spieltage27('la')[0];
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/tabellen" />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Tabellenübersicht" boardRight="max(20px, calc(50vw - 430px))" />

      <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/tabellen" archivHref="/tabellen/2025-26" />
        <InfoZeile>
          Die Tabellen füllen sich ab dem ersten Spieltag ({wochenendeText(erster.fri, erster.sun)}). Bis dahin stehen alle Teams bei null, sortiert nach Namen.{' '}
          <a href="#auf-abstieg" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Auf- und Abstieg</a>
        </InfoZeile>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {LIGEN_2027.map(liga => {
            const teams = liga.teams.map(id => team27(id)!).sort((a, b) => a.name.localeCompare(b.name, 'de'));
            return (
              <div key={liga.code} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', borderLeft: `3px solid ${liga.color}` }}>
                <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid var(--th-line-6)' }}>
                  <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>{liga.name}</div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, color: 'var(--th-text-faint2)', marginTop: 2 }}>{NEUE_SAISON.name} · {teams.length} Teams</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 40px 48px', padding: '6px 18px', gap: 6, borderBottom: '1px solid var(--th-line-4)' }}>
                  {['#', 'Team', 'Sp.', 'Pkt.'].map((h, i) => (
                    <span key={h} style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, color: 'var(--th-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
                  ))}
                </div>

                {teams.map((t, i) => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 40px 48px', padding: '8px 18px', gap: 6, borderBottom: i < teams.length - 1 ? '1px solid var(--th-line-3)' : 'none' }}>
                    <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-faint)', lineHeight: '1.3' }}>–</span>
                    <Link href={`/teams/${t.id}`} aria-label={`Teamprofil von ${t.name} öffnen`} className="mdu-entity-link" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', minWidth: 0, overflow: 'hidden' }}>
                      <TeamBadge initials={t.short.slice(0, 3)} color={t.color} logoUrl={t.logoUrl ?? undefined} size={20} ring="transparent" />
                      <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 500, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </Link>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-muted)', textAlign: 'right', lineHeight: '1.3' }}>0</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', textAlign: 'right', lineHeight: '1.3' }}>0</span>
                  </div>
                ))}

                <div style={{ padding: '9px 18px', borderTop: '1px solid var(--th-line-4)', display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/ligen/${liga.code}?tab=spielplan`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-accent)', textDecoration: 'none' }}>
                    Spielplan der {liga.name}
                    <Icon name="arrow-right" size={13} stroke={2.5} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <AufAbstiegUebersicht />
      </div>

      <Footer />
    </div>
  );
}
