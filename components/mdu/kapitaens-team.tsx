'use client';

// ============================================================
// Co-Captain und Vertretung für den Spielbericht (Migration 0062)
// ============================================================
// Betreiber, 29.10.2026. Für ALLE Teams (nicht nur Team Manager):
// • Co-Captain: der Kapitän bestimmt höchstens einen und hakt die Rechte an
//   (Spielberichte, Team Manager, Teamkasse, Verlegung & Heimrecht) —
//   jederzeit änderbar oder ganz entziehbar.
// • Vertretung: Kapitän oder Co-Captain (Spielberichte) teilt für ein
//   Heimspiel jemanden ein, der den Spielbericht anlegt, live führt und
//   absendet. Endet mit dem Absenden, spätestens Dienstag 24 Uhr.
// Server: /api/team/kapitaene. Mit `matchKey` zeigt die Karte nur dieses Spiel
// (Spieltag-Seite im Team Manager).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TC_RECHTE, TC_RECHT_TEXT, type TcRecht } from '@/lib/auth/roles';
import { karte, h2 } from './zusagen-ui';

interface Lage {
  kapitaene: { userId: string; name: string }[];
  coCaptain: { userId: string; name: string; rechte: TcRecht[] } | null;
  mitglieder: { userId: string; name: string; kapitaen: boolean }[];
  vertretungen: { id: string; matchKey: string; spiel: string; userId: string; name: string; gueltigBis: string }[];
  heimspiele: { key: string; text: string }[];
  darf: { coCaptain: boolean; vertreter: boolean };
}
type Meldung = { ok: boolean; text: string } | null;

async function aufruf(url: string, body?: unknown): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (!token) return { ok: false, json: { error: 'Nicht angemeldet.' } };
  try {
    const r = await fetch(url, body ? { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { headers: { Authorization: `Bearer ${token}` } });
    return { ok: r.ok, json: await r.json().catch(() => ({})) };
  } catch { return { ok: false, json: { error: 'Keine Verbindung – bitte noch einmal versuchen.' } }; }
}

const text: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.5 };
const leise: React.CSSProperties = { ...text, fontSize: 12.5, color: 'var(--th-text-muted)' };
const feld: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14 };
const knopf = (voll: boolean): React.CSSProperties => ({ padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, border: '1.5px solid var(--th-accent)', background: voll ? 'var(--th-accent)' : 'transparent', color: voll ? '#fff' : 'var(--th-accent)' });
const hinweisStil = (m: NonNullable<Meldung>): React.CSSProperties => ({ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: m.ok ? 'var(--th-win)' : 'var(--th-loss, #d64545)' });
const bis = (iso: string) => new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Lädt die Lage einmal und teilt sie den Karten mit. */
function useLage(teamId: string) {
  const [lage, setLage] = useState<Lage | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const uebernehmen = useCallback((r: { ok: boolean; json: Record<string, unknown> }) => {
    if (r.ok) { setLage(r.json as unknown as Lage); setFehler(null); } else setFehler(String(r.json.error ?? 'Laden fehlgeschlagen.'));
  }, []);
  const laden = useCallback(async () => uebernehmen(await aufruf(`/api/team/kapitaene?team=${encodeURIComponent(teamId)}`)), [teamId, uebernehmen]);
  useEffect(() => {
    let weg = false;
    aufruf(`/api/team/kapitaene?team=${encodeURIComponent(teamId)}`).then(r => { if (!weg) uebernehmen(r); });
    return () => { weg = true; };
  }, [teamId, uebernehmen]);
  return { lage, fehler, laden };
}

/** Beide Karten zusammen (Mein Team, Team-Manager-Dashboard). */
export function KapitaensTeam({ teamId }: { teamId: string }) {
  const { lage, fehler, laden } = useLage(teamId);
  // Fehlt die Migration noch (oder kein Zugriff), bleibt die Karte einfach weg.
  if (fehler) return /Migration/.test(fehler) || /Zugriff/.test(fehler) ? null
    : <section style={karte}><h2 style={h2}>Co-Captain &amp; Vertretung</h2><div role="alert" style={hinweisStil({ ok: false, text: fehler })}>{fehler}</div></section>;
  if (!lage) return null;
  return (
    <>
      <CoCaptainKarte teamId={teamId} lage={lage} neuLaden={laden} />
      {(lage.darf.vertreter || lage.vertretungen.length > 0) && <VertretungKarte teamId={teamId} lage={lage} neuLaden={laden} />}
    </>
  );
}

