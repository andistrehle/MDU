'use client';

// „Nächste Spiele" auf der Startseite: je Liga eine Gruppe, die Ligen wechseln
// sich automatisch ab. Die Karten rendert der Server (home-content.tsx) und
// reicht sie fertig herein — hier wird nur umgeschaltet, damit der Spielplan
// nicht ins Browser-Paket wandert.
//
// Alle Gruppen liegen übereinander in derselben Rasterzelle: Die Höhe richtet
// sich nach der längsten, beim Wechsel springt die Seite darunter nicht.
// Die Automatik läuft immer weiter — auch mit der Maus darüber (am Desktop
// liegt der Zeiger dort oft einfach herum, dann wechselte nie etwas). Sie
// endet erst, wenn jemand selbst eine Liga antippt, und pausiert, solange per
// Tastatur ein Reiter im Fokus ist. Bei „weniger Bewegung" (z. B. Windows
// „Animationen anzeigen: aus") wird ohne Überblenden und Laufbalken gewechselt.

import { useEffect, useState, useSyncExternalStore } from 'react';

export interface LigaGruppe {
  code: string;
  name: string;
  color: string;
  anzahl: number;
  inhalt: React.ReactNode;
}

const TAKT_MS = 7000;
const RUHIG = '(prefers-reduced-motion: reduce)';
function abonniereRuhig(cb: () => void) {
  const mq = window.matchMedia(RUHIG);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function NaechsteSpieleRotator({ gruppen }: { gruppen: LigaGruppe[] }) {
  const [aktiv, setAktiv] = useState(0);
  const [gewaehlt, setGewaehlt] = useState(false);
  const [fokus, setFokus] = useState(false);
  const pause = gewaehlt || fokus;
  const ruhig = useSyncExternalStore(abonniereRuhig, () => window.matchMedia(RUHIG).matches, () => false);

  useEffect(() => {
    if (pause || gruppen.length < 2) return;
    const t = setTimeout(() => setAktiv(i => (i + 1) % gruppen.length), TAKT_MS);
    return () => clearTimeout(t);
  }, [aktiv, pause, gruppen.length]);

  if (!gruppen.length) return null;

  return (
    <div
      onFocusCapture={e => setFokus((e.target as HTMLElement).matches(':focus-visible'))}
      onBlurCapture={() => setFokus(false)}
    >
      {/* Liga-Auswahl: zeigt, wo man ist, und lässt direkt springen */}
      <div role="tablist" aria-label="Liga wählen" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {gruppen.map((g, i) => {
          const an = i === aktiv;
          return (
            <button
              key={g.code} role="tab" aria-selected={an} type="button"
              onClick={() => { setAktiv(i); setGewaehlt(true); }}
              style={{
                position: 'relative', overflow: 'hidden', padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-manrope)', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                border: `1.5px solid ${an ? g.color : 'var(--th-line-10)'}`,
                background: an ? g.color : 'transparent', color: an ? '#fff' : 'var(--th-text-muted)',
              }}
            >
              {g.name} <span style={{ opacity: 0.75, fontWeight: 700 }}>{g.anzahl}</span>
              {/* Fortschritt bis zum nächsten Wechsel */}
              {an && !pause && !ruhig && gruppen.length > 1 && (
                <span key={aktiv} aria-hidden style={{ position: 'absolute', left: 0, bottom: 0, height: 2, background: 'rgba(255,255,255,0.75)', animation: `mdu-rotator-lauf ${TAKT_MS}ms linear forwards` }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid' }}>
        {gruppen.map((g, i) => {
          const an = i === aktiv;
          return (
            <div
              key={g.code} role="tabpanel" aria-hidden={!an}
              style={{
                gridArea: '1 / 1', display: 'flex', flexDirection: 'column', gap: 10,
                opacity: an ? 1 : 0, visibility: an ? 'visible' : 'hidden',
                transition: ruhig ? 'none' : 'opacity 400ms ease',
              }}
            >
              {g.inhalt}
            </div>
          );
        })}
      </div>
      <style>{'@keyframes mdu-rotator-lauf { from { width: 0 } to { width: 100% } }'}</style>
    </div>
  );
}
