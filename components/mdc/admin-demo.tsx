'use client';

// ============================================================
// MDC — Turnierverwaltung (Oberflächen-Demo)
// ============================================================
//
// Zeigt den Ablauf eines Turnierabends: anlegen → melden → Ergebnis → abschließen.
//
// WICHTIG: Das ist ausschließlich eine Oberfläche. Es gibt keine Anmeldung,
// keinen Server und keine Datenbank — alles lebt im Browser-Zustand und ist
// nach dem Neuladen weg. Nichts wird gespeichert, nichts wird verschickt.
// Der Zuschnitt ist aber schon der echte: dieselben Felder, dieselbe
// Punktelogik (`lib/mdc/points.ts`) wie in der Auswertung.
// ============================================================

import { useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, ChevronRight, Lock, Plus, Search, Trash2, Trophy,
} from 'lucide-react';
import { pointsFor, bracketSizeFor } from '@/lib/mdc/points';
import { formatNumber } from '@/lib/mdc/format';

export interface AdminPlayerOption {
  id: string;
  passNr: number;
  name: string;
  nickname: string | null;
}

interface AdminDemoProps {
  venues: { id: string; name: string; weekday: string; time: string }[];
  players: AdminPlayerOption[];
}

type Step = 'setup' | 'field' | 'results' | 'done';

const STEP_LABEL: Record<Step, string> = {
  setup: 'Turnier anlegen',
  field: 'Spieler melden',
  results: 'Ergebnis eintragen',
  done: 'Abgeschlossen',
};

const STEPS: Step[] = ['setup', 'field', 'results', 'done'];