/** Nur die Vertretung für EIN Spiel (Spieltag-Seite). */
export function VertretungFuerSpiel({ teamId, matchKey }: { teamId: string; matchKey: string }) {
  const { lage, laden } = useLage(teamId);
  if (!lage || !lage.darf.vertreter) return null;
  if (!lage.heimspiele.some(h => h.key === matchKey) && !lage.vertretungen.some(v => v.matchKey === matchKey)) return null;
  return <VertretungKarte teamId={teamId} lage={lage} neuLaden={laden} nurSpiel={matchKey} />;
}

function CoCaptainKarte({ teamId, lage, neuLaden }: { teamId: string; lage: Lage; neuLaden: () => Promise<void> }) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const [wer, setWer] = useState('');
  const [rechte, setRechte] = useState<TcRecht[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  const [m, setM] = useState<Meldung>(null);
  const co = lage.coCaptain;

  function starten() {
    setWer(co?.userId ?? ''); setRechte(co?.rechte ?? ['spielberichte']); setBearbeiten(true); setM(null);
  }
  async function speichern(entfernen = false) {
    if (!entfernen && !wer) { setM({ ok: false, text: 'Bitte jemanden aus dem Team wählen.' }); return; }
    if (!entfernen && !rechte.length) { setM({ ok: false, text: 'Bitte mindestens ein Recht anhaken – oder „Co-Captain entfernen“.' }); return; }
    if (entfernen && !confirm(`${co?.name ?? 'Der Co-Captain'} verliert alle Co-Captain-Rechte. Fortfahren?`)) return;
    setLaeuft(true); setM(null);
    const r = await aufruf('/api/team/kapitaene', entfernen ? { team: teamId, aktion: 'co_entfernen' } : { team: teamId, aktion: 'co_setzen', userId: wer, rechte });
    setLaeuft(false);
    if (!r.ok) { setM({ ok: false, text: String(r.json.error ?? 'Speichern fehlgeschlagen.') }); return; }
    setBearbeiten(false);
    setM({ ok: true, text: entfernen ? 'Co-Captain entfernt – er hat eine Nachricht bekommen.' : 'Gespeichert – dein Co-Captain hat eine Nachricht bekommen.' });
    await neuLaden();
  }

  return (
    <section style={karte}>
      <h2 style={h2}>Co-Captain</h2>
      <div style={text}>
        Kapitän: <strong>{lage.kapitaene.map(k => k.name).join(', ') || '–'}</strong>
        <br />Co-Captain: {co ? <strong>{co.name}</strong> : <span style={{ color: 'var(--th-text-muted)' }}>keiner</span>}
        {co && <span style={{ color: 'var(--th-text-muted)' }}> · {co.rechte.map(r => TC_RECHT_TEXT[r].label).join(', ')}</span>}
      </div>
      {!lage.darf.coCaptain ? (
        <div style={leise}>Den Co-Captain bestimmt der Kapitän.</div>
      ) : !bearbeiten ? (
        <button type="button" onClick={starten} style={{ ...knopf(false), alignSelf: 'flex-start' }}>{co ? 'Co-Captain ändern' : 'Co-Captain bestimmen'}</button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={leise} htmlFor="co-wer">Wer? (nur mit Konto im Team, höchstens einer)</label>
          <select id="co-wer" value={wer} onChange={e => { setWer(e.target.value); setM(null); }} style={feld}>
            <option value="">— aus dem Team wählen —</option>
            {lage.mitglieder.filter(p => !p.kapitaen).map(p => <option key={p.userId} value={p.userId}>{p.name}</option>)}
          </select>
          <div style={leise}>Welche Kapitänsrechte bekommt er?</div>
          {TC_RECHTE.map(r => (
            <label key={r} style={{ ...text, display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="checkbox" checked={rechte.includes(r)} onChange={e => { setRechte(x => e.target.checked ? [...x, r] : x.filter(y => y !== r)); setM(null); }} style={{ marginTop: 3 }} />
              <span><strong>{TC_RECHT_TEXT[r].label}</strong> – {TC_RECHT_TEXT[r].text}</span>
            </label>
          ))}
          {m && !m.ok && <div role="alert" style={hinweisStil(m)}>{m.text}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={laeuft} onClick={() => void speichern()} style={knopf(true)}>{laeuft ? 'Speichere …' : 'Speichern'}</button>
            {co && <button type="button" disabled={laeuft} onClick={() => void speichern(true)} style={{ ...knopf(false), color: 'var(--th-loss)', borderColor: 'var(--th-loss)' }}>Co-Captain entfernen</button>}
            <button type="button" disabled={laeuft} onClick={() => { setBearbeiten(false); setM(null); }} style={{ ...knopf(false), color: 'var(--th-text-muted)', borderColor: 'var(--th-line-10)' }}>Abbrechen</button>
          </div>
        </div>
      )}
      {m && (m.ok || !bearbeiten) && <div role={m.ok ? 'status' : 'alert'} style={hinweisStil(m)}>{m.text}</div>}
    </section>
  );
}

function VertretungKarte({ teamId, lage, neuLaden, nurSpiel }: { teamId: string; lage: Lage; neuLaden: () => Promise<void>; nurSpiel?: string }) {
  const spiele = nurSpiel ? lage.heimspiele.filter(h => h.key === nurSpiel) : lage.heimspiele;
  const aktive = nurSpiel ? lage.vertretungen.filter(v => v.matchKey === nurSpiel) : lage.vertretungen;
  const [spiel, setSpiel] = useState(nurSpiel ?? '');
  const [wer, setWer] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [m, setM] = useState<Meldung>(null);

  async function einteilen() {
    if (!spiel) { setM({ ok: false, text: 'Bitte das Heimspiel wählen.' }); return; }
    if (!wer) { setM({ ok: false, text: 'Bitte wählen, wer den Spielbericht einträgt.' }); return; }
    setLaeuft(true); setM(null);
    const r = await aufruf('/api/team/kapitaene', { team: teamId, aktion: 'vertreter_setzen', matchKey: spiel, userId: wer });
    setLaeuft(false);
    if (!r.ok) { setM({ ok: false, text: String(r.json.error ?? 'Speichern fehlgeschlagen.') }); return; }
    setM({ ok: true, text: `Eingeteilt bis ${bis(String(r.json.gueltigBis))} Uhr (oder bis der Bericht abgesendet ist) – er hat eine Nachricht bekommen.` });
    setWer(''); if (!nurSpiel) setSpiel('');
    await neuLaden();
  }
  async function entziehen(id: string, name: string) {
    if (!confirm(`${name} darf den Spielbericht dann nicht mehr eintragen. Fortfahren?`)) return;
    setLaeuft(true); setM(null);
    const r = await aufruf('/api/team/kapitaene', { team: teamId, aktion: 'vertreter_entziehen', id });
    setLaeuft(false);
    if (!r.ok) { setM({ ok: false, text: String(r.json.error ?? 'Fehlgeschlagen.') }); return; }
    setM({ ok: true, text: 'Vertretung beendet.' });
    await neuLaden();
  }

  return (
    <section style={karte}>
      <h2 style={h2}>Spielbericht – Vertretung</h2>
      <div style={leise}>
        Bist du beim Heimspiel nicht da? Teil jemanden aus dem Team ein, der den Spielbericht anlegt, live führt und absendet.
        Das gilt nur für dieses Spiel und endet mit dem Absenden, spätestens Dienstag 24 Uhr nach dem Spiel.
      </div>
      {aktive.map(v => (
        <div key={v.id} style={{ ...text, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '8px 10px', borderRadius: 10, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)' }}>
          <span style={{ flex: '1 1 200px' }}><strong>{v.name}</strong> trägt ein{nurSpiel ? '' : <>: {v.spiel}</>} · bis {bis(v.gueltigBis)} Uhr</span>
          {lage.darf.vertreter && <button type="button" disabled={laeuft} onClick={() => void entziehen(v.id, v.name)} style={{ ...knopf(false), padding: '6px 10px', fontSize: 12, color: 'var(--th-loss)', borderColor: 'var(--th-loss)' }}>Beenden</button>}
        </div>
      ))}
      {lage.darf.vertreter && (spiele.length === 0 ? (
        <div style={leise}>{nurSpiel ? 'Für dieses Spiel ist der Bericht schon abgesendet oder die Frist vorbei.' : 'Kein offenes Heimspiel – nichts einzuteilen.'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!nurSpiel && (
            <select value={spiel} onChange={e => { setSpiel(e.target.value); setM(null); }} style={feld} aria-label="Heimspiel">
              <option value="">— Heimspiel wählen —</option>
              {spiele.map(s => <option key={s.key} value={s.key}>{s.text}</option>)}
            </select>
          )}
          <select value={wer} onChange={e => { setWer(e.target.value); setM(null); }} style={feld} aria-label="Wer trägt ein">
            <option value="">— wer trägt ein? (nur mit Konto im Team) —</option>
            {lage.mitglieder.map(p => <option key={p.userId} value={p.userId}>{p.name}</option>)}
          </select>
          {m && !m.ok && <div role="alert" style={hinweisStil(m)}>{m.text}</div>}
          <button type="button" disabled={laeuft} onClick={() => void einteilen()} style={{ ...knopf(true), alignSelf: 'flex-start' }}>{laeuft ? 'Speichere …' : aktive.length && nurSpiel ? 'Jemand anderen einteilen' : 'Einteilen'}</button>
        </div>
      ))}
      {m && m.ok && <div role="status" style={hinweisStil(m)}>{m.text}</div>}
    </section>
  );
}
