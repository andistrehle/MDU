'use client';

// ============================================================
// MDC — Derselbe Mensch, zwei Passnummern
// ============================================================
//
// Steht jemand im Blatt „Teilnehmer" zweimal, ist das nicht bloß unordentlich.
// Die Spieler-ID entsteht aus dem Namen; beim zweiten Eintrag hängt die Seite
// die Passnummer an. Aus einem Menschen werden also zwei — einer mit allen
// Ergebnissen und womöglich der FALSCHEN Nummer, einer ohne Ergebnisse mit
// der richtigen. Genau so stand Claudia Vaszi am 12.09.2026 mit 196 da,
// obwohl sie ihre 63 Turniere unter 251 gespielt hat.
//
// Was hier geht: die Zeile OHNE Starts stilllegen. Dann gilt die andere, und
// die Person ist wieder eine.
//
// Was hier bewusst NICHT geht: die Nummer mit Starts stilllegen (die
// Ergebnisse verlören ihren Menschen) oder eine Nummer vergeben. Der Stamm
// entsteht aus der Arbeitsmappe; die Stilllegung ist eine Berichtigung, die
// den nächsten Import übersteht — die Mappe bleibt die Quelle und gehört
// trotzdem nachgezogen.
// ============================================================

import { useState } from 'react';
import { AlertTriangle, Check, ExternalLink, Loader2, RotateCcw, Users } from 'lucide-react';
import type { RegisterKorrektur } from '@/data/register-korrekturen';
import { hebeStilllegungAuf, legeNummerStill } from '@/app/mdc/admin/passnummern/actions';

export interface DoppelNummerAnzeige {
  passNr: number;
  gespielt: number;
}

export interface DoppelAnzeige {
  name: string;
  nummern: DoppelNummerAnzeige[];
}

