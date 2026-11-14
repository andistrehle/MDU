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

/** Wer im Formular „Live-Link teilen“ sieht (Betreiber 12.11.2026: erst intern testen). null = alle Teams. */
export const LIVE_TEILEN_TEAMS: string[] | null = ['freibad-bazis'];
export const liveTeilenErlaubt = (heimTeam: string | null | undefined) =>
  !!heimTeam && LIVE_TICKER_AN && (LIVE_TEILEN_TEAMS === null || LIVE_TEILEN_TEAMS.includes(heimTeam));

/** Link auf EIN Spiel im Live-Ticker (die Seite klappt es auf und springt hin). */
export const liveLink = (site: string, key: string) => `${site.replace(/\/$/, '')}/live?spiel=${encodeURIComponent(key)}`;
/** Text zum Teilen (WhatsApp). */
export const liveTeilenText = (heim: string, gast: string, link: string) =>
  `🎯 ${heim} – ${gast} läuft live!\nHier könnt ihr Spiel für Spiel mitverfolgen:\n${link}`;

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
  /** Highlights der Begegnung (mit Spielzuordnung) */
  highlights: TickerHighlight[];
}

export const SPIELE_JE_BEGEGNUNG = 18;

// ── Highlights im Live-Ticker (Betreiber 13.11.2026) ──
// Im Spielbericht hängen Highlights an der PERSON (Seite + Position), nicht am Spiel. Zugeordnet wird dem
// LETZTEN Spiel mit Ergebnis, in dem diese Person (einzeln oder im Doppel) stand — eingetragen wird ein
// Highlight praktisch immer direkt nach dem Spiel. Der WhatsApp-Bot merkt sich, was er schon gemeldet hat.
export type HighlightTyp = '180' | '171' | 'high_finish' | 'short_leg';
export interface TickerHighlight {
  /** stabil je Eintrag: Seite:Position:Typ:Wert:laufende Nummer gleicher Einträge */
  id: string;
  seite: 'heim' | 'gast';
  name: string;
  typ: HighlightTyp;
  /** 180/171: Anzahl · High Finish: Checkout · Short Leg: Darts */
  wert: number;
  /** Spielnummer (1–18) oder null, wenn die Person noch kein Spiel mit Ergebnis hat */
  spiel: number | null;
}
export interface RohHighlight { side: 'home' | 'guest'; slot: number; type: string; value: number | null; game_no?: number | null }
export interface RohSpiel { game_no: number; home_slot: number | null; guest_slot: number | null; home_slot2: number | null; guest_slot2: number | null; legs_home: number | null; legs_guest: number | null }

const TYPEN: readonly string[] = ['180', '171', 'high_finish', 'short_leg'];

type SpielSlots = Pick<RohSpiel, 'game_no' | 'home_slot' | 'guest_slot' | 'home_slot2' | 'guest_slot2' | 'legs_home' | 'legs_guest'>;
/** Spiele (Nummern, aufsteigend), in denen diese Person aufgestellt ist — einzeln oder im Doppel. */
export function spieleVon(spiele: SpielSlots[], side: 'home' | 'guest', slot: number): number[] {
  return spiele.filter(g => side === 'home' ? (g.home_slot === slot || g.home_slot2 === slot) : (g.guest_slot === slot || g.guest_slot2 === slot))
    .map(g => g.game_no).sort((a, b) => a - b);
}
const fertigSpiel = (g: SpielSlots) => g.legs_home != null && g.legs_guest != null;
/** Legs, die diese Seite in dem Spiel gewonnen hat. */
const legsDerSeite = (g: SpielSlots, side: 'home' | 'guest') => (side === 'home' ? g.legs_home : g.legs_guest) ?? 0;
/** Typen, die ein gewonnenes Leg voraussetzen (wer ein Finish/Short Leg wirft, gewinnt das Leg). */
const BRAUCHT_LEG: readonly string[] = ['high_finish', 'short_leg'];

/**
 * Vorschlag beim Eintragen (Betreiber 14.11.2026: live wird das Highlight eingetragen, BEVOR das Ergebnis
 * des laufenden Spiels drin ist): das erste Spiel der Person OHNE Ergebnis (= das laufende). Sind alle fertig:
 * das letzte — bei High Finish/Short Leg das letzte, in dem sie ein Leg gewonnen hat. Keins → null.
 */
export function vorschlagSpiel(spiele: SpielSlots[], side: 'home' | 'guest', slot: number, typ?: string): number | null {
  const meine = spieleVon(spiele, side, slot).map(nr => spiele.find(x => x.game_no === nr)!);
  const offen = meine.find(g => !fertigSpiel(g));
  if (offen) return offen.game_no;
  const passend = typ && BRAUCHT_LEG.includes(typ) ? meine.filter(g => legsDerSeite(g, side) > 0) : meine;
  const liste = passend.length ? passend : meine;
  return liste.length ? liste[liste.length - 1].game_no : null;
}

/**
 * High Finish/Short Leg an einem fertigen Spiel, in dem die Person KEIN Leg gewonnen hat, kann nicht stimmen
 * (so eingetragen mit dem alten Vorschlag „letztes fertiges Spiel“). Dann gilt ihr nächstes Spiel mit gewonnenem
 * Leg; ist das nächste noch ohne Ergebnis → null (steht dann vorerst ohne Spiel).
 */
