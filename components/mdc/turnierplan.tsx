'use client';

// ============================================================
// MDC — Doppel-K.-o.-Turnier am Bildschirm
// ============================================================
//
// Der Papierplan, aber klickbar: Teilnehmer eintragen, Plan erzeugen, nach
// jeder Partie den Sieger antippen. Der Rest wandert von selbst durch den
// Plan — auch rückwärts, wenn man sich vertippt hat.
//
// AUSDRÜCKLICH NOCH NICHTS AM SYSTEM. Nichts wird abgelegt, nichts gemeldet,
// keine Punkte gerechnet. Ergebnisse kommen weiter über den Ergebniszettel
// (`/admin/ergebnis`) in die Wertung. Das ist keine Übergangslösung aus
// Bequemlichkeit, sondern die Reihenfolge, die der Betreiber vorgegeben hat:
// erst der Plan, das Einlesen später.
//
// Gespeichert wird trotzdem — im Browser (`localStorage`). Ein Turnierabend
// dauert Stunden, und ein versehentlich geschlossener Reiter darf ihn nicht
// kosten. Das Gerät behält es für sich; auf einem anderen Handy ist nichts da.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Check, ListOrdered, Plus, RotateCcw, Trash2, Trophy,
} from 'lucide-react';
import {
  besetzungen, entfaellt, fortschritt, jetztDran, neuesTurnier, planFuer,
  platzierungen, setzeLegs, setzeSieger, spielbar, ueblicheErgebnisse,
  GEWINNLEGS_STANDARD,
  type Besetzung, type Feldgroesse, type Partie, type Teilnehmer, type Turnier,
} from '@/lib/mdc/doppel-ko';
import { Turnierbaum } from '@/components/mdc/turnierbaum';

export interface PlanSpieler {
  passNr: number;
  name: string;
  nickname: string | null;
}

const SPEICHER = 'mdc-turnierplan';

/** Was im Browser liegt — bewusst schlicht, damit es sich lesen lässt. */
interface Gespeichert {
  feld: Feldgroesse;
  teilnehmer: Teilnehmer[];
  ergebnisse: Record<string, 'a' | 'b'>;
  legs?: Record<string, [number, number]>;
  gewinnlegs?: number;
  titel: string;
}

function name(b: Besetzung): string {
  if (b.art === 'spieler') return b.spieler.name;
  if (b.art === 'freilos') return 'Freilos';
  return 'steht noch nicht fest';
}

