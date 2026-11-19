'use client';

// ============================================================
// „Was wurde geändert?“ an einem Spielbericht (Betreiber, 19.11.2026)
// ============================================================
// Zeigt die nachträglichen Änderungen eines schon eingereichten Berichts in Worten
// („Spiel 2: Ergebnis 1:2 → 0:2“), neueste zuerst. Quelle: Verlauf `geaendert`
// (ladeAenderungen in lib/supabase/match-reports.ts, geschrieben von
// /api/match-reports/aenderung). Ohne Änderungen erscheint nichts.
// ============================================================

export interface BerichtAenderung { am: string; zeilen: string[] }

const wann = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' })}`;
};

export function BerichtAenderungen({ liste, style }: { liste?: BerichtAenderung[]; style?: React.CSSProperties }) {
  if (!liste?.length) return null;
  return (
    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, lineHeight: 1.5, color: 'var(--th-text-body)', ...style }}>
      {liste.map((a, i) => (
        <div key={a.am + i} style={{ marginTop: i ? 4 : 0 }}>
          <span style={{ fontWeight: 800, color: '#9A6B00' }}>✎ Geändert {wann(a.am)}:</span>{' '}
          {a.zeilen.join(' · ')}
        </div>
      ))}
    </div>
  );
}
