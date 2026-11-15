'use client';

// ============================================================
// Website-Umfrage: Popup beim Öffnen der Seite (Betreiber, 09.11.2026)
// ============================================================
// Nur solange die Umfrage läuft (lib/umfrage.ts). Betreiber 15.11.2026: höchstens EINMAL am Tag je Gerät,
// bis abgestimmt wurde; × oder „Später“ schließt es bis morgen. Ein angefangener Stand bleibt gemerkt
// (umfrageStandKey) — beim nächsten Öffnen geht es an derselben Frage weiter. Nicht auf /umfrage selbst, nicht
// im Admin, nicht bei Login/Registrierung und nicht im Spielbericht (dort wird gerade eingetragen).
// Bericht per Link direkt geöffnet → Frage VORHER mit „Erst den Bericht lesen“, danach am Ende des Berichts
// noch einmal (lib/artikel-signal.ts). Zum Ausprobieren: ?umfrage=probe zeigt es sofort, auch vor dem Start.
// ============================================================

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UMFRAGE, umfrageLaeuft } from '@/lib/umfrage';
import { UmfrageFormular } from './umfrage-formular';
import { artikelOffen, beiArtikel } from '@/lib/artikel-signal';

const fertigKey = () => `mdu-umfrage-${UMFRAGE.id}-fertig`;
const abgelehntKey = () => `mdu-umfrage-${UMFRAGE.id}-abgelehnt`;
const tagKey = () => `mdu-umfrage-${UMFRAGE.id}-gezeigt-am`;
const AUSGENOMMEN = /^\/(umfrage|admin|login|registrieren|passwort|auth|mein-bereich\/spielberichte)/;
/** Gilt nur bis zum Neuladen der Seite (kein Speicher). `wartet` = nach dem Lesen eines Berichts noch einmal fragen. */
const merk = { gesehen: false, wartet: false };
const heuteBerlin = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const tagMerken = () => { try { localStorage.setItem(tagKey(), heuteBerlin()); } catch { /* egal */ } };

type Variante = 'normal' | 'vorher' | 'nachher';

export function UmfragePopup() {
  const pathname = usePathname() ?? '/';
  const [offen, setOffen] = useState(false);
  const [variante, setVariante] = useState<Variante>('normal');

  useEffect(() => {
    const probe = new URLSearchParams(window.location.search).get('umfrage') === 'probe';
    if (merk.gesehen || AUSGENOMMEN.test(pathname)) return;
    // Höchstens 1× am Tag (Betreiber 15.11.2026): gezeigt wird es nur, wenn es heute auf diesem Gerät noch nicht da war.
    if (!probe) {
      if (!umfrageLaeuft()) return;
      try {
        if (localStorage.getItem(fertigKey()) || localStorage.getItem(abgelehntKey())) return;
        if (localStorage.getItem(tagKey()) === heuteBerlin()) return;
      } catch { return; }
    }
    const zeigen = (v: Variante) => { merk.gesehen = true; setVariante(v); setOffen(true); if (!probe) tagMerken(); };
    // Bericht per Link direkt geöffnet (z. B. aus Facebook, Betreiber 15.11.2026): VORHER fragen, „Erst den Bericht
    // lesen“ möglich. Sonst nach 2,5 s — ist dann gerade ein Bericht offen, nicht stören, sondern danach fragen.
    let spaet: ReturnType<typeof setTimeout> | undefined;
    const frueh = setTimeout(() => {
      if (artikelOffen()) { zeigen('vorher'); return; }
      spaet = setTimeout(() => {
        if (artikelOffen()) { merk.gesehen = true; merk.wartet = true; return; }
        zeigen('normal');
      }, probe ? 0 : 1800);
    }, probe ? 400 : 700);
    return () => { clearTimeout(frueh); if (spaet) clearTimeout(spaet); };
  }, [pathname]);

  // Nach dem Lesen: am ENDE des Berichts (bis unten gescrollt) oder beim Schließen noch einmal fragen —
  // viele schließen den Bericht nie, sondern gleich den Tab.
  useEffect(() => beiArtikel(art => {
    if (!merk.wartet || (art !== 'ende' && art !== 'zu')) return;
    merk.wartet = false;
    try { if (localStorage.getItem(fertigKey()) || localStorage.getItem(abgelehntKey())) return; } catch { return; }
    setVariante('nachher'); setOffen(true); tagMerken();
  }), []);

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
        <UmfrageFormular imPopup onSchliessen={() => setOffen(false)}
          einstieg={variante === 'vorher' ? { titel: 'Servus! 👋', frage: 'Bevor du den Bericht liest: Hast du kurz 2 Minuten für uns?' }
            : variante === 'nachher' ? { titel: 'Na, wie war der Bericht? 😄', frage: 'Hast du jetzt noch 2 Minuten für uns?' } : undefined}
          onErstLesen={variante === 'vorher' ? () => { merk.wartet = true; setOffen(false); } : undefined} />
      </div>
    </div>
  );
}
