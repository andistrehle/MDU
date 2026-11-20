// ============================================================
// „Dein Team“ auf der Startseite (Betreiber, 20.11.2026)
// ============================================================
// Reine Rechnung: aus den Spielen EINES Teams das nächste (ohne Ergebnis, Termin ab heute, frühestes)
// und das letzte (mit Ergebnis, jüngstes) heraussuchen. Die Karte selbst: components/mdu/dein-team.tsx.

export interface TeamSpielKurz {
  /** Begegnung Heim|Gast */
  key: string;
  heim: boolean;
  gegner: string;
  /** Echter Termin (verlegte Spiele dort, wo sie stattfinden); ohne Termin der Freitag des Wochenendes. */
  datum: string;
  uhrzeit: string | null;
  spieltag: number;
}
export interface ErgebnisKurz { spieleHome: number; spieleAway: number; datum?: string | null; wertung?: string | null; bestaetigt?: boolean }

export interface Naechstes extends TeamSpielKurz { }
export interface Letztes extends TeamSpielKurz { eigen: number; fremd: number; wertung: boolean; bestaetigt: boolean }

export function naechstesUndLetztes(
  spiele: TeamSpielKurz[], ergebnisse: Record<string, ErgebnisKurz | undefined>, heute: string,
): { naechstes: Naechstes | null; letztes: Letztes | null } {
  let naechstes: Naechstes | null = null;
  let letztes: Letztes | null = null;
  for (const s of spiele) {
    if (!s.gegner) continue;                       // spielfrei
    const e = ergebnisse[s.key];
    if (e) {
      const datum = e.datum || s.datum;
      if (!letztes || datum > letztes.datum) {
        letztes = { ...s, datum, eigen: s.heim ? e.spieleHome : e.spieleAway, fremd: s.heim ? e.spieleAway : e.spieleHome, wertung: !!e.wertung, bestaetigt: e.bestaetigt !== false };
      }
    } else if (s.datum >= heute && (!naechstes || s.datum < naechstes.datum)) {
      naechstes = { ...s };
    }
  }
  return { naechstes, letztes };
}

/** Was die Karte je Team braucht (vom Server gerechnet, klein gehalten — steht für alle Teams im HTML). */
export interface DeinTeamDaten {
  id: string; name: string; kurz: string; logo: string | null; farbe: string;
  liga: string; ligaName: string; ligaFarbe: string;
  platz: number | null; von: number; pkt: number;
  naechstes: (Naechstes & { gegnerName: string; gegnerLogo: string | null; gegnerFarbe: string; ort: string | null; ortId: string | null }) | null;
  letztes: (Letztes & { gegnerName: string; gegnerLogo: string | null; gegnerFarbe: string }) | null;
}
