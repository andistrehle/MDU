// ============================================================
// Live-Tabelle im Ticker (Betreiber, 27.11.2026, per Klick-Umfrage)
// ============================================================
// „Als wäre jetzt Schluss“: Laufende Begegnungen zählen mit ihrem Zwischenstand (Spiele + Legs der
// eingetragenen Partien), beendete mit ihrem Endstand. Dazu der Platz VOR dem Abend (Tabelle ohne die
// heutigen Begegnungen) für die Pfeile ↑↓ und je Team, gegen wen es gerade wie steht.
// Rechnet mit derselben Tabelle wie überall (lib/tabelle-2027.ts: Punkte → Spiel- → Legdifferenz →
// direkter Vergleich). Reine Rechnung, getestet.
// ============================================================

import { berechneTabelle, type Ergebnis27, type TabellenZeile } from './tabelle-2027';

export interface HeuteBegegnung {
  key: string; home: string; away: string;
  status: 'offen' | 'live' | 'beendet';
  standHeim: number; standGast: number;
  /** Legs aus den eingetragenen Partien */
  legsHeim: number; legsGast: number;
  /** Schon zählendes Ergebnis (eingereicht/bestätigt/Wertung) — hat Vorrang vor dem Zwischenstand */
  ergebnis?: Ergebnis27 | null;
}

export interface LiveTabellenZeile extends TabellenZeile {
  /** Platz vor dem Abend */
  vorher: number;
  /** Heutige Begegnung des Teams, sofern begonnen */
  heute?: { gegner: string; eigene: number; andere: number; status: 'live' | 'beendet' };
}

const punkte = (a: number, b: number) => (a > b ? 3 : a === b ? 1 : 0);

export function liveTabelle(teams: string[], basis: Ergebnis27[], heute: HeuteBegegnung[], namen: (id: string) => string = id => id): LiveTabellenZeile[] {
  const ids = new Set(teams);
  const heuteKeys = new Set(heute.map(h => h.key));
  const ohneHeute = basis.filter(e => !heuteKeys.has(e.key));
  const vorher = new Map(berechneTabelle(teams, ohneHeute, namen).map(z => [z.team, z.pos]));

  const begonnen = heute.filter(h => h.status !== 'offen' && ids.has(h.home) && ids.has(h.away));
  const zusatz: Ergebnis27[] = begonnen.map(h => h.ergebnis ?? {
    key: h.key, home: h.home, away: h.away,
    spieleHome: h.standHeim, spieleAway: h.standGast, legsHome: h.legsHeim, legsAway: h.legsGast,
    ptsHome: punkte(h.standHeim, h.standGast), ptsAway: punkte(h.standGast, h.standHeim),
    abzugHome: 0, abzugAway: 0, bestaetigt: false, wertung: null, datum: null, reportId: '',
  });
  const jetzt = berechneTabelle(teams, [...ohneHeute, ...zusatz], namen);

  const heuteJe = new Map<string, LiveTabellenZeile['heute']>();
  for (const h of begonnen) {
    const st = h.status as 'live' | 'beendet';
    const sh = h.ergebnis ? h.ergebnis.spieleHome : h.standHeim, sg = h.ergebnis ? h.ergebnis.spieleAway : h.standGast;
    heuteJe.set(h.home, { gegner: h.away, eigene: sh, andere: sg, status: st });
    heuteJe.set(h.away, { gegner: h.home, eigene: sg, andere: sh, status: st });
  }
  return jetzt.map(z => ({ ...z, vorher: vorher.get(z.team) ?? z.pos, heute: heuteJe.get(z.team) }));
}
