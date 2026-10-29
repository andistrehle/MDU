'use client';

// ============================================================
// Mein Spielplan → „Spiel verlegen“ (nur TC / Ligaleitung)
// ============================================================
// Oben die Anfragen, auf die DEIN Team antworten muss (bestätigen /
// ablehnen), darunter die eigenen laufenden Anfragen (zurückziehen) und die
// letzten Entscheidungen; unten das Formular für einen neuen Termin.
// Regeln + Glocke: lib/server/verlegung.ts (Migration 0050).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { alleBegegnungen27, team27, terminKurz, wochenendeText, datumText, SAISON_START, SAISON_ENDE } from '@/lib/data/saison-2027';
import { ladeVerlegungen, frageVerlegungAn, frageHeimrechtAn, verlegungAktion, type Verlegung } from '@/lib/supabase/verlegung';

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const tag = (iso: string) => { const d = new Date(iso + 'T12:00:00Z'); return `${WT[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`; };
const termin = (d: string | null, t: string | null) => (d ? `${tag(d)}${t ? ` ${t}` : ''}` : 'Spielwochenende');
/** Alter Termin: fester Termin, sonst das Plan-Wochenende (statt nur „Spielwochenende“). */
const alterTermin = (v: Verlegung) => {
  if (v.old_date) return termin(v.old_date, v.old_time);
  const b = alleBegegnungen27().find(x => x.key === v.match_key) ?? alleBegegnungen27().find(x => x.home === v.away_team_id && x.away === v.home_team_id);
  return b ? `Spielwochenende ${wochenendeText(b.fri, b.sun, false)}` : 'Spielwochenende';
};
const name = (id: string) => team27(id)?.name ?? id;
const STATUS_TEXT: Record<Verlegung['status'], string> = {
  offen: 'wartet auf den Gegner', freigabe: 'wartet auf die Ligaleitung', bestaetigt: 'bestätigt – wird übernommen',
  uebernommen: 'erledigt', abgelehnt: 'abgelehnt', zurueckgezogen: 'zurückgezogen',
};

