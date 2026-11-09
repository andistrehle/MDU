// ============================================================
// Website-Umfrage (Betreiber, 09.11.2026)
// ============================================================
// Eine Quelle für Seite (/umfrage), Popup, Speicher-API und Auswertung
// (Admin → Umfrage). Anonym, für alle, je Gerät einmal (Migration 0068).
// Läuft 14 Tage ab `start`. Solange `live = false`, erscheint KEIN Popup und
// /umfrage zeigt nur eine Vorschau ohne Speichern („Noch nicht starten“,
// Betreiber 09.11.2026). Zum Starten: `live = true` und `start` = Starttag.
// ============================================================

export type FrageTyp = 'eine' | 'mehr' | 'sterne' | 'skala' | 'text';

export interface Frage {
  id: string;
  frage: string;
  typ: FrageTyp;
  optionen?: { wert: string; text: string }[];
  /** Bei 'eine': Freitext, wenn diese Option gewählt ist (Schlüssel `<id>_text`). */
  freitextBei?: string;
  hinweis?: string;
  gruppe: string;
}

export const UMFRAGE = {
  id: 'website-2026-11',
  live: false,
  start: '2026-11-09',
  tage: 14,
  titel: 'Wie gefällt dir mdudarts.de?',
};

/** Letzter Tag (einschließlich). */
export function umfrageEnde(): string {
  const d = new Date(UMFRAGE.start + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + UMFRAGE.tage - 1);
  return d.toISOString().slice(0, 10);
}

/** Läuft gerade (live und im Zeitraum, Datum nach Berlin)? */
export function umfrageLaeuft(jetzt = new Date()): boolean {
  if (!UMFRAGE.live) return false;
  const heute = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  return heute >= UMFRAGE.start && heute <= umfrageEnde();
}

const o = (...p: [string, string][]) => p.map(([wert, text]) => ({ wert, text }));

