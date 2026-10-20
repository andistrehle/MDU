'use client';

// ============================================================
// Admin — Spielverlegungen (Migration 0050, lib/server/verlegung.ts)
// ============================================================
// Alle Anfragen der Saison. Freigeben muss die Ligaleitung nur Termine
// außerhalb der Saison ('freigabe'); alles andere läuft zwischen den TCs und
// steht hier zur Info. Klappte das Übernehmen in den Spielplan nicht (z. B.
// MDU_GITHUB_TOKEN fehlt), steht die Anfrage auf „bestätigt“ mit Hinweis und
// lässt sich hier erneut übernehmen.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { team27 } from '@/lib/data/saison-2027';
import { ladeVerlegungen, verlegungAktion, type Verlegung } from '@/lib/supabase/verlegung';

const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const tag = (iso: string) => { const d = new Date(iso + 'T12:00:00Z'); return `${WT[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`; };
const termin = (d: string | null, t: string | null) => (d ? `${tag(d)}${t ? ` ${t}` : ''}` : 'Spielwochenende');
const name = (id: string) => team27(id)?.name ?? id;
const STATUS: Record<Verlegung['status'], [string, string]> = {
  offen: ['wartet auf Gegner', 'var(--th-text-muted)'], freigabe: ['Freigabe nötig', 'var(--th-gold)'],
  bestaetigt: ['bestätigt – nicht übernommen', 'var(--th-loss)'], uebernommen: ['erledigt', 'var(--th-win)'],
  abgelehnt: ['abgelehnt', 'var(--th-text-muted)'], zurueckgezogen: ['zurückgezogen', 'var(--th-text-faint)'],
};

export default function AdminVerlegungenPage() {
  const [rows, setRows] = useState<Verlegung[] | null>(null);
  const [bereit, setBereit] = useState(true);
  const [filter, setFilter] = useState<'handeln' | 'alle'>('handeln');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const laden = useCallback(async () => { const r = await ladeVerlegungen(); setRows(r.rows); setBereit(r.bereit); }, []);
  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  const liste = useMemo(() => (rows ?? []).filter(v => filter === 'alle' || v.status === 'freigabe' || v.status === 'bestaetigt' || v.status === 'offen'), [rows, filter]);

  async function aktion(v: Verlegung, a: 'freigeben' | 'ablehnen' | 'uebernehmen') {
    let grund: string | null = null;
    if (a === 'ablehnen') { grund = window.prompt('Grund für die Ablehnung (geht an beide Teams):', '') ?? null; if (grund === null) return; }
    setBusy(v.id); setMsg(null);
    const { data, error } = await verlegungAktion(v.id, a, grund, true);
    setBusy(null);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    setMsg({ kind: 'ok', text: data?.status === 'uebernommen' ? 'Übernommen – der neue Termin steht nach dem Neubau (wenige Minuten) im Spielplan.' : data?.status === 'abgelehnt' ? 'Abgelehnt – beide Teams wurden informiert.' : `Stand: ${STATUS[data!.status][0]}${data?.note ? ` – ${data.note}` : ''}` });
    void laden();
  }

  return (
    <AdminGuard title="Spielverlegungen" subtitle="Von den Teamcaptains angefragte Verlegungen. Freigeben musst du nur Termine außerhalb der Saison.">
      {!bereit && rows !== null ? (
        <p style={txt}>Spielverlegungen sind noch nicht eingerichtet (Migration 0050).</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['handeln', 'alle'] as const).map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={knopf(filter === f)}>{f === 'handeln' ? 'Offen' : 'Alle'}</button>
            ))}
          </div>
          {msg && <div role="status" style={{ ...txt, padding: '9px 12px', borderRadius: 8, marginBottom: 12, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>}
          {rows === null ? <p style={txt}>Lade …</p> : liste.length === 0 ? <p style={txt}>{filter === 'handeln' ? 'Keine offenen Anfragen.' : 'Noch keine Verlegungen.'}</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {liste.map(v => (
                <div key={v.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                    <div style={{ ...txt, fontWeight: 800, color: 'var(--th-text-strong)' }}>{name(v.home_team_id)} – {name(v.away_team_id)}</div>
                    <div style={txt}>{v.kind === 'heimrecht' ? <b style={{ color: 'var(--th-text-strong)' }}>Heimrecht tauschen (Hin- und Rückspiel, Termine bleiben)</b> : <><s>{termin(v.old_date, v.old_time)}</s> → <b style={{ color: 'var(--th-text-strong)' }}>{termin(v.new_date, v.new_time)}</b></>} · angefragt von {name(v.requested_team)}{v.reason ? ` · „${v.reason}“` : ''}</div>
                    {v.note && <div style={{ ...txt, fontSize: 12, color: v.status === 'bestaetigt' ? 'var(--th-loss)' : 'var(--th-text-faint)' }}>{v.note}</div>}
                  </div>
                  <span style={{ ...txt, fontWeight: 800, color: STATUS[v.status][1] }}>{STATUS[v.status][0]}</span>
                  {v.status === 'freigabe' && (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button type="button" disabled={busy === v.id} onClick={() => void aktion(v, 'freigeben')} style={knopf(true)}>Freigeben</button>
                      <button type="button" disabled={busy === v.id} onClick={() => void aktion(v, 'ablehnen')} style={knopf(false, 'var(--th-loss)')}>Ablehnen</button>
                    </span>
                  )}
                  {v.status === 'bestaetigt' && <button type="button" disabled={busy === v.id} onClick={() => void aktion(v, 'uebernehmen')} style={knopf(true)}>Erneut übernehmen</button>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminGuard>
  );
}

const txt: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: 0 };
function knopf(voll: boolean, farbe = 'var(--th-accent)'): React.CSSProperties {
  return { padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, border: `1.5px solid ${farbe}`, background: voll ? farbe : 'transparent', color: voll ? '#fff' : farbe };
}