export function Turnierplan({ spieler }: { spieler: PlanSpieler[] }) {
  const [titel, setTitel] = useState('');
  const [liste, setListe] = useState<Teilnehmer[]>([]);
  const [suche, setSuche] = useState('');
  const [gast, setGast] = useState('');
  const [gewinnlegs, setGewinnlegs] = useState(GEWINNLEGS_STANDARD);
  const [turnier, setTurnier] = useState<Turnier | null>(null);
  const [geladen, setGeladen] = useState(false);

  // ── Aus dem Browser holen (einmal) ──
  //
  // Das MUSS im Effekt passieren und nicht schon beim ersten Rendern: Auf dem
  // Server gibt es keinen `localStorage`. Läse man ihn gleich mit, käme vom
  // Server eine leere Aufstellung und vom Browser ein laufendes Turnier —
  // zwei verschiedene Seiten für dieselbe Adresse. Deshalb hier, und deshalb
  // die Ausnahme von der Regel gegen `setState` im Effekt.
  useEffect(() => {
    try {
      const roh = window.localStorage.getItem(SPEICHER);
      if (roh) {
        const g = JSON.parse(roh) as Gespeichert;
        const t = neuesTurnier(g.teilnehmer, g.feld, g.gewinnlegs ?? GEWINNLEGS_STANDARD);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTurnier({ ...t, ergebnisse: g.ergebnisse ?? {}, legs: g.legs ?? {} });
        setTitel(g.titel ?? '');
        setGewinnlegs(g.gewinnlegs ?? GEWINNLEGS_STANDARD);
      }
    } catch {
      // Kaputter Eintrag: lieber neu anfangen als hängen bleiben.
    }
    setGeladen(true);
  }, []);

  // ── Und wieder ablegen ──
  useEffect(() => {
    if (!geladen) return;
    try {
      if (turnier) {
        const g: Gespeichert = {
          feld: turnier.feld,
          teilnehmer: turnier.teilnehmer,
          ergebnisse: turnier.ergebnisse,
          legs: turnier.legs,
          gewinnlegs: turnier.gewinnlegs,
          titel,
        };
        window.localStorage.setItem(SPEICHER, JSON.stringify(g));
      } else {
        window.localStorage.removeItem(SPEICHER);
      }
    } catch {
      // Kein Speicher (privates Fenster): Der Plan lebt dann nur im Reiter.
    }
  }, [turnier, titel, geladen]);

  const q = suche.trim().toLowerCase();
  const treffer = useMemo(() => {
    if (!q) return [];
    const drin = new Set(liste.map(t => t.id));
    return spieler
      .filter(s => !drin.has(String(s.passNr)))
      .filter(s => (/^\d+$/.test(q)
        ? String(s.passNr).startsWith(q)
        : s.name.toLowerCase().includes(q) || (s.nickname?.toLowerCase().includes(q) ?? false)))
      .slice(0, 8);
  }, [q, spieler, liste]);

  function dazu(s: PlanSpieler) {
    setListe(alt => [...alt, { id: String(s.passNr), name: s.name, passNr: s.passNr }]);
    setSuche('');
  }

  function gastDazu() {
    const sauber = gast.trim();
    if (!sauber) return;
    setListe(alt => [...alt, { id: `gast-${alt.length + 1}-${sauber}`, name: sauber, passNr: null }]);
    setGast('');
  }

  function verschiebe(index: number, richtung: -1 | 1) {
    const ziel = index + richtung;
    if (ziel < 0 || ziel >= liste.length) return;
    setListe(alt => {
      const neu = [...alt];
      [neu[index], neu[ziel]] = [neu[ziel], neu[index]];
      return neu;
    });
  }

  function starten() {
    if (liste.length < 3) return;
    setTurnier(neuesTurnier(liste, undefined, gewinnlegs));
  }

  function verwerfen() {
    if (!window.confirm(
      'Turnierplan verwerfen?\n\nAlle eingetragenen Ergebnisse dieses Plans sind dann weg. '
      + 'In der Wertung stand ohnehin nichts davon.',
    )) return;
    setTurnier(null);
    setListe([]);
    setTitel('');
  }

  if (!geladen) return null;

  // ────────────────────────────────────────────────────────
  // Aufstellen
  // ────────────────────────────────────────────────────────
  if (!turnier) {
    const feld = liste.length >= 3 ? planFuer(liste.length) : null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Hinweis />

        <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Teilnehmer</h2>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            In der Reihenfolge eintragen, in der gesetzt wird: Wer zuerst steht, ist die
            Nummer 1 auf dem Plan. Verschieben geht mit den Pfeilen. Wer keine Passnummer
            hat, kommt als Gast dazu.
          </p>

          <label style={{ display: 'block', marginTop: 16 }}>
            <span style={label}>Turnier (nur für die Überschrift)</span>
            <input
              value={titel}
              onChange={e => setTitel(e.target.value)}
              placeholder="z. B. Harlekin, Donnerstag"
              style={eingabe}
            />
          </label>

          <label style={{ display: 'block', marginTop: 14 }}>
            <span style={label}>Modus</span>
            <select
              value={gewinnlegs}
              onChange={e => setGewinnlegs(Number(e.target.value))}
              style={eingabe}
            >
              <option value={1}>1 Gewinnleg (ein Leg entscheidet)</option>
              <option value={2}>2 Gewinnlegs — best of 3 (üblich)</option>
              <option value={3}>3 Gewinnlegs — best of 5</option>
            </select>
            <span style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
              Bestimmt nur die Schnellknöpfe beim Eintragen. Jedes andere Ergebnis lässt sich
              trotzdem eingeben.
            </span>
          </label>

          <label style={{ display: 'block', marginTop: 14 }}>
            <span style={label}>Spieler suchen (Name oder Passnummer)</span>
            <input
              value={suche}
              onChange={e => setSuche(e.target.value)}
              placeholder="z. B. 153 oder Pogremno"
              inputMode="search"
              style={eingabe}
            />
          </label>

          {q !== '' && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {treffer.length === 0 ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--mdc-ink-soft)' }}>
                  Dazu findet sich niemand. Als Gast eintragen geht unten.
                </p>
              ) : treffer.map(s => (
                <button key={s.passNr} type="button" onClick={() => dazu(s)} style={trefferStil}>
                  <span className="mdc-num" style={{ minWidth: 44, color: 'var(--mdc-red)', fontWeight: 700 }}>
                    {s.passNr}
                  </span>
                  <span style={{ flex: 1 }}>{s.name}{s.nickname ? ` (${s.nickname})` : ''}</span>
                  <Plus size={15} style={{ color: 'var(--mdc-ink-dim)' }} />
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'flex-end' }}>
            <label style={{ flex: 1 }}>
              <span style={label}>Gast ohne Passnummer</span>
              <input
                value={gast}
                onChange={e => setGast(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); gastDazu(); } }}
                placeholder="Name"
                style={eingabe}
              />
            </label>
            <button type="button" className="mdc-btn mdc-btn-ghost" onClick={gastDazu} disabled={!gast.trim()}>
              <Plus size={16} />
              Dazu
            </button>
          </div>
        </div>

        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>Setzliste</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--mdc-ink-dim)' }}>
              {liste.length} {liste.length === 1 ? 'Teilnehmer' : 'Teilnehmer'}
              {feld ? ` · ${feld}er-Plan` : ''}
            </span>
          </div>

          {liste.length === 0 ? (
            <p style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--mdc-ink-soft)' }}>
              Noch niemand eingetragen.
            </p>
          ) : (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {liste.map((t, i) => (
                <div key={t.id} style={zeileStil}>
                  <span className="mdc-num" style={{ minWidth: 32, fontWeight: 700, color: 'var(--mdc-navy)' }}>
                    {i + 1}.
                  </span>
                  <span style={{ flex: 1 }}>
                    {t.name}
                    {t.passNr === null && (
                      <span className="mdc-chip" style={{ marginLeft: 8 }}>Gast</span>
                    )}
                  </span>
                  <button type="button" onClick={() => verschiebe(i, -1)} disabled={i === 0} style={iconStil} aria-label="Nach oben">↑</button>
                  <button type="button" onClick={() => verschiebe(i, 1)} disabled={i === liste.length - 1} style={iconStil} aria-label="Nach unten">↓</button>
                  <button
                    type="button"
                    onClick={() => setListe(alt => alt.filter((_, j) => j !== i))}
                    style={iconStil}
                    aria-label="Entfernen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {feld && liste.length < feld && (
            <p style={{ marginTop: 14, fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--mdc-ink-dim)' }}>
              Der {feld}er-Plan hat {feld} Plätze; die übrigen {feld - liste.length} sind
              Freilose. Wer eins zieht, ist ohne Wurf eine Runde weiter — das rechnet der Plan
              selbst.
            </p>
          )}

          <button
            type="button"
            className="mdc-btn mdc-btn-primary"
            style={{ marginTop: 18 }}
            onClick={starten}
            disabled={liste.length < 3}
          >
            <Trophy size={17} />
            Plan erstellen
          </button>
          {liste.length < 3 && (
            <span style={{ marginLeft: 12, fontSize: '0.85rem', color: 'var(--mdc-ink-dim)' }}>
              Mindestens drei Teilnehmer.
            </span>
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // Laufendes Turnier
  // ────────────────────────────────────────────────────────
  const dran = jetztDran(turnier);
  const stand = fortschritt(turnier);
  const platz = platzierungen(turnier);
  const platzSpiele = turnier.partien.filter(p => p.seite === 'platz' && !entfaellt(turnier, p));

  const klick = (partie: Partie, seite: 'a' | 'b') => {
    const bisher = turnier.ergebnisse[partie.id];
    setTurnier(setzeSieger(turnier, partie.id, bisher === seite ? null : seite));
  };

  const legs = (partie: Partie, a: number, b: number) => {
    setTurnier(setzeLegs(turnier, partie.id, a, b));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Hinweis />

      <div className="mdc-card mdc-card-accent" style={{ padding: '20px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>
            {titel || `${turnier.feld}er-Turnier`}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--mdc-ink-dim)' }}>
            {turnier.teilnehmer.length} Teilnehmer · {stand.gespielt} gespielt · {stand.offen} offen
          </span>
        </div>
        <button type="button" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }} onClick={verwerfen}>
          <ArrowLeft size={14} />
          Plan verwerfen und neu anfangen
        </button>
      </div>

      {/* ── Was jetzt gespielt wird ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>
          {dran.length ? 'Jetzt dran' : 'Turnier durch'}
        </h2>
        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          {dran.length
            ? 'Sieger antippen. Wer zweimal verloren hat, ist draußen — der Plan rechnet den Rest.'
            : 'Alle Partien sind entschieden. Die Platzierung steht unten.'}
        </p>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dran.map(partie => (
            <PartieKarte
              key={partie.id}
              turnier={turnier}
              partie={partie}
              onKlick={klick}
              onLegs={legs}
              gross
            />
          ))}
        </div>
      </div>

      {/* ── Platzierung ── */}
      {platz.length > 0 && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <ListOrdered size={19} style={{ color: 'var(--mdc-red)' }} />
            Platzierung
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Steht fest, sobald jemand ausgeschieden ist. Die Plätze folgen der Ergebnisliste:
            1 bis 8 einzeln, danach 9, 13, 17 und 25 als Gruppe.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {platz.map(p => (
              <div key={p.spieler.id} style={{ display: 'flex', gap: 12, padding: '6px 4px', fontSize: '0.95rem' }}>
                <span className="mdc-num" style={{ minWidth: 40, textAlign: 'right', fontWeight: 700, color: 'var(--mdc-red)' }}>
                  {p.platz}.
                </span>
                <span style={{ flex: 1 }}>{p.spieler.name}</span>
                {p.spieler.passNr !== null && (
                  <span className="mdc-num" style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
                    {p.spieler.passNr}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Der Turnierbaum ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Turnierbaum</h2>
        <p style={{ marginTop: 8, marginBottom: 14, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Derselbe Aufbau wie auf dem Zettel: in der Mitte die erste Runde mit den
          Setznummern, rechts die Siegerseite, links die Verliererseite. Unter dem Kasten,
          der gerade dran ist, stehen die Ergebnisknöpfe. Ein Name lässt sich auch antippen —
          das setzt den Sieger ohne Ergebnis, und ein zweiter Tipp nimmt ihn zurück.
        </p>
        <Turnierbaum turnier={turnier} onWaehle={klick} onLegs={legs} />
      </div>

      {/* ── Platzierungsspiele ── */}
      {platzSpiele.length > 0 && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Spiele um die Plätze</h2>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Stehen so auf dem Papierplan. Ohne sie teilen sich die Betroffenen den Platz.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {platzSpiele.map(partie => (
              <div key={partie.id}>
                <h3 className="mdc-display" style={{ fontSize: '0.9rem', color: 'var(--mdc-navy)', marginBottom: 6 }}>
                  {partie.titel}
                </h3>
                <PartieKarte turnier={turnier} partie={partie} onKlick={klick} onLegs={legs} gross />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Eine Partie
// ------------------------------------------------------------

function PartieKarte({ turnier, partie, onKlick, onLegs, gross }: {
  turnier: Turnier;
  partie: Partie;
  onKlick: (partie: Partie, seite: 'a' | 'b') => void;
  onLegs: (partie: Partie, a: number, b: number) => void;
  gross?: boolean;
}) {
  const { a, b } = besetzungen(turnier, partie);
  const sieger = turnier.ergebnisse[partie.id];
  const stand = turnier.legs[partie.id];
  const offen = spielbar(turnier, partie) && !sieger;
  const weg = entfaellt(turnier, partie);

  if (weg) {
    // Steht auf der anderen Seite schon jemand, ist er ohne Wurf weiter.
    // Steht dort noch niemand, entfällt die Partie einfach — „steht noch
    // nicht fest — Freilos" wäre eine Zeile, über die man zweimal liest.
    const anderer = a.art === 'freilos' ? b : a;
    return (
      <div style={{ ...partieStil, opacity: 0.55 }}>
        <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--mdc-ink-dim)' }}>
          {anderer.art === 'spieler'
            ? `${anderer.spieler.name} — Freilos, ohne Wurf weiter`
            : 'Entfällt — Freilos'}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        ...partieStil,
        borderColor: offen ? 'var(--mdc-red-a35)' : 'var(--mdc-line)',
        background: offen ? 'var(--mdc-red-a08)' : 'var(--mdc-card-2)',
      }}
    >
      {(['a', 'b'] as const).map(seite => {
        const b_ = seite === 'a' ? a : b;
        const gewinnt = sieger === seite;
        const verliert = sieger !== undefined && !gewinnt;
        const klickbar = b_.art === 'spieler' && (spielbar(turnier, partie) || sieger !== undefined);
        return (
          <button
            key={seite}
            type="button"
            disabled={!klickbar}
            onClick={() => onKlick(partie, seite)}
            style={{
              flex: 1, minWidth: 120, textAlign: 'left', cursor: klickbar ? 'pointer' : 'default',
              padding: gross ? '12px 14px' : '9px 11px',
              borderRadius: 9, font: 'inherit',
              fontSize: gross ? '1rem' : '0.92rem',
              border: `1px solid ${gewinnt ? 'var(--mdc-win)' : 'var(--mdc-line)'}`,
              background: gewinnt ? 'rgba(20, 122, 61, 0.10)' : 'var(--mdc-card)',
              color: verliert ? 'var(--mdc-ink-dim)' : 'var(--mdc-ink)',
              fontWeight: gewinnt ? 700 : 400,
              textDecoration: verliert ? 'line-through' : 'none',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {gewinnt && <Check size={15} style={{ color: 'var(--mdc-win)', flexShrink: 0 }} />}
            <span style={{ flex: 1 }}>{name(b_)}</span>
            {stand && (
              <span
                className="mdc-num"
                style={{ fontWeight: 700, color: gewinnt ? 'var(--mdc-win)' : 'var(--mdc-ink-dim)' }}
              >
                {seite === 'a' ? stand[0] : stand[1]}
              </span>
            )}
          </button>
        );
      })}
      {sieger && (
        <button
          type="button"
          onClick={() => onKlick(partie, sieger)}
          style={iconStil}
          aria-label="Entscheidung zurücknehmen"
          title="Entscheidung zurücknehmen"
        >
          <RotateCcw size={14} />
        </button>
      )}

      {/* ── Ergebnis eintragen ──
          Zwei Wege: die üblichen Ergebnisse als Knopf (ein Tipp im Lokal) und
          zwei Felder für alles andere. Der Sieger ergibt sich daraus; wer nur
          den Namen antippt, bekommt einen Sieger ohne Ergebnis — auch das ist
          in Ordnung, der Plan braucht die Legs nicht. */}
      {gross && spielbar(turnier, partie) && (
        <div style={{ flexBasis: '100%', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--mdc-ink-dim)', marginRight: 2 }}>
            Ergebnis:
          </span>
          {ueblicheErgebnisse(turnier.gewinnlegs).flatMap(([hoch, tief]) => [
            [hoch, tief] as [number, number],
            [tief, hoch] as [number, number],
          ]).map(([a_, b_]) => {
            const aktiv = stand?.[0] === a_ && stand?.[1] === b_;
            return (
              <button
                key={`${a_}-${b_}`}
                type="button"
                onClick={() => onLegs(partie, a_, b_)}
                style={{
                  ...legKnopf,
                  borderColor: aktiv ? 'var(--mdc-win)' : 'var(--mdc-line)',
                  background: aktiv ? 'rgba(20, 122, 61, 0.10)' : 'var(--mdc-card)',
                  fontWeight: aktiv ? 700 : 400,
                }}
              >
                {a_}:{b_}
              </button>
            );
          })}
          <FreiesErgebnis partie={partie} stand={stand} onLegs={onLegs} />
        </div>
      )}
    </div>
  );
}

/** Zwei kleine Felder für ein Ergebnis, das nicht auf einen Knopf passt. */
function FreiesErgebnis({ partie, stand, onLegs }: {
  partie: Partie;
  stand?: [number, number];
  onLegs: (partie: Partie, a: number, b: number) => void;
}) {
  const [offen, setOffen] = useState(false);
  const [a, setA] = useState(stand ? String(stand[0]) : '');
  const [b, setB] = useState(stand ? String(stand[1]) : '');

  if (!offen) {
    return (
      <button type="button" onClick={() => setOffen(true)} style={{ ...legKnopf, color: 'var(--mdc-ink-dim)' }}>
        anderes …
      </button>
    );
  }

  const uebernehmen = () => {
    const za = Number(a);
    const zb = Number(b);
    if (!Number.isInteger(za) || !Number.isInteger(zb) || za < 0 || zb < 0) return;
    onLegs(partie, za, zb);
    setOffen(false);
  };

  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      <input
        value={a}
        onChange={e => setA(e.target.value.replace(/\D/g, ''))}
        inputMode="numeric"
        style={legFeld}
        aria-label="Legs oben"
      />
      <span style={{ color: 'var(--mdc-ink-dim)' }}>:</span>
      <input
        value={b}
        onChange={e => setB(e.target.value.replace(/\D/g, ''))}
        inputMode="numeric"
        style={legFeld}
        aria-label="Legs unten"
      />
      <button type="button" onClick={uebernehmen} style={{ ...legKnopf, borderColor: 'var(--mdc-red-a35)' }}>
        <Check size={13} />
      </button>
    </span>
  );
}

function Hinweis() {
  return (
    <div
      className="mdc-card"
      style={{
        padding: '16px 18px', display: 'flex', gap: 12,
        borderColor: 'var(--mdc-warn-line)', background: 'var(--mdc-warn-tint)',
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-warn-ink)' }} />
      <p style={{ fontSize: '0.9rem', lineHeight: 1.65 }}>
        <strong>Noch nicht am System.</strong> Dieser Plan rechnet nichts in die Wertung und
        legt nichts ab — er ersetzt nur den Zettel an der Wand. In die Rangliste kommt das
        Turnier weiterhin über <strong>Ergebnis hochladen</strong>. Der Plan liegt solange in
        diesem Browser; auf einem anderen Gerät ist er nicht da.
      </p>
    </div>
  );
}

// ------------------------------------------------------------
// Stile — gelten nur hier, deshalb nicht im Stylesheet.
// ------------------------------------------------------------

const label: React.CSSProperties = {
  fontFamily: 'var(--mdc-font-display)', fontSize: '0.72rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
};

const eingabe: React.CSSProperties = {
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
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 10px', borderRadius: 9,
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card-2)',
  fontSize: '0.95rem',
};

const partieStil: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
  padding: '8px 10px', borderRadius: 10, border: '1px solid var(--mdc-line)',
};

const legKnopf: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 9px', borderRadius: 7, fontSize: '0.82rem',
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card)',
  color: 'var(--mdc-ink)', cursor: 'pointer', font: 'inherit',
  fontVariantNumeric: 'tabular-nums',
};

const legFeld: React.CSSProperties = {
  width: 34, padding: '4px 6px', textAlign: 'center', fontSize: '0.82rem',
  border: '1px solid var(--mdc-line-hard)', borderRadius: 7,
  background: 'var(--mdc-card)', color: 'var(--mdc-ink)', font: 'inherit',
};

const iconStil: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card)',
  color: 'var(--mdc-ink-soft)', cursor: 'pointer', font: 'inherit',
};
