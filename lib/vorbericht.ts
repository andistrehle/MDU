// ============================================================
// Vorbericht fürs WhatsApp-Live (Betreiber, 13.11.2026) — reine Rechnung
// ============================================================
// Fakten zu einer Begegnung vor dem Anwurf: Tabellenplatz beider Teams, Form
// der letzten Spiele, Top-Spieler (Einzelrangliste) + meiste Highlights je
// Team, letztes Duell. Daraus schreibt Claude ein paar lockere Sätze
// (app/api/live/vorbericht); ohne Claude baut `vorlageText` einen Text.
// ============================================================

import type { Ergebnis27, TabellenZeile } from './tabelle-2027';
import type { EinzelZeile } from './einzelrangliste-2027';

export interface VorberichtTeam {
  name: string;
  platz: number | null;
  vonTeams: number;
  punkte: number;
  spiele: number;
  bilanz: string; // „3-1-2“ = Siege-Unentschieden-Niederlagen
  /** Neueste zuerst, höchstens 5: „S 12:6 gg. X“ */
  form: { ergebnis: 'S' | 'U' | 'N'; stand: string; gegner: string }[];
  topSpieler: { name: string; bilanz: string; ligaPlatz: number } | null;
  meisteHighlights: { name: string; anzahl: number; was: string } | null;
}

export interface VorberichtFakten {
  heim: VorberichtTeam;
  gast: VorberichtTeam;
  lokal: string | null;
  anwurf: string | null;
  /** Letztes Duell in dieser Saison (Heim:Gast aus Sicht DIESER Begegnung) */
  letztesDuell: { stand: string; sieger: string | null; datum: string | null } | null;
}

type Plan = { key: string; home: string; away: string; datum: string | null };

const hlAnzahl = (z: EinzelZeile) => z.b180 + z.b171 + z.hfAnzahl + z.slAnzahl;
function hlWas(z: EinzelZeile): string {
  const t: string[] = [];
  if (z.b180) t.push(`${z.b180}× 180`);
  if (z.b171) t.push(`${z.b171}× 171`);
  if (z.hfAnzahl) t.push(`${z.hfAnzahl}× High Finish${z.highFinish ? ` (bestes ${z.highFinish})` : ''}`);
  if (z.slAnzahl) t.push(`${z.slAnzahl}× Short Leg${z.shortLeg ? ` (bestes ${z.shortLeg} Darts)` : ''}`);
  return t.join(', ');
}

export function teamFakten(
  teamId: string, name: (id: string) => string, tabelle: TabellenZeile[],
  ergebnisse: Ergebnis27[], plan: Plan[], einzel: EinzelZeile[], vorKey: string,
): VorberichtTeam {
  const z = tabelle.find(t => t.team === teamId);
  const datumVon = new Map(plan.map(p => [p.key, p.datum]));
  const eigene = ergebnisse
    .filter(e => (e.home === teamId || e.away === teamId) && e.key !== vorKey)
    .map(e => ({ e, d: e.datum ?? datumVon.get(e.key) ?? '' }))
    .sort((a, b) => b.d.localeCompare(a.d))
    .slice(0, 5)
    .map(({ e }) => {
      const heim = e.home === teamId;
      const f = heim ? e.spieleHome : e.spieleAway, g = heim ? e.spieleAway : e.spieleHome;
      return { ergebnis: (f > g ? 'S' : f < g ? 'N' : 'U') as 'S' | 'U' | 'N', stand: `${f}:${g}`, gegner: name(heim ? e.away : e.home) };
    });
  const spieler = einzel.filter(s => s.teamId === teamId && s.singles > 0);
  const top = [...spieler].sort((a, b) => a.pos - b.pos)[0];
  const hl = [...spieler].filter(s => hlAnzahl(s) > 0).sort((a, b) => hlAnzahl(b) - hlAnzahl(a) || b.hlPunkte - a.hlPunkte)[0];
  return {
    name: name(teamId),
    platz: z && z.sp > 0 ? z.pos : null,
    vonTeams: tabelle.length,
    punkte: z?.pts ?? 0,
    spiele: z?.sp ?? 0,
    bilanz: `${z?.s ?? 0}-${z?.u ?? 0}-${z?.n ?? 0}`,
    form: eigene,
    topSpieler: top ? { name: top.name, bilanz: `${top.wins}:${top.losses}`, ligaPlatz: top.pos } : null,
    meisteHighlights: hl ? { name: hl.name, anzahl: hlAnzahl(hl), was: hlWas(hl) } : null,
  };
}

/** Letztes Duell der beiden in dieser Saison (Hin- oder anderes Spiel), nicht diese Begegnung selbst. */
export function letztesDuell(home: string, away: string, vorKey: string, ergebnisse: Ergebnis27[], name: (id: string) => string): VorberichtFakten['letztesDuell'] {
  const d = ergebnisse
    .filter(e => e.key !== vorKey && ((e.home === home && e.away === away) || (e.home === away && e.away === home)))
    .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))[0];
  if (!d) return null;
  const h = d.home === home ? d.spieleHome : d.spieleAway, g = d.home === home ? d.spieleAway : d.spieleHome;
  return { stand: `${name(home)} ${h}:${g} ${name(away)}`, sieger: h > g ? name(home) : g > h ? name(away) : null, datum: d.datum };
}

/** Text ohne Claude — nur Fakten, kurz. */
export function vorlageText(f: VorberichtFakten): string {
  const zeile = (t: VorberichtTeam) => {
    const teile = [t.platz ? `Platz ${t.platz} mit ${t.punkte} Punkten` : 'noch ohne Tabellenplatz'];
    if (t.form.length) teile.push(`Form ${t.form.map(x => x.ergebnis).join('-')}`);
    if (t.topSpieler) teile.push(`Topmann ${t.topSpieler.name} (${t.topSpieler.bilanz})`);
    return `${t.name}: ${teile.join(', ')}.`;
  };
  const z = ['📋 Vorbericht', '', zeile(f.heim), zeile(f.gast)];
  if (f.letztesDuell) z.push('', `Letztes Duell: ${f.letztesDuell.stand}.`);
  return z.join('\n');
}
