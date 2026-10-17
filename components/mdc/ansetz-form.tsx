'use client';

// ============================================================
// MDC — „Ranking ansetzen" für die Wirte
// ============================================================
//
// Bewusst viel kleiner als der Kalender der Turnierleitung: ein Formular, eine
// Liste, sonst nichts. Wer das hier benutzt, steht im Lokal am Handy und will
// einen Samstagabend eintragen — nicht einen Verwaltungsbereich erkunden.
//
// Absagen gibt es hier nicht. Ein Ranking, das im Plan steht, abzusagen nimmt
// anderen Leuten den Abend weg; das bleibt bei der Turnierleitung.
// ============================================================

import { useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarPlus, Check, ExternalLink, Loader2, RotateCcw,
} from 'lucide-react';
import { formatDate, formatTime, weekdayName } from '@/lib/mdc/format';
import { setzeZusatzAn, nimmZusatzZurueck } from '@/app/mdc/admin/ansetzen/actions';

export interface AnsetzVenue {
  id: string;
  name: string;
  time: string;
  /** Wochentage, an denen dort ohnehin gespielt wird (1 = Mo … 7 = So). */
  weekdays: number[];
  weekdayLabel: string;
}

export interface AngesetzterTermin {
  id: string;
  date: string;
  venueName: string;
  time: string;
  note: string | null;
}

/** 1 = Montag … 7 = Sonntag, passend zu den Spielorten. */
function wochentagVon(iso: string): number {
  const tag = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return tag === 0 ? 7 : tag;
}

