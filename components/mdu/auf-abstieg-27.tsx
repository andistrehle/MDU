import {
  AUF_AB_2027, RELEGATIONEN_2027, groessenNaechsteSaison, LIGEN_2027,
  type Liga27, type Zone,
} from '@/lib/data/saison-2027';

// Auf-/Abstieg 2026/27 je Tabellenplatz (Server-tauglich, keine Hooks).
// Vor dem ersten Spieltag zeigt die Karte nur die Plätze, nicht die Teams —
// die alphabetische Vorschau-Tabelle sagt nichts über die Platzierung.

const ZONE: Record<Zone, { bg: string; fg: string; zeichen: string }> = {
  auf:    { bg: 'rgba(34,197,94,0.10)',  fg: '#1E8E3E', zeichen: '▲' },
  rel:    { bg: 'rgba(232,184,74,0.16)', fg: '#9A6B00', zeichen: '⚔' },
  ab:     { bg: 'rgba(212,0,0,0.08)',    fg: '#C0392B', zeichen: '▼' },
  bleibt: { bg: 'transparent',           fg: 'var(--th-text-faint)', zeichen: '' },
};

export function AufAbstiegLegende() {
  const item = (z: Zone, label: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 14, height: 14, borderRadius: 3, background: z === 'bleibt' ? 'var(--th-bg-card)' : ZONE[z].bg, border: '1px solid var(--th-line-10)' }} />
      <span style={{ color: z === 'bleibt' ? 'var(--th-text-muted)' : ZONE[z].fg, fontWeight: 700 }}>{ZONE[z].zeichen} {label}</span>
    </span>
  );
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', padding: '10px 14px', borderRadius: 10, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 12.5 }}>
      {item('auf', 'Aufstieg (sicher)')}
      {item('rel', 'Relegationsspiel')}
      {item('ab', 'Abstieg (sicher)')}
      {item('bleibt', 'bleibt in der Liga')}
    </div>
  );
}

export function AufAbstiegKarte({ liga }: { liga: Liga27 }) {
  const regeln = AUF_AB_2027[liga.code];
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderLeft: `3px solid ${liga.color}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--th-line-6)' }}>
        <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>{liga.name}</span>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-faint)' }}>{liga.teams.length} Teams</span>
      </div>
      {regeln.map((r, i) => {
        const z = ZONE[r.zone];
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) auto', alignItems: 'center', gap: 8, padding: '7px 16px', background: z.bg, borderTop: i ? '1px solid var(--th-line-4)' : 'none', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
            <span style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{i + 1}.</span>
            <span aria-hidden style={{ borderBottom: '1px dotted var(--th-line-18)', height: 1, alignSelf: 'center' }} />
            <span style={{ fontWeight: 700, color: z.fg, whiteSpace: 'nowrap' }}>{z.zeichen ? `${z.zeichen} ` : ''}{r.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Relegationsspiele (alle oder nur die einer Liga) + Ligagrößen der Folgesaison. */
export function RelegationUndAusblick({ nurLiga }: { nurLiga?: string }) {
  const g = groessenNaechsteSaison();
  const kurz = nurLiga?.toUpperCase();
  const spiele = kurz ? RELEGATIONEN_2027.filter(r => r.oben.startsWith(kurz + '-') || r.unten.startsWith(kurz + '-')) : RELEGATIONEN_2027;
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.65, color: 'var(--th-text-body)' }}>
      {spiele.length > 0 && (
        <>
          <b style={{ color: 'var(--th-text-strong)' }}>{spiele.length === 1 ? 'Relegationsspiel' : `Die ${spiele.length} Relegationsspiele`}</b>
          <span style={{ color: 'var(--th-text-muted)' }}> (Saisonende, Sieger oben, Verlierer unten)</span>
          <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>
            {spiele.map(r => <li key={r.oben}><b>{r.oben}</b> ⟷ <b>{r.unten}</b> → um {r.um}</li>)}
          </ul>
        </>
      )}
      {!kurz && <div style={{ color: 'var(--th-text-muted)' }}>Zwischen A und La Liga gibt es keine Relegation: Aus der A steigen drei direkt auf, aus der La einer direkt ab.</div>}
      <div style={{ marginTop: 6 }}>
        Saison 2027/28: La <b>{g.La}</b> · A <b>{g.A}</b> · B <b>{g.B}</b> · C <b>{g.C}</b> = <b>{g.La + g.A + g.B + g.C} Teams</b>
      </div>
    </div>
  );
}

/** Ganze Übersicht (alle Ligen) für /tabellen. */
export function AufAbstiegUebersicht() {
  return (
    <section id="auf-abstieg" style={{ marginTop: 40, scrollMarginTop: 90 }}>
      <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: '0 0 12px' }}>
        Auf- und Abstieg 2026/27
      </h2>
      <AufAbstiegLegende />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 14, margin: '14px 0' }}>
        {LIGEN_2027.map(l => <AufAbstiegKarte key={l.code} liga={l} />)}
      </div>
      <RelegationUndAusblick />
    </section>
  );
}
