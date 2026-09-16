'use client';

// ============================================================
// MDC — Spielorte bearbeiten
// ============================================================
//
// Elf Lokale, untereinander als Liste. Aufgeklappt wird eines nach dem
// anderen: Elf offene Formulare am Handy wären eine Tapete, und geändert wird
// ohnehin immer nur eines.
//
// Alle Felder stehen immer mit dem GELTENDEN Wert da — auch die, die man
// gerade nicht ändern will. Der Server vergleicht sie mit der Übersicht des
// Betreibers und legt nur ab, was wirklich abweicht. Wer einen Wert wieder auf
// den ursprünglichen zurückstellt, nimmt damit die Änderung zurück; dafür
// braucht es keinen eigenen Knopf (einen gibt es trotzdem, das ist schneller).
// ============================================================

import { useId, useState } from 'react';
import {
  AlertTriangle, Check, ExternalLink, Loader2, MapPin, Pencil, RotateCcw, X,
} from 'lucide-react';
import { speichereSpielortAenderung, nimmSpielortAenderungZurueck } from '@/app/mdc/admin/spielorte/actions';

export interface SpielortStatus {
  canPublish: boolean;
  missing: string[];
}

/** Ein Lokal, wie die Verwaltung es braucht: geltender Stand und Übersicht. */
export interface EditorSpielort {
  id: string;
  /** Was gilt — Übersicht plus Änderung. */
  name: string;
  street: string;
  zip: string;
  city: string;
  weekdays: number[];
  time: string;
  phones: string[];
  boards: number;
  /** Was in der Übersicht des Betreibers steht, Feld für Feld. */
  basis: {
    name: string;
    street: string;
    zip: string;
    city: string;
    weekdays: number[];
    time: string;
    phones: string[];
    boards: number;
  };
  /** Die Felder, die gerade von der Übersicht abweichen — für den Hinweis. */
  geaendert: { feld: string; vorher: string; jetzt: string }[];
  /** Begründung der laufenden Änderung, falls eine hinterlegt ist. */
  note: string | null;
  /** Wann zuletzt geändert. */
  datum: string | null;
}

const TAGE: { wert: number; kurz: string; lang: string }[] = [
  { wert: 1, kurz: 'Mo', lang: 'Montag' },
  { wert: 2, kurz: 'Di', lang: 'Dienstag' },
  { wert: 3, kurz: 'Mi', lang: 'Mittwoch' },
  { wert: 4, kurz: 'Do', lang: 'Donnerstag' },
  { wert: 5, kurz: 'Fr', lang: 'Freitag' },
  { wert: 6, kurz: 'Sa', lang: 'Samstag' },
  { wert: 7, kurz: 'So', lang: 'Sonntag' },
];

interface Entwurf {
  name: string;
  street: string;
  zip: string;
  city: string;
  weekdays: number[];
  time: string;
  /** Als eine Zeile je Nummer — Listen tippt man schlecht mit Komma. */
  phones: string[];
  boards: string;
  note: string;
}

function ausSpielort(v: EditorSpielort): Entwurf {
  return {
    name: v.name,
    street: v.street,
    zip: v.zip,
    city: v.city,
    weekdays: [...v.weekdays],
    time: v.time,
    phones: v.phones.length ? [...v.phones] : [''],
    boards: String(v.boards),
    note: '',
  };
}

