'use client';

// ============================================================
// Admin → Postfach (Betreiber, 18.11.2026)
// ============================================================
// Mails an kontakt@mdudarts.de, stündlich bei Strato abgeholt (lib/server/postfach.ts).
// Die ganze Ligaleitung sieht sie; geantwortet wird von hier als kontakt@mdudarts.de,
// IMMER erst nach Klick auf „Antwort senden“ + Rückfrage. Im Strato-Postfach bleibt
// alles wie es ist (die Antwort landet dort zusätzlich in „Gesendet“).
// „Vorschlag“ = interne Notiz (z. B. von Claude vorbereitet: was zu tun ist),
// „Antwort“ = Entwurf, der sich vor dem Senden frei ändern lässt.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { leererEntwurf, vorschau, antwortPruefen, type PostfachMail } from '@/lib/postfach';

type Mail = PostfachMail & { automatisch: boolean; bezug: string | null };
type Filter = 'offen' | 'erledigt' | 'alle';
interface Daten { mails: Mail[]; verlauf: Mail[]; stand: { letzter_lauf: string | null; letzter_fehler: string | null } | null; eingerichtet: boolean; versand: boolean }

const zeit = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }) === d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const u = d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
  return heute ? `heute ${u}` : `${d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' })} ${u}`;
};
const groesse = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

