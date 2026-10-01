import Link from 'next/link';
import { NEUE_SAISON, ARCHIV_SAISON, VORLAEUFIG_TEXT } from '@/lib/data/saison-2027';

/**
 * Umschalter „Saison 2026/27 | Saison 2025/26 (Archiv)" oben auf den
 * öffentlichen Seiten. Reine Links (keine Client-Logik) — die Archivseiten
 * haben eigene Adressen (…/2025-26 bzw. ?saison=2025-26), damit sie statisch
 * bleiben und verlinkbar sind.
 */
export function SaisonUmschalter({ archiv, neuHref, archivHref, style }: {
  archiv: boolean;
  neuHref: string;
  archivHref: string;
  style?: React.CSSProperties;
}) {
  const pill = (aktiv: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 999, textDecoration: 'none',
    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, letterSpacing: '0.02em',
    border: `1px solid ${aktiv ? 'var(--th-accent)' : 'var(--th-line-18)'}`,
    // Fester Hintergrund: Auf dem Desktop liegt das Dartboard des Seitenkopfs dahinter.
    background: aktiv ? 'var(--th-accent)' : 'var(--th-bg-card)',
    color: aktiv ? '#fff' : 'var(--th-text-muted)',
  });
  return (
    <nav aria-label="Saison wählen" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, ...style }}>
      <Link href={neuHref} aria-current={!archiv ? 'page' : undefined} style={pill(!archiv)} prefetch={false}>
        Saison {NEUE_SAISON.kurz}
      </Link>
      <Link href={archivHref} aria-current={archiv ? 'page' : undefined} style={pill(archiv)} prefetch={false}>
        Saison {ARCHIV_SAISON.kurz}
        <span style={{ fontWeight: 600, opacity: 0.8 }}>· Archiv</span>
      </Link>
    </nav>
  );
}

/** Gelber Hinweis: Spielplan 2026/27 ist vorläufig. */
export function VorlaeufigHinweis({ style, children }: { style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <div role="note" style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 24,
      // Deckend (Kartenfarbe + Goldton darüber) — sonst scheint das Dartboard durch.
      background: 'linear-gradient(rgba(232,184,74,0.14), rgba(232,184,74,0.14)), var(--th-bg-card)',
      border: '1px solid rgba(232,184,74,0.45)',
      fontFamily: 'var(--font-manrope)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--th-text-body)',
      ...style,
    }}>
      <b style={{ color: 'var(--th-text-strong)' }}>Vorläufig.</b>{' '}
      {VORLAEUFIG_TEXT.replace(/^Vorläufiger Spielplan: /, '')}
      {children}
    </div>
  );
}

/** Kleiner Hinweis oben auf Archivseiten. */
export function ArchivHinweis({ style }: { style?: React.CSSProperties }) {
  return (
    <p style={{ ...INFO_ZEILE, ...style }}>
      Archiv: {ARCHIV_SAISON.name} ist abgeschlossen. Die Daten bleiben hier so stehen, wie die Saison geendet hat.
    </p>
  );
}

/** Einleitungszeile unter dem Umschalter: deckender Hintergrund, damit sie auf
 *  dem Desktop über dem Dartboard des Seitenkopfs lesbar bleibt. */
export const INFO_ZEILE: React.CSSProperties = {
  margin: '0 0 24px', padding: '10px 14px', borderRadius: 10,
  background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
  fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.55, color: 'var(--th-text-muted)',
};

export function InfoZeile({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ ...INFO_ZEILE, ...style }}>{children}</p>;
}
