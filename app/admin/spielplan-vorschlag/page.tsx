'use client';

// ============================================================
// Admin/Ligaleitung: Spielplan-VORSCHLAG Saison 2026/2027
// ============================================================
// Reiner Vorschlag zum Anschauen/Abstimmen — schreibt NICHTS in die DB und
// legt keine Spiele an. Der Plan ist generiert (Doppelrunde je Liga, gleiche
// Reihenfolge Hin/Rück, Derbys früh, Lokal-Heimspiele ligaübergreifend
// entzerrt, rotierendes Freilos bei ungerader Ligagröße, Ferien frei).
// Datenquelle: spielplan.json (vom Generator scripts/mdu-spielplan-2627.ts).
// ============================================================

import { AdminGuard } from '@/components/mdu/admin-guard';
import { SpielplanView, type SpielplanData } from './spielplan-view';
import data from './spielplan.json';

export default function SpielplanVorschlagPage() {
  const d = data as unknown as SpielplanData;
  return (
    <AdminGuard
      title="Spielplan-Vorschlag 2026/2027"
      subtitle="Generierter Vorschlag zum Abstimmen — schreibt nichts, legt keine Spiele an. Terminsitzung 11.10., Spieltag = Fr–So (genaue Termine machen die TCs aus)."
      require="league"
    >
      <div style={{ maxWidth: 900, padding: '0 0 40px' }}>
        {/* Regeln/Annahmen kurz */}
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.65, color: 'var(--th-text-body)' }}>
          <b style={{ color: 'var(--th-text-strong)' }}>So ist der Plan gebaut:</b>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>Jede Liga eine Doppelrunde (jeder gegen jeden, Heim + Auswärts). B-Liga in <b>B1 (8)</b> und <b>B2 (7)</b> geteilt.</li>
            <li>Hin- und Rückrunde haben <b>dieselbe Spielreihenfolge</b> (Heimrecht getauscht).</li>
            <li><b>Derbys</b> (zwei Teams im selben Lokal) liegen bewusst <b>früh</b> in jeder Runde (⚔).</li>
            <li>Bei ungerader Ligagröße hat je Spieltag ein Team <b>spielfrei</b> (rotierend).</li>
            <li><b>Ferienwochenenden</b> sind frei gelassen (Herbst, Weihnachten, Fasching, Ostern, Pfingsten).</li>
            <li>Ligaübergreifend wird versucht, dass <b>nicht mehrere Teams desselben Lokals am selben Wochenende zuhause</b> spielen.</li>
          </ul>
        </div>

        <SpielplanView data={d} />

        {/* Playoff-/Relegations-Konzept */}
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: '0 0 10px' }}>
            Playoffs / Relegation (Vorschlag)
          </h2>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.65, color: 'var(--th-text-body)' }}>
            <p style={{ margin: '0 0 10px' }}>
              Meister über die Tabelle (kein Titel-Playoff). Auf-/Abstieg wird als <b>Aufstiegs-Playoff</b> ausgespielt und ist
              bewusst <b>asymmetrisch</b>: an den oberen Grenzen steigen mehr auf als ab, damit sich <b>La- und A-Liga über die
              Jahre füllen</b>. Die Playoffs entscheiden selbst, wie viele hoch- bzw. runtergehen. Alles bis <b>Anfang Juni 2027</b>
              (reservierte Wochenenden im Mai).
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>
                <b>La-Relegation (La wächst 6 → 8):</b> die <b>Top 3 der A</b> + die <b>2 Letzten der La</b> = 5 Teams spielen um
                <b> 4 La-Plätze</b>. 1 Team scheidet aus. → 2–3 aus der A hoch, 0–1 aus der La runter.
              </li>
              <li>
                <b>A-Relegation (A wächst ~9 → ~10):</b> die <b>2 Letzten der A</b> + <b>4 aus der B</b> (B1-Meister, B1-Vize,
                B2-Meister, B2-Vize) = 6 Teams spielen um <b>4 A-Plätze</b>. → 2–3 aus der B hoch, 1–2 aus der A runter.
              </li>
              <li>
                <b>B ↔ C (ausgeglichen):</b> gleich viele hoch wie runter (z. B. 2 ↔ 2) — über Tabelle oder kurze Relegation.
                B normalisiert sich Richtung 12–13 und wird wieder in B1/B2 geteilt.
              </li>
              <li><b>Format je Runde:</b> Mini-Turnier oder Hin-/Rückspiel an einem reservierten Wochenende (Mai–Anfang Juni).</li>
            </ul>
            <p style={{ margin: '10px 0 0', color: 'var(--th-text-faint)', fontSize: 12 }}>
              Voraussichtliche Größen nächste Saison: <b>La 8</b>, <b>A ~10</b>, <b>B ~12–13</b> (B1/B2), <b>C ~7</b>. Genaue
              Endzahlen ergeben sich aus den Playoff-Ergebnissen.
            </p>
          </div>
        </div>

        <p style={{ marginTop: 22, fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)' }}>
          Erzeugt am {new Date(d.generatedAt).toLocaleString('de-DE')} · Nur ein Vorschlag · keine Speicherung in der Datenbank.
        </p>
      </div>
    </AdminGuard>
  );
}
