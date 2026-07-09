import Image from 'next/image';
import type { ReactNode } from 'react';

// ============================================================
// PageBanner — einheitlicher Seitenkopf mit dezentem Dartboard
// ============================================================
//
// Kapselt das Banner-Muster der Ligen-/Team-Seiten (Dartboard-Foto rechts,
// radial ausmaskiert + Verlaufsschleier), damit alle Unterseiten denselben
// Look bekommen. Das Bild ist rein dekorativ (aria-hidden) und wird über die
// Klasse `mdu-banner-dartboard` im Light-Theme zusätzlich abgeschwächt.

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
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--th-bg-page)',
      borderBottom: '1px solid var(--th-line-4)',
    }}>
      <div className="mdu-section-pad" style={{
        maxWidth: 1280, margin: '0 auto', padding: '48px 28px 52px', position: 'relative', minHeight: 140,
      }}>
        {/* Großflächiges Dartboard, das über einen weichen Radial-Verlauf in den
            Hintergrund ausläuft — keine harten Kanten, dezent im Hintergrund
            „schimmernd", rechter Rand nahe der Glocken-/Content-Kante. */}
        <div aria-hidden className="mdu-banner-dartboard" style={{
          position: 'absolute', right: 90, top: '50%', transform: 'translateY(-50%)',
          width: 560, height: 560, pointerEvents: 'none', opacity: 0.6, zIndex: 0,
          WebkitMaskImage: 'radial-gradient(circle closest-side at 50% 50%, #000 0%, #000 55%, transparent 88%)',
          maskImage: 'radial-gradient(circle closest-side at 50% 50%, #000 0%, #000 55%, transparent 88%)',
        }}>
          <Image src="/mdu-hero-dartboard-2.webp"
            unoptimized alt="" width={560} height={560}
            style={{ width: 560, height: 560, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        {/* Jede Seite linear in den Hintergrund ausblenden (links fürs Textfeld,
            rechts + oben/unten gegen harte Kanten). Kein Kasten, weiches Schimmern. */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background:
            'linear-gradient(90deg,  var(--th-bg-page) 0%, transparent 46%),'
            + 'linear-gradient(270deg, var(--th-bg-page) 0%, transparent 18%),'
            + 'linear-gradient(180deg, var(--th-bg-page) 0%, transparent 20%, transparent 70%, var(--th-bg-page) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
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
  );
}
