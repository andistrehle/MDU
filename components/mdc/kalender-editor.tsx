'use client';

// ============================================================
// MDC — Kalender bearbeiten
// ============================================================
//
// Zwei Wege, weil es zwei Fälle gibt:
//
//   1. Der Plan der nächsten Wochen steht als Liste da. Neben jedem Termin ein
//      Knopf „Fällt aus" — das ist der häufige Fall und soll ein Klick sein,
//      kein Formular.
//   2. Darunter ein kleines Formular für alles, was NICHT im Plan steht: das
//      Lokal, das einspringt, und das spontane Turnier am Wochenende.
//
// Der Spielort ist immer eines der elf MDC-Lokale. Freie Eingabe gibt es
// bewusst nicht — gespielt wird nur dort, und ein hingeschriebener Name hätte
// keine Adresse, keine Karte und keine Spielort-Seite.
// ============================================================

import { useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarPlus, Check, ExternalLink, Loader2, RotateCcw, X,
} from 'lucide-react';
import type { Terminaenderung } from '@/data/kalender';
import { formatDate, formatTime, weekdayName } from '@/lib/mdc/format';
import { speichereAenderung, entferneAenderung } from '@/app/mdc/admin/kalender/actions';

export interface KalenderStatus {
  canPublish: boolean;
  missing: string[];
}

export interface KalenderVenue {
  id: string;
  name: string;
  time: string;
  /** Wochentage, an denen dort regulär gespielt wird (1 = Mo … 7 = So). */
  weekdays: number[];
}

export interface KalenderTermin {
  date: string;
  venueId: string;
  venueName: string;
  time: string;
  zusatz: boolean;
  abgesagt: boolean;
  note: string | null;
  /** Kennung der Änderung, falls es eine gibt — zum Zurücknehmen. */
  aenderungId: string | null;
}

