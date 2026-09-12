'use client';

// ============================================================
// MDC — Passnummer vergeben oder umschreiben
// ============================================================
//
// Bis September 2026 konnte die Seite am Register gar nichts ändern: Der Stamm
// entstand aus dem Blatt „Teilnehmer" der Arbeitsmappe, und wer einen Pass
// bekam, wurde dort eingetragen. Zwei echte Fälle haben das gekippt:
//
//   UMSCHREIBEN  Passnr. 281 stand auf Morris Roll (ein Turnier im Februar
//                2026), gespielt hat damit zuletzt Markus Hundseder im
//                Sommer-Ranking. Der Betreiber hat entschieden: Die Nummer
//                behält Hundseder.
//
//   VERGEBEN     Ein Pass wird am Turnierabend ausgegeben, nicht nur beim
//                ersten Ergebniszettel. Dafür soll niemand die Mappe aufmachen
//                müssen.
//
// Beides landet als Berichtigung in `data/register-korrekturen.ts`, übersteht
// jeden Import und fällt von selbst weg, sobald die Mappe nachgezogen ist.
//
// AN DEN ERGEBNISSEN ÄNDERT DAS NIE ETWAS — und das steht auch auf der Karte.
// Jede Saison löst ihre Passnummern über ihre eigene Rangliste auf: Rolls
// Februarturnier bleibt bei Roll, er wird nur als „früher Passnr. 281"
// ausgewiesen.
// ============================================================

import { useMemo, useState } from 'react';
import {
  AlertTriangle, Check, ExternalLink, Hash, Loader2, RotateCcw, UserPlus,
} from 'lucide-react';
import type { RegisterKorrektur } from '@/data/register-korrekturen';
import {
  hebeRegisterKorrekturAuf, ordneNummerZu, vergebeNummer,
} from '@/app/mdc/admin/passnummern/actions';

export type Vergabe = Extract<RegisterKorrektur, { art: 'inhaber' | 'vergeben' }>;

/** Ein Mensch im Stamm, so wie die Karte ihn braucht. */
export interface VergabeSpieler {
  playerId: string;
  name: string;
  division: 'men' | 'women';
  /** Nummer, die er heute trägt — `null` heißt: keine. */
  passNr: number | null;
  /** Nummer, die er früher hatte. */
  formerPassNr: number | null;
  starts: number;
}

/** Wem eine Nummer heute gehört und wer sie vorher hatte. */
export interface NummerStand {
  passNr: number;
  heute: string | null;
  divison: 'men' | 'women' | null;
  frueher: string[];
}

