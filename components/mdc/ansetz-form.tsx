'use client';

// ============================================================
// MDC — „Ranking ansetzen oder absagen" für die Wirte
// ============================================================
//
// Bewusst viel kleiner als der Kalender der Turnierleitung: ein Formular, eine
// Liste, sonst nichts. Wer das hier benutzt, steht im Lokal am Handy — mal um
// einen Samstagabend einzutragen, mal um den heutigen abzusagen, weil im Lokal
// eine Veranstaltung ist. Kein Verwaltungsbereich zum Erkunden.
//
// ZWEI DINGE, EIN FORMULAR (Absagen seit 09.11.2026, vom Betreiber angewiesen):
// Umgeschaltet wird mit zwei Knöpfen oben, nicht mit zwei Karten untereinander
// — am Handy sähe man die zweite sonst gar nicht.
//
// Der Unterschied steckt im Datumsfeld, und zwar mit Absicht:
//
//   Ansetzen  → freies Datum. Ein Zusatztermin kann auf jeden Tag fallen, an
//               dem bei dem Lokal NICHT ohnehin gespielt wird.
//   Absagen   → Auswahl aus den festen Abenden dieses Lokals. Abgesagt werden
//               kann nur, was auch stattfindet; ein freies Feld lüde dazu ein,
//               einen Tag zu erwischen, an dem es nichts abzusagen gibt — die
//               Aktion lehnte das ab, aber erst nach dem Tippen.
// ============================================================

import { useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarOff, CalendarPlus, Check, ExternalLink, Loader2, RotateCcw,
} from 'lucide-react';
import { formatDate, formatTime, weekdayName } from '@/lib/mdc/format';
import { setzeZusatzAn, sageRankingAb, nimmZurueck } from '@/app/mdc/admin/ansetzen/actions';

export interface AnsetzVenue {
  id: string;
  name: string;
  time: string;
  /** Wochentage, an denen dort ohnehin gespielt wird (1 = Mo … 7 = So). */
  weekdays: number[];
  weekdayLabel: string;
  /**
   * Die nächsten festen Abende dieses Lokals — daraus wird beim Absagen
   * gewählt. Schon abgesagte stehen mit drin, damit man sieht, dass es
   * erledigt ist, statt ein zweites Mal abzusagen.
   */
  spieltage: { date: string; abgesagt: boolean }[];
}

export interface AngesetzterTermin {
  id: string;
  date: string;
  /** „zusatz" = selbst angesetzt, „absage" = abgesagter Abend. */
  art: 'zusatz' | 'absage';
  venueName: string;
  time: string;
  note: string | null;
}

/** 1 = Montag … 7 = Sonntag, passend zu den Spielorten. */
function wochentagVon(iso: string): number {
  const tag = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return tag === 0 ? 7 : tag;
}

type Modus = 'ansetzen' | 'absagen';

