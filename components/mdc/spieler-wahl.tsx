'use client';

// ============================================================
// MDC — Spieler wählen, mit Suche nach PASSNUMMER oder Name
// ============================================================
//
// Steht in einer eigenen Datei, weil zwei Stellen dasselbe brauchen: die
// Prüfliste beim Hochladen (`ergebnis-upload.tsx`) und das nachträgliche
// Berichtigen einer Ergebnisliste (`turnier-korrektur.tsx`). Zweimal gebaut
// hieße zweimal gepflegt — und die Suche ist genau die Stelle, an der sich
// Kleinigkeiten rächen.
// ============================================================

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';

/** Ein Spieler, wie ihn die Auswahl braucht. */
export interface UploadSpieler {
  passNr: number;
  name: string;
  nickname: string | null;
}

/** Höchstens so viele Treffer werden gezeichnet — der Rest wird gezählt. */
const MAX_TREFFER = 40;

export const eingabeStil: React.CSSProperties = {
  padding: '9px 11px',
  borderRadius: 9,
  border: '1px solid var(--mdc-line)',
  background: 'var(--mdc-card)',
  color: 'var(--mdc-ink)',
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  width: '100%',
};

/** Klein und ohne Umlautzeichen: „Böhme" soll auch auf „bohme" anspringen. */
export function ohneZeichen(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Was passt zur Eingabe? Reine Ziffern gelten der PASSNUMMER (genau diese
 * zuerst, dann die, die damit anfangen), alles andere dem Namen.
 */
function suchtreffer(spieler: UploadSpieler[], suche: string): UploadSpieler[] {
  const q = suche.trim();
  if (!q) return spieler;

  if (/^\d+$/.test(q)) {
    return spieler
      .filter(s => String(s.passNr).startsWith(q))
      .sort((a, b) =>
        (String(a.passNr) === q ? 0 : 1) - (String(b.passNr) === q ? 0 : 1)
        || a.passNr - b.passNr);
  }

  const k = ohneZeichen(q);
  return spieler.filter(s =>
    ohneZeichen(s.name).includes(k)
    || (s.nickname !== null && ohneZeichen(s.nickname).includes(k)));
}

export function SpielerWahl({ spieler, passNr, beschriftung, onWaehlen, onNeu }: {
  spieler: UploadSpieler[];
  passNr: number | null;
  /** Für Screenreader — das Feld steht ohne sichtbare Beschriftung da. */
  beschriftung: string;
  onWaehlen: (passNr: number | null) => void;
  /**
   * Fehlt der Eintrag, gibt es „Neuen Spieler anlegen" gar nicht erst. So beim
   * nachträglichen Berichtigen: Wer noch keine Passnummer hat, kommt über den
   * Zettel herein — dort steht die Wertungsklasse und die Nummer wird aus den
   * freien vergeben, hier wüsste die Maske beides nicht.
   */
  onNeu?: () => void;
}) {
  /**
   * `null` heißt: noch nichts getippt. Dann steht der gewählte Spieler im
   * Feld und die Liste zeigt alle — erst der erste Tastendruck filtert.
   */
  const [suche, setSuche] = useState<string | null>(null);
  const [offen, setOffen] = useState(false);
  const [markiert, setMarkiert] = useState(0);
  const listeId = useId();
  const listeRef = useRef<HTMLUListElement>(null);

  const gewaehlt = passNr === null ? null : spieler.find(s => s.passNr === passNr) ?? null;
  const treffer = useMemo(
    () => (offen ? suchtreffer(spieler, suche ?? '') : []),
    [offen, spieler, suche],
  );
  const gezeigt = treffer.slice(0, MAX_TREFFER);
  // Der Eintrag „neuen Spieler anlegen" steht hinter den Treffern und ist
  // genauso mit den Pfeiltasten erreichbar. Ohne `onNeu` gibt es ihn nicht,
  // dann endet die Liste beim letzten Treffer.
  const letzter = onNeu ? gezeigt.length : -1;

  // Was markiert ist, muss auch zu sehen sein — sonst tastet man sich blind
  // durch eine Liste, die stehen bleibt.
  useEffect(() => {
    listeRef.current?.querySelector('[data-markiert="1"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [markiert, offen]);

  const anzeige = suche !== null
    ? suche
    : gewaehlt
      ? `${gewaehlt.name}${gewaehlt.nickname ? ` (${gewaehlt.nickname})` : ''} · ${gewaehlt.passNr}`
      : '';

  function schliesse() {
    setOffen(false);
    setSuche(null);
  }

  function waehle(stelle: number) {
    if (onNeu && stelle === letzter) {
      schliesse();
      onNeu();
      return;
    }
    const s = gezeigt[stelle];
    if (!s) return;
    onWaehlen(s.passNr);
    schliesse();
  }

  const nurZiffern = suche !== null && /^\d+$/.test(suche.trim());

  return (
    <div>
      <input
        type="text"
        inputMode="text"
        role="combobox"
        aria-expanded={offen}
        aria-controls={listeId}
        aria-autocomplete="list"
        aria-label={beschriftung}
        autoComplete="off"
        placeholder="Name oder Passnummer"
        value={anzeige}
        onFocus={e => {
          setOffen(true);
          setSuche(null);
          setMarkiert(0);
          // Alles markieren: Der erste Tastendruck ersetzt den bisherigen
          // Namen, statt sich dahinter zu hängen.
          e.target.select();
        }}
        onChange={e => {
          setSuche(e.target.value);
          setMarkiert(0);
          setOffen(true);
        }}
        onBlur={schliesse}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOffen(true);
            setMarkiert(m => Math.min(m + 1, onNeu ? letzter : gezeigt.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMarkiert(m => Math.max(m - 1, 0));
          } else if (e.key === 'Enter') {
            if (!offen) return;
            e.preventDefault();
            waehle(markiert);
          } else if (e.key === 'Escape') {
            schliesse();
          }
        }}
        style={{
          ...eingabeStil,
          width: '100%',
          // Solange nichts eingesetzt ist, soll das Feld nicht wie ein
          // fertiges aussehen.
          color: gewaehlt || suche !== null ? undefined : 'var(--mdc-ink-dim)',
        }}
      />

      {offen && (
        // `onMouseDown` mit `preventDefault`: Ohne das verliert das Eingabefeld
        // den Fokus, BEVOR der Klick ankommt — die Liste wäre weg und die
        // Auswahl käme nie an.
        <ul
          id={listeId}
          ref={listeRef}
          role="listbox"
          onMouseDown={e => e.preventDefault()}
          style={{
            marginTop: 4, maxHeight: 250, overflowY: 'auto',
            border: '1px solid var(--mdc-line)', borderRadius: 9,
            background: 'var(--mdc-card)', fontSize: '0.9rem',
          }}
        >
          {gezeigt.map((s, i) => (
            <li
              // Nummer UND Name als Schlüssel: Die Passnummer allein ist nicht
              // zwingend eindeutig — steht dieselbe Nummer (fälschlich) bei
              // zwei Leuten, kämen doppelte Schlüssel heraus, und React lässt
              // dann Einträge der vorigen Liste stehen. Beim Tippen standen so
              // plötzlich Namen da, die gar nicht zur Suche passten.
              key={`${s.passNr}-${s.name}`}
              role="option"
              aria-selected={s.passNr === passNr}
              data-markiert={i === markiert ? '1' : '0'}
              onClick={() => waehle(i)}
              onMouseEnter={() => setMarkiert(i)}
              style={{
                display: 'flex', justifyContent: 'space-between', gap: 10,
                padding: '8px 11px', cursor: 'pointer',
                background: i === markiert ? 'var(--mdc-blue-a08)' : undefined,
                fontWeight: s.passNr === passNr ? 700 : undefined,
              }}
            >
              <span>{s.name}{s.nickname ? ` (${s.nickname})` : ''}</span>
              <span className="mdc-num" style={{ color: 'var(--mdc-ink-dim)' }}>{s.passNr}</span>
            </li>
          ))}

          {gezeigt.length === 0 && (
            <li style={{ padding: '8px 11px', color: 'var(--mdc-ink-dim)' }}>
              {nurZiffern
                ? `Passnummer ${suche?.trim()} gehört niemandem im Stamm.`
                : 'Kein Name passt dazu.'}
            </li>
          )}

          {treffer.length > gezeigt.length && (
            <li style={{ padding: '6px 11px', color: 'var(--mdc-ink-dim)', fontSize: '0.82rem' }}>
              … und {treffer.length - gezeigt.length} weitere — bitte genauer eingrenzen.
            </li>
          )}

          {onNeu && (
          <li
            role="option"
            aria-selected={false}
            data-markiert={markiert === letzter ? '1' : '0'}
            onClick={() => waehle(letzter)}
            onMouseEnter={() => setMarkiert(letzter)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 11px', cursor: 'pointer',
              borderTop: '1px solid var(--mdc-line)',
              color: 'var(--mdc-blue)',
              background: markiert === letzter ? 'var(--mdc-blue-a08)' : undefined,
            }}
          >
            <UserPlus size={15} />
            Neuen Spieler anlegen
          </li>
          )}
        </ul>
      )}
    </div>
  );
}
