'use client';

// ============================================================
// Team Manager holen — Upgrade-Seite (VORSCHAU, nur Super-Admin)
// ============================================================
//
// Was drin ist, 14 Tage testen, Saisonpass oder Monat. Bezahlen (Betreiber,
// 29.10.2026, ohne Stripe): PayPal / Kreditkarte über den PayPal-Knopf →
// sofort frei (Server bestätigt bei PayPal), Überweisung → „Ich habe
// überwiesen“, der Betreiber schaltet nach Zahlungseingang frei.
// Solange PREMIUM_OEFFENTLICH = false (lib/premium.ts) sieht und nutzt die
// Seite nur der Super-Admin. Server: /api/premium, /api/premium/paypal.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PayPalKnopf } from '@/components/mdu/paypal-knopf';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { team27, NEUE_SAISON } from '@/lib/data/saison-2027';
import { PREISE, ZAHLUNG, LEISTUNGEN, TESTTAGE, PREMIUM_OEFFENTLICH, premiumVorschau, verwendungszweck, euroText, type PremiumModell } from '@/lib/premium';
import { Icon } from '@/components/mdu/icon';

const GRUEN = '#1FA34A', ROT = '#D2352B', GOLD = '#E8B84A';

export default function PremiumSeite() {
  const { user, loading } = useAuth();
  const [modell, setModell] = useState<PremiumModell>('saison');
  const [weg, setWeg] = useState<'paypal' | 'ueberweisung'>('paypal');
  const [hinweis, setHinweis] = useState<{ ok: boolean; text: string } | null>(null);
  const [lage, setLage] = useState<Lage | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const team = user?.teamId ?? '';
  const neuLaden = useCallback(async () => {
    if (!team) return;
    const r = await aufruf(`/api/premium?team=${encodeURIComponent(team)}`);
    if (r.ok) setLage(r.json as unknown as Lage); else setHinweis({ ok: false, text: String(r.json.error ?? 'Laden fehlgeschlagen.') });
  }, [team]);
  useEffect(() => {
    let ab = false;
    if (team) aufruf(`/api/premium?team=${encodeURIComponent(team)}`).then(r => {
      if (ab) return;
      if (r.ok) setLage(r.json as unknown as Lage); else setHinweis({ ok: false, text: String(r.json.error ?? 'Laden fehlgeschlagen.') });
    });
    return () => { ab = true; };
  }, [team]);
  async function aktion(body: Record<string, unknown>, erfolg: string) {
    setLaeuft(true); setHinweis(null);
    const r = await aufruf('/api/premium', { team, ...body });
    setLaeuft(false);
    if (!r.ok) { setHinweis({ ok: false, text: String(r.json.error ?? 'Fehlgeschlagen.') }); return; }
    setHinweis({ ok: true, text: erfolg.replace('{bis}', r.json.bis ? datumDe(String(r.json.bis)) : '') });
    await neuLaden();
  }
  const p = lage?.premium ?? null;
  const pp = lage?.paypal;
  const paypalMoeglich = !!pp?.clientId && (modell === 'saison' || pp.abo);
  const teamName = (user?.teamId && team27(user.teamId)?.name) || 'Dein Team';
  const vorschau = !PREMIUM_OEFFENTLICH;
  const preis = PREISE[modell];
  const zweck = verwendungszweck(teamName, modell, NEUE_SAISON.name);

  return (
    <MemberShell title="Team Manager holen">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Dieser Bereich ist nur für angemeldete Mitglieder.{' '}<LoginLink /></Notice>
        : !PREMIUM_OEFFENTLICH && !premiumVorschau(user) ? <Notice title="Noch nicht verfügbar">Der Team Manager wird gerade erprobt.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
            {vorschau && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(232,184,74,0.15)', border: `1.5px dashed ${GOLD}`, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                <b>Vorschau – nur für dich sichtbar.</b> Die Knöpfe funktionieren echt (Test, Überweisung melden, PayPal sobald eingerichtet) – aber nur du kannst sie benutzen. {ZAHLUNG.ueberweisung.iban.startsWith('folgt') && 'Kontoinhaber und IBAN sind noch Platzhalter.'}
              </div>
            )}

            {lage && <StatusKarte p={p} aktiv={lage.aktiv} laeuft={laeuft} onKuendigen={() => {
              if (confirm('PayPal-Abo kündigen? Der Team Manager läuft bis zum Ende des bezahlten Monats weiter.')) void aktion({ aktion: 'abo_kuendigen' }, 'Abo gekündigt – der Team Manager läuft bis {bis}.');
            }} />}

            {/* Kopf */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '22px 20px', color: '#fff',
              background: 'radial-gradient(120% 80% at 0% 0%, #1E5A31 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, rgba(210,53,43,0.35) 0%, transparent 55%), linear-gradient(160deg, #10301C 0%, #0A1A10 100%)',
              boxShadow: '0 14px 34px rgba(10,26,16,0.35)',
            }}>
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'repeating-conic-gradient(from 9deg at 90% 20%, rgba(255,255,255,0.045) 0 18deg, transparent 18deg 36deg)' }} />
              <div style={{ position: 'relative', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD }}>Für {teamName}</div>
              <div style={{ position: 'relative', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginTop: 6 }}>Team Manager</div>
              <div style={{ position: 'relative', fontFamily: 'var(--font-manrope)', fontSize: 14.5, color: 'rgba(239,230,207,0.88)', marginTop: 8, lineHeight: 1.5 }}>
                Zusagen, Aufstellung, Kasse und Gegneranalyse – alles fürs Team an einem Ort. Ein Preis fürs ganze Team, nicht pro Spieler.
              </div>
              {!p?.trial_used && !lage?.aktiv && <button type="button" disabled={laeuft || !lage?.darf} onClick={() => void aktion({ aktion: 'test' }, `Los geht's – ${TESTTAGE} Tage Team Manager bis {bis}. Lade die Seite neu, dann ist alles freigeschaltet.`)} style={{
                position: 'relative', marginTop: 16, padding: '12px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: GOLD, color: '#3A2A00', fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: 14.5, boxShadow: `0 0 0 5px ${GOLD}33`,
              }}>{TESTTAGE} Tage gratis testen</button>}
              {!p?.trial_used && !lage?.aktiv && <div style={{ position: 'relative', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'rgba(239,230,207,0.7)', marginTop: 8 }}>Endet von selbst – kein Abo, keine Zahlungsdaten nötig.</div>}
            </div>

            {/* Leistungen */}
            <section style={karte}>
              <Kopf titel="Das ist drin" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                {LEISTUNGEN.map(l => (
                  <div key={l.titel} style={{ display: 'flex', gap: 10, padding: '8px 4px' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: GRUEN, color: '#fff' }}><Icon name="check" size={14} stroke={2.8} /></span>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)', lineHeight: 1.45 }}><b style={{ color: 'var(--th-text-strong)' }}>{l.titel}</b> – {l.text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Preise */}
            <section style={karte}>
              <Kopf titel="Preis fürs ganze Team" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(Object.keys(PREISE) as PremiumModell[]).map(m => {
                  const p = PREISE[m]; const an = modell === m;
                  return (
                    <button key={m} type="button" onClick={() => setModell(m)} aria-pressed={an} style={{
                      position: 'relative', textAlign: 'left', padding: '14px', borderRadius: 16, cursor: 'pointer',
                      background: an ? 'rgba(31,163,74,0.08)' : 'var(--th-bg-card3)', border: `2px solid ${an ? GRUEN : 'var(--th-line-8)'}`,
                    }}>
                      {m === 'saison' && <span style={{ position: 'absolute', top: -10, right: 10, padding: '2px 8px', borderRadius: 999, background: ROT, color: '#fff', fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Spart am meisten</span>}
                      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, lineHeight: 1.05, color: 'var(--th-text-strong)', marginTop: 4 }}>{euroText(p.cents)}</div>
                      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)' }}>{p.zeile} · {p.hinweis}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Bezahlen */}
            <section style={karte}>
              <Kopf titel="Bezahlen" />
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {([['paypal', 'PayPal / Kreditkarte'], ['ueberweisung', 'Überweisung']] as const).filter(([k]) => ZAHLUNG[k].aktiv).map(([k, l]) => (
                  <button key={k} type="button" onClick={() => { setWeg(k); setHinweis(null); }} aria-pressed={weg === k} style={{
                    padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
                    background: weg === k ? 'var(--th-text-strong)' : 'transparent', color: weg === k ? 'var(--th-bg-card)' : 'var(--th-text-muted)', border: '1.5px solid var(--th-line-8)',
                  }}>{l}</button>
                ))}
              </div>
              {weg === 'paypal' ? (
                paypalMoeglich && lage?.darf ? (
                  <>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', marginBottom: 10, lineHeight: 1.5 }}>
                      {modell === 'saison' ? `Einmal ${euroText(preis.cents)}, gilt bis Saisonende.` : `${euroText(preis.cents)} im Monat, bucht PayPal jeden Monat ab – jederzeit hier kündbar.`} Mit PayPal-Konto oder per Debit-/Kreditkarte. <b>Nach dem Bezahlen ist der Team Manager sofort freigeschaltet.</b>
                    </div>
                    <PayPalKnopf key={modell} clientId={pp!.clientId!} planMonat={pp!.planMonat} team={team} art={modell}
                      onFertig={bis => { setHinweis({ ok: true, text: `Danke! Der Team Manager ist freigeschaltet${bis ? ` bis ${datumDe(bis)}` : ''}. Lade die Seite neu, dann ist alles da.` }); void neuLaden(); }}
                      onFehler={text => setHinweis({ ok: false, text })} />
                  </>
                ) : (
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.5 }}>
                    {!pp?.clientId ? 'Bezahlen per PayPal und Kreditkarte ist gleich so weit – bis dahin bitte per Überweisung.'
                      : !lage?.darf ? 'Bezahlen kann der Kapitän (oder der Co-Captain mit Recht „Team Manager“).'
                      : 'Das Monatsabo per PayPal ist gleich so weit – bis dahin Saisonpass per PayPal oder Monat per Überweisung.'}
                  </div>
                )
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-manrope)', fontSize: 13.5 }}>
                    <Zeile l="Betrag" w={euroText(preis.cents)} />
                    <Zeile l="Kontoinhaber" w={ZAHLUNG.ueberweisung.inhaber} />
                    <Zeile l="IBAN" w={ZAHLUNG.ueberweisung.iban} />
                    <Zeile l="Verwendungszweck" w={zweck} />
                  </div>
                  {p?.status === 'angefragt' || (p?.requested_model && p.payment_method === 'ueberweisung') ? (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(31,163,74,0.10)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                      Deine Überweisung ({p.requested_model ? PREISE[p.requested_model].name : ''}) ist gemeldet. Sobald das Geld da ist, schalten wir frei – du bekommst eine Nachricht.
                    </div>
                  ) : (
                    <button type="button" disabled={laeuft || !lage?.darf} onClick={() => {
                      if (confirm(`Hast du ${euroText(preis.cents)} mit dem Verwendungszweck „${zweck}“ überwiesen?`)) void aktion({ aktion: 'ueberwiesen', modell }, 'Danke! Wir schalten frei, sobald die Überweisung da ist – du bekommst eine Nachricht.');
                    }} style={{
                      marginTop: 14, width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: laeuft || !lage?.darf ? 'not-allowed' : 'pointer', opacity: laeuft || !lage?.darf ? 0.6 : 1,
                      background: GRUEN, color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: 14.5,
                    }}>{preis.name} für {euroText(preis.cents)} – ich habe überwiesen</button>
                  )}
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                    Nach Zahlungseingang schalten wir den Team Manager für dein ganzes Team frei. {modell === 'monat' ? 'Kurz vor Ablauf jedes Monats bekommst du eine Erinnerung.' : 'Er gilt bis zum Ende der Saison.'}
                  </div>
                </>
              )}
              {hinweis && <div role={hinweis.ok ? 'status' : 'alert'} style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: hinweis.ok ? 'rgba(31,163,74,0.12)' : 'rgba(210,53,43,0.10)', fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: hinweis.ok ? GRUEN : ROT }}>{hinweis.text}</div>}
            </section>

            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', lineHeight: 1.6 }}>
              Anbieter des Team Managers: <i>folgt</i> · <Link href="#" style={{ color: 'inherit' }}>Abo-Bedingungen</Link> · <Link href="#" style={{ color: 'inherit' }}>Widerruf</Link> · <Link href="/datenschutz" style={{ color: 'inherit' }}>Datenschutz</Link>
              {vorschau && ' (Platzhalter – Texte folgen)'}
            </div>
          </div>
        )}
    </MemberShell>
  );
}

