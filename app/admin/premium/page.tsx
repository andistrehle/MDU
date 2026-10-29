'use client';

// ============================================================
// Admin — Premium (Team Manager) · nur Super-Admin (Betreiber)
// ============================================================
//
// Gemeldete Überweisungen („Zahlung erhalten – freischalten“), freigeschaltete
// Teams mit „gültig bis“ und PayPal-Abo-Stand, Zahlungsnachweise, und Team
// direkt freischalten (bar, Überweisung, Test, dauerhaft). Daten über
// /api/premium/admin (Migration 0063, nur Super-Admin).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { LIGEN_2027, SAISON_ENDE, team27 } from '@/lib/data/saison-2027';
import { PREISE, euroText, PREMIUM_OEFFENTLICH, TESTTAGE } from '@/lib/premium';

interface Zeile { team_id: string; modell: string | null; status: string; valid_until: string | null; requested_model: 'saison' | 'monat' | null; requested_at: string | null; payment_method: string | null; note: string | null; paypal_subscription_id: string | null; abo_status: string | null; activated_at: string | null }
interface Zahlung { id: string; team_id: string; modell: 'saison' | 'monat'; amount_cents: number; method: string; valid_until: string; external_id: string | null; created_at: string }
const WEG_TEXT: Record<string, string> = { paypal: 'PayPal', ueberweisung: 'Überweisung', bar: 'Bar', kostenlos: 'kostenlos' };
const tname = (id: string) => team27(id)?.name ?? id;
const datumDe = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('.') : '–');

async function aufruf(body?: Record<string, unknown>): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (!token) return { ok: false, json: { error: 'Nicht angemeldet.' } };
  try {
    const r = await fetch('/api/premium/admin', body ? { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { headers: { Authorization: `Bearer ${token}` } });
    return { ok: r.ok, json: await r.json().catch(() => ({})) };
  } catch { return { ok: false, json: { error: 'Keine Verbindung.' } }; }
}

