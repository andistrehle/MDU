import Image from 'next/image';
import type { ReactNode } from 'react';

// ============================================================
// PageBanner — kompakter Seitenkopf + Dartboard-Hintergrund
// ============================================================
//
// Responsiv (Styles in globals.css, .mdu-pb*):
//  • Mobil: kleines, dezentes Dartboard rechts im Banner (wie zuvor).
//  • Desktop: der Titel-Bereich bleibt kompakt; das Dartboard läuft als großes
//    Hintergrund-Element HINTER die Seiteninhalte (z-index unter den Feldern,
//    über dem Seiten-Hintergrund).
//
// Wichtig: Die aufrufende Seite muss ihren äußeren Container mit
// `position: relative` + `isolation: isolate` versehen, damit das
// z-index-(-1)-Board hinter die Inhalte, aber über den Seiten-Hintergrund
// gemalt wird (siehe pageShellStyle unten / die Seiten selbst).

/** Style-Ergänzung für den äußeren Seiten-Container, damit das Hintergrund-
 *  Dartboard korrekt gestapelt wird. */
export const bannerShell = { position: 'relative', isolation: 'isolate' } as const;

export function PageBanner({
  eyebrow,
  title,
  breadcrumb,
  children,
}: {
  /** Kleine Überzeile über dem Titel (z. B. „Letzte Spieltage"). */
  eyebrow?: string;
  title: string;
  /** Optionaler Breadcrumb-Bereich über der Überzeile. */
  breadcrumb?: ReactNode;
  /** Optionaler Zusatzinhalt unter dem Titel (z. B. Kurzbeschreibung). */
  children?: ReactNode;
}) {
  return (
    <>
      {/* Desktop-Hintergrund: großes Dartboard hinter den Seiteninhalten. */}
      <div aria-hidden className="mdu-pb-board-page mdu-banner-dartboard">
        <Image src="/mdu-hero-dartboard-2.webp"
          unoptimized alt="" width={780} height={780}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      </div>

      <div className="mdu-pb">
        <div className="mdu-section-pad mdu-pb-inner">
          {/* Mobiles Dartboard im Banner (Desktop: ausgeblendet). */}
          <div aria-hidden className="mdu-pb-board mdu-banner-dartboard">
            <Image src="/mdu-hero-dartboard-2.webp"
              unoptimized alt="" width={680} height={680}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
          <div aria-hidden className="mdu-pb-veil" />

          <div className="mdu-pb-content">
            {breadcrumb}
            {eyebrow && (
              <div style={{
                fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.2em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 8,
              }}>
                {eyebrow}
              </div>
            )}
            <h1 style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48,
              letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
              margin: 0, paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block',
            }}>
              {title}
            </h1>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
