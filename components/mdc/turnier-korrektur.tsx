'use client';

// ============================================================
// MDC — hochgeladene Turniere berichtigen
// ============================================================
//
// Der Fall aus der Praxis: Beim 70er-Turnier stand nach dem Hochladen der
// 29.09. statt des 09.09. — das Datum war vom Zettel falsch gelesen und erst
// Tage später ist es aufgefallen. Bis dahin ging so etwas nur, indem jemand
// die Datei im Repository änderte.
//
// Änderbar sind Datum und Spielort, und nur bei Turnieren, die von der Seite
// selbst hochgeladen wurden. Was aus der Arbeitsmappe kommt, steht hier gar
// nicht erst zur Auswahl: Das käme beim nächsten Einlesen zurück.
//
// An der Ergebnisliste wird hier nichts gedreht. Stimmen Namen oder
// Reihenfolge nicht, gehört der Zettel noch einmal hochgeladen — dieselbe
// Kennung ersetzt die alte Zeile, und die Korrektur steht wieder neben dem
// Bild, aus dem sie stammt.
// ============================================================

import { useState } from 'react';
import {
  AlertTriangle, Check, ExternalLink, Loader2, PencilLine, Trash2,
} from 'lucide-react';
import {
  verschiebeHochgeladenesTurnier, entferneHochgeladenesTurnier,
} from '@/app/mdc/admin/ergebnis/actions';

export interface KorrekturTurnier {
  /** „2026-09-09-siebziger" */
  id: string;
  datum: string;
  spielortId: string;
  spielortName: string;
  starter: number;
  /** Sieger, für den Wiedererkennungswert in der Liste. */
  sieger: string;
}

export interface KorrekturVenue {
  id: string;
  name: string;
  weekday: string;
}

function tagName(datum: string): string {
  const tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return tage[new Date(`${datum}T12:00:00`).getDay()] ?? '';
}

function anzeige(datum: string): string {
  const [j, m, t] = datum.split('-');
  return `${t}.${m}.${j}`;
}

