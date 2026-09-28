// Anschauliche Darstellung von Auf-/Abstieg + Playoffs — bewusst ohne Fachjargon,
// damit es auch ohne Vorwissen verständlich ist. Rein statisch (nur Anzeige).

import type { CSSProperties } from 'react';

const UP = 'var(--th-win)';      // grün = Aufsteiger
const DOWN = '#e5484d';          // rot = Absteiger

function LeagueBar({ name, size, accent }: { name: string; size: string; accent: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderRadius: 12, background: 'var(--th-bg-card)',
      border: '1px solid var(--th-line-8)', borderLeft: `5px solid ${accent}`,
    }}>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--th-text-strong)' }}>{name}</span>
      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-muted)' }}>{size}</span>
    </div>
  );
}

function badge(color: string): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999,
    fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, color: '#fff', background: color,
  };
}

function ArrowRow({ up, down, balanced }: { up?: string; down?: string; balanced?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
      {balanced ? (
        <span style={badge('var(--th-text-faint)')}>⇅ {balanced}</span>
      ) : (
        <>
          {up && <span style={badge(UP)}>▲ {up}</span>}
          {down && <span style={badge(DOWN)}>▼ {down}</span>}
        </>
      )}
    </div>
  );
}

type ChipKind = 'a' | 'la' | 'b' | 'c';
function chip(text: string, kind: ChipKind) {
  const bg = kind === 'la' ? 'var(--th-accent-a12)' : kind === 'a' ? 'rgba(91,224,140,0.12)'
    : kind === 'c' ? 'rgba(232,184,74,0.12)' : 'rgba(255,255,255,0.06)';
  const bd = kind === 'la' ? 'var(--th-accent-a25)' : kind === 'a' ? 'rgba(91,224,140,0.3)'
    : kind === 'c' ? 'rgba(232,184,74,0.3)' : 'var(--th-line-10)';
  return (
    <span key={text} style={{
      padding: '6px 11px', borderRadius: 8, background: bg, border: `1px solid ${bd}`,
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-strong)',
    }}>{text}</span>
  );
}

function PlayoffCard({ title, subtitle, inputs, outUp, outDown }: {
  title: string; subtitle: string;
  inputs: { text: string; kind: ChipKind }[];
  outUp: string; outDown: string;
}) {
  return (
    <div style={{ padding: '16px', borderRadius: 14, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)' }}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 17, textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', margin: '2px 0 12px' }}>{subtitle}</div>

      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--th-text-faint)', marginBottom: 7 }}>Diese Teams spielen ({inputs.length})</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{inputs.map(i => chip(i.text, i.kind))}</div>

      <div style={{ textAlign: 'center', fontSize: 22, color: 'var(--th-text-faint)', margin: '6px 0 2px' }}>▼</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ ...badge(UP), fontSize: 13 }}>▲ {outUp}</span>
        <span style={{ ...badge(DOWN), fontSize: 13 }}>▼ {outDown}</span>
      </div>
    </div>
  );
}

