import Image from 'next/image';
import Link from 'next/link';

// ============================================================
// Alternative Hero-Variante: Full-bleed-Hintergrundbild über die ganze
// Bildschirmhöhe (100svh), dunkler Gradient für Kontrast, bold Headline und
// eine schwebende, transparente Pill-Navbar über dem Bild.
//
// Nur für die Design-Vorschau (/hero-vorschau). Die echte Startseite nutzt
// weiter den klassischen Hero — die Variante wird über HomeContent(hero=…)
// umgeschaltet, damit hier NICHTS an der Live-Seite hängt.
// ============================================================

const NAV = [
  { label: 'Ligen', href: '/ligen' },
  { label: 'Spielplan', href: '/spielplan' },
  { label: 'Ergebnisse', href: '/ergebnisse' },
  { label: 'Teams', href: '/teams' },
  { label: 'Spielstätten', href: '/spielstaetten' },
  { label: 'Kontakt', href: '/kontakt' },
];

export function HeroFullbleed() {
  return (
    <section className="hv-hero">
      <style>{HV_CSS}</style>

      <Image
        src="/mdu-hero-dartboard-2.webp"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="hv-bg"
      />
      <div aria-hidden className="hv-veil hv-veil-vert" />
      <div aria-hidden className="hv-veil hv-veil-left" />

      {/* Schwebende Pill-Navbar */}
      <header className="hv-nav-wrap">
        <nav className="hv-nav">
          <Link href="/" className="hv-nav-logo" aria-label="Münchner Dart Union — Startseite">
            <Image src="/mdu-logo.webp" alt="Münchner Dart Union" height={32} width={71} unoptimized priority style={{ height: 32, width: 'auto' }} />
          </Link>
          <div className="hv-nav-links">
            {NAV.map(i => <Link key={i.href} href={i.href} className="hv-nav-link">{i.label}</Link>)}
          </div>
          <Link href="/login" className="hv-nav-cta">Login</Link>
        </nav>
      </header>

      <div className="hv-inner">
        <div className="hv-kicker">München · Dart-Liga</div>
        <h1 className="hv-title">
          <span>Münchner</span><br />
          <span className="hv-accent">Dart</span> <span>Union</span>
        </h1>
        <div className="hv-subtitle">Dart. Leidenschaft. Gemeinschaft.</div>
        <p className="hv-desc">Die offizielle Liga-Seite für den organisierten Dartsport in München.</p>
        <div className="hv-cta">
          <Link href="/ligen" className="hv-btn hv-btn-primary">Ligen Übersicht</Link>
          <Link href="/ergebnisse" className="hv-btn hv-btn-ghost">Aktuelle Ergebnisse</Link>
        </div>
      </div>

      <span className="hv-badge">Design-Vorschau · nicht live</span>
    </section>
  );
}

const HV_CSS = `
.hv-hero {
  position: relative; width: 100%;
  min-height: 100svh; min-height: 100vh;   /* schließt exakt mit dem Bildschirm ab */
  overflow: hidden; display: flex; align-items: center;
}
.hv-bg { object-fit: cover; object-position: center; z-index: 0; }
.hv-veil { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.hv-veil-vert { background: linear-gradient(180deg, rgba(5,7,10,0.60) 0%, rgba(5,7,10,0.30) 42%, rgba(5,7,10,0.82) 100%); }
.hv-veil-left { background: linear-gradient(90deg, rgba(5,7,10,0.80) 0%, rgba(5,7,10,0.35) 52%, rgba(5,7,10,0.05) 100%); }

.hv-nav-wrap { position: absolute; top: 0; left: 0; right: 0; z-index: 3; padding: 16px; }
.hv-nav {
  max-width: 1180px; margin: 0 auto; display: flex; align-items: center; gap: 18px;
  padding: 9px 12px 9px 18px; border-radius: 999px;
  background: rgba(16,18,24,0.42); border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%);
  box-shadow: 0 10px 30px rgba(0,0,0,0.28);
}
.hv-nav-logo { display: flex; align-items: center; flex-shrink: 0; }
.hv-nav-links { display: flex; align-items: center; gap: 22px; flex: 1; justify-content: center; }
.hv-nav-link {
  font-family: var(--font-manrope), sans-serif; font-weight: 700; font-size: 13.5px;
  color: rgba(255,255,255,0.82); text-decoration: none; letter-spacing: 0.01em; transition: color 140ms ease;
}
.hv-nav-link:hover { color: #fff; }
.hv-nav-cta {
  flex-shrink: 0; font-family: var(--font-manrope), sans-serif; font-weight: 800; font-size: 12.5px;
  color: #fff; text-decoration: none; letter-spacing: 0.02em; padding: 9px 18px; border-radius: 999px;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22); transition: background 140ms ease;
}
.hv-nav-cta:hover { background: rgba(255,255,255,0.22); }

.hv-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; width: 100%; padding: 0 28px; }
.hv-kicker {
  display: inline-flex; align-items: center; font-family: var(--font-saira-condensed), sans-serif;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; font-size: 14px; color: #fff; margin-bottom: 18px;
}
.hv-kicker::before { content: ''; width: 26px; height: 3px; margin-right: 12px; background: var(--th-accent, #D40000); border-radius: 2px; }
.hv-title {
  font-family: var(--font-saira-condensed), sans-serif; font-weight: 900;
  font-size: clamp(56px, 11.5vw, 108px); line-height: 0.9; letter-spacing: -0.005em;
  text-transform: uppercase; color: #fff; margin: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.45);
}
.hv-accent { color: var(--th-accent, #D40000); }
.hv-subtitle {
  font-family: var(--font-manrope), sans-serif; font-weight: 700; font-size: 22px; color: #fff;
  margin-top: 20px; letter-spacing: 0.01em; text-shadow: 0 2px 18px rgba(0,0,0,0.5);
}
.hv-desc {
  font-family: var(--font-manrope), sans-serif; font-size: 15.5px; color: rgba(255,255,255,0.82);
  margin: 14px 0 0; max-width: 460px; line-height: 1.6; text-shadow: 0 2px 18px rgba(0,0,0,0.5);
}
.hv-cta { display: flex; gap: 14px; margin-top: 36px; flex-wrap: wrap; }
.hv-btn {
  padding: 15px 30px; border-radius: 6px; font-family: var(--font-manrope), sans-serif; font-weight: 800;
  font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; display: inline-block;
}
.hv-btn-primary { background: var(--th-accent, #D40000); color: #fff; box-shadow: 0 10px 26px rgba(212,0,0,0.42); }
.hv-btn-ghost { background: rgba(255,255,255,0.06); color: #fff; border: 1.5px solid rgba(255,255,255,0.5); }
.hv-badge {
  position: absolute; z-index: 3; right: 14px; bottom: 14px; font-family: var(--font-manrope), sans-serif;
  font-weight: 700; font-size: 11px; color: rgba(255,255,255,0.85); background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.18); border-radius: 999px; padding: 6px 12px; backdrop-filter: blur(6px);
}
@media (max-width: 860px) { .hv-nav-links { display: none; } .hv-nav { gap: 12px; justify-content: space-between; } }
@media (max-width: 600px) { .hv-inner { padding: 0 20px; } .hv-subtitle { font-size: 19px; } }
`;