export function SpielVerlegen({ teamId }: { teamId: string }) {
  const [liste, setListe] = useState<Verlegung[] | null>(null);
  const [bereit, setBereit] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [key, setKey] = useState('');
  const [datum, setDatum] = useState('');
  const [uhrzeit, setUhrzeit] = useState('');
  const [grund, setGrund] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [ablehnenId, setAblehnenId] = useState<string | null>(null);
  const [ablehnenGrund, setAblehnenGrund] = useState('');
  const [art, setArt] = useState<'verlegung' | 'heimrecht'>('verlegung');
  const [paarKey, setPaarKey] = useState('');

  const laden = useCallback(async () => { const r = await ladeVerlegungen(); setListe(r.rows); setBereit(r.bereit); }, []);
  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  const spiele = useMemo(() => {
    const h = heuteIso();
    return alleBegegnungen27().filter(b => (b.home === teamId || b.away === teamId) && (b.termin?.datum ?? b.sun) >= h)
      .sort((a, b) => (a.termin?.datum ?? a.fri).localeCompare(b.termin?.datum ?? b.fri));
  }, [teamId]);
  const laufend = new Set((liste ?? []).filter(v => v.status === 'offen' || v.status === 'freigabe').map(v => v.match_key));
  // Paarungen fürs Heimrecht: je Gegner Hin- und Rückspiel, beide noch nicht vorbei
  const paare = useMemo(() => {
    const h = heuteIso();
    const d = (b: ReturnType<typeof alleBegegnungen27>[number]) => b.termin?.datum ?? b.fri;
    const eigene = alleBegegnungen27().filter(b => b.home === teamId || b.away === teamId);
    const jeGegner = new Map<string, typeof eigene>();
    for (const b of eigene) { const g = b.home === teamId ? b.away : b.home; jeGegner.set(g, [...(jeGegner.get(g) ?? []), b]); }
    return [...jeGegner.entries()].filter(([, l]) => l.length === 2)
      .map(([g, l]) => { const [hin, rueck] = [...l].sort((x, y) => d(x).localeCompare(d(y))); return { gegner: g, hin, rueck }; })
      .filter(p => (p.hin.termin?.datum ?? p.hin.sun) >= h)
      .sort((x, y) => d(x.hin).localeCompare(d(y.hin)));
  }, [teamId]);
  const paar = paare.find(p => p.hin.key === paarKey);
  const anMich = (liste ?? []).filter(v => v.status === 'offen' && v.requested_team !== teamId);
  const meine = (liste ?? []).filter(v => (v.status === 'offen' || v.status === 'freigabe') && v.requested_team === teamId)
    .concat((liste ?? []).filter(v => v.status === 'freigabe' && v.requested_team !== teamId));
  const erledigt = (liste ?? []).filter(v => !['offen', 'freigabe'].includes(v.status)).slice(0, 5);
  const aussen = !!datum && (datum < SAISON_START || datum > SAISON_ENDE);

  async function sendeTausch() {
    if (!paar) { setMsg({ kind: 'err', text: 'Bitte eine Paarung wählen.' }); return; }
    setLaeuft(true); setMsg(null);
    const { error } = await frageHeimrechtAn({ key: paar.hin.key, grund: grund.trim() || null });
    setLaeuft(false);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    setPaarKey(''); setGrund('');
    setMsg({ kind: 'ok', text: 'Anfrage geschickt – der Teamcaptain des Gegners bekommt sie in die Glocke.' });
    void laden();
  }
  async function senden() {
    if (!key || !datum) { setMsg({ kind: 'err', text: 'Bitte Spiel und neues Datum wählen.' }); return; }
    setLaeuft(true); setMsg(null);
    const { error } = await frageVerlegungAn({ key, datum, uhrzeit: uhrzeit || null, grund: grund.trim() || null });
    setLaeuft(false);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    setKey(''); setDatum(''); setUhrzeit(''); setGrund('');
    setMsg({ kind: 'ok', text: 'Anfrage geschickt – der Teamcaptain des Gegners bekommt sie in die Glocke.' });
    void laden();
  }
  async function aktion(v: Verlegung, a: 'bestaetigen' | 'ablehnen' | 'zurueckziehen', g?: string) {
    setMsg(null);
    const { data, error } = await verlegungAktion(v.id, a, g ?? null);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    setAblehnenId(null); setAblehnenGrund('');
    setMsg({ kind: 'ok', text: a === 'bestaetigen'
      ? (data?.status === 'freigabe' ? 'Bestätigt – weil der Termin außerhalb der Saison liegt, gibt jetzt noch die Ligaleitung frei.'
        : data?.status === 'uebernommen' ? (data.kind === 'heimrecht' ? 'Bestätigt – das Heimrecht ist getauscht, der Spielplan ist in wenigen Minuten angepasst.' : 'Bestätigt – der neue Termin steht in wenigen Minuten überall im Spielplan.')
        : 'Bestätigt – die Ligaleitung übernimmt den Termin in den Spielplan.')
      : a === 'ablehnen' ? 'Abgelehnt – es bleibt, wie es war.' : 'Anfrage zurückgezogen.' });
    void laden();
  }

  if (!bereit && liste !== null) return null; // Migration 0050 fehlt noch → Karte unsichtbar

  return (
    <div style={karte}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', marginBottom: 4 }}>Spiel verlegen / Heimrecht tauschen</div>
      <p style={{ ...klein, margin: '0 0 12px', lineHeight: 1.55 }}>
        Der Teamcaptain des Gegners bestätigt, die Ligaleitung wird informiert.
        Liegt ein neuer Termin vor dem {datumText(SAISON_START)} oder nach dem {datumText(SAISON_ENDE)}, gibt die Ligaleitung zusätzlich frei.
      </p>

      {msg && <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>}

      {anMich.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div style={ueber}>Deine Antwort ist gefragt</div>
          {anMich.map(v => (
            <div key={v.id} style={{ ...zeile, borderColor: 'var(--th-gold)', background: 'rgba(232,184,74,0.10)' }}>
              <div style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{name(v.home_team_id)} – {name(v.away_team_id)}</div>
              <div style={klein}>{v.kind === 'heimrecht'
                ? <>{name(v.requested_team)} möchte das <b style={{ color: 'var(--th-text-strong)' }}>Heimrecht tauschen</b>: Hin- und Rückspiel wechseln Heim und Gast, Termine bleiben.</>
                : <>{name(v.requested_team)} möchte verlegen: <s>{alterTermin(v)}</s> → <b style={{ color: 'var(--th-text-strong)' }}>{termin(v.new_date, v.new_time)}</b></>}{v.reason ? ` · „${v.reason}“` : ''}</div>
              {v.needs_admin && <div style={{ ...klein, color: 'var(--th-gold)' }}>Außerhalb der Saison – nach deiner Bestätigung gibt noch die Ligaleitung frei.</div>}
              {ablehnenId === v.id ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <input value={ablehnenGrund} onChange={e => setAblehnenGrund(e.target.value.slice(0, 200))} placeholder="Grund (freiwillig)" style={{ ...feld, flex: '1 1 180px' }} />
                  <button type="button" onClick={() => void aktion(v, 'ablehnen', ablehnenGrund)} style={knopf(true, 'var(--th-loss)')}>Ablehnen</button>
                  <button type="button" onClick={() => setAblehnenId(null)} style={knopf(false, 'var(--th-text-muted)')}>Abbrechen</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <button type="button" onClick={() => void aktion(v, 'bestaetigen')} style={knopf(true)}>Bestätigen</button>
                  <button type="button" onClick={() => { setAblehnenId(v.id); setAblehnenGrund(''); }} style={knopf(false, 'var(--th-loss)')}>Ablehnen …</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {meine.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div style={ueber}>Laufende Anfragen</div>
          {meine.map(v => (
            <div key={v.id} style={zeile}>
              <div style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{name(v.home_team_id)} – {name(v.away_team_id)}</div>
              <div style={klein}>{v.kind === 'heimrecht' ? <b style={{ color: 'var(--th-text-strong)' }}>Heimrecht tauschen</b> : <>{alterTermin(v)} → <b style={{ color: 'var(--th-text-strong)' }}>{termin(v.new_date, v.new_time)}</b></>} · {STATUS_TEXT[v.status]}</div>
              {v.status === 'offen' && v.requested_team === teamId && <button type="button" onClick={() => void aktion(v, 'zurueckziehen')} style={{ ...knopf(false, 'var(--th-text-muted)'), alignSelf: 'flex-start', marginTop: 6 }}>Zurückziehen</button>}
            </div>
          ))}
        </div>
      )}

      <div role="tablist" style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 999, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', marginBottom: 12, width: 'fit-content', maxWidth: '100%' }}>
        {([['verlegung', 'Termin verlegen'], ['heimrecht', 'Heimrecht tauschen']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={art === k} type="button" onClick={() => { setArt(k); setMsg(null); }} style={{
            padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5,
            background: art === k ? 'var(--th-accent)' : 'transparent', color: art === k ? '#fff' : 'var(--th-text-muted)',
          }}>{l}</button>
        ))}
      </div>

      {art === 'heimrecht' ? (<>
        <label style={lab}>Paarung
          <select value={paarKey} onChange={e => setPaarKey(e.target.value)} style={feld}>
            <option value="">— Gegner wählen —</option>
            {paare.map(p => (
              <option key={p.hin.key} value={p.hin.key} disabled={laufend.has(p.hin.key) || laufend.has(p.rueck.key)}>
                {name(p.gegner)}{laufend.has(p.hin.key) || laufend.has(p.rueck.key) ? ' – Anfrage läuft' : ''}
              </option>
            ))}
          </select>
        </label>
        {paar && (
          <div style={{ ...klein, marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-8)', lineHeight: 1.6 }}>
            {[paar.hin, paar.rueck].map((b, i) => (
              <div key={b.key}>
                <b style={{ color: 'var(--th-text-strong)' }}>{i === 0 ? 'Hinspiel' : 'Rückspiel'}</b> · {b.termin ? terminKurz(b.termin) : `WE ${wochenendeText(b.fri, b.sun, false)}`}:{' '}
                bisher bei <s>{name(b.home)}</s> → künftig bei <b style={{ color: 'var(--th-text-strong)' }}>{name(b.away)}</b>
              </div>
            ))}
            <div style={{ marginTop: 4 }}>Datum und Uhrzeit bleiben. Zusagen und Aufstellung wandern mit. Geht nur, solange es noch keinen Spielbericht gibt.</div>
          </div>
        )}
        <label style={{ ...lab, marginTop: 8 }}>Grund (freiwillig)<input value={grund} onChange={e => setGrund(e.target.value.slice(0, 200))} placeholder="z. B. unser Lokal hat im November zu" style={feld} /></label>
        <button type="button" disabled={laeuft} onClick={() => void sendeTausch()} style={{ ...knopf(true), marginTop: 12, opacity: laeuft ? 0.6 : 1 }}>{laeuft ? 'Sende …' : 'Heimrechttausch anfragen'}</button>
      </>) : (<>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
        <label style={{ ...lab, gridColumn: '1 / -1' }}>Spiel
          <select value={key} onChange={e => setKey(e.target.value)} style={feld}>
            <option value="">— Spiel wählen —</option>
            {spiele.map(b => (
              <option key={b.key} value={b.key} disabled={laufend.has(b.key)}>
                {b.termin ? terminKurz(b.termin) : `WE ${wochenendeText(b.fri, b.sun, false)}`} · {b.home === teamId ? `gegen ${name(b.away)} (H)` : `bei ${name(b.home)} (A)`}{laufend.has(b.key) ? ' – Anfrage läuft' : ''}
              </option>
            ))}
          </select>
        </label>
        <label style={lab}>Neues Datum<input type="date" value={datum} min={heuteIso()} onChange={e => setDatum(e.target.value)} style={feld} /></label>
        <label style={lab}>Uhrzeit<input type="time" value={uhrzeit} onChange={e => setUhrzeit(e.target.value)} style={feld} /></label>
        <label style={{ ...lab, gridColumn: '1 / -1' }}>Grund (freiwillig)<input value={grund} onChange={e => setGrund(e.target.value.slice(0, 200))} placeholder="z. B. Feier im Lokal" style={feld} /></label>
      </div>
      {aussen && <div style={{ ...klein, color: 'var(--th-gold)', marginTop: 8 }}>Dieser Termin liegt außerhalb der Saison – nach der Bestätigung des Gegners muss die Ligaleitung noch freigeben.</div>}
      <button type="button" disabled={laeuft} onClick={() => void senden()} style={{ ...knopf(true), marginTop: 12, opacity: laeuft ? 0.6 : 1 }}>{laeuft ? 'Sende …' : 'Verlegung anfragen'}</button>
      </>)}

      {erledigt.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={ueber}>Zuletzt</div>
          {erledigt.map(v => (
            <div key={v.id} style={{ ...klein, padding: '5px 0', borderTop: '1px solid var(--th-line-4)' }}>
              {name(v.home_team_id)} – {name(v.away_team_id)}: {v.kind === 'heimrecht' ? 'Heimrecht tauschen' : termin(v.new_date, v.new_time)} · <b style={{ color: v.status === 'uebernommen' ? 'var(--th-win)' : v.status === 'abgelehnt' ? 'var(--th-loss)' : 'var(--th-text-muted)' }}>{STATUS_TEXT[v.status]}</b>{v.note && v.status === 'abgelehnt' ? ` („${v.note}“)` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px', marginBottom: 24 };
const klein: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' };
const ueber: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-faint)' };
const zeile: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--th-line-8)', fontFamily: 'var(--font-manrope)', fontSize: 13.5 };
const lab: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-text-muted)', minWidth: 0 };
const feld: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' };
function knopf(voll: boolean, farbe = 'var(--th-accent)'): React.CSSProperties {
  return { padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, border: `1.5px solid ${farbe}`, background: voll ? farbe : 'transparent', color: voll ? '#fff' : farbe };
}