export function AdminDemo({ venues, players }: AdminDemoProps) {
  const [step, setStep] = useState<Step>('setup');

  // Schritt 1 — Turnierkopf
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [date, setDate] = useState('2026-08-10');
  const [time, setTime] = useState('20:00');
  const [maxPlayers, setMaxPlayers] = useState(24);
  const [entryFee, setEntryFee] = useState(5);

  // Schritt 2 — Meldeliste
  const [query, setQuery] = useState('');
  const [field, setField] = useState<AdminPlayerOption[]>([]);

  const venue = venues.find(v => v.id === venueId);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const chosen = new Set(field.map(p => p.id));
    return players
      .filter(p => !chosen.has(p.id))
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.nickname?.toLowerCase().includes(q) ?? false) ||
        String(p.passNr).startsWith(q),
      )
      .slice(0, 8);
  }, [query, players, field]);

  const addPlayer = (player: AdminPlayerOption) => {
    if (field.length >= maxPlayers) return;
    setField(current => [...current, player]);
    setQuery('');
  };

  const removePlayer = (id: string) =>
    setField(current => current.filter(p => p.id !== id));

  const move = (index: number, direction: -1 | 1) => {
    setField(current => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const canStart = field.length >= 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Fortschritt */}
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {STEPS.map((item, index) => {
          const active = item === step;
          const done = STEPS.indexOf(step) > index;
          return (
            <li
              key={item}
              className="mdc-chip"
              style={{
                borderColor: active ? 'var(--mdc-red)' : undefined,
                background: active ? 'var(--mdc-red-a08)' : undefined,
                color: active ? 'var(--mdc-red-deep)' : done ? 'var(--mdc-navy)' : undefined,
              }}
            >
              {done ? <Check size={13} /> : <span className="mdc-num">{index + 1}</span>}
              {STEP_LABEL[item]}
            </li>
          );
        })}
      </ol>

      {/* ── Schritt 1: Turnier anlegen ── */}
      {step === 'setup' && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display mdc-h3" style={{ marginBottom: 18 }}>Turnier anlegen</h2>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <div>
              <label className="mdc-label" htmlFor="admin-venue">Lokal</label>
              <select
                id="admin-venue"
                className="mdc-select"
                value={venueId}
                onChange={event => setVenueId(event.target.value)}
              >
                {venues.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.weekday} {item.time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mdc-label" htmlFor="admin-date">Datum</label>
              <input
                id="admin-date"
                className="mdc-input"
                type="date"
                value={date}
                onChange={event => setDate(event.target.value)}
              />
            </div>

            <div>
              <label className="mdc-label" htmlFor="admin-time">Startzeit</label>
              <input
                id="admin-time"
                className="mdc-input"
                type="time"
                value={time}
                onChange={event => setTime(event.target.value)}
              />
            </div>

            <div>
              <label className="mdc-label" htmlFor="admin-max">Teilnehmerzahl (max.)</label>
              <select
                id="admin-max"
                className="mdc-select"
                value={maxPlayers}
                onChange={event => setMaxPlayers(Number(event.target.value))}
              >
                {[8, 16, 24, 32].map(value => (
                  <option key={value} value={value}>{value} Starter</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mdc-label" htmlFor="admin-fee">Startgeld</label>
              <input
                id="admin-fee"
                className="mdc-input"
                type="number"
                min={0}
                max={50}
                value={entryFee}
                onChange={event => setEntryFee(Number(event.target.value))}
              />
            </div>
          </div>

          <p style={{ marginTop: 16, fontSize: '0.84rem', color: 'var(--mdc-ink-soft)' }}>
            Turnierbaum: bis {bracketSizeFor(maxPlayers)} Plätze · Doppel-K.-o.
          </p>

          <button type="button" className="mdc-btn mdc-btn-primary" style={{ marginTop: 18 }} onClick={() => setStep('field')}>
            Weiter zur Meldeliste
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {/* ── Schritt 2: Meldeliste ── */}
      {step === 'field' && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>Spieler melden</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--mdc-ink-soft)', marginBottom: 18 }}>
            {venue?.name} · {date} · {field.length} von {maxPlayers} gemeldet
          </p>

          <label className="mdc-label" htmlFor="admin-search">Spieler oder Passnummer suchen</label>
          <div style={{ position: 'relative', maxWidth: 460 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: 15, color: 'var(--mdc-ink-dim)' }}
            />
            <input
              id="admin-search"
              className="mdc-input"
              style={{ paddingLeft: 36 }}
              placeholder="z. B. Ruhland oder 23"
              value={query}
              onChange={event => setQuery(event.target.value)}
              autoComplete="off"
            />

            {suggestions.length > 0 && (
              <ul
                className="mdc-card"
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5,
                  marginTop: 6, padding: 6, maxHeight: 280, overflowY: 'auto',
                }}
              >
                {suggestions.map(player => (
                  <li key={player.id}>
                    <button
                      type="button"
                      onClick={() => addPlayer(player)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 6, background: 'transparent',
                        border: 'none', color: 'var(--mdc-ink)', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <Plus size={15} style={{ color: 'var(--mdc-red)' }} />
                      <span style={{ flex: 1 }}>
                        {player.name}
                        {player.nickname && (
                          <span style={{ color: 'var(--mdc-ink-dim)' }}> „{player.nickname}“</span>
                        )}
                      </span>
                      <span className="mdc-num" style={{ color: 'var(--mdc-ink-dim)', fontSize: '0.8rem' }}>
                        {player.passNr}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {field.length > 0 && (
            <ul style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {field.map((player, index) => (
                <li
                  key={player.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                    borderRadius: 8, background: 'var(--mdc-tint-2)',
                  }}
                >
                  <span className="mdc-num" style={{ width: 26, color: 'var(--mdc-ink-dim)' }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, color: 'var(--mdc-ink)' }}>{player.name}</span>
                  <span className="mdc-num" style={{ color: 'var(--mdc-ink-dim)', fontSize: '0.8rem' }}>
                    Passnr. {player.passNr}
                  </span>
                  <button
                    type="button"
                    aria-label={`${player.name} entfernen`}
                    onClick={() => removePlayer(player.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--mdc-ink-dim)', cursor: 'pointer', padding: 6 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
            <button type="button" className="mdc-btn mdc-btn-ghost" onClick={() => setStep('setup')}>
              Zurück
            </button>
            <button
              type="button"
              className="mdc-btn mdc-btn-primary"
              disabled={!canStart}
              style={!canStart ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
              onClick={() => canStart && setStep('results')}
            >
              Turnier starten
              <ChevronRight size={17} />
            </button>
          </div>

          {!canStart && (
            <p style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
              Mindestens vier Starter — darunter läuft kein Ranglistenturnier.
            </p>
          )}
        </div>
      )}

      {/* ── Schritt 3: Ergebnis ── */}
      {step === 'results' && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>Ergebnis eintragen</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--mdc-ink-soft)', marginBottom: 18 }}>
            Reihenfolge = Endplatzierung. Die Punkte rechnet die Serie selbst aus —
            aus Platz und Teilnehmerzahl ({field.length} Starter).
          </p>

          <div className="mdc-scroll-x">
            <table className="mdc-table">
              <thead>
                <tr>
                  <th>Platz</th>
                  <th>Spieler</th>
                  <th className="mdc-td-num">Punkte</th>
                  <th style={{ width: 96 }}>Verschieben</th>
                </tr>
              </thead>
              <tbody>
                {field.map((player, index) => (
                  <tr key={player.id}>
                    <td className="mdc-num" style={{ fontWeight: 700 }}>{index + 1}.</td>
                    <td>
                      {player.name}
                      <span className="mdc-num" style={{ color: 'var(--mdc-ink-dim)', fontSize: '0.78rem' }}>
                        {' '}· {player.passNr}
                      </span>
                    </td>
                    <td className="mdc-td-num mdc-num" style={{ fontWeight: 700, color: 'var(--mdc-ink)' }}>
                      {formatNumber(pointsFor(index + 1, field.length))}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          aria-label={`${player.name} nach oben`}
                          onClick={() => move(index, -1)}
                          className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                          style={{ padding: '5px 8px', minHeight: 30 }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${player.name} nach unten`}
                          onClick={() => move(index, 1)}
                          className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                          style={{ padding: '5px 8px', minHeight: 30 }}
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
            <button type="button" className="mdc-btn mdc-btn-ghost" onClick={() => setStep('field')}>
              Zurück
            </button>
            <button type="button" className="mdc-btn mdc-btn-primary" onClick={() => setStep('done')}>
              <Lock size={16} />
              Turnier abschließen
            </button>
          </div>
        </div>
      )}

      {/* ── Schritt 4: Abschluss ── */}
      {step === 'done' && (
        <div className="mdc-card mdc-card-accent" style={{ padding: '26px 20px' }}>
          <Trophy size={26} style={{ color: 'var(--mdc-red)' }} />
          <h2 className="mdc-display mdc-h3" style={{ marginTop: 12 }}>Turnier abgeschlossen</h2>
          <p style={{ marginTop: 8, color: 'var(--mdc-ink-soft)', fontSize: '0.92rem', lineHeight: 1.65, maxWidth: 640 }}>
            {venue?.name} am {date}, {field.length} Starter, {entryFee} € Startgeld.
            Sieger: <strong style={{ color: 'var(--mdc-ink)' }}>{field[0]?.name}</strong> mit{' '}
            {formatNumber(pointsFor(1, field.length))} Punkten.
          </p>

          <p
            style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 8,
              background: 'var(--mdc-red-a08)', border: '1px solid var(--mdc-red-a35)',
              fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-ink-soft)',
            }}
          >
            In dieser Vorschau wurde nichts gespeichert. Im späteren Betrieb würde
            das Turnier hier in die Datenbank geschrieben, die Rangliste neu berechnet
            und die Ergebnisseite veröffentlicht.
          </p>

          <button
            type="button"
            className="mdc-btn mdc-btn-ghost"
            style={{ marginTop: 18 }}
            onClick={() => { setField([]); setStep('setup'); }}
          >
            Neues Turnier anlegen
          </button>
        </div>
      )}
    </div>
  );
}