export function KalenderEditor({ plan, aenderungen, venues, heute, status }: {
  plan: KalenderTermin[];
  aenderungen: Terminaenderung[];
  venues: KalenderVenue[];
  heute: string;
  status: KalenderStatus;
}) {
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ url: string; text: string } | null>(null);

  const [neu, setNeu] = useState({
    date: heute,
    venueId: venues[0]?.id ?? '',
    time: '',
    note: '',
  });

  const gewaehlt = venues.find(v => v.id === neu.venueId);

  /** Nach Tag gruppiert, damit der Plan sich wie ein Kalender liest. */
  const tage = useMemo(() => {
    const map = new Map<string, KalenderTermin[]>();
    for (const t of plan) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [plan]);

  async function absagen(t: KalenderTermin) {
    const grund = window.prompt(
      `Warum fällt das Ranking am ${formatDate(t.date)} im ${t.venueName} aus?\n`
      + 'Der Grund steht auf der Seite beim Termin. Leer lassen geht auch.',
      '',
    );
    // Abbrechen im Dialog gibt null zurück — dann passiert nichts.
    if (grund === null) return;
    await schicke(
      `absage-${t.date}-${t.venueId}`,
      () => speichereAenderung({ date: t.date, venueId: t.venueId, art: 'absage', note: grund }),
      `${t.venueName} am ${formatDate(t.date)} abgesagt`,
    );
  }

  async function zuruecknehmen(id: string, was: string) {
    if (!window.confirm(`„${was}" zurücknehmen? Danach gilt wieder der normale Plan.`)) return;
    await schicke(`weg-${id}`, () => entferneAenderung(id), `${was} zurückgenommen`);
  }

  async function ansetzen() {
    if (!gewaehlt) return;
    await schicke(
      'neu',
      () => speichereAenderung({
        date: neu.date, venueId: neu.venueId, art: 'zusatz',
        time: neu.time, note: neu.note,
      }),
      `Zusatztermin im ${gewaehlt.name} am ${formatDate(neu.date)}`,
    );
    setNeu(n => ({ ...n, time: '', note: '' }));
  }

  async function schicke(
    marke: string,
    aktion: () => Promise<{ ok: true; url: string } | { ok: false; fehler: string }>,
    text: string,
  ) {
    setLaeuft(marke);
    setFehler(null);
    setErfolg(null);
    const antwort = await aktion();
    setLaeuft(null);
    if (!antwort.ok) { setFehler(antwort.fehler); return; }
    setErfolg({ url: antwort.url, text });
  }

  if (!status.canPublish) {
    return (
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Noch nicht eingerichtet</h2>
        <p style={{ marginTop: 8, fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Terminänderungen werden wie die Ergebnisse im Repository abgelegt. Dafür fehlt
          die Zugangsdatei:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 18, listStyle: 'disc', lineHeight: 1.8 }}>
          {status.missing.map(m => <li key={m}><code>{m}</code></li>)}
        </ul>
      </div>
    );
  }

  const eingabe: React.CSSProperties = {
    marginTop: 6, width: '100%', padding: '10px 12px', fontSize: '1rem',
    border: '1px solid var(--mdc-line-hard)', borderRadius: 10,
    background: 'var(--mdc-card-2)', color: 'var(--mdc-ink)',
  };
  const label: React.CSSProperties = {
    fontFamily: 'var(--mdc-font-display)', fontSize: '0.72rem',
    letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fehler && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {erfolg && (
        <div className="mdc-card mdc-card-accent" style={{ padding: '18px 20px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
            <Check size={18} style={{ color: 'var(--mdc-win)' }} />
            {erfolg.text}
          </p>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            Die Seite baut sich neu; in ein bis zwei Minuten steht es im Plan. Die Liste hier
            zeigt es erst nach dem Neubau.
          </p>
          <a href={erfolg.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
            Was geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* ── Zusatztermin ansetzen ── */}
      <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
          <CalendarPlus size={19} style={{ color: 'var(--mdc-red)' }} />
          Termin ansetzen
        </h2>
        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Für alles, was nicht im festen Plan steht: das Lokal, das für ein ausgefallenes
          einspringt, und das Turnier am Freitag, Samstag oder Sonntag. Jeder Tag ist
          möglich, auch einer, an dem das Lokal sonst nicht spielt.
        </p>

        <div style={{ display: 'grid', gap: 14, marginTop: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label>
            <span style={label}>Tag</span>
            <input
              type="date" value={neu.date} style={eingabe}
              onChange={e => setNeu({ ...neu, date: e.target.value })}
            />
          </label>
          <label>
            <span style={label}>Spielort</span>
            <select
              value={neu.venueId} style={eingabe}
              onChange={e => setNeu({ ...neu, venueId: e.target.value })}
            >
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <label>
            <span style={label}>Uhrzeit</span>
            <input
              type="time" value={neu.time} style={eingabe}
              placeholder={gewaehlt?.time ?? ''}
              onChange={e => setNeu({ ...neu, time: e.target.value })}
            />
            <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
              Leer = wie sonst dort ({gewaehlt ? formatTime(gewaehlt.time) : '—'})
            </span>
          </label>
        </div>

        <label style={{ display: 'block', marginTop: 14 }}>
          <span style={label}>Hinweis (steht beim Termin auf der Seite)</span>
          <input
            value={neu.note} maxLength={200} style={eingabe}
            placeholder="z. B. Vertretung fürs Fiakerstüberl"
            onChange={e => setNeu({ ...neu, note: e.target.value })}
          />
        </label>

        <button
          type="button"
          className="mdc-btn mdc-btn-primary"
          style={{ marginTop: 16 }}
          disabled={laeuft !== null || !gewaehlt}
          onClick={ansetzen}
        >
          {laeuft === 'neu'
            ? <><Loader2 size={16} className="mdc-spin" /> Wird abgelegt …</>
            : <><CalendarPlus size={16} /> Termin ansetzen</>}
        </button>
      </div>

      {/* ── Der Plan der nächsten Wochen ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Die nächsten drei Wochen</h2>
        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          So steht der Plan gerade auf der Seite. Fällt etwas aus, hier absagen — der Termin
          bleibt dann sichtbar, aber durchgestrichen und mit dem Grund dahinter.
        </p>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {tage.map(([datum, termine]) => (
            <div key={datum}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="mdc-display" style={{ fontSize: '1rem' }}>
                  {datum === heute ? 'Heute' : weekdayName(datum)}
                </span>
                <span className="mdc-num" style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
                  {formatDate(datum)}
                </span>
              </div>

              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {termine.map(t => (
                  <div
                    key={`${t.venueId}-${t.zusatz}`}
                    style={{
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 9,
                      border: '1px solid var(--mdc-line)',
                      background: t.abgesagt ? 'var(--mdc-tint)' : 'var(--mdc-card-2)',
                    }}
                  >
                    <span
                      className="mdc-num"
                      style={{ minWidth: 52, color: 'var(--mdc-red)', fontWeight: 700 }}
                    >
                      {formatTime(t.time)}
                    </span>
                    <span style={{ flex: 1, minWidth: 120, fontWeight: 600 }}>
                      {/* Durchgestrichen wird nur der Name, nicht der Grund —
                          der soll ja lesbar bleiben. */}
                      <span
                        style={{
                          textDecoration: t.abgesagt ? 'line-through' : undefined,
                          color: t.abgesagt ? 'var(--mdc-ink-dim)' : undefined,
                        }}
                      >
                        {t.venueName}
                      </span>
                      {t.zusatz && <span className="mdc-chip mdc-chip-red" style={{ marginLeft: 8 }}>Zusatz</span>}
                      {t.note && (
                        <span style={{ display: 'block', marginTop: 3, fontWeight: 400, fontSize: '0.83rem', color: 'var(--mdc-ink-dim)' }}>
                          {t.note}
                        </span>
                      )}
                    </span>

                    {t.aenderungId ? (
                      <button
                        type="button"
                        className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                        disabled={laeuft !== null}
                        onClick={() => zuruecknehmen(
                          t.aenderungId as string,
                          `${t.abgesagt ? 'Absage' : 'Zusatztermin'} ${t.venueName} am ${formatDate(t.date)}`,
                        )}
                      >
                        {laeuft === `weg-${t.aenderungId}`
                          ? <Loader2 size={14} className="mdc-spin" />
                          : <RotateCcw size={14} />}
                        Zurücknehmen
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                        disabled={laeuft !== null}
                        onClick={() => absagen(t)}
                      >
                        {laeuft === `absage-${t.date}-${t.venueId}`
                          ? <Loader2 size={14} className="mdc-spin" />
                          : <X size={14} />}
                        Fällt aus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alles, was gerade vom Plan abweicht ── */}
      {aenderungen.length > 0 && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Eingetragene Änderungen</h2>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Auch die aus der Vergangenheit — sie erklären, warum an einem Tag etwas anders
            war. Wegräumen kannst du sie jederzeit.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aenderungen.map(a => {
              const name = venues.find(v => v.id === a.venueId)?.name ?? a.venueId;
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 9,
                    border: '1px solid var(--mdc-line)', background: 'var(--mdc-card-2)',
                  }}
                >
                  <span className={`mdc-chip ${a.art === 'absage' ? '' : 'mdc-chip-red'}`}>
                    {a.art === 'absage' ? 'Absage' : 'Zusatz'}
                  </span>
                  <span style={{ flex: 1, minWidth: 160, fontSize: '0.9rem' }}>
                    <span className="mdc-num">{formatDate(a.date)}</span> · {name}
                    {a.time && <> · {formatTime(a.time)}</>}
                    {a.note && (
                      <span style={{ display: 'block', marginTop: 3, fontSize: '0.83rem', color: 'var(--mdc-ink-dim)' }}>
                        {a.note}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                    disabled={laeuft !== null}
                    onClick={() => zuruecknehmen(a.id, `${a.art === 'absage' ? 'Absage' : 'Zusatztermin'} ${name} am ${formatDate(a.date)}`)}
                  >
                    {laeuft === `weg-${a.id}` ? <Loader2 size={14} className="mdc-spin" /> : <RotateCcw size={14} />}
                    Zurücknehmen
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