export function RegisterDoppelt({ doppelt, korrekturen, erledigt, canPublish, missing }: {
  doppelt: DoppelAnzeige[];
  /** Schon stillgelegte Zeilen — die Mappe führt sie noch. */
  korrekturen: RegisterKorrektur[];
  /** Stillgelegte Zeilen, die es in der Mappe nicht mehr gibt. */
  erledigt: RegisterKorrektur[];
  canPublish: boolean;
  missing: string[];
}) {
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ url: string; text: string } | null>(null);

  if (!doppelt.length && !korrekturen.length && !erledigt.length) return null;

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

  async function stilllegen(name: string, passNr: number, bleibt: number) {
    if (!window.confirm(
      `Passnr. ${passNr} stilllegen?\n\n`
      + `${name} steht damit nur noch unter Passnr. ${bleibt}. Die ${passNr} wird wieder `
      + 'frei und kann neu vergeben werden.\n\n'
      + 'Das gilt, solange die Arbeitsmappe den Doppeleintrag führt — dort gehört er '
      + 'trotzdem gelöscht.',
    )) return;
    await schicke(
      `still-${passNr}`,
      () => legeNummerStill(passNr, `Doppelt im Register; ${name} läuft unter ${bleibt}.`),
      `Passnr. ${passNr} stillgelegt — ${name} läuft unter ${bleibt}`,
    );
  }

  async function zurueck(k: RegisterKorrektur) {
    if (!window.confirm(
      `Stilllegung von Passnr. ${k.passNr} zurücknehmen?\n\n`
      + 'Danach gilt wieder, was in der Arbeitsmappe steht — also beide Zeilen.',
    )) return;
    await schicke(
      `weg-${k.passNr}`,
      () => hebeStilllegungAuf(k.passNr),
      `Stilllegung von Passnr. ${k.passNr} zurückgenommen`,
    );
  }

  return (
    <div className="mdc-card" style={{ padding: '22px 20px' }}>
      <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
        <Users size={19} style={{ color: 'var(--mdc-red)' }} />
        Zweimal im Register
      </h2>
      <p style={{ marginTop: 8, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
        {'Diese Menschen stehen im Blatt „Teilnehmer" unter zwei Nummern. Dadurch werden aus '}
        einem zwei: Einer hat alle Ergebnisse, der andere die zweite Nummer — und angezeigt
        wird womöglich die falsche. Stilllegen lässt sich nur die Nummer, mit der{' '}
        <strong>nie gespielt</strong> wurde.
      </p>

      {fehler && (
        <div className="mdc-card" style={{ marginTop: 16, padding: '16px 18px', display: 'flex', gap: 12, borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {erfolg && (
        <div className="mdc-card mdc-card-accent" style={{ marginTop: 16, padding: '18px 20px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
            <Check size={18} style={{ color: 'var(--mdc-win)' }} />
            {erfolg.text}
          </p>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            Die Seite baut sich neu; in ein bis zwei Minuten stimmt die Nummer überall. Diese
            Liste zeigt es erst nach dem Neubau. In der Arbeitsmappe gehört die doppelte Zeile
            trotzdem gelöscht — dann fällt die Berichtigung hier von selbst weg.
          </p>
          <a href={erfolg.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
            Was geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {doppelt.length > 0 && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {doppelt.map(person => {
            const mitStarts = person.nummern.filter(n => n.gespielt > 0);
            const ohneStarts = person.nummern.filter(n => n.gespielt === 0);
            // Bleiben soll die Nummer mit den meisten Starts; gibt es keine
            // mit Starts, ist nicht zu entscheiden — dann sagt die Karte das.
            const bleibt = [...person.nummern].sort((a, b) => b.gespielt - a.gespielt)[0];
            return (
              <div key={person.name} style={karte}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '1rem' }}>{person.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--mdc-ink-dim)' }}>
                    {person.nummern.map(n => n.passNr).join(' und ')}
                  </span>
                </div>

                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {person.nummern.map(n => (
                    <div key={n.passNr} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                      <span className="mdc-num" style={{ minWidth: 52, fontWeight: 700, color: 'var(--mdc-red)' }}>
                        {n.passNr}
                      </span>
                      <span style={{ flex: 1, minWidth: 170, fontSize: '0.9rem' }}>
                        {n.gespielt > 0
                          ? `${n.gespielt} Turnier${n.gespielt === 1 ? '' : 'e'} in der Wertung`
                          : 'kein einziges Turnier'}
                      </span>
                      {n.gespielt === 0 && mitStarts.length > 0 && canPublish && (
                        <button
                          type="button"
                          className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                          disabled={laeuft !== null}
                          onClick={() => stilllegen(person.name, n.passNr, bleibt.passNr)}
                        >
                          {laeuft === `still-${n.passNr}`
                            ? <Loader2 size={14} className="mdc-spin" />
                            : <RotateCcw size={14} />}
                          Stilllegen
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {mitStarts.length === 0 && (
                  <p style={{ marginTop: 10, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--mdc-warn-ink)' }}>
                    Mit keiner der beiden Nummern wurde gespielt. Welche gilt, steht damit
                    nirgends — das entscheidet die Arbeitsmappe, nicht diese Seite.
                  </p>
                )}
                {mitStarts.length > 1 && (
                  <p style={{ marginTop: 10, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--mdc-warn-ink)' }}>
                    Unter beiden Nummern wurde gespielt. Das sind entweder zwei Menschen mit
                    demselben Namen — dann ist hier alles in Ordnung — oder einer, der die
                    Nummer gewechselt hat. Beides gehört in die Arbeitsmappe.
                  </p>
                )}
                {ohneStarts.length > 0 && mitStarts.length === 1 && !canPublish && (
                  <p style={{ marginTop: 10, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--mdc-ink-dim)' }}>
                    Stilllegen geht hier nicht — dafür fehlt {missing.join(', ')}.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {korrekturen.length > 0 && (
        <>
          <h3 className="mdc-display" style={{ marginTop: 22, fontSize: '0.95rem', color: 'var(--mdc-navy)' }}>
            Stillgelegt
          </h3>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {korrekturen.map(k => (
              <div key={k.passNr} style={{ ...karte, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <span className="mdc-num" style={{ minWidth: 52, fontWeight: 700, color: 'var(--mdc-red)' }}>
                  {k.passNr}
                </span>
                <span style={{ flex: 1, minWidth: 200, fontSize: '0.9rem' }}>
                  {k.firstName} {k.lastName}
                  {k.stattdessen !== null && ` — läuft unter ${k.stattdessen}`}
                </span>
                {canPublish && (
                  <button
                    type="button"
                    className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                    disabled={laeuft !== null}
                    onClick={() => zurueck(k)}
                  >
                    {laeuft === `weg-${k.passNr}`
                      ? <Loader2 size={14} className="mdc-spin" />
                      : <RotateCcw size={14} />}
                    Zurücknehmen
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {erledigt.length > 0 && (
        <p style={{ marginTop: 16, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-win)' }}>
          <strong>ERLEDIGT:</strong> Für{' '}
          {erledigt.map(k => `Passnr. ${k.passNr}`).join(', ')} gibt es in der Arbeitsmappe
          keinen Doppeleintrag mehr. {erledigt.length === 1 ? 'Die Berichtigung' : 'Die Berichtigungen'}
          {' '}hier {erledigt.length === 1 ? 'bewirkt' : 'bewirken'} nichts mehr und{' '}
          {erledigt.length === 1 ? 'kann' : 'können'} zurückgenommen werden.
        </p>
      )}
    </div>
  );
}

const karte: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 10,
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card-2)',
};