function plausiblesSpiel(spiele: SpielSlots[], side: 'home' | 'guest', slot: number, typ: string, spiel: number | null): number | null {
  if (spiel == null || !BRAUCHT_LEG.includes(typ)) return spiel;
  const meine = spieleVon(spiele, side, slot).map(nr => spiele.find(x => x.game_no === nr)!);
  const g = meine.find(x => x.game_no === spiel);
  if (!g || !fertigSpiel(g) || legsDerSeite(g, side) > 0) return spiel;
  for (const n of meine.filter(x => x.game_no > spiel)) {
    if (!fertigSpiel(n)) return null;
    if (legsDerSeite(n, side) > 0) return n.game_no;
  }
  return null;
}

export function highlightsZuordnen(roh: RohHighlight[], spiele: RohSpiel[], name: (side: 'home' | 'guest', slot: number) => string): TickerHighlight[] {
  const zaehler = new Map<string, number>();
  const gespielt = spiele.filter(g => g.legs_home != null && g.legs_guest != null);
  const out: TickerHighlight[] = [];
  for (const h of roh || []) {
    if (!h || !TYPEN.includes(h.type) || h.value == null || !(h.value > 0)) continue;
    const basis = `${h.side}:${h.slot}:${h.type}:${h.value}${h.game_no ? `@${h.game_no}` : ''}`;
    const n = (zaehler.get(basis) ?? 0) + 1; zaehler.set(basis, n);
    // Beim Eintragen festgehaltenes Spiel gilt; ältere Einträge ohne → letztes Spiel der Person mit Ergebnis.
    const dabei = gespielt.filter(g => h.side === 'home' ? (g.home_slot === h.slot || g.home_slot2 === h.slot) : (g.guest_slot === h.slot || g.guest_slot2 === h.slot));
    const roh = h.game_no ?? (dabei.length ? Math.max(...dabei.map(g => g.game_no)) : null);
    const spiel = plausiblesSpiel(spiele, h.side, h.slot, h.type, roh);
    out.push({ id: `${basis}:${n}`, seite: h.side === 'home' ? 'heim' : 'gast', name: name(h.side, h.slot), typ: h.type as HighlightTyp, wert: h.value, spiel });
  }
  return out;
}

/** „🎯 180“, „🎯 2× 180“, „💥 High Finish 121“, „⚡ Short Leg 15 Darts“ — ohne Namen. */
export function highlightKurz(h: Pick<TickerHighlight, 'typ' | 'wert'>): string {
  if (h.typ === '180' || h.typ === '171') return `🎯 ${h.wert > 1 ? `${h.wert}× ` : ''}${h.typ}`;
  if (h.typ === 'high_finish') return `💥 High Finish ${h.wert}`;
  return `⚡ Short Leg ${h.wert} Darts`;
}

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
  return { ...plan, status, standHeim: h, standGast: g, gespielt: spiele.length, bestaetigt: b?.status === 'confirmed', spiele, highlights: [] };
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
  /** Aufstellung H1–H8 / G1–G8 (nur belegte Plätze; 1–4 Stamm, 5–8 Ersatz) */
  aufstellung?: { heim: AufstellungPlatz[]; gast: AufstellungPlatz[] };
  /** Ein- und Rückwechsel, aus den eingetragenen Einzeln errechnet */
  wechsel?: WechselEreignis[];
}

// ── Aufstellung + Wechsel (Betreiber, 14.11.2026) ─────────────────────────
// Der Spielbericht kennt keine eigenen Wechsel-Einträge: Ein Wechsel ist ein Einzel,
// in dem auf einer Position (1–4, fest im Spielplan des Abends) ein anderer Spieler
// steht als zuletzt dort. Steht wieder der Stammspieler da, ist es ein Rückwechsel.
// Doppel zählen nicht (dort ist die Besetzung frei).

export interface AufstellungPlatz { slot: number; name: string }
export interface WechselEreignis { seite: 'heim' | 'gast'; nr: number; position: number; rein: string; raus: string; rueck: boolean }
export interface EinzelBesetzung { nr: number; heimPos: number; gastPos: number; heimSlot: number | null; gastSlot: number | null }

export function wechselErmitteln(einzel: EinzelBesetzung[], namen: { heim: Map<number, string>; gast: Map<number, string> }): WechselEreignis[] {
  const out: WechselEreignis[] = [];
  for (const seite of ['heim', 'gast'] as const) {
    const belegt = new Map<number, number>();
    const name = (slot: number) => namen[seite].get(slot) || `${seite === 'heim' ? 'H' : 'G'}${slot}`;
    for (const g of [...einzel].sort((a, b) => a.nr - b.nr)) {
      const pos = seite === 'heim' ? g.heimPos : g.gastPos;
      const slot = seite === 'heim' ? g.heimSlot : g.gastSlot;
      if (slot == null) continue;
      const vorher = belegt.get(pos) ?? pos;
      if (slot !== vorher) out.push({ seite, nr: g.nr, position: pos, rein: name(slot), raus: name(vorher), rueck: slot === pos });
      belegt.set(pos, slot);
    }
  }
  return out.sort((a, b) => a.nr - b.nr || (a.seite === 'heim' ? -1 : 1));
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