export function TurnierKorrektur({ turniere, venues, canPublish }: {
  turniere: KorrekturTurnier[];
  venues: KorrekturVenue[];
  canPublish: boolean;
}) {
  const [offen, setOffen] = useState<string | null>(null);
  const [datum, setDatum] = useState('');
  const [spielortId, setSpielortId] = useState('');
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ url: string; text: string } | null>(null);

  if (!turniere.length) return null;

  function aufmachen(t: KorrekturTurnier) {
    setOffen(t.id === offen ? null : t.id);
    setDatum(t.datum);
    setSpielortId(t.spielortId);
    setFehler(null);
    setErfolg(null);
  }

  async function schicke(
    marke: string,
    aktion: () => Promise<{ ok: true; url: string; turnier: string } | { ok: false; fehler: string }>,
    text: (turnier: string) => string,
  ) {
    setLaeuft(marke);
    setFehler(null);
    setErfolg(null);
    const antwort = await aktion();
    setLaeuft(null);
    if (!antwort.ok) { setFehler(antwort.fehler); return; }
    setErfolg({ url: antwort.url, text: text(antwort.turnier) });
    setOffen(null);
  }

  async function speichern(t: KorrekturTurnier) {
    await schicke(
      `speichern-${t.id}`,
      () => verschiebeHochgeladenesTurnier({
        altesDatum: t.datum,
        alterSpielortId: t.spielortId,
        datum,
        spielortId,
      }),
      turnier => `Turnier berichtigt: ${turnier}`,
    );
  }

  async function entfernen(t: KorrekturTurnier) {
    if (!window.confirm(
      `${t.spielortName} am ${anzeige(t.datum)} wirklich entfernen?\n\n`
      + `Die Punkte der ${t.starter} Starter zählen dann nicht mehr in der Wertung. `
      + 'Rückgängig geht das nur, indem der Zettel noch einmal hochgeladen wird.',
    )) return;
    await schicke(
      `weg-${t.id}`,
      () => entferneHochgeladenesTurnier({ datum: t.datum, spielortId: t.spielortId }),
      turnier => `Turnier entfernt: ${turnier}`,
    );
  }

  return (
    <div className="mdc-card" style={{ padding: '22px 20px' }}>
      <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
        <PencilLine size={19} style={{ color: 'var(--mdc-red)' }} />
        Hochgeladene Turniere berichtigen
      </h2>
      <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)', maxWidth: 640 }}>
        Falsches Datum vom Zettel gelesen, falsches Lokal ausgewählt? Hier lässt sich beides
        geraderücken, ohne den Zettel noch einmal zu fotografieren. Es stehen nur Turniere in
        der Liste, die über diese Seite hochgeladen wurden — was aus der Arbeitsmappe kommt,
        wird dort geändert.
      </p>
      <p style={{ marginTop: 8, fontSize: '0.86rem', lineHeight: 1.7, color: 'var(--mdc-ink-dim)', maxWidth: 640 }}>
        <strong>An der Ergebnisliste ändert das nichts.</strong> Stimmen Namen oder Reihenfolge
        nicht, den Zettel einfach noch einmal hochladen — dasselbe Datum und Lokal ersetzt die
        alte Fassung.
      </p>

      {fehler && (
        <div
          className="mdc-card"
          style={{ marginTop: 16, padding: '14px 16px', display: 'flex', gap: 12, borderColor: 'var(--mdc-red-a35)' }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {erfolg && (
        <div className="mdc-card mdc-card-accent" style={{ marginTop: 16, padding: '16px 18px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
            <Check size={18} style={{ color: 'var(--mdc-win)' }} />
            {erfolg.text}
          </p>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            Die Seite baut sich neu; in ein bis zwei Minuten steht es überall richtig. Die Liste
            hier zeigt es erst nach dem Neubau.
          </p>
          <a
            href={erfolg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mdc-btn mdc-btn-ghost mdc-btn-sm"
            style={{ marginTop: 12 }}
          >
            Was geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {turniere.map(t => (
          <div
            key={t.id}
            style={{
              padding: '12px 14px', borderRadius: 9,
              border: '1px solid var(--mdc-line)',
              background: offen === t.id ? 'var(--mdc-tint)' : 'var(--mdc-card-2)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <span style={{ flex: 1, minWidth: 200, fontSize: '0.92rem' }}>
                <strong>{t.spielortName}</strong>
                {' · '}
                <span className="mdc-num">{anzeige(t.datum)}</span>
                {' · '}{tagName(t.datum)}
                <span style={{ display: 'block', marginTop: 3, fontSize: '0.83rem', color: 'var(--mdc-ink-dim)' }}>
                  {t.starter} Starter · Sieger {t.sieger}
                </span>
              </span>

              <button
                type="button"
                className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                onClick={() => aufmachen(t)}
                disabled={!canPublish || laeuft !== null}
              >
                <PencilLine size={14} />
                {offen === t.id ? 'Zuklappen' : 'Ändern'}
              </button>
            </div>

            {offen === t.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--mdc-line)' }}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <label>
                    <span style={labelStil}>Datum</span>
                    <input
                      type="date"
                      value={datum}
                      onChange={e => setDatum(e.target.value)}
                      style={eingabeStil}
                    />
                  </label>
                  <label>
                    <span style={labelStil}>Spielort</span>
                    <select
                      value={spielortId}
                      onChange={e => setSpielortId(e.target.value)}
                      style={eingabeStil}
                    >
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>{v.name} · {v.weekday}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {datum !== t.datum && (
                  <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--mdc-ink-soft)' }}>
                    {anzeige(t.datum)} ({tagName(t.datum)}) → <strong>{anzeige(datum)}</strong>
                    {datum ? ` (${tagName(datum)})` : ''}
                  </p>
                )}

                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button
                    type="button"
                    className="mdc-btn mdc-btn-primary mdc-btn-sm"
                    onClick={() => speichern(t)}
                    disabled={
                      laeuft !== null
                      || !datum
                      || (datum === t.datum && spielortId === t.spielortId)
                    }
                  >
                    {laeuft === `speichern-${t.id}`
                      ? <><Loader2 size={14} className="mdc-spin" /> Wird abgelegt …</>
                      : <><Check size={14} /> Änderung ablegen</>}
                  </button>
                  <button
                    type="button"
                    className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                    onClick={() => entfernen(t)}
                    disabled={laeuft !== null}
                  >
                    {laeuft === `weg-${t.id}`
                      ? <Loader2 size={14} className="mdc-spin" />
                      : <Trash2 size={14} />}
                    Turnier entfernen
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStil: React.CSSProperties = {
  fontFamily: 'var(--mdc-font-display)', fontSize: '0.72rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
};

const eingabeStil: React.CSSProperties = {
  marginTop: 6, width: '100%', padding: '9px 11px', fontSize: '0.95rem',
  border: '1px solid var(--mdc-line-hard)', borderRadius: 9,
  background: 'var(--mdc-card)', color: 'var(--mdc-ink)', fontFamily: 'inherit',
};
