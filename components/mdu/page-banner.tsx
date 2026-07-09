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
      background: 'linear-gradient(180deg, var(--th-bg-header) 0%, var(--th-bg-page) 100%)',
      borderBottom: '1px solid var(--th-line-4)',
    }}>
      <div aria-hidden className="mdu-banner-dartboard" style={{
        position: 'absolute', right: -260, top: '50%', transform: 'translateY(-50%)',
        width: 680, height: 680, pointerEvents: 'none', opacity: 0.7,
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
      }}>
        <Image src="/mdu-hero-dartboard-2.webp"
          unoptimized alt="" width={680} height={680}
          style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
      </div>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, var(--th-bg-page) 30%, var(--th-veil-40) 65%, var(--th-veil-70))',
      }} />

      <div className="mdu-section-pad" style={{
        maxWidth: 1280, margin: '0 auto', padding: '34px 28px 26px', position: 'relative', zIndex: 2,
      }}>
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
  );
}