export function AnsetzForm({ venues, termine, heute, maxDatum, darfAblegen, fehlt }: {
  venues: AnsetzVenue[];
  /** Schon eingetragene Termine und Absagen ab heute — aus dem letzten Neubau. */
  termine: AngesetzterTermin[];
  heute: string;
  /** Weiter voraus nimmt die Seite nichts an. */
  maxDatum: string;
  darfAblegen: boolean;
  fehlt: string[];
}) {
  const [modus, setModus] = useState<Modus>('ansetzen');
  const [date, setDate] = useState(heute);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [absageTag, setAbsageTag] = useState('');
  const [grund, setGrund] = useState('');
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ text: string; url: string } | null>(null);

  const lokal = useMemo(() => venues.find(v => v.id === venueId), [venues, venueId]);

  // Dieselbe Prüfung macht der Server noch einmal — hier steht sie, damit man
  // es sieht, BEVOR man auf „Ansetzen" tippt.
  const festerTag = !!lokal && lokal.weekdays.includes(wochentagVon(date));

  /** Die noch offenen Abende des Lokals — abgesagte stehen mit drin, gesperrt. */
  const spieltage = lokal?.spieltage ?? [];
  const gewaehlterAbend = spieltage.find(t => t.date === absageTag);

  const eingabe: React.CSSProperties = {
    marginTop: 6, width: '100%', padding: '10px 12px', fontSize: '1rem',
    border: '1px solid var(--mdc-line-hard)', borderRadius: 10,
    background: 'var(--mdc-card-2)', color: 'var(--mdc-ink)',
  };
  const label: React.CSSProperties = {
    fontFamily: 'var(--mdc-font-display)', fontSize: '0.72rem',
    letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
  };

  /** Lokal wechseln setzt die Abend-Auswahl zurück — sie gehört zum Lokal. */
  function waehleLokal(id: string) {
    setVenueId(id);
    setAbsageTag('');
  }

  function wechsle(zu: Modus) {
    setModus(zu);
    setFehler(null);
    setErfolg(null);
  }

  /**
   * Eine Server-Aktion kann auch werfen statt zu antworten (Verbindung weg,
   * Neubau mitten im Aufruf). Dann darf die Seite nicht einfach stehen
   * bleiben, als wäre nichts passiert.
   */
  function keineAntwort(was: string, ausnahme: unknown): string {
    return `Auf ${was} ist keine Antwort gekommen. Bitte die Seite neu laden und nachsehen, `
      + 'ob es trotzdem drinsteht. '
      + `(${ausnahme instanceof Error ? ausnahme.message : String(ausnahme)})`;
  }

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
      setFehler(keineAntwort('das Ansetzen', ausnahme));
    } finally {
      setLaeuft(null);
    }
  }

  async function absagen() {
    if (!lokal || !absageTag) return;
    setLaeuft('absage'); setFehler(null); setErfolg(null);
    try {
      const antwort = await sageRankingAb({ date: absageTag, venueId, grund });
      if (!antwort.ok) setFehler(antwort.fehler);
      else {
        setErfolg({
          text: `${lokal.name} · ${weekdayName(absageTag)}, ${formatDate(absageTag)} — abgesagt`,
          url: antwort.url,
        });
        setGrund('');
        setAbsageTag('');
      }
    } catch (ausnahme) {
      setFehler(keineAntwort('die Absage', ausnahme));
    } finally {
      setLaeuft(null);
    }
  }

  async function zurueck(t: AngesetzterTermin) {
    const was = t.art === 'absage' ? 'Die Absage für' : 'Den Termin';
    if (!confirm(`${was} „${t.venueName} am ${formatDate(t.date)}" wirklich zurücknehmen?`)) return;
    setLaeuft(t.id); setFehler(null); setErfolg(null);
    try {
      const antwort = await nimmZurueck(t.id);
      if (!antwort.ok) setFehler(antwort.fehler);
      else {
        setErfolg({
          text: t.art === 'absage'
            ? `${t.venueName} am ${formatDate(t.date)} findet wieder statt.`
            : `${t.venueName} am ${formatDate(t.date)} ist zurückgenommen.`,
          url: antwort.url,
        });
      }
    } catch (ausnahme) {
      setFehler(keineAntwort('das Zurücknehmen', ausnahme));
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

      {/* Umschalter. Zwei Knöpfe, kein Reiter-Gebastel: am Handy muss man
          sehen, was es überhaupt gibt. */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`mdc-btn ${modus === 'ansetzen' ? 'mdc-btn-primary' : 'mdc-btn-ghost'}`}
          disabled={laeuft !== null}
          onClick={() => wechsle('ansetzen')}
        >
          <CalendarPlus size={16} />
          Termin ansetzen
        </button>
        <button
          type="button"
          className={`mdc-btn ${modus === 'absagen' ? 'mdc-btn-primary' : 'mdc-btn-ghost'}`}
          disabled={laeuft !== null}
          onClick={() => wechsle('absagen')}
        >
          <CalendarOff size={16} />
          Ranking absagen
        </button>
      </div>

      {modus === 'ansetzen' ? (
        <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <CalendarPlus size={19} style={{ color: 'var(--mdc-red)' }} />
            Termin ansetzen
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            Für einen Abend, an dem bei euch sonst kein Ranking ist — Freitag, Samstag, Sonntag
            oder was ihr verabredet.
          </p>

          <div style={{ display: 'grid', gap: 14, marginTop: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <label>
              <span style={label}>Lokal</span>
              <select value={venueId} style={eingabe} onChange={e => waehleLokal(e.target.value)}>
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
              Plan — angesetzt wird nur, was sonst nicht stattfindet. Fällt er aus, dann oben
              auf <em>Ranking absagen</em>.
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
      ) : (
        <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <CalendarOff size={19} style={{ color: 'var(--mdc-red)' }} />
            Ranking absagen
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            Fällt ein Abend aus — Veranstaltung, Feiertag, geschlossen? Hier absagen. Der Termin
            bleibt auf der Seite stehen, durchgestrichen und mit dem Grund daneben: Wer schon
            losfahren wollte, soll sehen, warum nicht.
          </p>

          <div style={{ display: 'grid', gap: 14, marginTop: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <label>
              <span style={label}>Lokal</span>
              <select value={venueId} style={eingabe} onChange={e => waehleLokal(e.target.value)}>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {lokal && (
                <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
                  Fester Spieltag: {lokal.weekdayLabel}
                </span>
              )}
            </label>
            <label>
              <span style={label}>Welcher Abend</span>
              <select value={absageTag} style={eingabe} onChange={e => setAbsageTag(e.target.value)}>
                <option value="">— bitte auswählen —</option>
                {spieltage.map(t => (
                  <option key={t.date} value={t.date} disabled={t.abgesagt}>
                    {weekdayName(t.date)}, {formatDate(t.date)}
                    {t.abgesagt ? ' · schon abgesagt' : ''}
                  </option>
                ))}
              </select>
              <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
                Nur die festen Abende des Lokals, vier Monate voraus
              </span>
            </label>
          </div>

          <label style={{ display: 'block', marginTop: 14 }}>
            <span style={label}>Warum (steht auf der Seite)</span>
            <input
              value={grund} maxLength={200} style={eingabe}
              placeholder="z. B. Veranstaltung im Lokal"
              onChange={e => setGrund(e.target.value)}
            />
            <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
              Bitte wirklich kurz dazuschreiben — „fällt aus&ldquo; allein lässt jeden rätseln.
            </span>
          </label>

          {spieltage.length === 0 && lokal && (
            <p style={{ marginTop: 12, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-ink-soft)' }}>
              Für das <strong>{lokal.name}</strong> steht in den nächsten vier Monaten kein fester
              Abend im Plan. Geht es um einen Abend, den ihr selbst angesetzt habt, steht er unten
              in der Liste und lässt sich dort zurücknehmen.
            </p>
          )}

          {gewaehlterAbend?.abgesagt && (
            <p style={{ marginTop: 12, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-red-deep)' }}>
              Dieser Abend ist schon abgesagt.
            </p>
          )}

          <button
            type="button"
            className="mdc-btn mdc-btn-primary"
            style={{ marginTop: 16 }}
            disabled={
              laeuft !== null || !lokal || !absageTag
              || !!gewaehlterAbend?.abgesagt || grund.trim().length < 3
            }
            onClick={absagen}
          >
            {laeuft === 'absage' ? <Loader2 size={16} className="mdc-spin" /> : <CalendarOff size={16} />}
            {laeuft === 'absage' ? 'Wird abgelegt …' : 'Absagen'}
          </button>
        </div>
      )}

      <div className="mdc-card" style={{ padding: '20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>Schon eingetragen</h2>
        {termine.length === 0 ? (
          <p style={{ marginTop: 8, fontSize: '0.92rem', color: 'var(--mdc-ink-soft)' }}>
            Für die nächsten Wochen steht kein zusätzlicher Termin und keine Absage.
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
                  <strong style={{ fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {t.venueName}
                    <span style={{
                      fontFamily: 'var(--mdc-font-display)', fontSize: '0.64rem',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      padding: '2px 7px', borderRadius: 999,
                      border: '1px solid var(--mdc-line-hard)',
                      color: t.art === 'absage' ? 'var(--mdc-red-deep)' : 'var(--mdc-ink-dim)',
                    }}>
                      {t.art === 'absage' ? 'Abgesagt' : 'Angesetzt'}
                    </span>
                  </strong>
                  <p style={{ fontSize: '0.86rem', color: 'var(--mdc-ink-soft)' }}>
                    {weekdayName(t.date)}, {formatDate(t.date)}
                    {t.art === 'absage' ? '' : ` · ab ${formatTime(t.time)}`}
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
