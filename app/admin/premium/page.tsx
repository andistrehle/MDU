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

import { AdminGuard } from '@/components/mdu/admin-guard';
import { PREISE, euroText, PREMIUM_OEFFENTLICH } from '@/lib/premium';

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

function Beispiel() {
  return <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, background: 'var(--th-line-6)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>Beispiel</span>;
}

const txt: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)' };
const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 };
const zaehler: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12, padding: '1px 8px', borderRadius: 999, background: 'var(--th-gold)', color: '#3A2A00' };
const zeile: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', marginBottom: 8 };
const knopf: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, background: 'transparent', border: '1.5px solid var(--th-line-8)', color: 'var(--th-text-strong)', cursor: 'not-allowed', opacity: 0.75 };
