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
// Änderbar sind Datum, Spielort UND — seit 25.09.2026 — die Spieler der
// einzelnen Plätze. Nur bei Turnieren, die von der Seite selbst hochgeladen
// wurden. Was aus der Arbeitsmappe kommt, steht hier gar nicht erst zur
// Auswahl: Das käme beim nächsten Einlesen zurück.
//
// DIE PUNKTE HÄNGEN AM PLATZ. Wer einen Platz räumt, verliert die Punkte
// dieses Turniers; wer ihn einnimmt, bekommt genau sie. Das ist keine
// Erfindung dieser Maske, sondern der Punkteschlüssel selbst — er rechnet aus
// Platz und Feldgröße, nicht aus dem Namen.
//
// Die ZAHL der Plätze bleibt. An ihr hängt die Feldgröße und damit jede
// einzelne Punktzahl des Abends; ein Starter mehr oder weniger rechnet alles
// neu. Dafür gehört der Zettel noch einmal hochgeladen — dieselbe Kennung
// ersetzt die alte Zeile, und die Korrektur steht wieder neben dem Bild, aus
// dem sie stammt.
//
// Zwei getrennte Knöpfe, weil es zwei verschiedene Berichtigungen sind: Der
// eine schiebt das Turnier, der andere tauscht Menschen aus. Jede wird für
// sich abgelegt und ist damit einzeln nachlesbar.
// ============================================================

import { useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, Check, ExternalLink, Loader2, PencilLine, Trash2, Users,
} from 'lucide-react';
import {
  verschiebeHochgeladenesTurnier, entferneHochgeladenesTurnier, berichtigeTurnierSpieler,
} from '@/app/mdc/admin/ergebnis/actions';
import { SpielerWahl, type UploadSpieler } from '@/components/mdc/spieler-wahl';
import { rankGroupLabel } from '@/lib/mdc/points';

export interface KorrekturZeile {
  passNr: number;
  punkte: number;
  /** Wie der Mensch heute heißt — `null`, wenn die Nummer zu keinem gehört. */
  name: string | null;
}

export interface KorrekturTurnier {
  /** „2026-09-09-siebziger" */
  id: string;
  datum: string;
  spielortId: string;
  spielortName: string;
  starter: number;
  /** Sieger, für den Wiedererkennungswert in der Liste. */
  sieger: string;
  /** Die Ergebnisliste in Platzreihenfolge. */
  zeilen: KorrekturZeile[];
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

export function TurnierKorrektur({ turniere, venues, spieler, canPublish }: {
  turniere: KorrekturTurnier[];
  venues: KorrekturVenue[];
  /** Für die Suche beim Austauschen. */
  spieler: UploadSpieler[];
  canPublish: boolean;
}) {
  const [offen, setOffen] = useState<string | null>(null);
  const [datum, setDatum] = useState('');
  const [spielortId, setSpielortId] = useState('');
  /** Die Passnummern in Platzreihenfolge, wie sie gerade am Bildschirm stehen. */
  const [liste, setListe] = useState<number[]>([]);
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ url: string; text: string } | null>(null);

  if (!turniere.length) return null;

  function aufmachen(t: KorrekturTurnier) {
    setOffen(t.id === offen ? null : t.id);
    setDatum(t.datum);
    setSpielortId(t.spielortId);
    setListe(t.zeilen.map(z => z.passNr));
    setFehler(null);
    setErfolg(null);
  }

  /** Platz `index` bekommt einen anderen Menschen — die Punkte bleiben liegen. */
  function setzeSpieler(index: number, passNr: number | null) {
    if (passNr === null) return;
    setListe(alt => alt.map((n, i) => (i === index ? passNr : n)));
  }