export const FRAGEN: Frage[] = [
  { gruppe: 'Über dich', id: 'rolle', typ: 'eine', frage: 'Wer bist du?',
    optionen: o(['spieler', 'Spieler'], ['tc', 'Teamcaptain'], ['co', 'Co-Captain'], ['fan', 'Fan / Zuschauer']) },
  { gruppe: 'Über dich', id: 'haeufigkeit', typ: 'eine', frage: 'Wie oft bist du auf mdudarts.de?',
    optionen: o(['taeglich', 'Täglich'], ['woche', 'Mehrmals pro Woche'], ['spieltag', 'Rund um den Spieltag'], ['selten', 'Selten']) },
  { gruppe: 'Über dich', id: 'geraet', typ: 'eine', frage: 'Womit bist du meistens drauf?',
    optionen: o(['handy', 'Handy (Browser)'], ['app', 'Als App installiert'], ['pc', 'PC / Laptop'], ['tablet', 'Tablet']) },

  { gruppe: 'Aussehen und Bedienung', id: 'modus', typ: 'eine', frage: 'Welchen Modus nutzt du?',
    hinweis: 'Umschalter oben rechts: „Old School“ (hell) oder „New Design“ (dunkel).',
    optionen: o(['hell', 'Old School (hell)'], ['dunkel', 'New Design (dunkel)'], ['beide', 'Mal so, mal so'], ['unbekannt', 'Wusste nicht, dass es zwei gibt']) },
  { gruppe: 'Aussehen und Bedienung', id: 'gesamt', typ: 'sterne', frage: 'Wie gefällt dir die Seite insgesamt?' },
  { gruppe: 'Aussehen und Bedienung', id: 'zurecht', typ: 'eine', frage: 'Findest du dich gut zurecht?',
    optionen: o(['sehr', 'Sehr gut'], ['meist', 'Meistens'], ['oft_nicht', 'Oft nicht']) },

  { gruppe: 'Funktionen', id: 'bereiche', typ: 'mehr', frage: 'Welche Bereiche nutzt du am meisten?', hinweis: 'Mehrere möglich.',
    optionen: o(['tabellen', 'Tabellen'], ['spielplan', 'Spielplan'], ['ergebnisse', 'Ergebnisse'], ['spielberichte', 'Spielberichte'],
      ['einzel', 'Einzelrangliste'], ['profile', 'Spielerprofile'], ['news', 'Spieltagsberichte / News'], ['teams', 'Team-Seiten'], ['lokale', 'Spielstätten']) },
  { gruppe: 'Funktionen', id: 'spielbericht', typ: 'eine', frage: 'Wie zufrieden bist du mit dem digitalen Spielbericht?',
    optionen: o(['5', 'Sehr zufrieden'], ['4', 'Zufrieden'], ['3', 'Geht so'], ['2', 'Eher unzufrieden'], ['1', 'Unzufrieden'], ['nicht', 'Nutze ich nicht']) },
  { gruppe: 'Funktionen', id: 'push', typ: 'eine', frage: 'Benachrichtigungen aufs Handy (Push)?',
    optionen: o(['passt', 'An – passt so'], ['zuviel', 'An – aber zu viele'], ['will_nicht', 'Aus – will ich nicht'], ['weiss_nicht', 'Aus – weiß nicht, wie das geht']) },
  { gruppe: 'Funktionen', id: 'bericht', typ: 'eine', frage: 'Liest du den Spieltagsbericht am Wochenende?',
    optionen: o(['immer', 'Immer'], ['manchmal', 'Manchmal'], ['nie', 'Nie']) },
  { gruppe: 'Funktionen', id: 'wunsch', typ: 'eine', frage: 'Welche neue Funktion wünschst du dir am meisten?', freitextBei: 'sonst',
    optionen: o(['ticker', 'Live-Ticker am Spielabend'], ['statistik', 'Mehr Statistiken'], ['ersatz', 'Ersatzspieler-Börse'], ['kalender', 'Turnier- und Eventkalender'], ['sonst', 'Etwas anderes …']) },

  { gruppe: 'Deine Meinung', id: 'gut', typ: 'text', frage: 'Was gefällt dir am besten?' },
  { gruppe: 'Deine Meinung', id: 'schlecht', typ: 'text', frage: 'Was nervt dich oder fehlt dir?' },
  { gruppe: 'Deine Meinung', id: 'empfehlen', typ: 'skala', frage: 'Würdest du die Seite anderen Dartern empfehlen?', hinweis: '0 = auf keinen Fall · 10 = auf jeden Fall' },

  { gruppe: 'Zum Schluss', id: 'team_manager', typ: 'eine', frage: 'Nutzt dein Team schon den Team Manager?',
    optionen: o(['ja', 'Ja'], ['nein', 'Nein'], ['weiss_nicht', 'Weiß nicht']) },
];

export const TEXT_MAX = 1000;

export type Antworten = Record<string, string | string[] | number>;

/** Prüft und säubert Antworten (Server UND Browser). Unbekanntes fliegt raus. */
export function antwortenPruefen(roh: unknown): Antworten | null {
  if (!roh || typeof roh !== 'object') return null;
  const r = roh as Record<string, unknown>;
  const a: Antworten = {};
  for (const f of FRAGEN) {
    const v = r[f.id];
    if (v == null || v === '') continue;
    const erlaubt = new Set((f.optionen ?? []).map(x => x.wert));
    if (f.typ === 'eine' && typeof v === 'string' && erlaubt.has(v)) {
      a[f.id] = v;
      const t = r[`${f.id}_text`];
      if (f.freitextBei === v && typeof t === 'string' && t.trim()) a[`${f.id}_text`] = t.trim().slice(0, TEXT_MAX);
    } else if (f.typ === 'mehr' && Array.isArray(v)) {
      const w = [...new Set(v.filter((x): x is string => typeof x === 'string' && erlaubt.has(x)))];
      if (w.length) a[f.id] = w;
    } else if (f.typ === 'sterne' && typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5) a[f.id] = v;
    else if (f.typ === 'skala' && typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10) a[f.id] = v;
    else if (f.typ === 'text' && typeof v === 'string' && v.trim()) a[f.id] = v.trim().slice(0, TEXT_MAX);
  }
  return Object.keys(a).length ? a : null;
}
