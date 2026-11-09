'use client';

// ============================================================
// MDC — „Aktuelles" mit drei Reitern
// ============================================================
//
// Features · Neuigkeiten · Termine, zwei Beiträge je Reiter, automatisch
// wechselnd (Betreiber, 09.11.2026 — wie auf der MDU-Startseite, dort aber
// drei Beiträge). Vorn steht der Reiter mit der neuesten Meldung.
//
// Die Karten rendert der Server und reicht sie fertig herein: Die Beiträge
// selbst gehören nicht ins Browser-Paket, hier wird nur umgeschaltet.
//
// Alle Reiter liegen übereinander in derselben Rasterzelle — die Höhe richtet
// sich nach dem längsten, beim Wechsel springt die Seite darunter nicht.
//
// Die Automatik läuft auch mit der Maus darüber weiter (am Schreibtisch liegt
// der Zeiger oft einfach irgendwo, dann wechselte nie etwas). Sie hört auf,
// sobald jemand selbst einen Reiter oder eine Karte antippt, und pausiert,
// solange per Tastatur etwas im Fokus ist. Gewechselt wird mit einer reinen
// Überblendung (nur Deckkraft, keine Bewegung) — deshalb läuft sie auch bei
// „weniger Bewegung"; dort entfällt nur der Laufbalken im Reiter.
// ============================================================

import { useEffect, useState, useSyncExternalStore } from 'react';

export interface NewsGruppe {
  code: string;
  name: string;
  inhalt: React.ReactNode;
}

const TAKT_MS = 6000;
const BLENDE_MS = 1200;
const RUHIG = '(prefers-reduced-motion: reduce)';

function abonniereRuhig(cb: () => void) {
  const mq = window.matchMedia(RUHIG);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function NewsRotator({ gruppen }: { gruppen: NewsGruppe[] }) {
  const [aktiv, setAktivRoh] = useState(0);
  // Voriger Reiter (blendet aus) und Zähler der Wechsel: Der Name der
  // Animation wechselt mit (…-a / …-b), damit sie sicher neu startet.
  const [vorher, setVorher] = useState<number | null>(null);
  const [wechsel, setWechsel] = useState(0);
  const [gewaehlt, setGewaehlt] = useState(false);
  const [fokus, setFokus] = useState(false);
  const pause = gewaehlt || fokus;
  const ruhig = useSyncExternalStore(
    abonniereRuhig,
    () => window.matchMedia(RUHIG).matches,
    () => false,
  );

  function waehle(neu: number) {
    if (neu === aktiv) return;
    setVorher(aktiv); setWechsel(w => w + 1); setAktivRoh(neu);
  }

  useEffect(() => {
    if (pause || gruppen.length < 2) return;
    const t = setTimeout(() => {
      setVorher(aktiv); setWechsel(w => w + 1); setAktivRoh((aktiv + 1) % gruppen.length);
    }, TAKT_MS);
    return () => clearTimeout(t);
  }, [aktiv, pause, gruppen.length]);

  if (!gruppen.length) return null;

  return (
    <div
      onFocusCapture={e => setFokus((e.target as HTMLElement).matches(':focus-visible'))}
      onBlurCapture={() => setFokus(false)}
    >
      <div
        role="tablist"
        aria-label="Aktuelles wählen"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
      >
        {gruppen.map((g, i) => {
          const an = i === aktiv;
          return (
            <button
              key={g.code} role="tab" aria-selected={an} type="button"
              onClick={() => { waehle(i); setGewaehlt(true); }}
              style={{
                position: 'relative', overflow: 'hidden',
                padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--mdc-font-display)', fontSize: '0.74rem',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                border: `1.5px solid ${an ? 'var(--mdc-red)' : 'var(--mdc-line-hard)'}`,
                background: an ? 'var(--mdc-red)' : 'transparent',
                color: an ? '#fff' : 'var(--mdc-ink-dim)',
              }}
            >
              {g.name}
              {/* Wie lange noch bis zum nächsten Wechsel */}
              {an && !pause && !ruhig && gruppen.length > 1 && (
                <span
                  key={wechsel} aria-hidden
                  style={{
                    position: 'absolute', left: 0, bottom: 0, height: 2,
                    background: 'rgba(255,255,255,0.75)',
                    animation: `mdc-rot-lauf ${TAKT_MS}ms linear forwards`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Wer in eine Karte tippt, hält die Automatik an — sonst blendete der
          Beitrag mitten im Lesen aus. */}
      <div
        style={{ display: 'grid' }}
        onPointerDownCapture={() => setGewaehlt(true)}
        onKeyDownCapture={() => setGewaehlt(true)}
      >
        {gruppen.map((g, i) => {
          const an = i === aktiv;
          const raus = i === vorher && !an;
          const ab = wechsel % 2 ? 'a' : 'b';
          // Überblenden per Keyframes statt CSS-Transition: iOS Safari ließ
          // die Transition aus und schaltete hart um.
          return (
            <div
              key={g.code} role="tabpanel" aria-hidden={!an}
              style={{
                gridArea: '1 / 1',
                display: 'grid', gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                alignContent: 'start',
                opacity: an ? 1 : 0,
                visibility: an || raus ? 'visible' : 'hidden',
                pointerEvents: an ? 'auto' : 'none',
                animation: wechsel === 0 ? undefined
                  : an ? `mdc-rot-ein-${ab} ${BLENDE_MS}ms ease-in-out both`
                  : raus ? `mdc-rot-aus-${ab} ${BLENDE_MS}ms ease-in-out both` : undefined,
              }}
            >
              {g.inhalt}
            </div>
          );
        })}
      </div>

      <style>{'@keyframes mdc-rot-lauf { from { width: 0 } to { width: 100% } }'
        + '@keyframes mdc-rot-ein-a { from { opacity: 0 } to { opacity: 1 } }'
        + '@keyframes mdc-rot-ein-b { from { opacity: 0 } to { opacity: 1 } }'
        + '@keyframes mdc-rot-aus-a { from { opacity: 1; visibility: visible } to { opacity: 0; visibility: hidden } }'
        + '@keyframes mdc-rot-aus-b { from { opacity: 1; visibility: visible } to { opacity: 0; visibility: hidden } }'}</style>
    </div>
  );
}
