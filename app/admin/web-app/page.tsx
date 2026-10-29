'use client';

// ============================================================
// Admin → Statistik → Web-App (nur Super-Admin, Migration 0064)
// ============================================================
// Installationen (gezählt, sobald die App vom Startbildschirm geöffnet wird)
// und Geräte mit Benachrichtigungen. Nur Summen, keine einzelnen Geräte.
// ============================================================

import { useEffect, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { supabase } from '@/lib/supabase/client';

interface Daten {
  installationen: { gesamt: number; aktiv7: number; aktiv30: number; jePlattform: Record<string, number>; neuJeTag: Record<string, number> };
  push: { geraete: number; personen: number; iphone: number; zugestellt: number };
}
const PLATTFORM: Record<string, string> = { ios: 'iPhone/iPad', android: 'Android', desktop: 'Computer', sonst: 'Sonstige' };

export default function WebAppStatistik() {
  const [d, setD] = useState<Daten | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  useEffect(() => {
    let ab = false;
    (async () => {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const r = await fetch('/api/admin/web-app', { headers: { Authorization: `Bearer ${token ?? ''}` } }).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : { error: 'Keine Verbindung.' };
      if (ab) return;
      if (r?.ok) setD(j as Daten); else setFehler((j as { error?: string }).error ?? 'Fehlgeschlagen.');
    })();
    return () => { ab = true; };
  }, []);

  const tage = d ? Object.entries(d.installationen.neuJeTag).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14) : [];
  return (
    <AdminGuard title="Web-App" subtitle="Installationen und Benachrichtigungen" require="super">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
        {fehler && <div role="alert" style={{ ...txt, color: 'var(--th-loss)', fontWeight: 700 }}>{fehler}</div>}
        {!d && !fehler && <div style={txt}>Lade …</div>}
        {d && (
          <>
            <section style={karte}>
              <h2 style={h2}>Installiert</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Zahl wert={d.installationen.gesamt} text="Geräte gesamt" />
                <Zahl wert={d.installationen.aktiv7} text="geöffnet in den letzten 7 Tagen" />
                <Zahl wert={d.installationen.aktiv30} text="in den letzten 30 Tagen" />
              </div>
              <div style={{ ...txt, marginTop: 10 }}>
                {Object.entries(d.installationen.jePlattform).map(([k, v]) => `${PLATTFORM[k] ?? k}: ${v}`).join(' · ') || 'Noch keine.'}
              </div>
              <div style={{ ...txt, fontSize: 12.5, color: 'var(--th-text-muted)', marginTop: 8 }}>
                Gezählt wird ab dem 29.10.2026, und zwar erst, wenn jemand die App vom Startbildschirm öffnet. Wer sie vorher installiert hat, erscheint beim nächsten Öffnen.
              </div>
              {tage.length > 0 && (
                <div style={{ ...txt, fontSize: 13, marginTop: 10 }}>
                  <b>Neu je Tag:</b> {tage.map(([t, n]) => `${t.slice(8, 10)}.${t.slice(5, 7)}. ${n}`).join(' · ')}
                </div>
              )}
            </section>
            <section style={karte}>
              <h2 style={h2}>Benachrichtigungen an</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Zahl wert={d.push.geraete} text={`Geräte (${d.push.personen} Personen)`} />
                <Zahl wert={d.push.iphone} text="davon iPhone/iPad (nur als installierte App möglich)" />
                <Zahl wert={d.push.zugestellt} text="haben schon eine Nachricht bekommen" />
              </div>
            </section>
          </>
        )}
      </div>
    </AdminGuard>
  );
}

function Zahl({ wert, text }: { wert: number; text: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, color: 'var(--th-text-strong)', lineHeight: 1 }}>{wert}</div>
      <div style={{ ...txt, fontSize: 12.5, color: 'var(--th-text-muted)', marginTop: 4 }}>{text}</div>
    </div>
  );
}

const txt: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)' };
const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: '0 0 10px' };
const karte: React.CSSProperties = { padding: '14px 16px', borderRadius: 14, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)' };
