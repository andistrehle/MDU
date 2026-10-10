// ============================================================
// Tabelle 2026/27 aus Spielberichten — reine Rechnung (ohne DB)
// ============================================================
//
// Regeln (Spielbedingungen Ziffer 10 + Vorgabe des Betreibers, 09.10.2026):
//   • Begegnung: Sieg 3 · Unentschieden je 1 · Niederlage 0 (aus den Spielen,
//     18 je Begegnung).
//   • Reihenfolge: Punkte → Spieldifferenz → Legdifferenz → direkter Vergleich
//     (Mini-Tabelle nur der Punktgleichen: Punkte → Spiel- → Legdifferenz aus
//     ihren Begegnungen untereinander). Ist dann noch alles gleich, teilen sie
//     sich den Platz.
//   • Ein Ergebnis zählt ab dem Einreichen; bis der Gegner bestätigt, ist es
//     als „noch nicht bestätigt" markiert.
//   • Nichtantritt (Wertung der Ligaleitung): 0:3 Punkte, 0:18 Spiele
//     (Legs 0:36 — 18 Spiele à 2:0; La Liga Best of 5: 0:54); dem nicht angetretenen Team zusätzlich
//     −3 Punkte. Fehlender Spielbericht: Heimteam verliert 0:3 / 0:18, ohne Abzug.
// ============================================================

export type Wertung = 'home_no_show' | 'guest_no_show' | 'no_report';

export interface Ergebnis27 {
  /** Begegnung (Heim|Gast) */
  key: string;
  home: string;
  away: string;
  spieleHome: number;
  spieleAway: number;
  legsHome: number;
  legsAway: number;
  ptsHome: number;
  ptsAway: number;
  /** Abzug für Nichtantritt (negativ), je Seite */
  abzugHome: number;
  abzugAway: number;
  bestaetigt: boolean;
  wertung: Wertung | null;
  /** Spieldatum laut Bericht (YYYY-MM-DD) */
  datum: string | null;
  reportId: string;
}

export interface Rohbericht {
  id: string;
  home_team_id: string;
  guest_team_id: string;
  spiele_home: number | null;
  spiele_guest: number | null;
  legs_home: number | null;
  legs_guest: number | null;
  status: string;
  forfeit: string | null;
  match_date: string | null;
}

/** Zählt ein Bericht in der Tabelle? Ab dem Einreichen ja (auch während der Gegner eine Änderung anfordert). */
export const zaehlt = (r: Pick<Rohbericht, 'status' | 'forfeit'>) =>
  !!r.forfeit || r.status === 'submitted' || r.status === 'changes_requested' || r.status === 'confirmed';

const punkte = (a: number, b: number) => (a > b ? 3 : a === b ? 1 : 0);

/** `legsProSpiel`: 2 (Best of 3) bzw. 3 (La Liga, Best of 5) — nur für Wertungen. */
export function ergebnisAusBericht(r: Rohbericht, legsProSpiel = 2): Ergebnis27 {
  const base = { key: `${r.home_team_id}|${r.guest_team_id}`, home: r.home_team_id, away: r.guest_team_id, datum: r.match_date, reportId: r.id };
  const w = (r.forfeit ?? null) as Wertung | null;
  if (w) {
    const homeVerliert = w === 'home_no_show' || w === 'no_report';
    return {
      ...base, wertung: w, bestaetigt: true,
      spieleHome: homeVerliert ? 0 : 18, spieleAway: homeVerliert ? 18 : 0,
      legsHome: homeVerliert ? 0 : 18 * legsProSpiel, legsAway: homeVerliert ? 18 * legsProSpiel : 0,
      ptsHome: homeVerliert ? 0 : 3, ptsAway: homeVerliert ? 3 : 0,
      abzugHome: w === 'home_no_show' ? -3 : 0, abzugAway: w === 'guest_no_show' ? -3 : 0,
    };
  }
  const sh = r.spiele_home ?? 0, sa = r.spiele_guest ?? 0;
  return {
    ...base, wertung: null, bestaetigt: r.status === 'confirmed',
    spieleHome: sh, spieleAway: sa, legsHome: r.legs_home ?? 0, legsAway: r.legs_guest ?? 0,
    ptsHome: punkte(sh, sa), ptsAway: punkte(sa, sh), abzugHome: 0, abzugAway: 0,
  };
}

