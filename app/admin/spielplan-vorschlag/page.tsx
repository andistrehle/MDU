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
              Meister werden über die Tabelle entschieden (kein Titel-Playoff). Auf-/Abstieg zwischen den Ligen wird als
              Relegation ausgespielt — jeweils <b>2–3 Teams</b> aus den angrenzenden Ligen, alles bis <b>Anfang Juni 2027</b>.
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>La ↔ A:</b> untere 2 der La Liga gegen die oberen 2 der A Liga (Kreuz-Halbfinale + Platzierungsspiel).</li>
              <li><b>A ↔ B:</b> untere 2 der A Liga gegen die Meister/Vize aus B1 und B2.</li>
              <li><b>B ↔ C:</b> untere je 1–2 aus B1/B2 gegen die oberen 2–3 der C Liga.</li>
              <li><b>Format je Runde:</b> Hin-/Rückspiel oder Mini-Turnier an einem reservierten Wochenende (Mai–Anfang Juni).</li>
            </ul>
            <p style={{ margin: '10px 0 0', color: 'var(--th-text-faint)', fontSize: 12 }}>
              Genaue Team-Zahlen je Relegationsrunde legen wir fest, sobald die Ligagrößen final sind — 2–3 aus einer 6er-Liga
              ist viel, dort eher 2.
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
