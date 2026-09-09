'use client';

// ============================================================
// MDC — Namen berichtigen
// ============================================================
//
// Zwei Fälle, für die es das gibt, beide echt: der Spieler, der unter dem
// Namen seines Lokals lief und seinen Nachnamen nachträgt („Ambasador David"
// → Sedlmeier), und der Name, der in zwei Auswertungen verschieden
// geschrieben steht („Pogremino" ↔ „Pogremno").
//
// Gesucht wird über Nummer ODER Name — abends im Lokal weiß man meist den
// einen und nicht die andere. Die Felder stehen dann schon voll da; ändern
// muss man nur, was falsch ist.
//
// Was hier bewusst sichtbar ist, statt hinterher zu überraschen:
//
//   • die neue Adresse des Profils (sie kommt aus dem Namen und ändert sich
//     mit ihm — die alte leitet danach dorthin um),
//   • dass die Korrektur für ALLE Wertungen gilt, auch die abgeschlossene
//     Saison, weil sie an der Passnummer hängt.
// ============================================================

import { useMemo, useState } from 'react';
import {
  AlertTriangle, Check, ExternalLink, Loader2, Pencil, RotateCcw, UserPen,
} from 'lucide-react';
import type { Namenskorrektur } from '@/data/namen';
import { slugify } from '@/lib/mdc/names';
import { mdcPath } from '@/lib/mdc/site';
import { korrigiereName, entferneNamenskorrektur } from '@/app/mdc/admin/passnummern/actions';

export interface NamenStatus {
  canPublish: boolean;
  missing: string[];
}

/** Ein Mensch mit Nummer, so wie er heute auf der Seite steht. */
export interface NamenSpieler {
  passNr: number;
  playerId: string;
  /** Anzeigename „Vorname Nachname". */
  name: string;
  /** Wie in der Arbeitsmappe: Großbuchstaben, Spitzname in Klammern. */
  lastName: string;
  firstName: string;
  starts: number;
  /** Die Nummer steht bei mehr als einem Menschen — dann geht es hier nicht. */
  mehrfach: boolean;
}