export interface TabellenZeile {
  pos: number;
  team: string;
  sp: number; s: number; u: number; n: number;
  spieleFor: number; spieleAgainst: number;
  legsFor: number; legsAgainst: number;
  /** Punkte inkl. Abzügen */
  pts: number;
  abzug: number;
  /** Davon noch nicht vom Gegner bestätigte Ergebnisse */
  offen: number;
}

function zeilen(teams: string[], ergebnisse: Ergebnis27[]): Map<string, TabellenZeile> {
  const m = new Map(teams.map(t => [t, { pos: 0, team: t, sp: 0, s: 0, u: 0, n: 0, spieleFor: 0, spieleAgainst: 0, legsFor: 0, legsAgainst: 0, pts: 0, abzug: 0, offen: 0 } as TabellenZeile]));
  for (const e of ergebnisse) {
    const h = m.get(e.home), a = m.get(e.away);
    if (!h || !a) continue;
    const add = (z: TabellenZeile, sf: number, sg: number, lf: number, lg: number, p: number, abzug: number) => {
      z.sp += 1; if (p === 3) z.s += 1; else if (p === 1) z.u += 1; else z.n += 1;
      z.spieleFor += sf; z.spieleAgainst += sg; z.legsFor += lf; z.legsAgainst += lg;
      z.pts += p + abzug; z.abzug += abzug; if (!e.bestaetigt) z.offen += 1;
    };
    add(h, e.spieleHome, e.spieleAway, e.legsHome, e.legsAway, e.ptsHome, e.abzugHome);
    add(a, e.spieleAway, e.spieleHome, e.legsAway, e.legsHome, e.ptsAway, e.abzugAway);
  }
  return m;
}

const sd = (z: TabellenZeile) => z.spieleFor - z.spieleAgainst;
const ld = (z: TabellenZeile) => z.legsFor - z.legsAgainst;
/** Vergleich Punkte → Spieldifferenz → Legdifferenz (negativ = a vor b). */
const vgl = (a: TabellenZeile, b: TabellenZeile) => (b.pts - a.pts) || (sd(b) - sd(a)) || (ld(b) - ld(a));

/** Punktgleiche (in allen drei Kriterien) per direktem Vergleich ordnen; liefert Gruppen gleichen Rangs. */
function direkterVergleich(gruppe: TabellenZeile[], ergebnisse: Ergebnis27[]): TabellenZeile[][] {
  if (gruppe.length < 2) return [gruppe];
  const ids = new Set(gruppe.map(z => z.team));
  const unter = ergebnisse.filter(e => ids.has(e.home) && ids.has(e.away));
  // Für den direkten Vergleich zählen keine Abzüge — nur die Spiele untereinander.
  const mini = zeilen([...ids], unter.map(e => ({ ...e, abzugHome: 0, abzugAway: 0 })));
  const sorted = [...gruppe].sort((a, b) => vgl(mini.get(a.team)!, mini.get(b.team)!) || a.team.localeCompare(b.team, 'de'));
  const out: TabellenZeile[][] = [];
  for (const z of sorted) {
    const last = out[out.length - 1];
    if (last && vgl(mini.get(last[0].team)!, mini.get(z.team)!) === 0) last.push(z);
    else out.push([z]);
  }
  return out;
}

/**
 * Tabelle einer Liga. `teams` = alle Teams der Liga (auch ohne Spiel),
 * `namen` nur für die alphabetische Reihenfolge bei geteiltem Platz.
 */
export function berechneTabelle(teams: string[], ergebnisse: Ergebnis27[], namen: (id: string) => string = id => id): TabellenZeile[] {
  const m = zeilen(teams, ergebnisse);
  const alle = [...m.values()].sort((a, b) => vgl(a, b) || namen(a.team).localeCompare(namen(b.team), 'de'));
  const out: TabellenZeile[] = [];
  let i = 0;
  while (i < alle.length) {
    let j = i + 1;
    while (j < alle.length && vgl(alle[i], alle[j]) === 0) j++;
    const gruppen = direkterVergleich(alle.slice(i, j), ergebnisse);
    for (const g of gruppen) {
      const pos = out.length + 1;
      for (const z of [...g].sort((a, b) => namen(a.team).localeCompare(namen(b.team), 'de'))) out.push({ ...z, pos });
    }
    i = j;
  }
  return out;
}
