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

        <p style={{ marginTop: 22, fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)' }}>
          Erzeugt am {new Date(d.generatedAt).toLocaleString('de-DE')} · Nur ein Vorschlag · keine Speicherung in der Datenbank.
        </p>
      </div>
    </AdminGuard>
  );
}
