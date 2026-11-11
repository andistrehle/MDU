// ============================================================
// Live-Ticker — reine Rechnung (Betreiber, 11.11.2026)
// ============================================================
// Je Begegnung des Spieltags ein Eintrag: offen (noch kein Ergebnis), live
// (Entwurf mit mindestens einem Ergebnis), beendet (eingereicht/bestätigt).
// Stand = gewonnene Spiele je Seite aus den bisher eingetragenen Ergebnissen.
// „Spieltag“ = Berliner Datum von (jetzt − 4 Stunden): Ein Abend, der bis nach
// Mitternacht läuft, bleibt derselbe Spieltag.
// Ohne Datenbank — der Server-Lader liefert die Daten (lib/server/live-ticker.ts).
// ============================================================

/** Not-Aus: false blendet Ticker, Band, Leiste und Meldungen überall aus (Autospeichern bleibt). */
export const LIVE_TICKER_AN = true;

export type TickerStatus = 'offen' | 'live' | 'beendet';

export interface TickerSpiel {
  nr: number;
  doppel: boolean;
  heim: string[];
  gast: string[];
  legsHeim: number;
  legsGast: number;
}

export interface TickerBericht {
  status: string;
  spiele: { nr: number; doppel: boolean; heim: string[]; gast: string[]; legsHeim: number | null; legsGast: number | null }[];
}

export interface TickerPlan { key: string; liga: string; home: string; away: string; uhrzeit: string | null }

export interface TickerEintrag extends TickerPlan {
  status: TickerStatus;
  standHeim: number;
  standGast: number;
  /** Zahl der Spiele mit Ergebnis (von 18) */
  gespielt: number;
  bestaetigt: boolean;
  /** Spiele mit Ergebnis, nach Spielnummer */
  spiele: TickerSpiel[];
}

export const SPIELE_JE_BEGEGNUNG = 18;

/** Berliner Datum (JJJJ-MM-TT) des laufenden Spieltags: jetzt minus 4 Stunden. */
export function spieltagDatum(jetzt: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date(jetzt.getTime() - 4 * 3600 * 1000));
}

export function tickerEintrag(plan: TickerPlan, b: TickerBericht | null): TickerEintrag {
  const spiele: TickerSpiel[] = (b?.spiele ?? [])
    .filter((g): g is TickerSpiel => g.legsHeim != null && g.legsGast != null)
    .sort((x, y) => x.nr - y.nr);
  let h = 0, g = 0;
  for (const s of spiele) { if (s.legsHeim > s.legsGast) h += 1; else if (s.legsGast > s.legsHeim) g += 1; }
  const eingereicht = !!b && b.status !== 'draft';
  const status: TickerStatus = eingereicht ? 'beendet' : spiele.length ? 'live' : 'offen';
  return { ...plan, status, standHeim: h, standGast: g, gespielt: spiele.length, bestaetigt: b?.status === 'confirmed', spiele };
}

/** Reihenfolge: live zuerst (meiste Spiele vorn), dann beendet, dann offen nach Beginn. */
export function sortiereTicker(e: TickerEintrag[]): TickerEintrag[] {
  const rang: Record<TickerStatus, number> = { live: 0, beendet: 1, offen: 2 };
  return [...e].sort((a, b) => rang[a.status] - rang[b.status]
    || (a.status === 'live' ? b.gespielt - a.gespielt : 0)
    || (a.uhrzeit ?? '99').localeCompare(b.uhrzeit ?? '99')
    || a.key.localeCompare(b.key));
}

/** Läuft der Ticker? Sobald am Spieltag irgendwo ein Ergebnis eingetragen ist. */
export const tickerAktiv = (e: TickerEintrag[]) => e.some(x => x.status !== 'offen');

/** Was die Schnittstelle /api/live je Begegnung ausliefert. */
export interface TickerAnzeige extends TickerEintrag {
  homeName: string;
  awayName: string;
  ligaName: string;
  ligaFarbe: string;
  ort: string | null;
  /** Wertung der Ligaleitung (Nichtantritt/kein Bericht) statt gespielter Partien */
  wertung: boolean;
}
export interface LiveAntwort { datum: string; aktiv: boolean; spiele: TickerAnzeige[] }

/** Text für die kurze Meldung, wenn sich ein Stand ändert (null = nichts melden). */
export function meldungText(alt: TickerEintrag | undefined, neu: TickerAnzeige): string | null {
  if (!alt) return null;
  const vorher = `${alt.status}:${alt.standHeim}:${alt.standGast}`, jetzt = `${neu.status}:${neu.standHeim}:${neu.standGast}`;
  if (vorher === jetzt) return null;
  const stand = `${neu.standHeim}:${neu.standGast}`;
  if (neu.status === 'beendet') return `Endstand: ${neu.homeName} ${stand} ${neu.awayName}`;
  if (alt.status === 'offen' && neu.status === 'live') return `Los geht's: ${neu.homeName} – ${neu.awayName} läuft live`;
  const fuehrungAlt = Math.sign(alt.standHeim - alt.standGast), fuehrungNeu = Math.sign(neu.standHeim - neu.standGast);
  if (fuehrungNeu !== fuehrungAlt) {
    if (fuehrungNeu === 0) return `Ausgleich: ${neu.homeName} ${stand} ${neu.awayName}`;
    return fuehrungNeu > 0 ? `${neu.homeName} gehen ${stand} in Führung gegen ${neu.awayName}`
      : `${neu.awayName} gehen bei ${neu.homeName} ${neu.standGast}:${neu.standHeim} in Führung`;
  }
  return `${neu.homeName} ${stand} ${neu.awayName}`;
}
