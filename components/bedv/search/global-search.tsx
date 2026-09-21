'use client';

// ============================================================
// Globale Suche
// ============================================================
//
// Öffnet sich über die Lupe oder mit Strg/⌘ + K. Gesucht wird im Browser,
// ohne Serveranfrage — die Trefferliste steht deshalb ohne Wartezeit da,
// und das ist im Verkaufsgespräch der eigentliche Effekt („tipp mal Ghost").
//
// Der Index (über 600 Einträge) wird ERST BEIM ÖFFNEN nachgeladen
// (`await import(...)`). Fest eingebunden läge er im Bündel jeder Seite und
// würde den ersten Bildschirm ausbremsen — genau den, der zählt.
//
// Der Baustein wird nur eingehängt, solange die Suche offen ist (die
// Aufrufer rendern ihn bedingt). Dadurch braucht es KEINEN Effekt, der beim
// Schließen Suchbegriff und Markierung zurücksetzt: Beim Aushängen ist der
// Zustand ohnehin weg. Die Trefferliste ist aus dem Suchbegriff abgeleitet
// und wird gar nicht erst abgelegt.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import type { Treffer, TrefferArt } from '@/data/bedv/suchindex';

type Sucher = (begriff: string, grenze?: number) => Treffer[];

const ART_LABEL: Record<TrefferArt, string> = {
  liga: 'Liga', team: 'Mannschaft', spieler: 'Spieler',
  spielstaette: 'Spielstätte', news: 'Beitrag', termin: 'Termin',
};

const ART_FARBE: Record<TrefferArt, string> = {
  liga: 'var(--bedv-accent-deep)', team: 'var(--bedv-blue-deep)', spieler: 'var(--bedv-teal)',
  spielstaette: 'var(--bedv-violet)', news: 'var(--bedv-ink-dim)', termin: 'var(--bedv-ink-dim)',
};

export function GlobalSearch({ schliessen }: { schliessen: () => void }) {
  const router = useRouter();
  const [begriff, setBegriff] = useState('');
  const [markiert, setMarkiert] = useState(0);
  // `null` heißt „Index noch nicht da" — ein eigener Ladezustand erübrigt sich.
  const [suchen, setSuchen] = useState<Sucher | null>(null);
  const feldRef = useRef<HTMLInputElement>(null);

  // Index nachladen. `setSuchen` läuft im `.then`, also NICHT synchron im
  // Effektrumpf — genau das will React vermieden sehen.
  useEffect(() => {
    let abgebrochen = false;
    import('@/data/bedv/suchindex')
      .then(modul => { if (!abgebrochen) setSuchen(() => modul.suche); })
      .catch(() => { /* ohne Index bleibt die Suche leer, die Seite läuft weiter */ });
    return () => { abgebrochen = true; };
  }, []);

  // Kurz warten, bis die Schicht im Baum steht — sonst greift der Fokus
  // ins Leere.
  useEffect(() => {
    const t = window.setTimeout(() => feldRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, []);

  const laedt = suchen === null;
  const treffer = suchen ? suchen(begriff, 12) : [];
  // Gegen den Fall, dass die Liste kürzer wird, während die Markierung noch
  // weiter unten stand.
  const aktiv = treffer.length === 0 ? 0 : Math.min(markiert, treffer.length - 1);

  const oeffne = useCallback((ziel: string) => {
    schliessen();
    router.push(bedvPath(ziel));
  }, [router, schliessen]);

  const taste = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { schliessen(); return; }
    if (treffer.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setMarkiert((aktiv + 1) % treffer.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setMarkiert((aktiv - 1 + treffer.length) % treffer.length); }
    if (e.key === 'Enter')     { e.preventDefault(); oeffne(treffer[aktiv].ziel); }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Team oder Spieler suchen"
      onMouseDown={e => { if (e.target === e.currentTarget) schliessen(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(6, 16, 31, 0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '10vh 16px 16px',
      }}
    >
      <div
        className="bedv-card bedv-pop"
        style={{ width: '100%', maxWidth: 580, padding: 0, overflow: 'hidden', boxShadow: 'var(--bedv-shadow-lg)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', borderBottom: '1px solid var(--bedv-line)' }}>
          {laedt
            ? <Loader2 size={18} className="bedv-spin-fast" style={{ color: 'var(--bedv-ink-faint)', flex: 'none' }} />
            : <Search size={18} style={{ color: 'var(--bedv-ink-faint)', flex: 'none' }} aria-hidden="true" />}
          <input
            ref={feldRef}
            value={begriff}
            onChange={e => { setBegriff(e.target.value); setMarkiert(0); }}
            onKeyDown={taste}
            placeholder="Team oder Spieler suchen …"
            aria-label="Suchbegriff"
            style={{
              flex: 1, border: 'none', outline: 'none', font: 'inherit',
              fontSize: '1rem', background: 'transparent', color: 'var(--bedv-ink)',
            }}
          />
          <button onClick={schliessen} aria-label="Suche schließen" className="bedv-btn bedv-btn--quiet bedv-btn--sm">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {begriff.trim().length < 2 && (
            <div style={{ padding: '22px 18px', color: 'var(--bedv-ink-dim)', fontSize: '0.9rem' }}>
              Mindestens zwei Zeichen. Gesucht wird in Ligen, Mannschaften, Spielern,
              Spielstätten, Beiträgen und Terminen — auch nach Passnummer und Spitznamen.
            </div>
          )}
          {begriff.trim().length >= 2 && treffer.length === 0 && !laedt && (
            <div style={{ padding: '22px 18px', color: 'var(--bedv-ink-dim)', fontSize: '0.9rem' }}>
              Nichts gefunden für <strong style={{ color: 'var(--bedv-ink)' }}>{begriff}</strong>.
            </div>
          )}
          {treffer.map((t, i) => (
            <button
              key={`${t.art}-${t.ziel}-${t.titel}`}
              onMouseEnter={() => setMarkiert(i)}
              onClick={() => oeffne(t.ziel)}
              style={{
                display: 'flex', width: '100%', alignItems: 'center', gap: 12,
                padding: '10px 15px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: i === aktiv ? 'var(--bedv-blue-mist)' : 'transparent',
                borderBottom: '1px solid var(--bedv-line-soft)',
              }}
            >
              <span
                className="bedv-kicker"
                style={{ color: ART_FARBE[t.art], width: 78, flex: 'none', fontSize: '0.62rem' }}
              >
                {ART_LABEL[t.art]}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.94rem' }}>{t.titel}</span>
                <span style={{ display: 'block', color: 'var(--bedv-ink-dim)', fontSize: '0.78rem' }}>{t.zusatz}</span>
              </span>
              <span aria-hidden="true" style={{ color: 'var(--bedv-ink-faint)' }}>→</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '8px 15px', background: 'var(--bedv-tint)', fontSize: '0.72rem', color: 'var(--bedv-ink-faint)', display: 'flex', gap: 14 }}>
          <span>↑↓ auswählen</span><span>⏎ öffnen</span><span>Esc schließen</span>
        </div>
      </div>
    </div>
  );
}
