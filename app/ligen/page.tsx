import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { SaisonUmschalter } from '@/components/mdu/saison-umschalter';
import { LIGEN_2027, NEUE_SAISON, spieltage27, type Liga27 } from '@/lib/data/saison-2027';

export const metadata: Metadata = { title: 'Ligen' };

function LigaKarte({ liga }: { liga: Liga27 }) {
  return (
    <Link
      href={`/ligen/${liga.code}`}
      className="mdu-card-hover mdu-league-card"
      style={{
        display: 'block', textDecoration: 'none', padding: '22px 24px', borderRadius: 14,
        background: 'linear-gradient(180deg, var(--th-bg-card3) 0%, var(--th-bg-card2) 100%)',
        border: '1px solid var(--th-line-6)',
        boxShadow: '0 1px 0 var(--th-line-4) inset, 0 8px 28px var(--th-shadow)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: liga.color, borderRadius: '14px 0 0 14px' }} />
      <div className="mdu-league-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: liga.color, textTransform: 'uppercase' }}>{liga.tier}</span>
        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-faint2)' }}>{NEUE_SAISON.kurz}</span>
      </div>
      <div className="mdu-league-card-title" style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, color: 'var(--th-text-strong)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{liga.name}</div>
      <div className="mdu-league-card-desc" style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
        {liga.teams.length} Teams · {spieltage27(liga.code).length} Spieltage
      </div>
    </Link>
  );
}

// Saison 2026/2027. Archiv 2025/26 (inkl. Playoffs): /ligen/2025-26.
export default function LigenPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/ligen" />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Ligen Übersicht" boardRight="max(28px, calc(50vw - 612px))" />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/ligen" archivHref="/ligen/2025-26" />

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--th-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{NEUE_SAISON.name}</div>
          <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: 0, paddingBottom: 10, borderBottom: '1px solid var(--th-line-8)', display: 'inline-block' }}>
            Ligen
          </h2>
        </div>

        <div className="mdu-league-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {LIGEN_2027.map(liga => <LigaKarte key={liga.code} liga={liga} />)}
        </div>
      </div>

      <Footer />
    </div>
  );
}
