'use client';

// ============================================================
// Website-Umfrage: Popup beim Öffnen der Seite (Betreiber, 09.11.2026)
// ============================================================
// Nur solange die Umfrage läuft (lib/umfrage.ts). Betreiber 15.11.2026: erscheint bei JEDEM Laden der
// Seite wieder, bis auf diesem Gerät abgestimmt wurde; × (oder „Später“) schließt es nur bis zum nächsten
// Neuladen — beim Weiterklicken innerhalb der Seite kommt es nicht erneut. Nicht auf /umfrage selbst, nicht
// im Admin, nicht bei Login/Registrierung und nicht im Spielbericht (dort wird gerade eingetragen).
// Zum Ausprobieren: ?umfrage=probe zeigt es sofort, auch vor dem Start.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FRAGEN, UMFRAGE, umfrageLaeuft } from '@/lib/umfrage';

const fertigKey = () => `mdu-umfrage-${UMFRAGE.id}-fertig`;
const AUSGENOMMEN = /^\/(umfrage|admin|login|registrieren|passwort|auth|mein-bereich\/spielberichte)/;
/** Gilt nur bis zum Neuladen der Seite (Modul-Variable, kein Speicher). */
let gesehenInDiesemLaden = false;

export function UmfragePopup() {
  const pathname = usePathname() ?? '/';
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    const probe = new URLSearchParams(window.location.search).get('umfrage') === 'probe';
    if (gesehenInDiesemLaden || AUSGENOMMEN.test(pathname)) return;
    if (!probe) {
      if (!umfrageLaeuft()) return;
      try { if (localStorage.getItem(fertigKey())) return; } catch { return; }
    }
    const t = setTimeout(() => { gesehenInDiesemLaden = true; setOffen(true); }, probe ? 300 : 2500);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!offen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [offen]);

  if (!offen) return null;
  return (
    <div onClick={() => setOffen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,7,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="umfrage-popup-titel" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, background: 'var(--th-bg-card)', color: 'var(--th-text-strong)', borderRadius: 18,
        border: '1px solid var(--th-line-10)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', padding: '22px 22px 18px', position: 'relative',
      }}>
        <button type="button" aria-label="Schließen" onClick={() => setOffen(false)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--th-text-muted)' }}>×</button>
        <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--th-accent)' }}>Kurze Umfrage</div>
        <h2 id="umfrage-popup-titel" style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, textTransform: 'uppercase', lineHeight: 1.05, margin: '4px 0 10px' }}>{UMFRAGE.titel}</h2>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14.5, lineHeight: 1.55, color: 'var(--th-text-body)', margin: '0 0 16px' }}>
          Hilf uns, die Seite besser zu machen: {FRAGEN.length} kurze Fragen, etwa 2 Minuten – anonym.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/umfrage" onClick={() => setOffen(false)} style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, padding: '11px 20px', borderRadius: 10, background: 'var(--th-accent)', color: '#fff', textDecoration: 'none' }}>Mitmachen</Link>
          <button type="button" onClick={() => setOffen(false)} style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 15, padding: '11px 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--th-line-10)', color: 'var(--th-text-body)', cursor: 'pointer' }}>Später</button>
        </div>
      </div>
    </div>
  );
}