async function ruf(methode: 'GET' | 'POST', pfad: string, body?: unknown): Promise<{ ok: boolean; j: Record<string, unknown> }> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const r = await fetch(pfad, {
    method: methode, headers: { Authorization: `Bearer ${token ?? ''}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).catch(() => null);
  const j = r ? ((await r.json().catch(() => ({}))) as Record<string, unknown>) : { error: 'Keine Verbindung.' };
  return { ok: !!r?.ok, j };
}

export default function AdminPostfachPage() {
  const [filter, setFilter] = useState<Filter>('offen');
  const [daten, setDaten] = useState<Daten | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [offen, setOffen] = useState<string | null>(null);
  const [holt, setHolt] = useState(false);
  const [holMeldung, setHolMeldung] = useState<{ art: 'ok' | 'err'; text: string } | null>(null);

  const laden = useCallback(async (f: Filter) => {
    const { ok, j } = await ruf('GET', `/api/postfach?status=${f}`);
    if (ok) { setDaten(j as unknown as Daten); setFehler(null); } else setFehler((j.error as string) ?? 'Laden fehlgeschlagen.');
  }, []);

  useEffect(() => {
    // Direktlink aus der Glocke: ?mail=<id>
    const m = new URLSearchParams(window.location.search).get('mail');
    queueMicrotask(() => { if (m) { setOffen(m); setFilter('alle'); void laden('alle'); } else void laden('offen'); });
  }, [laden]);

  const waehle = (f: Filter) => { setFilter(f); setDaten(null); void laden(f); };

  async function abholen() {
    setHolt(true); setHolMeldung(null);
    const { ok, j } = await ruf('POST', '/api/postfach', { aktion: 'abholen' });
    setHolt(false);
    if (!ok) { setHolMeldung({ art: 'err', text: (j.error as string) ?? 'Abholen fehlgeschlagen.' }); return; }
    const n = Number(j.neu) || 0;
    setHolMeldung({ art: 'ok', text: n ? `${n} neue ${n === 1 ? 'Mail' : 'Mails'} abgeholt.` : 'Keine neuen Mails.' });
    void laden(filter);
  }

  const verlaufJe = useMemo(() => {
    const m = new Map<string, Mail[]>();
    for (const v of daten?.verlauf ?? []) m.set(v.faden, [...(m.get(v.faden) ?? []), v]);
    return m;
  }, [daten]);

  const mails = daten?.mails ?? [];
  return (
    <AdminGuard title="Postfach" subtitle="Mails an kontakt@mdudarts.de">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div role="tablist" aria-label="Mails filtern" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([['offen', 'Offen'], ['erledigt', 'Erledigt'], ['alle', 'Alle']] as const).map(([f, l]) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => waehle(f)} style={pille(filter === f)}>
                {l}{f === 'offen' && filter === 'offen' && daten ? ` (${mails.length})` : ''}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button type="button" onClick={() => void abholen()} disabled={holt} style={{ ...knopf(false), opacity: holt ? 0.6 : 1 }}>{holt ? 'Hole ab …' : 'Jetzt abholen'}</button>
            {/* Hinweise direkt am Knopf */}
            {holMeldung && <span role={holMeldung.art === 'err' ? 'alert' : 'status'} style={{ ...klein, color: holMeldung.art === 'err' ? 'var(--th-loss)' : 'var(--th-win)', maxWidth: 320, textAlign: 'right' }}>{holMeldung.text}</span>}
            {!holMeldung && daten?.stand?.letzter_lauf && <span style={klein}>Zuletzt abgeholt: {zeit(daten.stand.letzter_lauf)} · automatisch jede Stunde</span>}
          </span>
        </div>

        {daten && !daten.eingerichtet && (
          <Hinweis ton="gold" titel="Noch nicht mit Strato verbunden">
            In Vercel fehlen die Zugangsdaten des Postfachs (<code>POSTFACH_IMAP_USER</code>, <code>POSTFACH_IMAP_PASSWORD</code>). Solange kommen hier keine Mails an.
          </Hinweis>
        )}
        {daten?.eingerichtet && daten.stand?.letzter_fehler && (
          <Hinweis ton="rot" titel="Letztes Abholen fehlgeschlagen">{daten.stand.letzter_fehler}</Hinweis>
        )}
        {daten && !daten.versand && (
          <Hinweis ton="gold" titel="Mailversand nicht eingerichtet">Antworten lassen sich im Moment nicht von hier verschicken.</Hinweis>
        )}

        {fehler ? <Hinweis ton="rot" titel="Postfach lässt sich nicht laden">{fehler}</Hinweis>
          : !daten ? <div style={klein}>Lade …</div>
          : mails.length === 0 ? <div style={{ ...karte, ...klein, fontSize: 14 }}>{filter === 'offen' ? 'Nichts offen – alles erledigt.' : 'Keine Mails.'}</div>
          : mails.map(m => (
            <MailKarte key={`${m.id}:${m.status}:${(m.entwurf ?? '').length}:${(m.notiz ?? '').length}`} m={m} auf={offen === m.id} versand={daten.versand}
              verlauf={(verlaufJe.get(m.faden) ?? []).filter(v => v.id !== m.id)}
              onAuf={() => setOffen(o => (o === m.id ? null : m.id))} onGeaendert={() => void laden(filter)} />
          ))}
      </div>
    </AdminGuard>
  );
}

function MailKarte({ m, auf, verlauf, versand, onAuf, onGeaendert }: { m: Mail; auf: boolean; verlauf: Mail[]; versand: boolean; onAuf: () => void; onGeaendert: () => void }) {
  const ein = m.richtung === 'ein';
  const [antwort, setAntwort] = useState(m.entwurf ?? leererEntwurf(m));
  const [notiz, setNotiz] = useState(m.notiz ?? '');
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ art: 'ok' | 'err'; wo: 'antwort' | 'notiz' | 'anhang' | 'status'; text: string } | null>(null);

  async function tu(wo: 'antwort' | 'notiz' | 'anhang' | 'status', body: Record<string, unknown>, okText?: string, danach = true) {
    setLaeuft(String(body.aktion)); setMsg(null);
    const { ok, j } = await ruf('POST', '/api/postfach', { id: m.id, ...body });
    setLaeuft(null);
    if (!ok) { setMsg({ art: 'err', wo, text: (j.error as string) ?? 'Hat nicht geklappt.' }); return null; }
    if (okText) setMsg({ art: 'ok', wo, text: okText });
    if (danach) onGeaendert();
    return j;
  }

  async function senden() {
    const meldung = antwortPruefen(m.von_email, antwort);
    if (meldung) { setMsg({ art: 'err', wo: 'antwort', text: meldung }); return; }
    if (!window.confirm(`Antwort jetzt als kontakt@mdudarts.de an ${m.von_email} senden?`)) return;
    await tu('antwort', { aktion: 'senden', text: antwort }, 'Antwort verschickt.');
  }

  async function anhang(i: number) {
    const j = await tu('anhang', { aktion: 'anhang', index: i }, undefined, false);
    if (j?.url) window.open(String(j.url), '_blank', 'noopener');
  }

  const meldung = (wo: string) => msg?.wo === wo && <div role={msg.art === 'err' ? 'alert' : 'status'} style={{ ...klein, marginTop: 6, fontWeight: 700, color: msg.art === 'err' ? 'var(--th-loss)' : 'var(--th-win)' }}>{msg.text}</div>;

  return (
    <div id={`mail-${m.id}`} style={{ ...karte, padding: 0, overflow: 'hidden', borderLeft: `4px solid ${!ein ? 'var(--th-line-10)' : m.status === 'offen' ? 'var(--th-accent)' : 'var(--th-line-10)'}` }}>
      <button type="button" onClick={onAuf} aria-expanded={auf} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', overflowWrap: 'anywhere' }}>
            {ein ? (m.von_name || m.von_email) : `Antwort an ${m.an}`}
          </span>
          {m.automatisch && <Etikett>automatisch</Etikett>}
          {m.notiz && ein && m.status === 'offen' && <Etikett gold>Vorschlag</Etikett>}
          {m.anhaenge.length > 0 && <Etikett>{m.anhaenge.length} {m.anhaenge.length === 1 ? 'Anhang' : 'Anhänge'}</Etikett>}
          <span style={{ ...klein, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{zeit(m.datum)}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13.5, color: 'var(--th-text-body)', marginTop: 3, overflowWrap: 'anywhere' }}>{m.betreff || '(ohne Betreff)'}</div>
        {!auf && <div style={{ ...klein, marginTop: 3, overflowWrap: 'anywhere' }}>{vorschau(m.text)}</div>}
      </button>

      {auf && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ein && m.von_name && <div style={klein}>{m.von_email}</div>}
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, lineHeight: 1.55, color: 'var(--th-text-body)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', borderRadius: 10, padding: '12px 14px' }}>
            {m.text || '(kein Text)'}
          </div>

          {m.anhaenge.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {m.anhaenge.map((a, i) => a.pfad
                  ? <button key={i} type="button" onClick={() => void anhang(i)} disabled={laeuft === 'anhang'} style={knopf(false)}>📎 {a.name} · {groesse(a.groesse)}</button>
                  : <span key={i} style={{ ...klein, padding: '7px 10px', border: '1px dashed var(--th-line-10)', borderRadius: 999 }} title="Zu groß – bitte im Mailprogramm öffnen">📎 {a.name} · {groesse(a.groesse)} · nicht abgelegt</span>)}
              </div>
              {meldung('anhang')}
            </div>
          )}

          {verlauf.length > 0 && (
            <details>
              <summary style={{ ...klein, fontWeight: 800, cursor: 'pointer' }}>Verlauf mit dieser Person ({verlauf.length})</summary>
              {verlauf.map(v => (
                <div key={v.id} style={{ marginTop: 8, paddingLeft: 10, borderLeft: `3px solid ${v.richtung === 'aus' ? 'var(--th-accent)' : 'var(--th-line-10)'}` }}>
                  <div style={{ ...klein, fontWeight: 800 }}>{v.richtung === 'aus' ? 'Unsere Antwort' : (v.von_name || v.von_email)} · {zeit(v.datum)}</div>
                  <div style={{ ...klein, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'var(--th-text-body)' }}>{v.text}</div>
                </div>
              ))}
            </details>
          )}

          {ein && (
            <>
              <label style={feldTitel}>
                Vorschlag / interne Notiz
                <textarea value={notiz} onChange={e => setNotiz(e.target.value)} rows={3} placeholder="Was ist zu tun? Sieht nur die Ligaleitung." style={eingabe} />
              </label>
              <div style={{ marginTop: -6 }}>
                <button type="button" onClick={() => void tu('notiz', { aktion: 'notiz', text: notiz }, 'Notiz gespeichert.', false)} disabled={!!laeuft} style={knopf(false)}>Notiz speichern</button>
                {meldung('notiz')}
              </div>

              {m.status === 'offen' ? (
                <>
                  <label style={feldTitel}>
                    Antwort an {m.von_email}
                    <textarea value={antwort} onChange={e => setAntwort(e.target.value)} rows={9} style={eingabe} />
                  </label>
                  <div style={{ ...klein, marginTop: -8 }}>Geht als kontakt@mdudarts.de raus; die ursprüngliche Mail wird darunter zitiert.</div>
                  <div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => void senden()} disabled={!!laeuft || !versand} style={{ ...knopf(true), opacity: laeuft || !versand ? 0.6 : 1 }}>{laeuft === 'senden' ? 'Sende …' : 'Antwort senden'}</button>
                      <button type="button" onClick={() => void tu('antwort', { aktion: 'entwurf', text: antwort }, 'Entwurf gespeichert.', false)} disabled={!!laeuft} style={knopf(false)}>Entwurf speichern</button>
                      <button type="button" onClick={() => void tu('status', { aktion: 'status', status: 'erledigt' })} disabled={!!laeuft} style={knopf(false)}>Erledigt ohne Antwort</button>
                    </div>
                    {meldung('antwort')}{meldung('status')}
                  </div>
                </>
              ) : (
                <div>
                  <span style={klein}>Erledigt{m.erledigt_am ? ` · ${zeit(m.erledigt_am)}` : ''} </span>
                  <button type="button" onClick={() => void tu('status', { aktion: 'status', status: 'offen' })} disabled={!!laeuft} style={knopf(false)}>Wieder öffnen</button>
                  {meldung('status')}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Etikett({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return <span style={{ padding: '2px 8px', borderRadius: 999, fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: gold ? 'rgba(232,184,74,0.18)' : 'var(--th-line-6)', color: gold ? '#9A6B00' : 'var(--th-text-muted)' }}>{children}</span>;
}

function Hinweis({ ton, titel, children }: { ton: 'gold' | 'rot'; titel: string; children: React.ReactNode }) {
  const f = ton === 'rot' ? '212,0,0' : '232,184,74';
  return (
    <div role={ton === 'rot' ? 'alert' : 'status'} style={{ padding: '12px 14px', borderRadius: 10, background: `rgba(${f},0.10)`, border: `1px solid rgba(${f},0.35)`, fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.5, color: 'var(--th-text-body)' }}>
      <strong style={{ display: 'block', color: 'var(--th-text-strong)' }}>{titel}</strong>{children}
    </div>
  );
}

const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '14px 16px' };
const klein: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.5 };
const feldTitel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)' };
const eingabe: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--th-line-10)', background: 'var(--th-bg-card)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, lineHeight: 1.5, textTransform: 'none', letterSpacing: 'normal', fontWeight: 500, resize: 'vertical' };
const pille = (an: boolean): React.CSSProperties => ({ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${an ? 'var(--th-accent)' : 'var(--th-line-10)'}`, background: an ? 'var(--th-accent)' : 'var(--th-bg-card)', color: an ? '#fff' : 'var(--th-text-body)' });
const knopf = (haupt: boolean): React.CSSProperties => ({ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${haupt ? 'var(--th-accent)' : 'var(--th-line-10)'}`, background: haupt ? 'var(--th-accent)' : 'var(--th-bg-card)', color: haupt ? '#fff' : 'var(--th-text-body)' });
