// ============================================================
// Website-Umfrage (Betreiber, 09.11.2026)
// ============================================================
// Eine Quelle für Seite (/umfrage), Popup, Speicher-API und Auswertung
// (Admin → Umfrage). Anonym, für alle, je Gerät einmal (Migration 0068).
// Läuft 14 Tage ab `start`. Solange `live = false`, erscheint KEIN Popup und
// /umfrage zeigt nur eine Vorschau ohne Speichern („Noch nicht starten“,
// Betreiber 09.11.2026). Zum Starten: `live = true` und `start` = Starttag.
// ============================================================

export type FrageTyp = 'eine' | 'mehr' | 'sterne' | 'skala' | 'text' | 'name';

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

/** Eine Umfrage. Mehrere teilen sich Tabelle, Formular, Schnittstelle und Auswertung (Spalte `umfrage`). */
export interface UmfrageDef {
  id: string;
  live: boolean;
  start: string;
  /** Laufzeit in Tagen ab `start`; null = ohne Ende. */
  tage: number | null;
  titel: string;
  /** Einleitung über den Fragen (statt des Standardtexts). */
  intro?: string;
  /** Text nach dem Absenden. */
  danke?: string;
  /** Adresse der Seite. */
  pfad: string;
}

/** Letzter Tag (einschließlich); null = ohne Ende. */
export function umfrageEnde(def: UmfrageDef = UMFRAGE): string | null {
  if (def.tage == null) return null;
  const d = new Date(def.start + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + def.tage - 1);
  return d.toISOString().slice(0, 10);
}

