'use client';

// ============================================================
// Push: Frage direkt nach dem Login + Einstellung (Betreiber, 22.10.2026)
// ============================================================
// PushAbfrage (global, components/mdu/global-chrome.tsx): Sobald jemand
// angemeldet ist und auf diesem Gerät noch nie gefragt wurde, erscheint unten
// die Frage „Benachrichtigungen aufs Handy?“. Erst der Tipp auf „Ja“ löst die
// Abfrage des Browsers aus (iOS verlangt das, und eine Ablehnung im Browser
// gilt für immer). „Später“ fragt nach 7 Tagen wieder. Auf dem iPhone im
// Browser kommt stattdessen einmal der Hinweis, die Seite zum Home-Bildschirm
// hinzuzufügen. Abmelden löscht das Abo des Geräts.
//
// PushEinstellung (Mein Bereich): Zustand + Ein/Aus, bei „blockiert“ die
// Anleitung, wie man es in den Einstellungen wieder erlaubt. Frage und Karte
// nur auf Handy/Tablet (`istHandy`), am Desktop ausgeblendet (Betreiber, 30.10.2026).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { pushZustand, pushEinschalten, pushAusschalten, pushAboAuffrischen, istIos, istHandy, type PushZustand } from '@/lib/push';

const SPAETER_KEY = 'mdu-push-spaeter';
const IOS_KEY = 'mdu-push-ios-hinweis';
const TAG = 24 * 3600 * 1000;
const lies = (k: string) => { try { return Number(localStorage.getItem(k) ?? 0); } catch { return 0; } };
const schreib = (k: string) => { try { localStorage.setItem(k, String(Date.now())); } catch { /* egal */ } };

export function PushAbfrage() {
  const { user } = useAuth();
  const [zeige, setZeige] = useState<'frage' | 'ios' | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const vorher = useRef<string | null>(null);

  useEffect(() => {
    const id = user?.id ?? null;
    const alt = vorher.current;
    vorher.current = id;
    if (!id) {
      queueMicrotask(() => setZeige(null));
      if (alt) void pushAusschalten(false); // abgemeldet → keine Nachrichten mehr auf dieses Gerät
      return;
    }
    let weg = false;
    void (async () => {
      await pushAboAuffrischen();
      const z = await pushZustand();
      if (weg || !istHandy()) return; // am Desktop nicht fragen
      if (z === 'frage' && Date.now() - lies(SPAETER_KEY) > 7 * TAG) setZeige('frage');
      else if (z === 'ios_installieren' && Date.now() - lies(IOS_KEY) > 30 * TAG) setZeige('ios');
    })();
    return () => { weg = true; };
  }, [user?.id]);

  if (!zeige) return null;
  return (
    <div role="dialog" aria-label="Benachrichtigungen" style={sheet}>
      {zeige === 'frage' ? (
        <>
          <div style={titel}>🔔 Benachrichtigungen aufs Handy?</div>
          <p style={text}>Spielberichte zum Bestätigen, Verlegungen, Zu-/Absagen – alles, was in deiner Glocke landet, bekommst du dann direkt aufs Handy. Abschalten geht jederzeit unter Mein Bereich.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" disabled={laeuft} style={knopf(true)} onClick={async () => {
              setLaeuft(true);
              await pushEinschalten();
              setLaeuft(false); setZeige(null);
            }}>{laeuft ? 'Einen Moment …' : 'Ja, einschalten'}</button>
            <button type="button" style={knopf(false)} onClick={() => { schreib(SPAETER_KEY); setZeige(null); }}>Später</button>
          </div>
        </>
      ) : (
        <>
          <div style={titel}>📲 MDU als App aufs iPhone</div>
          <p style={text}>Tippe unten auf <b>Teilen</b> (□↑) und dann auf <b>„Zum Home-Bildschirm“</b>. Öffnest du die MDU danach über das neue Symbol, kannst du auch Benachrichtigungen einschalten.</p>
          <div style={{ marginTop: 12 }}>
            <button type="button" style={knopf(false)} onClick={() => { schreib(IOS_KEY); setZeige(null); }}>Verstanden</button>
          </div>
        </>
      )}
    </div>
  );
}

const ANLEITUNG_BLOCKIERT_IOS = 'iPhone: Einstellungen → Mitteilungen → MDU → „Mitteilungen erlauben“ einschalten.';
const ANLEITUNG_BLOCKIERT = 'Im Browser auf das Schloss/Einstellungs-Symbol links neben der Adresse tippen → Benachrichtigungen → „Zulassen“. Android: alternativ Einstellungen → Apps → Chrome (bzw. MDU) → Benachrichtigungen.';

export function PushEinstellung() {
  const [z, setZ] = useState<PushZustand | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  // Nur auf Handy/Tablet bzw. in der installierten App — am Desktop braucht es die Karte nicht.
  useEffect(() => { if (istHandy()) void pushZustand().then(setZ); }, []);
  if (!z || z === 'nicht_moeglich') return null;

  const beschreibung: Record<PushZustand, string> = {
    aktiv: 'Eingeschaltet – alles aus deiner Glocke kommt auf dieses Gerät.',
    aus: 'Auf diesem Gerät ausgeschaltet.',
    frage: 'Noch nicht eingeschaltet.',
    blockiert: `Im Browser blockiert – die Seite darf nicht noch einmal fragen. So erlaubst du es wieder: ${istIos() ? ANLEITUNG_BLOCKIERT_IOS : ANLEITUNG_BLOCKIERT} Danach diese Seite neu laden.`,
    ios_installieren: 'Auf dem iPhone geht das nur in der App: unten auf Teilen (□↑) → „Zum Home-Bildschirm“, dann die MDU über das neue Symbol öffnen.',
    nicht_moeglich: '',
  };
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ ...titel, fontSize: 14, color: 'var(--th-text-strong)' }}>🔔 Benachrichtigungen aufs Handy</div>
          <p style={{ ...text, color: 'var(--th-text-muted)', margin: '4px 0 0' }}>{beschreibung[z]}</p>
          {fehler && <p style={{ ...text, color: 'var(--th-loss)', margin: '4px 0 0' }}>{fehler}</p>}
        </div>
        {(z === 'frage' || z === 'aus') && <button type="button" disabled={laeuft} style={knopf(true)} onClick={async () => {
          setLaeuft(true); const r = await pushEinschalten(); setLaeuft(false); setZ(r.zustand); setFehler(r.fehler);
        }}>{laeuft ? 'Einen Moment …' : 'Einschalten'}</button>}
        {z === 'aktiv' && <button type="button" disabled={laeuft} style={knopf(false)} onClick={async () => {
          setLaeuft(true); await pushAusschalten(true); setLaeuft(false); setZ('aus');
        }}>Ausschalten</button>}
      </div>
    </div>
  );
}

const sheet: React.CSSProperties = {
  position: 'fixed', left: 12, right: 12, bottom: 'calc(84px + env(safe-area-inset-bottom))', zIndex: 900,
  maxWidth: 460, margin: '0 auto', background: 'var(--th-bg-card)', border: '1px solid var(--th-accent-a25)',
  borderRadius: 16, padding: '16px 18px', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
};
const titel: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' };
const text: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.5, color: 'var(--th-text-body)', margin: '6px 0 0' };
function knopf(voll: boolean): React.CSSProperties {
  return { padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5, border: '1.5px solid var(--th-accent)', background: voll ? 'var(--th-accent)' : 'transparent', color: voll ? '#fff' : 'var(--th-accent)' };
}