export default function AdminPremiumPage() {
  const [daten, setDaten] = useState<{ zeilen: Zeile[]; zahlungen: Zahlung[] } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ team: string; ok: boolean; text: string } | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const laden = useCallback(async () => {
    const r = await aufruf();
    if (r.ok) { setDaten(r.json as unknown as { zeilen: Zeile[]; zahlungen: Zahlung[] }); setFehler(null); } else setFehler(String(r.json.error ?? 'Laden fehlgeschlagen.'));
  }, []);
  useEffect(() => {
    let ab = false;
    aufruf().then(r => { if (ab) return; if (r.ok) setDaten(r.json as unknown as { zeilen: Zeile[]; zahlungen: Zahlung[] }); else setFehler(String(r.json.error ?? 'Laden fehlgeschlagen.')); });
    return () => { ab = true; };
  }, []);
  async function tun(team: string, body: Record<string, unknown>, frage: string | null, erfolg: string) {
    if (frage && !confirm(frage)) return;
    setLaeuft(true); setMsg(null);
    const r = await aufruf({ team, ...body });
    setLaeuft(false);
    setMsg({ team, ok: r.ok, text: r.ok ? erfolg : String(r.json.error ?? 'Fehlgeschlagen.') });
    if (r.ok) await laden();
  }

  const h = heute();
  const anfragen = (daten?.zeilen ?? []).filter(z => z.requested_model);
  const aktiv = (daten?.zeilen ?? []).filter(z => (z.status === 'aktiv' || z.status === 'test') && (!z.valid_until || z.valid_until >= h));
  const vorbei = (daten?.zeilen ?? []).filter(z => !aktiv.includes(z) && !z.requested_model);
  const hinweisBei = (team: string) => msg?.team === team ? <div role={msg.ok ? 'status' : 'alert'} style={{ ...txt, flexBasis: '100%', fontSize: 12.5, fontWeight: 700, color: msg.ok ? 'var(--th-win)' : 'var(--th-loss)' }}>{msg.text}</div> : null;

  return (
    <AdminGuard title="Premium" subtitle="Team Manager – Anfragen, Freischaltungen, Abläufe" require="super">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
        {!PREMIUM_OEFFENTLICH && (
          <div style={{ ...txt, padding: '10px 14px', borderRadius: 10, background: 'rgba(232,184,74,0.15)', border: '1.5px dashed var(--th-gold)' }}>
            <b>Noch nicht öffentlich.</b> Teamcaptains sehen das Angebot noch nicht (PREMIUM_OEFFENTLICH). Freischalten von Hand geht hier schon.
          </div>
        )}
        {fehler && <div role="alert" style={{ ...txt, color: 'var(--th-loss)', fontWeight: 700 }}>{fehler}</div>}

        <PayPalEinrichtung />

        <TeamFreischalten onFertig={laden} />

        <section>
          <h2 style={h2}>Gemeldete Überweisungen <span style={zaehler}>{anfragen.length}</span></h2>
          {daten && anfragen.length === 0 && <div style={txt}>Keine offenen Meldungen.</div>}
          {anfragen.map(a => (
            <div key={a.team_id} style={zeile}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ ...txt, fontWeight: 800, color: 'var(--th-text-strong)' }}>{tname(a.team_id)}</div>
                <div style={txt}>{PREISE[a.requested_model!].name} · {euroText(PREISE[a.requested_model!].cents)} · per {WEG_TEXT[a.payment_method ?? ''] ?? '–'} · gemeldet am {datumDe(a.requested_at)}</div>
              </div>
              <button type="button" disabled={laeuft} onClick={() => void tun(a.team_id, { aktion: 'freischalten', art: a.requested_model, weg: 'ueberweisung' }, `Zahlungseingang für ${tname(a.team_id)} bestätigt? Das Team wird freigeschaltet und bekommt eine Nachricht.`, 'Freigeschaltet.')} style={{ ...knopf, cursor: 'pointer', opacity: 1, background: 'var(--th-win)', color: '#fff', border: 'none' }}>Zahlung erhalten – freischalten</button>
              <button type="button" disabled={laeuft} onClick={() => void tun(a.team_id, { aktion: 'ablehnen' }, `Meldung von ${tname(a.team_id)} verwerfen (Geld nicht angekommen)?`, 'Meldung verworfen.')} style={{ ...knopf, cursor: 'pointer', opacity: 1 }}>Nicht angekommen</button>
              {hinweisBei(a.team_id)}
            </div>
          ))}
        </section>

        <section>
          <h2 style={h2}>Freigeschaltete Teams <span style={zaehler}>{aktiv.length}</span></h2>
          {daten && aktiv.length === 0 && <div style={txt}>Noch keine.</div>}
          {aktiv.map(a => {
            const bald = a.valid_until && a.valid_until <= plusTage(h, 7);
            return (
              <div key={a.team_id} style={zeile}>
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div style={{ ...txt, fontWeight: 800, color: 'var(--th-text-strong)' }}>{tname(a.team_id)}</div>
                  <div style={txt}>
                    {a.status === 'test' ? `Test (${TESTTAGE} Tage)` : a.modell === 'dauerhaft' ? 'dauerhaft' : a.modell === 'saison' ? 'Saisonpass' : a.modell === 'monat' ? 'Monatlich' : '–'}
                    {a.payment_method && a.payment_method !== 'kostenlos' ? ` · ${WEG_TEXT[a.payment_method]}` : ''}
                    {a.paypal_subscription_id ? ` · PayPal-Abo ${a.abo_status === 'ACTIVE' ? 'läuft' : (a.abo_status ?? '').toLowerCase()}` : ''}
                    {' · gültig bis '}<b style={{ color: bald ? 'var(--th-gold)' : 'var(--th-win)' }}>{a.valid_until ? datumDe(a.valid_until) : 'unbegrenzt'}</b>
                  </div>
                </div>
                {a.modell !== 'dauerhaft' && <button type="button" disabled={laeuft} onClick={() => void tun(a.team_id, { aktion: 'beenden' }, `Team Manager für ${tname(a.team_id)} sofort beenden?${a.paypal_subscription_id ? ' Das PayPal-Abo wird mit gekündigt.' : ''}`, 'Beendet.')} style={{ ...knopf, cursor: 'pointer', opacity: 1 }}>Beenden</button>}
                {hinweisBei(a.team_id)}
              </div>
            );
          })}
        </section>

        {vorbei.length > 0 && (
          <section>
            <h2 style={h2}>Abgelaufen / beendet</h2>
            {vorbei.map(a => (
              <div key={a.team_id} style={{ ...zeile, opacity: 0.8 }}>
                <div style={{ ...txt, flex: 1 }}><b>{tname(a.team_id)}</b> · {a.status === 'abgelaufen' ? 'abgelaufen' : 'beendet'} {a.valid_until ? `am ${datumDe(a.valid_until)}` : ''}</div>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 style={h2}>Zahlungen</h2>
          {daten && daten.zahlungen.length === 0 && <div style={txt}>Noch keine.</div>}
          {(daten?.zahlungen ?? []).slice(0, 30).map(z => (
            <div key={z.id} style={{ ...txt, display: 'flex', gap: 10, borderBottom: '1px solid var(--th-line-4)', padding: '6px 0' }}>
              <span style={{ minWidth: 86, color: 'var(--th-text-faint)' }}>{datumDe(z.created_at)}</span>
              <span style={{ flex: 1 }}><b>{tname(z.team_id)}</b> · {PREISE[z.modell].name} · {euroText(z.amount_cents)} · {WEG_TEXT[z.method]} · bis {datumDe(z.valid_until)}</span>
            </div>
          ))}
        </section>

        <section style={{ ...txt, lineHeight: 1.6 }}>
          <h2 style={h2}>So läuft es</h2>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Der TC startet {TESTTAGE} Tage Test (einmal je Team) oder bucht Saisonpass ({euroText(PREISE.saison.cents)}) bzw. Monat ({euroText(PREISE.monat.cents)}).</li>
            <li>PayPal / Kreditkarte: sofort frei, PayPal meldet jede Zahlung hierher (auch die monatlichen Abbuchungen).</li>
            <li>Überweisung: Meldung erscheint oben und in deiner Glocke – du klickst nach Zahlungseingang „freischalten“.</li>
            <li>3 Tage vor Ablauf bekommt der TC eine Erinnerung (nicht bei laufendem PayPal-Abo); danach ist der Team Manager gesperrt, die Daten bleiben.</li>
          </ol>
        </section>
      </div>
    </AdminGuard>
  );
}

// ── PayPal einrichten (Produkt, Monatsplan, Webhook) ─────────

interface Einrichtung { produktId: string | null; planId: string | null; webhookId: string | null; webhookUrl: string; live: boolean; angelegt?: string[] }

function PayPalEinrichtung() {
  const [e, setE] = useState<Einrichtung | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const holen = useCallback(async (post: boolean) => {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    const r = await fetch('/api/premium/paypal/einrichten', { method: post ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token ?? ''}` } }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) as Einrichtung & { error?: string } : { error: 'Keine Verbindung.' } as Einrichtung & { error?: string };
    if (r?.ok) { setE(j); setFehler(null); } else setFehler(j.error ?? 'Fehlgeschlagen.');
  }, []);
  useEffect(() => {
    let ab = false;
    (async () => {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const r = await fetch('/api/premium/paypal/einrichten', { headers: { Authorization: `Bearer ${token ?? ''}` } }).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) as Einrichtung & { error?: string } : { error: 'Keine Verbindung.' } as Einrichtung & { error?: string };
      if (ab) return;
      if (r?.ok) setE(j); else setFehler(j.error ?? 'Fehlgeschlagen.');
    })();
    return () => { ab = true; };
  }, []);
  const fertig = !!e?.produktId && !!e.planId && !!e.webhookId;
  const punkt = (ok: boolean, text: string) => <div style={{ ...txt, fontSize: 13 }}><b style={{ color: ok ? 'var(--th-win)' : 'var(--th-gold)' }}>{ok ? '✓' : '○'}</b> {text}</div>;
  return (
    <section style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--th-bg-card)', border: `1.5px solid ${fertig ? 'var(--th-win)' : 'var(--th-gold)'}` }}>
      <h2 style={h2}>PayPal {e && !e.live && <span style={zaehler}>Sandbox</span>}</h2>
      {fehler && <div role="alert" style={{ ...txt, color: 'var(--th-loss)', fontWeight: 700 }}>{fehler}</div>}
      {!e && !fehler && <div style={txt}>Prüfe bei PayPal …</div>}
      {e && (
        <>
          {punkt(!!e.produktId, 'Produkt „MDU Team Manager“')}
          {punkt(!!e.planId, `Monatsplan ${euroText(PREISE.monat.cents)} (für das Abo)`)}
          {punkt(!!e.webhookId, `Webhook → ${e.webhookUrl}`)}
          {e.angelegt?.length ? <div role="status" style={{ ...txt, fontSize: 12.5, fontWeight: 700, color: 'var(--th-win)', marginTop: 6 }}>Angelegt: {e.angelegt.join(', ')}.</div> : null}
          {!fertig && (
            <>
              <div style={{ ...txt, fontSize: 12.5, color: 'var(--th-text-muted)', margin: '8px 0' }}>
                Legt bei PayPal an, was fehlt – mit deinem Geschäftskonto, nichts doppelt. Danach geht Saisonpass und Monatsabo per PayPal/Karte. Prüf, dass die Webhook-Adresse auf die echte Seite zeigt.
              </div>
              <button type="button" disabled={laeuft} onClick={async () => {
                if (!confirm(`Bei PayPal anlegen: ${[!e.produktId && 'Produkt', !e.planId && `Monatsplan ${euroText(PREISE.monat.cents)}`, !e.webhookId && `Webhook auf ${e.webhookUrl}`].filter(Boolean).join(', ')}?`)) return;
                setLaeuft(true); await holen(true); setLaeuft(false);
              }} style={{ ...knopf, cursor: 'pointer', opacity: 1, background: 'var(--th-win)', color: '#fff', border: 'none' }}>{laeuft ? 'Richte ein …' : 'PayPal einrichten'}</button>
            </>
          )}
          {fertig && <div style={{ ...txt, fontSize: 12.5, color: 'var(--th-win)', marginTop: 6, fontWeight: 700 }}>PayPal ist startklar.</div>}
        </>
      )}
    </section>
  );
}

// ── Team direkt freischalten (ohne Anfrage) ─────────────────

type Art = 'saison' | 'monat' | 'test' | 'dauerhaft';
const ARTEN: { k: Art; name: string }[] = [
  { k: 'saison', name: `Saisonpass (${euroText(PREISE.saison.cents)})` },
  { k: 'monat', name: `1 Monat (${euroText(PREISE.monat.cents)})` },
  { k: 'test', name: `Test (${TESTTAGE} Tage)` },
  { k: 'dauerhaft', name: 'Dauerhaft (ohne Zahlung)' },
];
const heute = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
function plusTage(iso: string, n: number) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function plusMonat(iso: string) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 10); }
const vorgabeBis = (a: Art) => (a === 'saison' ? SAISON_ENDE : a === 'monat' ? plusMonat(heute()) : a === 'test' ? plusTage(heute(), TESTTAGE) : '');

function TeamFreischalten({ onFertig }: { onFertig: () => Promise<void> }) {
  const teams = useMemo(() => LIGEN_2027.flatMap(l => l.teams.map(id => ({ id, name: team27(id)?.name ?? id, liga: l.name })))
    .sort((a, b) => a.name.localeCompare(b.name, 'de')), []);
  const [team, setTeam] = useState('');
  const [art, setArt] = useState<Art>('saison');
  const [bis, setBis] = useState(vorgabeBis('saison'));
  const [weg, setWeg] = useState<'paypal' | 'ueberweisung' | 'bar' | ''>('');
  const [notiz, setNotiz] = useState('');
  const [hinweis, setHinweis] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const kostenlos = art === 'test' || art === 'dauerhaft';

  return (
    <section style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--th-bg-card)', border: '1.5px solid var(--th-win)' }}>
      <h2 style={h2}>Team freischalten</h2>
      <div style={{ ...txt, fontSize: 12.5, color: 'var(--th-text-muted)', marginBottom: 10 }}>Direkt, ohne Anfrage – z. B. wenn ein Team bar oder per WhatsApp Bescheid gibt.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <label style={feldLabel}>Team
          <select value={team} onChange={e => setTeam(e.target.value)} style={feld}>
            <option value="">– Team wählen –</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name} · {t.liga}</option>)}
          </select>
        </label>
        <label style={feldLabel}>Art
          <select value={art} onChange={e => { const a = e.target.value as Art; setArt(a); setBis(vorgabeBis(a)); }} style={feld}>
            {ARTEN.map(a => <option key={a.k} value={a.k}>{a.name}</option>)}
          </select>
        </label>
        <label style={feldLabel}>Gültig bis
          {art === 'dauerhaft'
            ? <div style={{ ...feld, color: 'var(--th-text-muted)' }}>unbegrenzt</div>
            : <input type="date" value={bis} onChange={e => setBis(e.target.value)} style={feld} />}
        </label>
        {!kostenlos && (
          <label style={feldLabel}>Bezahlt per
            <select value={weg} onChange={e => setWeg(e.target.value as typeof weg)} style={feld}>
              <option value="">– wählen –</option>
              <option value="paypal">PayPal</option>
              <option value="ueberweisung">Überweisung</option>
              <option value="bar">Bar</option>
            </select>
          </label>
        )}
        <label style={{ ...feldLabel, gridColumn: '1 / -1' }}>Notiz (optional)
          <input value={notiz} onChange={e => setNotiz(e.target.value.slice(0, 300))} placeholder="z. B. bar bei der TC-Sitzung bekommen" style={feld} />
        </label>
      </div>
      <button type="button" disabled={laeuft || !team || (!kostenlos && !weg)}
        onClick={async () => {
          const name = teams.find(t => t.id === team)?.name;
          if (!confirm(`${name} ${art === 'dauerhaft' ? 'dauerhaft' : `bis ${bis.split('-').reverse().join('.')}`} freischalten? Die Kapitäne bekommen eine Nachricht.`)) return;
          setLaeuft(true); setHinweis(null);
          const r = await aufruf({ aktion: 'freischalten', team, art, bis: art === 'dauerhaft' ? null : bis, weg: kostenlos ? 'kostenlos' : weg, notiz });
          setLaeuft(false);
          setHinweis(r.ok ? { ok: true, text: `${name} ist freigeschaltet.` } : { ok: false, text: String(r.json.error ?? 'Fehlgeschlagen.') });
          if (r.ok) { setTeam(''); setNotiz(''); await onFertig(); }
        }}
        style={{ ...knopf, marginTop: 12, background: 'var(--th-win)', color: '#fff', border: 'none', cursor: team && (kostenlos || weg) ? 'pointer' : 'not-allowed', opacity: team && (kostenlos || weg) ? 1 : 0.5 }}>
        {laeuft ? 'Schalte frei …' : 'Freischalten'}
      </button>
      {hinweis && <div role={hinweis.ok ? 'status' : 'alert'} style={{ ...txt, marginTop: 10, padding: '8px 12px', borderRadius: 8, background: hinweis.ok ? 'rgba(31,163,74,0.12)' : 'rgba(210,53,43,0.10)', fontSize: 12.5, fontWeight: 700 }}>{hinweis.text}</div>}
    </section>
  );
}

const feldLabel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-text-muted)' };
const feld: React.CSSProperties = { padding: '9px 11px', borderRadius: 9, border: '1px solid var(--th-line-8)', background: 'var(--th-bg-card3)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, fontWeight: 600 };


const txt: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)' };
const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 };
const zaehler: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12, padding: '1px 8px', borderRadius: 999, background: 'var(--th-gold)', color: '#3A2A00' };
const zeile: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', marginBottom: 8 };
const knopf: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, background: 'transparent', border: '1.5px solid var(--th-line-8)', color: 'var(--th-text-strong)', cursor: 'not-allowed', opacity: 0.75 };
