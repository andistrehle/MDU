// ============================================================
// Demo-Login
// ============================================================

import type { Metadata } from 'next';
import { RollenWahl } from '@/components/bedv/dashboard/rollen-wahl';

export const metadata: Metadata = {
  title: 'Demo-Login',
  description: 'Rolle wählen und die Plattform aus Sicht von Spieler, Kapitän oder Ligaleitung ansehen.',
};

export default function LoginSeite() {
  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '38px 34px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Demo-Login</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>
            Welche Rolle willst du sehen?
          </h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '60ch', lineHeight: 1.6 }}>
            Dieselbe Plattform sieht für jede Rolle anders aus. Wähle eine — der Wechsel
            geht jederzeit, ohne Passwort und ohne Konto.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '28px 52px' }}>
        <RollenWahl />
      </div>
    </>
  );
}
