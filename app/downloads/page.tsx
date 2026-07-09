import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { PageBanner } from '@/components/mdu/page-banner';
import {
  TEMPLATE_ROUTE, TEMPLATE_PRINT_ROUTE, TEMPLATE_VERSION, TEMPLATE_SEASON_NAME,
  templateFileName,
} from '@/lib/spielbericht-template';

export const metadata = {
  title: 'Downloads · Münchner Dart Union',
  description: 'Druckbare Vorlagen und Dokumente der Münchner Dart Union.',
};

export default function DownloadsPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DesktopHeader activeHref="/downloads" />

      <PageBanner eyebrow="Münchner Dart Union" title="Downloads" />

      <main className="mdu-section-pad" style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* ── Eintrag: Offizieller MDU-Spielbericht ── */}
        <article style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 11, flexShrink: 0, background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-accent)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 17, color: 'var(--th-text-strong)', margin: '0 0 4px' }}>
                Offizieller MDU-Spielbericht
              </h2>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: '0 0 6px' }}>
                Druckbare Vorlage für Ligaspiele der Münchner Dart Union. Auf DIN A4 optimiert,
                handschriftlich ausfüllbar und auch in Schwarz-Weiß gut druckbar.
              </p>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                <span>{TEMPLATE_SEASON_NAME}</span>
                <span>Version {TEMPLATE_VERSION}</span>
                <span>{templateFileName()}</span>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                <Link href={TEMPLATE_ROUTE} style={primaryBtn}>Vorlage öffnen</Link>
                <Link href={TEMPLATE_PRINT_ROUTE} style={ghostBtn}>Als PDF speichern / drucken</Link>
              </div>
            </div>
          </div>
        </article>

        {/* ── Eintrag: Spielbedingungen ── */}
        <article style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '22px 24px', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 11, flexShrink: 0, background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-accent)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 17, color: 'var(--th-text-strong)', margin: '0 0 4px' }}>
                Spielbedingungen
              </h2>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: '0 0 6px' }}>
                Die offizielle Liga- und Spielordnung der Münchner Dart Union – Teilnahme, Spielablauf,
                Auswertung und Verhalten. Für alle gemeldeten Mannschaften und Spieler verbindlich.
              </p>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                <span>{TEMPLATE_SEASON_NAME}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                <Link href="/spielbedingungen" style={primaryBtn}>Spielbedingungen öffnen</Link>
              </div>
            </div>
          </div>
        </article>

        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.6, marginTop: 16 }}>
          Der Download verweist immer auf die aktuell gültige Version der Vorlage. Sollte die Vorlage
          einmal nicht verfügbar sein, wende dich bitte an die Ligaleitung.
        </p>
      </main>

      <Footer />
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-block', padding: '11px 22px', background: 'var(--th-accent)', color: '#fff',
  borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5,
  letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none',
  boxShadow: '0 6px 14px var(--th-accent-a32)',
};
const ghostBtn: React.CSSProperties = {
  display: 'inline-block', padding: '11px 22px', background: 'transparent', color: 'var(--th-accent)',
  border: '1.5px solid var(--th-accent)', borderRadius: 8, fontFamily: 'var(--font-manrope)',
  fontWeight: 800, fontSize: 12.5, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none',
};