export function NummernVergabe({
  spieler, nummern, frei, neueNummern, naechsteFreie, vergaben, erledigt, canPublish, missing,
}: {
  spieler: VergabeSpieler[];
  nummern: NummerStand[];
  /** Echte Lücken im Register — die werden der Reihe nach aufgefüllt. */
  frei: number[];
  /** Die nächsten Nummern über der höchsten vergebenen. */
  neueNummern: number[];
  /** Kleinste freie Nummer — steht in der Liste als Empfehlung dabei. */
  naechsteFreie: number;
  vergaben: Vergabe[];
  erledigt: Vergabe[];
  canPublish: boolean;
  missing: string[];
}) {
  const [nummer, setNummer] = useState('');
  const [suche, setSuche] = useState('');
  const [gewaehlt, setGewaehlt] = useState<VergabeSpieler | null>(null);
  const [neuName, setNeuName] = useState({ lastName: '', firstName: '', division: 'men' as 'men' | 'women' });
  const [neuAuf, setNeuAuf] = useState(false);
  const [note, setNote] = useState('');
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ url: string; text: string } | null>(null);

  const zahl = Number(nummer);
  const gueltig = Number.isInteger(zahl) && zahl >= 1;
  const stand = useMemo(
    () => (gueltig ? nummern.find(n => n.passNr === zahl) ?? null : null),
    [gueltig, zahl, nummern],
  );
  const istFrei = gueltig && !stand;

  // Wer in Frage kommt: nur, wer heute KEINE Nummer trägt. Zwei Nummern für
  // einen Menschen wären genau der Fehler, den die Karte darüber meldet.
  const ohneNummer = useMemo(() => spieler.filter(s => s.passNr === null), [spieler]);
  const q = suche.trim().toLowerCase();
  const treffer = useMemo(() => {
    if (!q) return [];
    return ohneNummer.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [q, ohneNummer]);

  // Wer diese Nummer früher hatte, steht oben — das ist fast immer der Fall.
  const vorherige = useMemo(
    () => (gueltig ? ohneNummer.filter(s => s.formerPassNr === zahl) : []),
    [gueltig, zahl, ohneNummer],
  );

  if (!canPublish) {
    return (
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Passnummer vergeben</h2>
        <p style={{ marginTop: 8, fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Wird wie die Ergebnisse im Repository abgelegt. Dafür fehlt:{' '}
          {missing.join(', ')}.
        </p>
      </div>
    );
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
    setGewaehlt(null);
    setSuche('');
    setNeuAuf(false);
    setNeuName({ lastName: '', firstName: '', division: 'men' });
    setNote('');
  }

  async function speichern() {
    if (!gueltig) return;
    if (gewaehlt) {
      const text = `Passnr. ${zahl} gehört jetzt ${gewaehlt.name}`;
      await schicke(
        'speichern',
        () => (istFrei
          ? vergebeNummer({ passNr: zahl, playerId: gewaehlt.playerId, note })
          : ordneNummerZu(zahl, gewaehlt.playerId, note)),
        text,
      );
      return;
    }
    if (neuAuf) {
      await schicke(
        'speichern',
        () => vergebeNummer({
          passNr: zahl,
          lastName: neuName.lastName,
          firstName: neuName.firstName,
          division: neuName.division,
          note,
        }),
        `Passnr. ${zahl} vergeben an ${neuName.firstName} ${neuName.lastName}`,
      );
    }
  }

  async function zurueck(v: Vergabe) {
    if (!window.confirm(
      `Berichtigung für Passnr. ${v.passNr} zurücknehmen?\n\n`
      + 'Danach gilt wieder, was in der Arbeitsmappe steht.',
    )) return;
    await schicke(
      `weg-${v.passNr}`,
      () => hebeRegisterKorrekturAuf(v.passNr),
      `Berichtigung für Passnr. ${v.passNr} zurückgenommen`,
    );
  }

  const bereit = gueltig && (gewaehlt !== null
    || (neuAuf && neuName.lastName.trim() !== '' && neuName.firstName.trim() !== ''));

  return (
    <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
      <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
        <Hash size={19} style={{ color: 'var(--mdc-red)' }} />
        Passnummer vergeben oder umschreiben
      </h2>
      <p style={{ marginTop: 8, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
        Eine <strong>freie</strong> Nummer an jemanden vergeben — auch an einen, der schon
        gespielt hat — oder eine <strong>vergebene</strong> Nummer jemand anderem zuschreiben.
        Die Turniere bleiben davon unberührt: Jede Saison rechnet mit ihrer eigenen Rangliste,
        wer eine Nummer abgibt, behält alle Ergebnisse und steht künftig als
        {' '}„früher Passnr. …“ da.
      </p>

      {fehler && (
        <div className="mdc-card" style={{ marginTop: 16, padding: '16px 18px', display: 'flex', gap: 12, borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {erfolg && (
        <div className="mdc-card" style={{ marginTop: 16, padding: '18px 20px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
            <Check size={18} style={{ color: 'var(--mdc-win)' }} />
            {erfolg.text}
          </p>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            Die Seite baut sich neu; in ein bis zwei Minuten stimmt die Nummer überall. Diese
            Liste zeigt es erst nach dem Neubau. In der Arbeitsmappe gehört es trotzdem
            nachgezogen — danach fällt die Berichtigung hier von selbst weg.
          </p>
          <a href={erfolg.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
            Was geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Auswahlliste statt Zahlenfeld: Am Handy soll niemand raten oder
          tippen müssen, welche Nummer frei ist. Erst die echten Lücken (die
          werden der Reihe nach aufgefüllt), dann die Nummern über der
          höchsten, dann die vergebenen — die stehen MIT Namen da, weil man
          eine Nummer umschreibt und nicht eine Zahl. */}
      <label style={{ display: 'block', marginTop: 18 }}>
        <span style={labelStil}>Passnummer</span>
        <select
          value={nummer}
          onChange={e => { setNummer(e.target.value); setGewaehlt(null); setNeuAuf(false); }}
          style={eingabeStil}
        >
          <option value="">— auswählen —</option>
          {frei.length > 0 && (
            <optgroup label={`Frei: Lücken im Register (${frei.length})`}>
              {frei.map(n => (
                <option key={n} value={String(n)}>
                  {n}{n === naechsteFreie ? ' — die kleinste freie' : ''}
                </option>
              ))}
            </optgroup>
          )}
          {neueNummern.length > 0 && (
            <optgroup label="Frei: neu, über der höchsten vergebenen">
              {neueNummern.map(n => <option key={n} value={String(n)}>{n}</option>)}
            </optgroup>
          )}
          <optgroup label={`Vergeben — umschreiben (${nummern.length})`}>
            {nummern.map(n => (
              <option key={n.passNr} value={String(n.passNr)}>
                {n.passNr} · {n.heute ?? 'ohne Namen'}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      {gueltig && (
        <div style={{ marginTop: 10, fontSize: '0.9rem', lineHeight: 1.7 }}>
          {stand ? (
            <>
              <strong>Passnr. {zahl}</strong> gehört heute{' '}
              <strong>{stand.heute ?? 'niemandem im Stamm'}</strong>
              {stand.frueher.length > 0 && <> · früher: {stand.frueher.join(', ')}</>}
            </>
          ) : (
            <>
              <strong>Passnr. {zahl} ist frei.</strong>{' '}
              {zahl > Math.max(...frei, 0) && frei.length > 0
                && `Die kleinste freie Lücke wäre ${frei[0]}.`}
            </>
          )}
        </div>
      )}

      {gueltig && (
        <>
          {vorherige.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <span style={labelStil}>Hatte diese Nummer schon</span>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {vorherige.map(s => (
                  <button
                    key={s.playerId}
                    type="button"
                    onClick={() => { setGewaehlt(s); setNeuAuf(false); }}
                    className={gewaehlt?.playerId === s.playerId ? 'mdc-btn mdc-btn-primary mdc-btn-sm' : 'mdc-btn mdc-btn-ghost mdc-btn-sm'}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label style={{ display: 'block', marginTop: 16 }}>
            <span style={labelStil}>Anderer Spieler ohne Nummer</span>
            <input
              value={suche}
              onChange={e => { setSuche(e.target.value); setGewaehlt(null); }}
              placeholder="Name suchen"
              style={eingabeStil}
            />
          </label>

          {q !== '' && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {treffer.length === 0 ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--mdc-ink-soft)' }}>
                  Niemand ohne Nummer gefunden. Wer schon eine hat, kann keine zweite
                  bekommen — und wer noch gar nicht im Stamm steht, wird unten neu angelegt.
                </p>
              ) : treffer.map(s => (
                <button
                  key={s.playerId}
                  type="button"
                  onClick={() => { setGewaehlt(s); setNeuAuf(false); }}
                  style={{
                    ...trefferStil,
                    borderColor: gewaehlt?.playerId === s.playerId ? 'var(--mdc-red)' : 'var(--mdc-line)',
                  }}
                >
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
                    {s.division === 'men' ? 'Herren' : 'Damen'}
                    {s.formerPassNr !== null && ` · früher ${s.formerPassNr}`}
                    {s.starts > 0 && ` · ${s.starts} Turniere`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {istFrei && (
            <div style={{ marginTop: 16 }}>
              {!neuAuf ? (
                <button
                  type="button"
                  className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                  onClick={() => { setNeuAuf(true); setGewaehlt(null); }}
                >
                  <UserPlus size={15} />
                  Neuen Spieler anlegen
                </button>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ flex: 1, minWidth: 160 }}>
                    <span style={labelStil}>Nachname</span>
                    <input
                      value={neuName.lastName}
                      onChange={e => setNeuName(n => ({ ...n, lastName: e.target.value }))}
                      style={eingabeStil}
                    />
                  </label>
                  <label style={{ flex: 1, minWidth: 160 }}>
                    <span style={labelStil}>Vorname</span>
                    <input
                      value={neuName.firstName}
                      onChange={e => setNeuName(n => ({ ...n, firstName: e.target.value }))}
                      placeholder="Spitzname in Klammern"
                      style={eingabeStil}
                    />
                  </label>
                  <label style={{ minWidth: 140 }}>
                    <span style={labelStil}>Wertung</span>
                    <select
                      value={neuName.division}
                      onChange={e => setNeuName(n => ({ ...n, division: e.target.value as 'men' | 'women' }))}
                      style={eingabeStil}
                    >
                      <option value="men">Herren</option>
                      <option value="women">Damen</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          )}

          <label style={{ display: 'block', marginTop: 16 }}>
            <span style={labelStil}>Hinweis (freiwillig)</span>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="z. B. Pass am 12.09. im Harlekin ausgegeben"
              style={eingabeStil}
            />
          </label>

          <button
            type="button"
            className="mdc-btn mdc-btn-primary"
            style={{ marginTop: 16, opacity: bereit ? 1 : 0.5 }}
            disabled={!bereit || laeuft !== null}
            onClick={speichern}
          >
            {laeuft === 'speichern' ? <Loader2 size={16} className="mdc-spin" /> : <Check size={16} />}
            {istFrei ? 'Nummer vergeben' : 'Nummer zuschreiben'}
          </button>
        </>
      )}

      {vergaben.length > 0 && (
        <>
          <h3 className="mdc-display" style={{ marginTop: 24, fontSize: '0.95rem', color: 'var(--mdc-navy)' }}>
            Hier vergeben oder umgeschrieben
          </h3>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vergaben.map(v => (
              <div key={v.passNr} style={zeileStil}>
                <span className="mdc-num" style={{ minWidth: 52, fontWeight: 700, color: 'var(--mdc-red)' }}>
                  {v.passNr}
                </span>
                <span style={{ flex: 1, minWidth: 200, fontSize: '0.9rem' }}>
                  {v.gehoertZu.firstName} {v.gehoertZu.lastName}
                  {v.art === 'inhaber' && (
                    <span style={{ color: 'var(--mdc-ink-dim)' }}>
                      {' '}— in der Mappe steht dort {v.firstName} {v.lastName}
                    </span>
                  )}
                  {v.art === 'vergeben' && (
                    <span style={{ color: 'var(--mdc-ink-dim)' }}> — hier neu vergeben</span>
                  )}
                </span>
                <button
                  type="button"
                  className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                  disabled={laeuft !== null}
                  onClick={() => zurueck(v)}
                >
                  {laeuft === `weg-${v.passNr}` ? <Loader2 size={14} className="mdc-spin" /> : <RotateCcw size={14} />}
                  Zurücknehmen
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {erledigt.length > 0 && (
        <p style={{ marginTop: 16, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-win)' }}>
          <strong>ERLEDIGT:</strong> {erledigt.map(v => `Passnr. ${v.passNr}`).join(', ')}{' '}
          {erledigt.length === 1 ? 'steht' : 'stehen'} inzwischen so in der Arbeitsmappe.
          {' '}{erledigt.length === 1 ? 'Die Berichtigung' : 'Die Berichtigungen'} hier{' '}
          {erledigt.length === 1 ? 'bewirkt' : 'bewirken'} nichts mehr.
        </p>
      )}
    </div>
  );
}

const labelStil: React.CSSProperties = {
  fontFamily: 'var(--mdc-font-display)', fontSize: '0.72rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
};

const eingabeStil: React.CSSProperties = {
  marginTop: 6, width: '100%', padding: '10px 12px', fontSize: '1rem',
  border: '1px solid var(--mdc-line-hard)', borderRadius: 10,
  background: 'var(--mdc-card-2)', color: 'var(--mdc-ink)', fontFamily: 'inherit',
};

const trefferStil: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
  padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card-2)',
  color: 'var(--mdc-ink)', font: 'inherit',
};

const zeileStil: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
  padding: '12px 14px', borderRadius: 10,
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card-2)',
};