/** Läuft gerade (live und im Zeitraum, Datum nach Berlin)? */
export function umfrageLaeuft(jetzt = new Date(), def: UmfrageDef = UMFRAGE): boolean {
  if (!def.live) return false;
  const heute = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const ende = umfrageEnde(def);
  return heute >= def.start && (!ende || heute <= ende);
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

export const UMFRAGE: UmfrageDef = {
  id: 'website-2026-11',
  live: false,
  start: '2026-11-09',
  tage: 14,
  titel: 'Wie gefällt dir mdudarts.de?',
  pfad: '/umfrage',
};

// ── Team-Manager-Käufer (Betreiber, 11.11.2026) ──────────────────────────
// Nur per Link (/umfrage/team-manager), nirgends verlinkt; der Betreiber schickt
// ihn an Käufer. Anonym, außer jemand trägt freiwillig Name/Team ein.
export const TM_UMFRAGE: UmfrageDef = {
  id: 'team-manager-kaeufer',
  live: true,
  start: '2026-11-11',
  tage: null,
  titel: 'Deine Meinung zum Team Manager',
  pfad: '/umfrage/team-manager',
  intro: 'Danke, dass ihr den Team Manager nutzt! Ein paar kurze Fragen, etwa 2 Minuten. Alles ist freiwillig. Ob du deinen Namen dazuschreibst, entscheidest du ganz unten selbst.',
  danke: 'Vielen Dank! Deine Antworten lese ich persönlich – und was sich umsetzen lässt, landet im Team Manager.',
};

export const TM_FRAGEN: Frage[] = [
  { gruppe: 'Der Kauf', id: 'grund', typ: 'mehr', frage: 'Was hat dich überzeugt, den Team Manager zu holen?', hinweis: 'Mehrere möglich.', freitextBei: 'sonst',
    optionen: o(['test', 'Der Test hat gezeigt, dass es funktioniert'], ['whatsapp', 'Weniger Chaos in der WhatsApp-Gruppe'], ['zusagen', 'Zu-/Absagen auf einen Blick'],
      ['kasse', 'Teamkasse & Strafen'], ['aufstellung', 'Aufstellung planen'], ['preis', 'Der Preis'], ['video', 'Das Video'], ['sonst', 'Etwas anderes …']) },
  { gruppe: 'Der Kauf', id: 'kauf_einfach', typ: 'eine', frage: 'Wie einfach war das Freischalten und Bezahlen?',
    optionen: o(['5', 'Sehr einfach'], ['4', 'Einfach'], ['3', 'Ging so'], ['2', 'Umständlich']) },
  { gruppe: 'Der Kauf', id: 'preis', typ: 'eine', frage: 'Wie findest du den Preis?',
    optionen: o(['guenstig', 'Günstig'], ['passt', 'Passt'], ['hoch', 'Eher zu hoch']) },

  { gruppe: 'Im Alltag', id: 'funktionen', typ: 'mehr', frage: 'Welche Funktionen nutzt ihr?', hinweis: 'Mehrere möglich.',
    optionen: o(['zusagen', 'Zu-/Absagen'], ['aufstellung', 'Aufstellung'], ['termine', 'Eigene Termine'], ['kasse', 'Teamkasse'], ['tracker', 'Strafen-Tracker'],
      ['statistik', 'Statistik'], ['aufgaben', 'Aufgaben'], ['nachricht', 'Nachricht ans Team'], ['kalender', 'Kalender-Abo']) },
  { gruppe: 'Im Alltag', id: 'liebling', typ: 'text', frage: 'Was gefällt dir am besten?' },
  { gruppe: 'Im Alltag', id: 'team_mit', typ: 'eine', frage: 'Wie gut macht dein Team mit?',
    optionen: o(['alle', 'Fast alle machen mit'], ['viele', 'Die meisten'], ['wenige', 'Nur ein paar'], ['hinterher', 'Ich muss viel hinterherlaufen']) },
  { gruppe: 'Im Alltag', id: 'gesamt', typ: 'sterne', frage: 'Wie zufrieden bist du insgesamt?' },

  { gruppe: 'Besser machen', id: 'nervt', typ: 'text', frage: 'Was nervt oder ist umständlich?', hinweis: 'Auch Kleinigkeiten – genau die interessieren mich.' },
  { gruppe: 'Besser machen', id: 'fehlt', typ: 'text', frage: 'Was fehlt dir noch?', hinweis: 'Gibt es etwas, das ihr noch per WhatsApp, Zettel oder Excel macht?' },
  { gruppe: 'Besser machen', id: 'empfehlen', typ: 'skala', frage: 'Würdest du den Team Manager anderen Kapitänen empfehlen?', hinweis: '0 = auf keinen Fall · 10 = auf jeden Fall' },
  { gruppe: 'Besser machen', id: 'sonst', typ: 'text', frage: 'Sonst noch etwas?' },

  { gruppe: 'Zum Schluss', id: 'name', typ: 'name', frage: 'Möchtest du deinen Namen oder dein Team dazuschreiben?', hinweis: 'Freiwillig. Leer lassen = anonym. Mit Namen kann ich bei Fragen nachhaken.' },
];

/** Alle Umfragen mit ihren Fragen. */
export const UMFRAGEN: { def: UmfrageDef; fragen: Frage[] }[] = [
  { def: UMFRAGE, fragen: FRAGEN },
  { def: TM_UMFRAGE, fragen: TM_FRAGEN },
];
export const findeUmfrage = (id: string | null | undefined) => UMFRAGEN.find(u => u.def.id === id);

export const TEXT_MAX = 1000;
export const NAME_MAX = 80;

export type Antworten = Record<string, string | string[] | number>;

/** Prüft und säubert Antworten (Server UND Browser). Unbekanntes fliegt raus. */
export function antwortenPruefen(roh: unknown, fragen: Frage[] = FRAGEN): Antworten | null {
  if (!roh || typeof roh !== 'object') return null;
  const r = roh as Record<string, unknown>;
  const a: Antworten = {};
  for (const f of fragen) {
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
      const t = r[`${f.id}_text`];
      if (f.freitextBei && w.includes(f.freitextBei) && typeof t === 'string' && t.trim()) a[`${f.id}_text`] = t.trim().slice(0, TEXT_MAX);
    } else if (f.typ === 'sterne' && typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5) a[f.id] = v;
    else if (f.typ === 'skala' && typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10) a[f.id] = v;
    else if (f.typ === 'text' && typeof v === 'string' && v.trim()) a[f.id] = v.trim().slice(0, TEXT_MAX);
    else if (f.typ === 'name' && typeof v === 'string' && v.trim()) a[f.id] = v.trim().slice(0, NAME_MAX);
  }
  return Object.keys(a).length ? a : null;
}
