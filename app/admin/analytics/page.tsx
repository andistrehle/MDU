'use client';

// ============================================================
// Nutzungsstatistik (nur Super-Admin) — anonym & cookielos
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { loadAnalytics, type AnalyticsData } from '@/lib/supabase/analytics';

const RANGES = [7, 30, 90] as const;

function fmtDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}
const themeLabel = (t: string) => t === 'light' ? 'Old School (Classic)' : t === 'dark' ? 'New Design (Dark)' : t;

export default function AdminAnalyticsPage() {
  return (
    <AdminGuard title="Nutzungsstatistik" subtitle="Anonym & cookielos · nur für Super Admins sichtbar." require="super">
      <Analytics />
    </AdminGuard>
  );
}

function Analytics() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    const { data, error } = await loadAnalytics(days);
    if (error) { setStatus('error'); setErr(error); return; }
    setData(data); setStatus('idle');
  }, [days]);
  useEffect(() => { queueMicrotask(() => load()); }, [load]);

  const totals = useMemo(() => {
    if (!data) return { views: 0, sessions: 0, loginViews: 0, loginPct: 0 };
    const views = data.daily.reduce((s, r) => s + Number(r.views), 0);
    const sessions = data.daily.reduce((s, r) => s + Number(r.sessions), 0);
    const loginViews = data.logins.filter(l => l.logged_in).reduce((s, r) => s + Number(r.views), 0);
    return { views, sessions, loginViews, loginPct: views ? Math.round((loginViews / views) * 100) : 0 };
  }, [data]);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {RANGES.map(r => (
          <button key={r} type="button" onClick={() => setDays(r)} style={chip(days === r)}>Letzte {r} Tage</button>
        ))}
        <button type="button" onClick={() => load()} style={chip(false)}>Aktualisieren</button>
      </div>

      {status === 'loading' && <p style={muted}>Lade Statistik …</p>}
      {status === 'error' && (
        <div style={card}><strong style={{ color: 'var(--th-loss)' }}>Fehler:</strong> <span style={{ color: 'var(--th-text-muted)' }}>{err}</span>
          <p style={{ ...muted, marginTop: 8 }}>Falls „function … does not exist": bitte Migration 0038_analytics.sql in Supabase einspielen.</p>
        </div>
      )}

      {status === 'idle' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Überblick */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Stat label="Seitenaufrufe" value={totals.views} />
            <Stat label="Sitzungen (ca.)" value={totals.sessions} />
            <Stat label="davon eingeloggt" value={`${totals.loginPct}%`} />
            <Stat label="Zeitraum" value={`${days} Tage`} />
          </div>

          {/* Pro Tag */}
          <Section title="Seitenaufrufe & Sitzungen pro Tag">
            {data.daily.length === 0 ? <p style={muted}>Noch keine Daten im Zeitraum.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => { const max = Math.max(1, ...data.daily.map(d => Number(d.views))); return data.daily.map(d => (
                  <div key={d.day} style={{ display: 'grid', gridTemplateColumns: '54px 1fr 96px', alignItems: 'center', gap: 10 }}>
                    <span style={{ ...small, color: 'var(--th-text-muted)' }}>{fmtDay(d.day)}</span>
                    <div style={{ background: 'var(--th-line-4)', borderRadius: 5, height: 16, overflow: 'hidden' }}>
                      <div style={{ width: `${(Number(d.views) / max) * 100}%`, height: '100%', background: 'var(--th-accent)', borderRadius: 5 }} />
                    </div>
                    <span style={{ ...small, textAlign: 'right', color: 'var(--th-text-body)' }}>{d.views} Aufr. · {d.sessions} Sitz.</span>
                  </div>
                )); })()}
              </div>
            )}
          </Section>

          {/* Theme-Split */}
          <Section title="New Design (Dark) vs. Old School (Classic)">
            <SplitBars rows={data.theme.map(t => ({ label: themeLabel(t.theme), value: Number(t.views) }))} unit="Aufrufe" />
          </Section>

          {/* Login-Quote */}
          <Section title="Eingeloggt vs. anonym">
            <SplitBars rows={data.logins.map(l => ({ label: l.logged_in ? 'Eingeloggt' : 'Anonym (ausgeloggt)', value: Number(l.views) }))} unit="Aufrufe" />
          </Section>

          {/* Top-Seiten */}
          <Section title="Meistbesuchte Seiten">
            {data.topPaths.length === 0 ? <p style={muted}>Noch keine Daten.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => { const max = Math.max(1, ...data.topPaths.map(p => Number(p.views))); return data.topPaths.map(p => (
                  <div key={p.path} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...small, color: 'var(--th-text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-jetbrains-mono)' }}>{p.path}</div>
                      <div style={{ background: 'var(--th-line-4)', borderRadius: 4, height: 8, overflow: 'hidden', marginTop: 3 }}>
                        <div style={{ width: `${(Number(p.views) / max) * 100}%`, height: '100%', background: 'var(--th-accent)' }} />
                      </div>
                    </div>
                    <span style={{ ...small, textAlign: 'right', color: 'var(--th-text-muted)' }}>{p.views} · {p.sessions} Sitz.</span>
                  </div>
                )); })()}
              </div>
            )}
          </Section>

          <p style={muted}>
            Erhoben werden ausschließlich anonyme Ereignisse (Pfad, Theme, ein-/ausgeloggt-Kennzeichen, zufällige
            Session-ID) — keine Cookies, keine IP, keine Zuordnung zu einzelnen Personen. Admin-Seiten werden nicht gezählt.
          </p>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={card}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26, color: 'var(--th-text-strong)', lineHeight: 1 }}>{value}</div>
      <div style={{ ...small, color: 'var(--th-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
function SplitBars({ rows, unit }: { rows: { label: string; value: number }[]; unit: string }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return <p style={muted}>Noch keine Daten.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.sort((a, b) => b.value - a.value).map(r => { const pct = Math.round((r.value / total) * 100); return (
        <div key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...small, color: 'var(--th-text-body)', marginBottom: 4 }}>
            <span>{r.label}</span><span style={{ color: 'var(--th-text-muted)' }}>{pct}% · {r.value} {unit}</span>
          </div>
          <div style={{ background: 'var(--th-line-4)', borderRadius: 5, height: 14, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--th-accent)', borderRadius: 5 }} />
          </div>
        </div>
      ); })}
    </div>
  );
}

const card: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px' };
const muted: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' };
const small: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12.5 };
function chip(active: boolean): React.CSSProperties {
  return { padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5,
    background: active ? 'var(--th-accent)' : 'transparent', color: active ? '#fff' : 'var(--th-text-muted)',
    border: `1.5px solid ${active ? 'var(--th-accent)' : 'var(--th-line-10)'}` };
}
