'use client';

// ============================================================
// Website-Umfrage: Popup beim Öffnen der Seite (Betreiber, 09.11.2026)
// ============================================================
// Nur solange die Umfrage läuft (lib/umfrage.ts). Betreiber 15.11.2026: höchstens EINMAL am Tag je Gerät,
// bis abgestimmt wurde; × oder „Später“ schließt es bis morgen. Ein angefangener Stand bleibt gemerkt
// (umfrageStandKey) — beim nächsten Öffnen geht es an derselben Frage weiter. Nicht auf /umfrage selbst, nicht
// im Admin, nicht bei Login/Registrierung und nicht im Spielbericht (dort wird gerade eingetragen).
// Zum Ausprobieren: ?umfrage=probe zeigt es sofort, auch vor dem Start.
// ============================================================

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UMFRAGE, umfrageLaeuft } from '@/lib/umfrage';
import { UmfrageFormular } from './umfrage-formular';

const fertigKey = () => `mdu-umfrage-${UMFRAGE.id}-fertig`;
const abgelehntKey = () => `mdu-umfrage-${UMFRAGE.id}-abgelehnt`;
const tagKey = () => `mdu-umfrage-${UMFRAGE.id}-gezeigt-am`;
const AUSGENOMMEN = /^\/(umfrage|admin|login|registrieren|passwort|auth|mein-bereich\/spielberichte)/;
/** Gilt nur bis zum Neuladen der Seite (Modul-Variable, kein Speicher). */
let gesehenInDiesemLaden = false;

export function UmfragePopup() {
  const pathname = usePathname() ?? '/';
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    const probe = new URLSearchParams(window.location.search).get('umfrage') === 'probe';
    if (gesehenInDiesemLaden || AUSGENOMMEN.test(pathname)) return;
    // Höchstens 1× am Tag (Betreiber 15.11.2026): gezeigt wird es nur, wenn es heute auf diesem Gerät noch nicht da war.
    const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
    if (!probe) {
      if (!umfrageLaeuft()) return;
      try {
        if (localStorage.getItem(fertigKey()) || localStorage.getItem(abgelehntKey())) return;
        if (localStorage.getItem(tagKey()) === heute) return;
      } catch { return; }
    }
    const t = setTimeout(() => {
      gesehenInDiesemLaden = true; setOffen(true);
      if (!probe) { try { localStorage.setItem(tagKey(), heute); } catch { /* egal */ } }
    }, probe ? 300 : 2500);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!offen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [offen]);

  if (!offen) return null;
  // Die ganze Umfrage läuft im Popup (Betreiber 15.11.2026): Einstieg „Servus! Hast du 2 Minuten?“, dann Schritt für
  // Schritt. Kein Schließen per Tipp daneben — sonst wären halb ausgefüllte Antworten mit einem Fehltipp weg.
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,7,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div role="dialog" aria-modal="true" aria-label={UMFRAGE.titel} style={{
        width: '100%', maxWidth: 480, maxHeight: 'min(92vh, 780px)', overflowY: 'auto', background: 'var(--th-bg-card)', color: 'var(--th-text-strong)', borderRadius: 18,
        border: '1px solid var(--th-line-10)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', padding: '20px 20px 18px', position: 'relative',
      }}>
        <button type="button" aria-label="Schließen" onClick={() => setOffen(false)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', fontSize: 24, lineHeight: 1, cursor: 'pointer', color: 'var(--th-text-muted)', zIndex: 1 }}>×</button>
        <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--th-accent)', marginBottom: 6 }}>Kurze Umfrage · {UMFRAGE.titel}</div>
        <UmfrageFormular imPopup onSchliessen={() => setOffen(false)} />
      </div>
    </div>
  );
}