export function NamenEditor({ spieler, korrekturen, status }: {
  spieler: NamenSpieler[];
  korrekturen: Namenskorrektur[];
  status: NamenStatus;
}) {
  const [suche, setSuche] = useState('');
  const [gewaehlt, setGewaehlt] = useState<NamenSpieler | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [note, setNote] = useState('');
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ url: string; text: string } | null>(null);

  const q = suche.trim().toLowerCase();
  const treffer = useMemo(() => {
    if (!q) return [];
    if (/^\d+$/.test(q)) return spieler.filter(s => String(s.passNr).startsWith(q)).slice(0, 8);
    return spieler.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [q, spieler]);

  function waehle(s: NamenSpieler) {
    setGewaehlt(s);
    setLastName(s.lastName);
    setFirstName(s.firstName);
    setNote('');
    setFehler(null);
    setErfolg(null);
    setSuche('');
  }

  // Dieselbe Rechnung wie in `data/namen.ts` — nur damit man vor dem Ablegen
  // sieht, wohin das Profil danach zeigt.
  const neueAdresse = slugify(
    `${firstName.replace(/\s*\([^)]*\)\s*$/, '')} ${lastName}`,
  );
  const adresseAendertSich = gewaehlt !== null && neueAdresse !== gewaehlt.playerId;
  const unveraendert = gewaehlt !== null
    && lastName.trim().toUpperCase() === gewaehlt.lastName
    && firstName.trim().toUpperCase() === gewaehlt.firstName;

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

  async function speichern() {
    if (!gewaehlt) return;
    await schicke(
      'speichern',
      () => korrigiereName({ passNr: gewaehlt.passNr, lastName, firstName, note }),
      `Passnr. ${gewaehlt.passNr} heißt jetzt ${firstName} ${lastName}`,
    );
  }

  async function zuruecknehmen(k: Namenskorrektur) {
    if (!window.confirm(
      `Korrektur für Passnr. ${k.passNr} zurücknehmen?\n\n`
      + 'Danach gilt wieder der Name, der in der Arbeitsmappe steht.',
    )) return;
    await schicke(
      `weg-${k.passNr}`,
      () => entferneNamenskorrektur(k.passNr),
      `Korrektur für Passnr. ${k.passNr} zurückgenommen`,
    );
  }

  if (!status.canPublish) {
    return (
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Namen berichtigen</h2>
        <p style={{ marginTop: 8, fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Korrekturen werden wie die Ergebnisse im Repository abgelegt. Dafür fehlt die
          Zugangsdatei:
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
            Die Seite baut sich neu; in ein bis zwei Minuten steht der Name überall — in
            beiden Ranglisten, im Archiv und auf jedem Ergebnis. Diese Liste hier zeigt es
            erst nach dem Neubau.
          </p>
          <a href={erfolg.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
            Was geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
          <UserPen size={19} style={{ color: 'var(--mdc-red)' }} />
          Namen berichtigen
        </h2>
        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          {'Für den, der unter dem Namen seines Lokals läuft und den Nachnamen nachträgt — '}
          {'und für Namen, die falsch geschrieben in der Auswertung stehen. Die Korrektur '}
          hängt an der Passnummer und gilt damit überall zugleich, auch rückwirkend für die
          abgeschlossene Saison. Die Punkte ändert sie nicht.
        </p>

        <label style={{ display: 'block', marginTop: 16 }}>
          <span style={label}>Wen? (Nummer oder Name)</span>
          <input
            value={suche} style={eingabe} inputMode="search"
            placeholder="z. B. 297 oder Ambasador"
            onChange={e => setSuche(e.target.value)}
          />
        </label>

        {q !== '' && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {treffer.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--mdc-ink-soft)' }}>
                Dazu steht niemand mit Passnummer auf der Seite.
              </p>
            ) : treffer.map(s => (
              // Eine Nummer, die zwei Menschen tragen (heute einer, früher ein
              // anderer), lässt sich hier nicht berichtigen: Die Korrektur
              // hängt an der Nummer und würde beide umbenennen. Das gleich zu
              // sagen ist ehrlicher, als es erst beim Ablegen abzulehnen.
              <button
                key={s.passNr}
                type="button"
                disabled={s.mehrfach}
                onClick={() => waehle(s)}
                title={s.mehrfach ? 'Diese Nummer steht bei mehreren Menschen.' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  padding: '9px 12px', borderRadius: 9,
                  cursor: s.mehrfach ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card-2)',
                  color: s.mehrfach ? 'var(--mdc-ink-dim)' : 'var(--mdc-ink)', font: 'inherit',
                }}
              >
                <span className="mdc-num" style={{ minWidth: 44, color: 'var(--mdc-red)', fontWeight: 700 }}>
                  {s.passNr}
                </span>
                <span style={{ flex: 1 }}>
                  {s.name}
                  <span style={{ marginLeft: 8, fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
                    {s.starts === 0 ? 'noch kein Turnier' : `${s.starts} ${s.starts === 1 ? 'Start' : 'Starts'}`}
                  </span>
                  {s.mehrfach && (
                    <span style={{ display: 'block', marginTop: 3, fontSize: '0.82rem', color: 'var(--mdc-warn-ink)' }}>
                      Nummer steht bei mehreren Menschen — nur in der Arbeitsmappe zu klären.
                    </span>
                  )}
                </span>
                {!s.mehrfach && <Pencil size={15} style={{ color: 'var(--mdc-ink-dim)' }} />}
              </button>
            ))}
          </div>
        )}

        {gewaehlt && (
          <div
            style={{
              marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--mdc-line)',
            }}
          >
            <p style={{ fontSize: '0.9rem' }}>
              <strong>Passnr. {gewaehlt.passNr}</strong> — steht heute als{' '}
              <strong>{gewaehlt.name}</strong> auf der Seite.
            </p>

            <div style={{ display: 'grid', gap: 14, marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <label>
                <span style={label}>Nachname</span>
                <input
                  value={lastName} maxLength={40} style={eingabe}
                  onChange={e => setLastName(e.target.value)}
                />
              </label>
              <label>
                <span style={label}>Vorname</span>
                <input
                  value={firstName} maxLength={40} style={eingabe}
                  onChange={e => setFirstName(e.target.value)}
                />
                <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
                  {'Spitzname wie in der Mappe in Klammern: MARKUS (JACKY)'}
                </span>
              </label>
            </div>

            <label style={{ display: 'block', marginTop: 14 }}>
              <span style={label}>Woher der richtige Name kommt</span>
              <input
                value={note} maxLength={200} style={eingabe}
                placeholder="z. B. Nachname am 08.09. auf dem Ergebniszettel nachgetragen"
                onChange={e => setNote(e.target.value)}
              />
              <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
                {'Steht nur hier in der Verwaltung — nicht auf der Seite.'}
              </span>
            </label>

            {adresseAendertSich && (
              <p style={{ marginTop: 14, fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
                <strong>Die Profiladresse ändert sich mit:</strong>{' '}
                <code>{mdcPath(`/spieler/${gewaehlt.playerId}`)}</code> →{' '}
                <code>{mdcPath(`/spieler/${neueAdresse}`)}</code>. Die alte Adresse leitet
                danach dorthin um, weitergegebene Links bleiben also gültig.
              </p>
            )}

            <button
              type="button"
              className="mdc-btn mdc-btn-primary"
              style={{ marginTop: 16 }}
              disabled={laeuft !== null || unveraendert || !lastName.trim() || !firstName.trim()}
              onClick={speichern}
            >
              {laeuft === 'speichern'
                ? <><Loader2 size={16} className="mdc-spin" /> Wird abgelegt …</>
                : <><Check size={16} /> Namen ablegen</>}
            </button>
            {unveraendert && (
              <span style={{ marginLeft: 12, fontSize: '0.85rem', color: 'var(--mdc-ink-dim)' }}>
                Noch nichts geändert.
              </span>
            )}
          </div>
        )}
      </div>

      {korrekturen.length > 0 && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>Berichtigte Namen</h2>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Diese Namen weichen bewusst von der Arbeitsmappe ab. Beim nächsten Einlesen einer
            Saison bleiben sie bestehen — sie werden nicht überschrieben.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {korrekturen.map(k => (
              <div
                key={k.passNr}
                style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 9,
                  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card-2)',
                }}
              >
                <span className="mdc-num" style={{ minWidth: 44, color: 'var(--mdc-red)', fontWeight: 700 }}>
                  {k.passNr}
                </span>
                <span style={{ flex: 1, minWidth: 180, fontSize: '0.9rem' }}>
                  <strong>{k.firstName} {k.lastName}</strong>
                  {k.note && (
                    <span style={{ display: 'block', marginTop: 3, fontSize: '0.83rem', color: 'var(--mdc-ink-dim)' }}>
                      {k.note}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                  disabled={laeuft !== null}
                  onClick={() => zuruecknehmen(k)}
                >
                  {laeuft === `weg-${k.passNr}`
                    ? <Loader2 size={14} className="mdc-spin" />
                    : <RotateCcw size={14} />}
                  Zurücknehmen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