export function SpielortEditor({ spielorte, status }: {
  spielorte: EditorSpielort[];
  status: SpielortStatus;
}) {
  const [offen, setOffen] = useState<string | null>(null);
  const [entwurf, setEntwurf] = useState<Entwurf | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [fertig, setFertig] = useState<{ url: string; text: string } | null>(null);

  if (!status.canPublish) {
    return (
      <div className="mdc-card" style={{ padding: '22px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
        <div>
          <h2 className="mdc-display" style={{ fontSize: '1.15rem' }}>Noch nicht eingerichtet</h2>
          <p style={{ marginTop: 8, fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Zum Ändern braucht die Seite Zugangsdaten, die im Vercel-Projekt hinterlegt werden
            müssen. Solange sie fehlen, steht das hier — statt einer Schaltfläche, die nichts tut.
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--mdc-ink-soft)', listStyle: 'disc' }}>
            {status.missing.map(m => <li key={m}><code>{m}</code></li>)}
          </ul>
        </div>
      </div>
    );
  }

  function aufmachen(v: EditorSpielort) {
    setOffen(v.id);
    setEntwurf(ausSpielort(v));
    setFehler(null);
    setFertig(null);
  }

  function zumachen() {
    setOffen(null);
    setEntwurf(null);
  }

  async function speichern(v: EditorSpielort) {
    if (!entwurf) return;
    const zahl = Number(entwurf.boards);
    if (!Number.isInteger(zahl)) {
      setFehler('Die Zahl der Automaten muss eine ganze Zahl sein.');
      return;
    }
    setLaeuft(true);
    setFehler(null);
    const antwort = await speichereSpielortAenderung({
      venueId: v.id,
      name: entwurf.name,
      street: entwurf.street,
      zip: entwurf.zip,
      city: entwurf.city,
      weekdays: entwurf.weekdays,
      time: entwurf.time,
      phones: entwurf.phones,
      boards: zahl,
      note: entwurf.note,
    });
    setLaeuft(false);
    if (!antwort.ok) {
      setFehler(antwort.fehler);
      return;
    }
    setFertig({
      url: antwort.url,
      text: antwort.zurueckgesetzt
        ? `${antwort.beschreibung} steht wieder wie in der Übersicht.`
        : antwort.beschreibung,
    });
    zumachen();
  }

  async function zuruecksetzen(v: EditorSpielort) {
    setLaeuft(true);
    setFehler(null);
    const antwort = await nimmSpielortAenderungZurueck(v.id);
    setLaeuft(false);
    if (!antwort.ok) {
      setFehler(antwort.fehler);
      return;
    }
    setFertig({ url: antwort.url, text: `${antwort.beschreibung} steht wieder wie in der Übersicht.` });
    zumachen();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {fehler && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {fertig && (
        <div className="mdc-card mdc-card-accent" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: '0.94rem', lineHeight: 1.7, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Check size={18} style={{ flexShrink: 0, marginTop: 3, color: 'var(--mdc-win)' }} />
            <span>
              <strong>Abgelegt.</strong> {fertig.text}{' '}
              Die Seite baut sich jetzt neu — in ein bis zwei Minuten steht es überall,
              auch im Wochenplan und beim Ergebnis-Upload.
            </span>
          </p>
          <a
            href={fertig.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mdc-btn mdc-btn-ghost mdc-btn-sm"
            style={{ marginTop: 12 }}
          >
            Was genau geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {spielorte.map(v => (
        <div
          key={v.id}
          className="mdc-card"
          style={{
            padding: '18px 18px',
            borderColor: v.geaendert.length ? 'var(--mdc-blue-soft)' : undefined,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <h3 className="mdc-display" style={{ fontSize: '1.05rem' }}>{v.name}</h3>
              <p style={{ marginTop: 4, fontSize: '0.88rem', color: 'var(--mdc-ink-soft)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <MapPin size={13} style={{ flexShrink: 0 }} />
                {v.street}, {v.zip} {v.city}
              </p>
              <p style={{ marginTop: 4, fontSize: '0.88rem', color: 'var(--mdc-ink-soft)' }}>
                {v.weekdays.map(d => TAGE.find(t => t.wert === d)?.lang ?? d).join(' & ')}
                {' '}ab {v.time} Uhr · {v.boards} {v.boards === 1 ? 'Automat' : 'Automaten'}
              </p>
            </div>

            {offen !== v.id && (
              <button
                type="button"
                onClick={() => aufmachen(v)}
                className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                disabled={laeuft}
              >
                <Pencil size={14} />
                Ändern
              </button>
            )}
          </div>

          {/* Weicht etwas von der Übersicht des Betreibers ab, steht es hier —
              samt dem Wert, der dort noch steht. Sonst wüsste später niemand
              mehr, was an der Seite geändert wurde und was aus der Vorlage kommt. */}
          {v.geaendert.length > 0 && (
            <div
              style={{
                marginTop: 12, padding: '10px 12px', borderRadius: 9,
                background: 'var(--mdc-blue-a08)', fontSize: '0.85rem', lineHeight: 1.65,
              }}
            >
              <strong>An der Seite geändert</strong>
              {v.datum ? ` (${v.datum})` : ''}:
              <ul style={{ marginTop: 4, paddingLeft: 18, listStyle: 'disc' }}>
                {v.geaendert.map(g => (
                  <li key={g.feld}>
                    {g.feld}: <s>{g.vorher}</s> → <strong>{g.jetzt}</strong>
                  </li>
                ))}
              </ul>
              {v.note && <p style={{ marginTop: 6 }}>{v.note}</p>}
              <p style={{ marginTop: 6, color: 'var(--mdc-ink-dim)' }}>
                In der Spielorte-Übersicht des Betreibers steht weiterhin der linke Wert.
                Sobald du ihn dort nachziehst, fällt dieser Eintrag von allein weg.
              </p>
            </div>
          )}

          {offen === v.id && entwurf && (
            <Formular
              entwurf={entwurf}
              setEntwurf={setEntwurf}
              geaendert={v.geaendert.length > 0}
              laeuft={laeuft}
              onSpeichern={() => speichern(v)}
              onAbbrechen={zumachen}
              onZuruecksetzen={() => zuruecksetzen(v)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Formular({ entwurf, setEntwurf, geaendert, laeuft, onSpeichern, onAbbrechen, onZuruecksetzen }: {
  entwurf: Entwurf;
  setEntwurf: (e: Entwurf) => void;
  geaendert: boolean;
  laeuft: boolean;
  onSpeichern: () => void;
  onAbbrechen: () => void;
  onZuruecksetzen: () => void;
}) {
  const id = useId();
  const setze = (teil: Partial<Entwurf>) => setEntwurf({ ...entwurf, ...teil });

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--mdc-line)', paddingTop: 16 }}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <Feld id={`${id}-name`} label="Name">
          <input
            id={`${id}-name`} value={entwurf.name} maxLength={60}
            onChange={e => setze({ name: e.target.value })} style={eingabe}
          />
        </Feld>
        <Feld id={`${id}-boards`} label="Dartautomaten">
          <input
            id={`${id}-boards`} type="number" inputMode="numeric" min={1} max={30}
            value={entwurf.boards}
            onChange={e => setze({ boards: e.target.value })} style={eingabe}
          />
        </Feld>
        <Feld id={`${id}-street`} label="Straße und Hausnummer">
          <input
            id={`${id}-street`} value={entwurf.street} maxLength={80}
            onChange={e => setze({ street: e.target.value })} style={eingabe}
          />
        </Feld>
        <Feld id={`${id}-zip`} label="PLZ">
          <input
            id={`${id}-zip`} value={entwurf.zip} inputMode="numeric" maxLength={5}
            onChange={e => setze({ zip: e.target.value })} style={eingabe}
          />
        </Feld>
        <Feld id={`${id}-city`} label="Ort">
          <input
            id={`${id}-city`} value={entwurf.city} maxLength={40}
            onChange={e => setze({ city: e.target.value })} style={eingabe}
          />
        </Feld>
        <Feld id={`${id}-time`} label="Beginn">
          <input
            id={`${id}-time`} type="time" value={entwurf.time}
            onChange={e => setze({ time: e.target.value })} style={eingabe}
          />
        </Feld>
      </div>

      <fieldset style={{ marginTop: 16, border: 0, padding: 0 }}>
        <legend style={{ ...label, padding: 0, marginBottom: 8 }}>Fester Spieltag</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TAGE.map(tag => {
            const an = entwurf.weekdays.includes(tag.wert);
            return (
              <label
                key={tag.wert}
                className={`mdc-btn mdc-btn-sm ${an ? 'mdc-btn-primary' : 'mdc-btn-ghost'}`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={an}
                  onChange={() => setze({
                    weekdays: an
                      ? entwurf.weekdays.filter(d => d !== tag.wert)
                      : [...entwurf.weekdays, tag.wert].sort((a, b) => a - b),
                  })}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                />
                {tag.lang}
              </label>
            );
          })}
        </div>
        <p style={{ marginTop: 8, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--mdc-ink-dim)' }}>
          Nur der feste Wochentag. Ein einzelner Abend, der ausfällt oder zusätzlich
          stattfindet, gehört in den <strong>Kalender</strong> — hier stünde er für immer.
        </p>
      </fieldset>

      <fieldset style={{ marginTop: 16, border: 0, padding: 0 }}>
        <legend style={{ ...label, padding: 0, marginBottom: 8 }}>Telefon</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entwurf.phones.map((nummer, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input
                value={nummer}
                inputMode="tel"
                maxLength={40}
                aria-label={`Telefonnummer ${i + 1}`}
                onChange={e => setze({
                  phones: entwurf.phones.map((n, j) => (i === j ? e.target.value : n)),
                })}
                style={eingabe}
              />
              <button
                type="button"
                aria-label={`Telefonnummer ${i + 1} entfernen`}
                onClick={() => setze({
                  phones: entwurf.phones.length === 1
                    ? ['']
                    : entwurf.phones.filter((_, j) => j !== i),
                })}
                className="mdc-btn mdc-btn-ghost mdc-btn-sm"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setze({ phones: [...entwurf.phones, ''] })}
          className="mdc-btn mdc-btn-ghost mdc-btn-sm"
          style={{ marginTop: 8 }}
        >
          Nummer dazu
        </button>
        <p style={{ marginTop: 8, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--mdc-ink-dim)' }}>
          Wird auf der Seite derzeit <strong>nicht</strong> angezeigt (`PHONES_PUBLIC`):
          Es sind überwiegend Mobilnummern, und ob die öffentlich dürfen, ist nicht geklärt.
        </p>
      </fieldset>

      <div style={{ marginTop: 16 }}>
        <Feld id={`${id}-note`} label="Warum (freiwillig)">
          <input
            id={`${id}-note`} value={entwurf.note} maxLength={200}
            placeholder={'z. B. „Wirt hat einen vierten Automaten aufgestellt“'}
            onChange={e => setze({ note: e.target.value })} style={eingabe}
          />
        </Feld>
        <p style={{ marginTop: 6, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--mdc-ink-dim)' }}>
          Steht in der Verwaltung und in der Commit-Nachricht — nicht auf der Seite.
        </p>
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <button type="button" onClick={onSpeichern} disabled={laeuft} className="mdc-btn mdc-btn-primary mdc-btn-sm">
          {laeuft ? <Loader2 size={15} className="mdc-spin" /> : <Check size={15} />}
          {laeuft ? 'Wird abgelegt …' : 'Speichern'}
        </button>
        <button type="button" onClick={onAbbrechen} disabled={laeuft} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
          Abbrechen
        </button>
        {geaendert && (
          <button type="button" onClick={onZuruecksetzen} disabled={laeuft} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
            <RotateCcw size={14} />
            Wieder wie in der Übersicht
          </button>
        )}
      </div>
    </div>
  );
}

function Feld({ id, label: text, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={label}>{text}</label>
      {children}
    </div>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.74rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mdc-ink-dim)',
  fontWeight: 700,
};

const eingabe: React.CSSProperties = {
  padding: '9px 11px',
  borderRadius: 9,
  border: '1px solid var(--mdc-line)',
  background: 'var(--mdc-card)',
  color: 'var(--mdc-ink)',
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  width: '100%',
};