export function AnsetzForm({ venues, termine, heute, maxDatum, darfAblegen, fehlt }: {
  venues: AnsetzVenue[];
  /** Schon angesetzte Termine ab heute — aus dem letzten Neubau der Seite. */
  termine: AngesetzterTermin[];
  heute: string;
  /** Weiter voraus nimmt die Seite nichts an. */
  maxDatum: string;
  darfAblegen: boolean;
  fehlt: string[];
}) {
  const [date, setDate] = useState(heute);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ text: string; url: string } | null>(null);

  const lokal = useMemo(() => venues.find(v => v.id === venueId), [venues, venueId]);

  // Dieselbe Prüfung macht der Server noch einmal — hier steht sie, damit man
  // es sieht, BEVOR man auf „Ansetzen" tippt.
  const festerTag = !!lokal && lokal.weekdays.includes(wochentagVon(date));

  const eingabe: React.CSSProperties = {
    marginTop: 6, width: '100%', padding: '10px 12px', fontSize: '1rem',
    border: '1px solid var(--mdc-line-hard)', borderRadius: 10,
    background: 'var(--mdc-card-2)', color: 'var(--mdc-ink)',
  };
  const label: React.CSSProperties = {
    fontFamily: 'var(--mdc-font-display)', fontSize: '0.72rem',
    letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
  };

  async function ansetzen() {
    if (!lokal) return;
    setLaeuft('neu'); setFehler(null); setErfolg(null);
    try {
      const antwort = await setzeZusatzAn({ date, venueId, time, note });
      if (!antwort.ok) setFehler(antwort.fehler);
      else {
        setErfolg({
          text: `${lokal.name} · ${weekdayName(date)}, ${formatDate(date)} um ${formatTime(time || lokal.time)}`,
          url: antwort.url,
        });
        setNote('');
      }
    } catch (ausnahme) {
      // Eine Server-Aktion kann auch werfen statt zu antworten (Verbindung
      // weg, Neubau mitten im Aufruf). Dann darf die Seite nicht einfach
      // stehen bleiben, als wäre nichts passiert.
      setFehler(
        'Auf das Ansetzen ist keine Antwort gekommen. Bitte die Seite neu laden und '
        + 'nachsehen, ob der Termin trotzdem drinsteht. '
        + `(${ausnahme instanceof Error ? ausnahme.message : String(ausnahme)})`,
      );
    } finally {
      setLaeuft(null);
    }
  }

  async function zurueck(t: AngesetzterTermin) {
    if (!confirm(`„${t.venueName} am ${formatDate(t.date)}" wirklich zurücknehmen?`)) return;
    setLaeuft(t.id); setFehler(null); setErfolg(null);
    try {
      const antwort = await nimmZusatzZurueck(t.id);
      if (!antwort.ok) setFehler(antwort.fehler);
      else setErfolg({ text: `${t.venueName} am ${formatDate(t.date)} ist zurückgenommen.`, url: antwort.url });
    } catch (ausnahme) {
      setFehler(
        'Auf das Zurücknehmen ist keine Antwort gekommen. Bitte die Seite neu laden und nachsehen. '
        + `(${ausnahme instanceof Error ? ausnahme.message : String(ausnahme)})`,
      );
    } finally {
      setLaeuft(null);
    }
  }

  if (!darfAblegen) {
    return (
      <div className="mdc-card" style={{ padding: '20px', borderColor: 'var(--mdc-red-a35)' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>Noch nicht eingerichtet</h2>
        <p style={{ marginTop: 8, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Termine lassen sich gerade nicht ablegen. Es fehlt: {fehlt.join(', ') || 'die Anbindung'}.
          Bitte der Turnierleitung Bescheid sagen — ein Formular anzubieten, das nichts
          speichert, wäre eine leere Zusage.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fehler && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, minWidth: 0, overflowWrap: 'anywhere' }}>{fehler}</p>
        </div>
      )}

      {erfolg && (
        <div className="mdc-card mdc-card-accent" style={{ padding: '18px 20px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
            <Check size={18} style={{ color: 'var(--mdc-win)' }} />
            {erfolg.text}
          </p>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            In ein bis zwei Minuten steht es auf der Seite — in der Übersicht, beim Lokal und
            im Wochenplan. In der Liste hier unten erscheint es erst danach.
          </p>
          <a href={erfolg.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
            Was geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
          <CalendarPlus size={19} style={{ color: 'var(--mdc-red)' }} />
          Termin ansetzen
        </h2>

        <div style={{ display: 'grid', gap: 14, marginTop: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label>
            <span style={label}>Lokal</span>
            <select value={venueId} style={eingabe} onChange={e => setVenueId(e.target.value)}>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {lokal && (
              <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
                Fester Spieltag: {lokal.weekdayLabel}
              </span>
            )}
          </label>
          <label>
            <span style={label}>Tag</span>
            <input
              type="date" value={date} min={heute} max={maxDatum} style={{
                ...eingabe,
                borderColor: festerTag ? 'var(--mdc-red)' : 'var(--mdc-line-hard)',
              }}
              onChange={e => setDate(e.target.value)}
            />
            <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
              {date ? weekdayName(date) : '—'}
            </span>
          </label>
          <label>
            <span style={label}>Beginn</span>
            <input type="time" value={time} style={eingabe} onChange={e => setTime(e.target.value)} />
            <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
              Leer = wie sonst bei euch ({lokal ? formatTime(lokal.time) : '—'})
            </span>
          </label>
        </div>

        <label style={{ display: 'block', marginTop: 14 }}>
          <span style={label}>Hinweis (steht beim Termin auf der Seite)</span>
          <input
            value={note} maxLength={200} style={eingabe}
            placeholder="z. B. Sonntagsranking, Anmeldung bis 17:30"
            onChange={e => setNote(e.target.value)}
          />
        </label>

        {festerTag && lokal && (
          <p style={{ marginTop: 12, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-red-deep)' }}>
            <strong>An dem Tag ist bei euch ohnehin Ranking.</strong> Der Abend steht schon im
            Plan — angesetzt wird nur, was sonst nicht stattfindet.
          </p>
        )}

        <button
          type="button"
          className="mdc-btn mdc-btn-primary"
          style={{ marginTop: 16 }}
          disabled={laeuft !== null || !lokal || festerTag}
          onClick={ansetzen}
        >
          {laeuft === 'neu' ? <Loader2 size={16} className="mdc-spin" /> : <CalendarPlus size={16} />}
          {laeuft === 'neu' ? 'Wird abgelegt …' : 'Ansetzen'}
        </button>
      </div>

      <div className="mdc-card" style={{ padding: '20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>Schon angesetzt</h2>
        {termine.length === 0 ? (
          <p style={{ marginTop: 8, fontSize: '0.92rem', color: 'var(--mdc-ink-soft)' }}>
            Für die nächsten Wochen steht noch kein zusätzlicher Termin.
          </p>
        ) : (
          <ul style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {termine.map(t => (
              <li
                key={t.id}
                style={{
                  display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', borderTop: '1px solid var(--mdc-line)', paddingTop: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: '0.96rem' }}>{t.venueName}</strong>
                  <p style={{ fontSize: '0.86rem', color: 'var(--mdc-ink-soft)' }}>
                    {weekdayName(t.date)}, {formatDate(t.date)} · ab {formatTime(t.time)}
                    {t.note ? ` · ${t.note}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                  disabled={laeuft !== null}
                  onClick={() => zurueck(t)}
                >
                  {laeuft === t.id ? <Loader2 size={14} className="mdc-spin" /> : <RotateCcw size={14} />}
                  Zurücknehmen
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
