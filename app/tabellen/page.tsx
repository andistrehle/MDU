import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';
import { Tabelle27 } from '@/components/mdu/tabelle-27';
import { PageBanner } from '@/components/mdu/page-banner';
import { SaisonUmschalter, InfoZeile } from '@/components/mdu/saison-umschalter';
import { AufAbstiegUebersicht } from '@/components/mdu/auf-abstieg-27';
import { LIGEN_2027, NEUE_SAISON, spieltage27, wochenendeText } from '@/lib/data/saison-2027';
import { alleTabellen27 } from '@/lib/server/ergebnisse-2027';

export const metadata: Metadata = { title: 'Tabellen' };

// Saison 2026/2027 — gerechnet aus den Spielberichten (lib/server/ergebnisse-2027.ts).
// Vor dem ersten Ergebnis stehen alle Teams bei null (alphabetisch).
// Neu gebaut nach jedem Spielbericht (/api/match-reports/published).
// Archiv 2025/26: /tabellen/2025-26.
export default async function TabellenPage() {
  const erster = spieltage27('la')[0];
  const tabellen = await alleTabellen27();
  const gespielt = Object.values(tabellen).some(t => t.some(z => z.sp > 0));
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/tabellen" />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Tabellenübersicht" boardRight="max(20px, calc(50vw - 430px))" />

      <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/tabellen" archivHref="/tabellen/2025-26" />
        <InfoZeile>
          {gespielt
            ? 'Reihenfolge: Punkte, dann Spieldifferenz, Legdifferenz, direkter Vergleich. Ein Ergebnis zählt ab dem Einreichen des Spielberichts.'
            : `Die Tabellen füllen sich ab dem ersten Spieltag (${wochenendeText(erster.fri, erster.sun)}). Bis dahin stehen alle Teams bei null, sortiert nach Namen.`}{' '}
          <a href="#auf-abstieg" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Auf- und Abstieg</a>
        </InfoZeile>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {LIGEN_2027.map(liga => {
            return (
              <div key={liga.code} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', borderLeft: `3px solid ${liga.color}` }}>
                <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid var(--th-line-6)' }}>
                  <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>{liga.name}</div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, color: 'var(--th-text-faint2)', marginTop: 2 }}>{NEUE_SAISON.name} · {liga.teams.length} Teams</div>
                </div>

                <Tabelle27 liga={liga} zeilen={tabellen[liga.code]} />

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
