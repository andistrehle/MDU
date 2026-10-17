'use client';

// ============================================================
// Admin — Premium (Team Manager) · VORSCHAU, nur Super-Admin
// ============================================================
//
// So sieht die Verwaltung aus, sobald Migration 0052 (team_premium) läuft:
// offene Anfragen mit „Zahlung erhalten – freischalten“, aktive Teams mit
// „gültig bis“, laufende Tests. Bis dahin zeigt die Seite BEISPIELZEILEN
// (deutlich markiert) — es wird nichts gelesen und nichts geschrieben.
// ============================================================

import { useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { LIGEN_2027, SAISON_ENDE, team27 } from '@/lib/data/saison-2027';
import { PREISE, euroText, PREMIUM_OEFFENTLICH, TESTTAGE } from '@/lib/premium';

const BEISPIEL = {
  anfragen: [
    { team: 'DC Animals', modell: 'saison' as const, weg: 'PayPal', am: '17.10.2026', tc: 'Lilo Ernst' },
    { team: 'Jolly Pirates V', modell: 'monat' as const, weg: 'Überweisung', am: '16.10.2026', tc: 'Max Beispiel' },
  ],
  aktiv: [
    { team: 'Freibad Bazis', art: 'dauerhaft (Betreiber)', bis: '—', farbe: 'var(--th-win)' },
    { team: 'Fiaker Deife', art: 'Saisonpass', bis: '09.05.2027', farbe: 'var(--th-win)' },
    { team: 'Illuminati', art: 'Monatlich', bis: '21.10.2026 · läuft in 4 Tagen ab', farbe: 'var(--th-gold)' },
    { team: 'Oldies & Co', art: 'Test (14 Tage)', bis: '28.10.2026', farbe: '#4E7DBD' },
  ],
};

export default function AdminPremiumPage() {
  return (
    <AdminGuard title="Premium" subtitle="Team Manager – Anfragen, Freischaltungen, Abläufe" require="super">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
        {!PREMIUM_OEFFENTLICH && (
          <div style={{ ...txt, padding: '10px 14px', borderRadius: 10, background: 'rgba(232,184,74,0.15)', border: '1.5px dashed var(--th-gold)' }}>
            <b>Vorschau mit Beispielzeilen.</b> Noch nicht aktiv: Migration 0052 ist nicht ausgeführt, die Knöpfe tun nichts, und Teamcaptains sehen das Angebot noch nicht.
          </div>
        )}

        <TeamFreischalten />

        <section>
          <h2 style={h2}>Offene Anfragen <span style={zaehler}>{BEISPIEL.anfragen.length}</span></h2>
          {BEISPIEL.anfragen.map(a => (
            <div key={a.team} style={zeile}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ ...txt, fontWeight: 800, color: 'var(--th-text-strong)' }}>{a.team} <Beispiel /></div>
                <div style={txt}>{PREISE[a.modell].name} · {euroText(PREISE[a.modell].cents)} · per {a.weg} · angefragt am {a.am} von {a.tc}</div>
              </div>
              <button type="button" disabled style={{ ...knopf, background: 'var(--th-win)', color: '#fff', border: 'none' }}>Zahlung erhalten – freischalten</button>
              <button type="button" disabled style={knopf}>Ablehnen</button>
            </div>
          ))}
        </section>

        <section>
          <h2 style={h2}>Freigeschaltete Teams</h2>
          {BEISPIEL.aktiv.map(a => (
            <div key={a.team} style={zeile}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ ...txt, fontWeight: 800, color: 'var(--th-text-strong)' }}>{a.team} <Beispiel /></div>
                <div style={txt}>{a.art} · gültig bis <b style={{ color: a.farbe }}>{a.bis}</b></div>
              </div>
              <button type="button" disabled style={knopf}>Verlängern</button>
              <button type="button" disabled style={knopf}>Beenden</button>
            </div>
          ))}
        </section>

        <section style={{ ...txt, lineHeight: 1.6 }}>
          <h2 style={h2}>So läuft es später</h2>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Der TC startet 14 Tage Test oder fragt Saisonpass ({euroText(PREISE.saison.cents)}) bzw. Monat ({euroText(PREISE.monat.cents)}) an und zahlt per PayPal oder Überweisung.</li>
            <li>Die Anfrage erscheint hier und in deiner Glocke.</li>
            <li>Du siehst den Zahlungseingang und klickst „freischalten“ – Saisonpass bis Saisonende, Monat für einen Monat.</li>
            <li>7 Tage vor Ablauf bekommt der TC eine Erinnerung; danach ist der Team Manager gesperrt, die Daten bleiben.</li>
          </ol>
        </section>
      </div>
    </AdminGuard>
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

function TeamFreischalten() {
  const teams = useMemo(() => LIGEN_2027.flatMap(l => l.teams.map(id => ({ id, name: team27(id)?.name ?? id, liga: l.name })))
    .sort((a, b) => a.name.localeCompare(b.name, 'de')), []);
  const [team, setTeam] = useState('');
  const [art, setArt] = useState<Art>('saison');
  const [bis, setBis] = useState(vorgabeBis('saison'));
  const [weg, setWeg] = useState<'paypal' | 'ueberweisung' | 'bar' | ''>('');
  const [notiz, setNotiz] = useState('');
  const [hinweis, setHinweis] = useState<string | null>(null);
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
      <button type="button" disabled={!team || (!kostenlos && !weg)}
        onClick={() => setHinweis(`Vorschau: ${teams.find(t => t.id === team)?.name} würde jetzt ${art === 'dauerhaft' ? 'dauerhaft' : `bis ${bis.split('-').reverse().join('.')}`} freigeschaltet – noch ohne Funktion.`)}
        style={{ ...knopf, marginTop: 12, background: 'var(--th-win)', color: '#fff', border: 'none', cursor: team && (kostenlos || weg) ? 'pointer' : 'not-allowed', opacity: team && (kostenlos || weg) ? 1 : 0.5 }}>
        Freischalten
      </button>
      {hinweis && <div role="status" style={{ ...txt, marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(232,184,74,0.15)', fontSize: 12.5, fontWeight: 700 }}>{hinweis}</div>}
    </section>
  );
}

const feldLabel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-text-muted)' };
const feld: React.CSSProperties = { padding: '9px 11px', borderRadius: 9, border: '1px solid var(--th-line-8)', background: 'var(--th-bg-card3)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, fontWeight: 600 };

function Beispiel() {
  return <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, background: 'var(--th-line-6)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>Beispiel</span>;
}

const txt: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)' };
const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 };
const zaehler: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12, padding: '1px 8px', borderRadius: 999, background: 'var(--th-gold)', color: '#3A2A00' };
const zeile: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', marginBottom: 8 };
const knopf: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, background: 'transparent', border: '1.5px solid var(--th-line-8)', color: 'var(--th-text-strong)', cursor: 'not-allowed', opacity: 0.75 };