export function RelegationVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.6, color: 'var(--th-text-body)' }}>
        <b>Kurz gesagt:</b> Oben steigen mehr Teams auf als ab — so werden La- und A-Liga größer. Jede Playoff-Runde
        ist eine kleine Rangliste: die oberen Plätze kommen in die höhere Liga, die unteren in die tiefere. Die große
        B-Liga gibt oben mehr an die A ab, als sie zurückbekommt, und schrumpft dadurch (15 → ~12); die C-Liga wächst
        leicht (~7 → ~8). Jede Playoff-Gruppe spielt eine <b>Einfachrunde – jeder gegen jeden</b> (Mai–Mitte Juni);
        die obersten Tabellenplätze steigen auf, die untersten ab.
      </p>

      {/* Liga-Pyramide */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <LeagueBar name="La Liga" size="6 → 7 Teams" accent="var(--th-gold)" />
        <ArrowRow up="3 steigen auf" down="2 steigen ab" />
        <LeagueBar name="A Liga" size="9 → 10 Teams" accent="var(--th-accent)" />
        <ArrowRow up="4 steigen auf" down="2 steigen ab" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <LeagueBar name="B1" size="8 Teams" accent="#6E7177" />
          <LeagueBar name="B2" size="7 Teams" accent="#6E7177" />
        </div>
        <ArrowRow balanced="Playoff: 3 Plätze B · 3 Plätze C" />
        <LeagueBar name="C Liga" size="~7 → ~8 Teams" accent="#8A6D3B" />
      </div>

      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', textAlign: 'center' }}>
        Am Ende: La <b>7</b> · A <b>10</b> · B <b>~12</b> (wieder B1/B2) · C <b>~8</b> — zusammen weiter 37 Teams.
      </div>

      {/* Playoff-Termine */}
      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', lineHeight: 1.7 }}>
        <b style={{ color: 'var(--th-text-strong)' }}>Playoff-Termine</b> (letzter regulärer Spieltag: 16.–18.04.2027):
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ color: 'var(--th-text-faint)' }}>1 Woche Puffer / Nachholspiele, dann direkt die Playoffs:</span>
          <span>Playoffs (Einfachrunde, alle 3 Gruppen parallel · je 5 Spieltage):</span>
          <span style={{ paddingLeft: 10 }}><b>ST1</b> 23.–25.04. · <b>ST2</b> 07.–09.05. · <b>ST3</b> 21.–23.05. · <b>ST4</b> 28.–30.05. · <b>ST5</b> 04.–06.06.2027</span>
        </div>
        <div style={{ marginTop: 6, color: 'var(--th-text-faint)', fontSize: 11.5 }}>
          Ferien/Feiertage ausgelassen (1. Mai am 30.04.–02.05., Pfingsten am 14.–16.05.). Fertig bis Anfang Juni 2027.
        </div>
      </div>

      {/* Playoffs */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
        <PlayoffCard
          title="Playoff um die La-Liga"
          subtitle="Einfachrunde (jeder gegen jeden) · damit die La-Liga auf 7 wächst"
          inputs={[
            { text: 'A-Liga · 1.', kind: 'a' }, { text: 'A-Liga · 2.', kind: 'a' }, { text: 'A-Liga · 3.', kind: 'a' },
            { text: 'La-Liga · 5.', kind: 'la' }, { text: 'La-Liga · 6.', kind: 'la' },
          ]}
          outUp="3 Teams → La Liga"
          outDown="2 Teams → A Liga"
        />
        <PlayoffCard
          title="Playoff um die A-Liga"
          subtitle="Einfachrunde (jeder gegen jeden) · damit die A-Liga auf 10 wächst"
          inputs={[
            { text: 'A-Liga · vorletzter', kind: 'a' }, { text: 'A-Liga · letzter', kind: 'a' },
            { text: 'B1 · Meister', kind: 'b' }, { text: 'B1 · Vize', kind: 'b' },
            { text: 'B2 · Meister', kind: 'b' }, { text: 'B2 · Vize', kind: 'b' },
          ]}
          outUp="4 Teams → A Liga"
          outDown="2 Teams → B Liga"
        />
        <PlayoffCard
          title="Playoff um B / C"
          subtitle="Einfachrunde (jeder gegen jeden) · damit die große B-Liga wieder kleiner wird"
          inputs={[
            { text: 'B1 · vorletzter', kind: 'b' }, { text: 'B1 · letzter', kind: 'b' },
            { text: 'B2 · vorletzter', kind: 'b' }, { text: 'B2 · letzter', kind: 'b' },
            { text: 'C-Liga · 1.', kind: 'c' }, { text: 'C-Liga · 2.', kind: 'c' },
          ]}
          outUp="3 Teams → B Liga"
          outDown="3 Teams → C Liga"
        />
      </div>

      <p style={{ margin: 0, fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', lineHeight: 1.55 }}>
        Die A-Liga gibt oben netto 1 Team an die La ab (3 hoch, 2 runter) und holt unten netto 2 (4 hoch, 2 runter) —
        unterm Strich <b>+1</b> (9 → 10). Beim untersten Playoff gehen 2 C-Teams rein, aber 3 C-Plätze raus — deshalb
        wächst die C leicht (~7 → ~8), und die B wird kleiner (15 → ~12).
      </p>
    </div>
  );
}
