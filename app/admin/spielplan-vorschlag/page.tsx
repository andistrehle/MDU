'use client';

// ============================================================
// Admin/Ligaleitung: Spielplan-VORSCHLAG Saison 2026/2027
// ============================================================
// Reiner Vorschlag zum Anschauen/Abstimmen — schreibt NICHTS in die DB und
// legt keine Spiele an. Der Plan ist generiert (Doppelrunde je Liga, gleiche
// Reihenfolge Hin/Rück, Derbys früh, Lokal-Heimspiele ligaübergreifend
// entzerrt, rotierendes Freilos bei ungerader Ligagröße, Ferien frei).
// Datenquelle: spielplan.json (Generator scripts/mdu-spielplan-2627.ts), über
// die Momentaufnahme lib/data/saison-2027 mit den Team-/Lokalnamen aus der DB —
// dieselben Daten wie die öffentliche Seite und „Mein Spielplan" der TCs.
// Nach einem neuen Generator-Lauf: scripts/mdu-saison-2027-snapshot.ts laufen lassen.
// ============================================================

import { useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { SpielplanView, type SpielplanData } from './spielplan-view';
import { SpielorteView } from './spielorte-view';
import { spielplanDaten27 } from '@/lib/data/saison-2027';

export default function SpielplanVorschlagPage() {
  const d: SpielplanData = spielplanDaten27();
  const [ansicht, setAnsicht] = useState<'liga' | 'spielort'>('liga');
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

        {/* Ansicht umschalten: nach Liga oder nach Spielort */}
        <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ansicht</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {([['liga', 'Nach Liga'], ['spielort', 'Nach Spielort']] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setAnsicht(key)}
              style={{
                padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-manrope)',
                border: `1px solid ${ansicht === key ? 'var(--th-accent)' : 'var(--th-line-18)'}`,
                background: ansicht === key ? 'var(--th-accent)' : 'transparent',
                color: ansicht === key ? '#fff' : 'var(--th-text-muted)',
              }}>{label}</button>
          ))}
        </div>

        {ansicht === 'liga' ? <SpielplanView data={d} /> : <SpielorteView data={d} />}

        <p style={{ marginTop: 22, fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)' }}>
          Erzeugt am {new Date(d.generatedAt).toLocaleString('de-DE')} · Nur ein Vorschlag · keine Speicherung in der Datenbank.
        </p>
      </div>
    </AdminGuard>
  );
}
