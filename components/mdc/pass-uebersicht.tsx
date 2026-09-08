'use client';

// ============================================================
// MDC — Passnummern: vergeben, frei, früher mal jemand anderem
// ============================================================
//
// Antwortet auf genau eine Frage: „Welche Nummer kann ich als nächste
// vergeben?" — und meldet daneben die einzige Sorte Fehler, die es hier
// wirklich gibt: eine Nummer, mit der gespielt wurde, die im Register des
// Betreibers aber ohne Namen steht.
//
// Die Liste ist nach Nummer sortiert, nicht nach Name oder Platzierung. Das
// ist der ganze Punkt: Im Spielerverzeichnis stehen die Nummern verstreut,
// hier stehen sie der Reihe nach, und die Lücken sieht man auf einen Blick.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Hash, History, KeyRound, TriangleAlert, Users } from 'lucide-react';
import { StatCard } from './ui';
import { mdcPath } from '@/lib/mdc/site';

export interface PassInhaberAnsicht {
  playerId: string;
  name: string;
  division: 'men' | 'women';
  /** Klartext der Wertung, aus der die Person stammt. */
  quelle: string;
  letzterStart: string | null;
  starts: number;
  aktuell: boolean;
}

export interface PassZeile {
  passNr: number;
  imRegister: boolean;
  inhaber: PassInhaberAnsicht[];
}

export interface PassUebersichtProps {
  zeilen: PassZeile[];
  frei: number[];
  naechsteFreie: number;
  hoechsteVergebene: number;
}

const zahl = new Intl.NumberFormat('de-DE');