  /** Zwei Plätze tauschen. Die Punkte wandern NICHT mit — sie hängen am Platz. */
  function verschiebe(index: number, richtung: -1 | 1) {
    const ziel = index + richtung;
    if (ziel < 0 || ziel >= liste.length) return;
    setListe(alt => {
      const neu = [...alt];
      [neu[index], neu[ziel]] = [neu[ziel], neu[index]];
      return neu;
    });
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

  async function spielerAblegen(t: KorrekturTurnier) {
    await schicke(
      `spieler-${t.id}`,
      () => berichtigeTurnierSpieler({
        datum: t.datum,
        spielortId: t.spielortId,
        passNummern: liste,
      }),
      turnier => `Ergebnisliste berichtigt: ${turnier}`,
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
        <strong>Auch die Spieler einzelner Plätze</strong> lassen sich hier austauschen. Die
        Punkte hängen dabei am Platz: Wer herausfällt, verliert die Punkte dieses Turniers, wer
        hereinkommt, bekommt genau sie. Nur die <strong>Zahl</strong> der Plätze bleibt — an ihr
        hängt die Feldgröße und damit jede Punktzahl des Abends. Fehlt oder steht jemand zu viel
        in der Liste, den Zettel noch einmal hochladen; dasselbe Datum und Lokal ersetzt die alte
        Fassung.
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

                {/* ── Die Ergebnisliste ──
                    Jeder Platz behält seine Punkte; gewechselt wird nur, wer
                    dort steht. Deshalb steht die Punktzahl fest neben dem Platz
                    und nicht neben dem Namen. */}
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--mdc-line)' }}>
                  <h3
                    className="mdc-display"
                    style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Users size={16} style={{ color: 'var(--mdc-red)' }} />
                    Spieler austauschen
                  </h3>
                  <p style={{ marginTop: 6, fontSize: '0.84rem', lineHeight: 1.65, color: 'var(--mdc-ink-dim)' }}>
                    {t.starter} Plätze. Die Punkte daneben bleiben, wo sie sind — sie gehören zum
                    Platz, nicht zum Namen.
                  </p>

                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {liste.map((passNr, i) => {
                      const vorher = t.zeilen[i];
                      const gewechselt = passNr !== vorher.passNr;
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap',
                            padding: '8px 10px', borderRadius: 9,
                            background: gewechselt ? 'var(--mdc-blue-a08)' : undefined,
                          }}
                        >
                          <span
                            className="mdc-display"
                            style={{ minWidth: 54, paddingTop: 8, fontSize: '0.95rem', color: 'var(--mdc-navy)' }}
                          >
                            {rankGroupLabel(i + 1)}
                          </span>

                          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
                            <SpielerWahl
                              spieler={spieler}
                              passNr={passNr}
                              beschriftung={`Spieler auf Platz ${i + 1}`}
                              onWaehlen={nr => setzeSpieler(i, nr)}
                            />
                            {gewechselt && (
                              <p style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--mdc-ink-dim)' }}>
                                vorher: {vorher.name ?? `Passnr. ${vorher.passNr}`}
                              </p>
                            )}
                          </div>

                          <span
                            className="mdc-num"
                            style={{ minWidth: 46, textAlign: 'right', paddingTop: 8, color: 'var(--mdc-red)', fontWeight: 700 }}
                          >
                            {vorher.punkte}
                          </span>

                          <span style={{ display: 'flex', gap: 4, paddingTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => verschiebe(i, -1)}
                              disabled={i === 0 || laeuft !== null}
                              className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                              aria-label={`Platz ${i + 1} nach oben`}
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => verschiebe(i, 1)}
                              disabled={i === liste.length - 1 || laeuft !== null}
                              className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                              aria-label={`Platz ${i + 1} nach unten`}
                            >
                              <ArrowDown size={13} />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn-primary mdc-btn-sm"
                      onClick={() => spielerAblegen(t)}
                      disabled={
                        laeuft !== null
                        || liste.every((n, i) => n === t.zeilen[i].passNr)
                      }
                    >
                      {laeuft === `spieler-${t.id}`
                        ? <><Loader2 size={14} className="mdc-spin" /> Wird abgelegt …</>
                        : <><Check size={14} /> Spieler berichtigen</>}
                    </button>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                      onClick={() => setListe(t.zeilen.map(z => z.passNr))}
                      disabled={laeuft !== null || liste.every((n, i) => n === t.zeilen[i].passNr)}
                    >
                      Zurücksetzen
                    </button>
                    <span style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-dim)' }}>
                      {(() => {
                        const anzahl = liste.filter((n, i) => n !== t.zeilen[i].passNr).length;
                        return anzahl === 0
                          ? 'Noch nichts geändert'
                          : anzahl === 1
                            ? '1 Platz bekommt jemand anderen'
                            : `${anzahl} Plätze bekommen jemand anderen`;
                      })()}
                    </span>
                  </div>
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