interface Lage {
  premium: { status: string; modell: string | null; valid_until: string | null; trial_used: boolean; requested_model: PremiumModell | null; payment_method: string | null; paypal_subscription_id: string | null; abo_status: string | null } | null;
  aktiv: boolean; darf: boolean;
  paypal: { clientId: string | null; abo: boolean; planMonat: string | null };
}
const datumDe = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');

async function aufruf(url: string, body?: Record<string, unknown>): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (!token) return { ok: false, json: { error: 'Nicht angemeldet.' } };
  try {
    const r = await fetch(url, body ? { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { headers: { Authorization: `Bearer ${token}` } });
    return { ok: r.ok, json: await r.json().catch(() => ({})) };
  } catch { return { ok: false, json: { error: 'Keine Verbindung – bitte noch einmal versuchen.' } }; }
}

/** Aktueller Stand: aktiv bis …, Test, Abo (kündbar). */
function StatusKarte({ p, aktiv, laeuft, onKuendigen }: { p: Lage['premium']; aktiv: boolean; laeuft: boolean; onKuendigen: () => void }) {
  if (!aktiv && !p) return null;
  const abo = p?.paypal_subscription_id && p.abo_status === 'ACTIVE';
  const text = aktiv
    ? p?.modell === 'dauerhaft' || !p ? 'Dein Team hat den Team Manager dauerhaft.'
      : p.status === 'test' ? `Test läuft bis ${p.valid_until ? datumDe(p.valid_until) : '–'}.`
      : `Freigeschaltet${p.modell ? ` (${p.modell === 'saison' ? 'Saisonpass' : p.modell === 'monat' ? 'Monat' : p.modell})` : ''} bis ${p.valid_until ? datumDe(p.valid_until) : '–'}.${abo ? ' PayPal bucht monatlich ab.' : p.abo_status === 'CANCELLED' ? ' Abo gekündigt – läuft bis dahin weiter.' : ''}`
    : p?.status === 'abgelaufen' ? 'Der Team Manager ist abgelaufen – deine Daten sind noch da. Unten verlängern.'
    : p?.status === 'angefragt' ? 'Deine Zahlung ist gemeldet und wird geprüft.' : null;
  if (!text) return null;
  return (
    <section style={{ ...karte, border: `1.5px solid ${aktiv ? GRUEN : GOLD}` }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, fontWeight: 800, color: 'var(--th-text-strong)' }}>{text}</div>
      {abo && <button type="button" disabled={laeuft} onClick={onKuendigen} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: `1.5px solid ${ROT}`, color: ROT, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13 }}>Abo kündigen</button>}
    </section>
  );
}

function Zeile({ l, w }: { l: string; w: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
      <span style={{ width: 120, flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--th-text-muted)' }}>{l}</span>
      <span style={{ flex: 1, minWidth: 0, fontWeight: 800, color: 'var(--th-text-strong)', overflowWrap: 'anywhere' }}>{w}</span>
      <button type="button" onClick={() => { void navigator.clipboard?.writeText(w).catch(() => {}); }} aria-label={`${l} kopieren`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12 }}>Kopieren</button>
    </div>
  );
}

function Kopf({ titel }: { titel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span aria-hidden style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(${ROT} 50%, ${GRUEN} 50%)` }} />
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>{titel}</span>
    </div>
  );
}

const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 20, padding: '14px 16px', boxShadow: '0 4px 16px var(--th-shadow)' };