function datum(iso: string | null): string {
  if (!iso) return 'noch kein Turnier auf der Seite';
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

/** Eine Zeile „heute/früher · Name · Wertung · Starts". */
function InhaberZeile({ i, mitMarke }: { i: PassInhaberAnsicht; mitMarke: boolean }) {
  return (
    <div style={{ marginTop: 6, fontSize: '0.88rem', lineHeight: 1.6 }}>
      {mitMarke && (
        <span className={`mdc-chip ${i.aktuell ? 'mdc-chip-red' : ''}`} style={{ marginRight: 8 }}>
          {i.aktuell ? 'heute' : 'früher'}
        </span>
      )}
      <Link href={mdcPath(`/spieler/${i.playerId}`)}>{i.name}</Link>
      {' · '}{i.division === 'women' ? 'Damen' : 'Herren'}
      {' · '}{i.quelle}
      {i.starts > 0 && <>{' · '}{i.starts} {i.starts === 1 ? 'Start' : 'Starts'}, zuletzt {datum(i.letzterStart)}</>}
    </div>
  );
}

export function PassUebersicht({
  zeilen, frei, naechsteFreie, hoechsteVergebene,
}: PassUebersichtProps) {
  const [suche, setSuche] = useState('');
  const [nurFreie, setNurFreie] = useState(false);

  const fehlend = useMemo(() => zeilen.filter(z => !z.imRegister), [zeilen]);
  // Nur Nummern, bei denen das Register entschieden hat, wem sie heute gehört.
  // Fehlt sie dort, ist das kein Vorgänger, sondern ein offener Punkt — der
  // steht im gelben Kasten.
  const mitVorgaenger = useMemo(
    () => zeilen.filter(z => z.imRegister && z.inhaber.length > 1),
    [zeilen],
  );
  const belegt = useMemo(() => new Map(zeilen.map(z => [z.passNr, z])), [zeilen]);

  /** Alle Nummern von 1 bis zur höchsten — belegte und Lücken in einer Reihe. */
  const alle = useMemo(
    () => Array.from({ length: hoechsteVergebene }, (_, i) => i + 1),
    [hoechsteVergebene],
  );
  const freiSet = useMemo(() => new Set(frei), [frei]);

  const q = suche.trim().toLowerCase();
  const gefiltert = useMemo(() => {
    let liste = alle;
    if (nurFreie) liste = liste.filter(n => freiSet.has(n));
    if (!q) return liste;
    // Reine Ziffern suchen die Nummer, alles andere den Namen.
    if (/^\d+$/.test(q)) return liste.filter(n => String(n).includes(q));
    return liste.filter(n => belegt.get(n)?.inhaber.some(i => i.name.toLowerCase().includes(q)));
  }, [alle, belegt, freiSet, nurFreie, q]);

  /** Volltreffer bei der Suche nach einer Nummer — die Antwort steht dann oben. */
  const treffer = /^\d+$/.test(q) ? Number(q) : null;
  const trefferZeile = treffer !== null ? belegt.get(treffer) : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div
        style={{
          display: 'grid', gap: 14,
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        }}
      >
        <StatCard
          label="Nächste freie"
          value={String(naechsteFreie)}
          sub={frei.length > 1 ? `danach ${frei.slice(1, 4).join(', ')}` : 'erste über der höchsten vergebenen'}
          icon={<KeyRound size={18} />}
        />
        <StatCard
          label="Vergeben"
          value={zahl.format(zeilen.length)}
          sub={`höchste Nummer: ${hoechsteVergebene}`}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Freie Nummern"
          value={zahl.format(frei.length)}
          sub={`Lücken zwischen 1 und ${hoechsteVergebene}`}
          icon={<Hash size={18} />}
        />
        <StatCard
          label="Früher jemand anderem"
          value={String(mitVorgaenger.length)}
          sub={mitVorgaenger.length ? 'Nummer wurde neu vergeben' : 'jede Nummer hatte nur einen Inhaber'}
          icon={<History size={18} />}
        />
      </div>

      {fehlend.length > 0 && (
        <div
          className="mdc-card"
          style={{
            padding: '18px 18px 20px',
            borderColor: 'var(--mdc-warn-line)', background: 'var(--mdc-warn-tint)',
          }}
        >
          <h2 className="mdc-display" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <TriangleAlert size={18} style={{ color: 'var(--mdc-warn-ink)' }} />
            {fehlend.length === 1 ? 'Eine Nummer fehlt im Register' : `${fehlend.length} Nummern fehlen im Register`}
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            {'Mit diesen Nummern wurde gespielt, im Blatt „Teilnehmer" der Arbeitsmappe stehen '}
            sie aber ohne Namen. Sie sehen dort also frei aus. Bitte nachtragen — sonst
            bekommt sie irgendwann ein Neuling und hat sie dann zu zweit.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fehlend.map(z => (
              <div
                key={z.passNr}
                style={{
                  padding: '11px 13px', borderRadius: 9, background: 'var(--mdc-card)',
                  border: '1px solid var(--mdc-line)',
                }}
              >
                <div className="mdc-display" style={{ fontSize: '0.95rem' }}>Passnr. {z.passNr}</div>
                {z.inhaber.map(i => <InhaberZeile key={i.playerId} i={i} mitMarke={false} />)}
                {z.inhaber.length > 1 && (
                  <div style={{ marginTop: 8, fontSize: '0.83rem', color: 'var(--mdc-warn-ink)' }}>
                    Zwei Namen auf einer Nummer. Wer sie heute trägt, kann die Seite nicht
                    sagen — im Register steht sie ja nicht. Bitte dort eintragen, dann ist
                    es entschieden.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mdc-card" style={{ padding: '18px 18px 20px' }}>
        <label style={{ display: 'block' }}>
          <span
            className="mdc-display"
            style={{ fontSize: '0.72rem', letterSpacing: '0.14em', color: 'var(--mdc-ink-dim)' }}
          >
            Nummer oder Name suchen
          </span>
          <input
            value={suche}
            onChange={e => setSuche(e.target.value)}
            placeholder="z. B. 305 oder Meyer"
            inputMode="search"
            style={{
              marginTop: 8, width: '100%', padding: '11px 13px', fontSize: '1rem',
              border: '1px solid var(--mdc-line-hard)', borderRadius: 10,
              background: 'var(--mdc-card-2)', color: 'var(--mdc-ink)',
            }}
          />
        </label>

        {treffer !== null && (
          <div
            style={{
              marginTop: 14, padding: '14px 16px', borderRadius: 10,
              border: `1px solid ${trefferZeile ? 'var(--mdc-line)' : 'var(--mdc-blue-soft)'}`,
              background: trefferZeile ? 'var(--mdc-tint)' : 'var(--mdc-blue-a08)',
            }}
          >
            {trefferZeile ? (
              <>
                <strong>Passnr. {treffer} ist vergeben.</strong>
                {trefferZeile.inhaber.map(i => (
                  <InhaberZeile key={i.playerId} i={i} mitMarke={trefferZeile.inhaber.length > 1} />
                ))}
                {!trefferZeile.imRegister && (
                  <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--mdc-warn-ink)' }}>
                    Im Register der Arbeitsmappe fehlt sie — bitte nachtragen.
                  </div>
                )}
              </>
            ) : (
              <>
                <strong>Passnr. {treffer} ist frei.</strong> Sie steht im Register ohne Namen
                und es hat auch niemand damit gespielt.
                {treffer > hoechsteVergebene && (
                  <> Sie liegt über der höchsten vergebenen ({hoechsteVergebene}).</>
                )}
              </>
            )}
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, fontSize: '0.9rem' }}>
          <input type="checkbox" checked={nurFreie} onChange={e => setNurFreie(e.target.checked)} />
          Nur freie Nummern zeigen
        </label>
      </div>

      {mitVorgaenger.length > 0 && (
        <div className="mdc-card" style={{ padding: '18px 18px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <History size={18} style={{ color: 'var(--mdc-red)' }} />
            Nummern, die früher jemand anderem gehört haben
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Diese Nummern wurden nach dem Aufhören des ersten Inhabers neu vergeben. Wer sie
            heute trägt, sagt das Register.{' '}
            <strong>Für die Ergebnisse ist das folgenlos:</strong> Jede Saison löst ihre
            Passnummern über ihre eigene Rangliste auf. Der frühere Inhaber behält seine
            Turniere und seine Platzierung, er hat nur keine Nummer mehr.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mitVorgaenger.map(z => (
              <div
                key={z.passNr}
                style={{
                  padding: '11px 13px', borderRadius: 9, background: 'var(--mdc-card-2)',
                  border: '1px solid var(--mdc-line)',
                }}
              >
                <div className="mdc-display" style={{ fontSize: '0.95rem' }}>Passnr. {z.passNr}</div>
                {z.inhaber.map(i => <InhaberZeile key={i.playerId} i={i} mitMarke />)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mdc-card" style={{ padding: '18px 18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>
            Nummern der Reihe nach
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
            {zahl.format(gefiltert.length)} von {zahl.format(alle.length)} angezeigt
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: '0.8rem', color: 'var(--mdc-ink-dim)' }}>
          <span><b style={{ color: 'var(--mdc-ink)' }}>Fett</b> = vergeben</span>
          <span>Blass = frei</span>
          <span style={{ color: 'var(--mdc-warn-ink)' }}>Gelb = fehlt im Register</span>
        </div>

        {gefiltert.length === 0 ? (
          <p style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--mdc-ink-soft)' }}>
            Dazu passt keine Nummer.
          </p>
        ) : (
          <div
            style={{
              marginTop: 14, display: 'grid', gap: 6,
              gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))',
            }}
          >
            {gefiltert.map(n => {
              const zeile = belegt.get(n);
              const warnung = zeile !== undefined && !zeile.imRegister;
              const namen = zeile?.inhaber.map(i => i.name).join(' / ');
              return (
                <span
                  key={n}
                  title={zeile
                    ? `Passnr. ${n}: ${namen}${warnung ? ' — fehlt im Register' : ''}`
                    : `Passnr. ${n} — frei`}
                  style={{
                    padding: '7px 4px', textAlign: 'center', borderRadius: 7,
                    fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem',
                    border: `1px solid ${warnung ? 'var(--mdc-warn-line)' : 'var(--mdc-line-soft)'}`,
                    background: zeile
                      ? (warnung ? 'var(--mdc-warn-tint)' : 'var(--mdc-tint)')
                      : 'transparent',
                    color: zeile
                      ? (warnung ? 'var(--mdc-warn-ink)' : 'var(--mdc-ink)')
                      : 'var(--mdc-ink-faint)',
                    fontWeight: zeile ? 700 : 400,
                  }}
                >
                  {n}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
