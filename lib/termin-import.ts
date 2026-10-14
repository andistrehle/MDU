// ============================================================
// Team Manager: Termine importieren (Einfügen aus Excel / Google Tabellen)
// ============================================================
//
// Der TC kopiert Zeilen aus einer Tabelle und fügt sie ein; hier wird daraus
// je Zeile ein TerminEingabe (oder ein verständlicher Fehler). Reine Logik,
// kein DB-Zugriff — gespeichert wird erst nach der Vorschau.
//
// Spalten werden über die Kopfzeile erkannt (Datum, Beginn, Ende, Gegner,
// Heim/Auswärts, Liga, Ort, Adresse, Titel, Art). Ohne Kopfzeile wird je
// Zelle geraten: Datum, Uhrzeit(en), „H/A“, dann Texte der Reihe nach
// Gegner → Ort → Adresse. Steht „Team A – Team B“ in einer Zelle und ist eine
// Seite das eigene Team, ergibt sich daraus Gegner UND Heim/Auswärts.
// Geraten wird nur, was eindeutig ist; sonst steht der Fehler an der Zeile.
// ============================================================

import { pruefeTermin, type TerminArt, type TerminEingabe, type TeamTermin } from '@/lib/supabase/termine';

export const IMPORT_MAX = 200;

type Feld = 'datum' | 'beginn' | 'ende' | 'gegner' | 'heim' | 'liga' | 'ort' | 'adresse' | 'titel' | 'art' | 'paarung';

const KOPF: [Feld, RegExp][] = [
  ['datum', /^(datum|tag|date)$/],
  ['beginn', /^(beginn|uhrzeit|zeit|anwurf|start|von)$/],
  ['ende', /^(ende|bis)$/],
  ['paarung', /^(paarung|begegnung|spiel|match)$/],
  ['gegner', /^(gegner|gegen)$/],
  ['heim', /^(heim\/?ausw(ä|ae)rts|h\/a|heim|ort\s*\(h\/a\))$/],
  ['liga', /^(liga|wettbewerb|liga\/wettbewerb|wettkampf)$/],
  ['ort', /^(ort|spielort|lokal|halle|location)$/],
  ['adresse', /^(adresse|anschrift|straße|strasse)$/],
  ['titel', /^(titel|termin|bezeichnung)(\s*\(.*\))?$/],
  ['art', /^(art|typ)$/],
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Text → Zeilen × Zellen. Trenner: Tab (Excel/Google), sonst Semikolon, sonst Komma. */
export function leseTabelle(text: string): string[][] {
  const zeilen = text.replace(/\r\n?/g, '\n').split('\n').filter(z => z.trim());
  if (!zeilen.length) return [];
  const t = zeilen.some(z => z.includes('\t')) ? '\t' : zeilen.some(z => z.includes(';')) ? ';' : ',';
  return zeilen.map(z => zerlege(z, t));
}

function zerlege(zeile: string, t: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i];
    if (q) {
      if (c === '"' && zeile[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"' && !cur.trim()) q = true;
    else if (c === t) { out.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** „23.10.2026“, „23.10.26“, „Fr 23.10.“, „2026-10-23“, Excel-Seriennummer → YYYY-MM-DD. */
export function leseDatum(s: string, heute: string): string | null {
  const x = s.trim().replace(/^[A-Za-zÄÖÜäöü]{2,10}\.?,?\s+/, ''); // Wochentag vorn weg
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(x);
  if (m) return gueltig(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/.exec(x);
  if (m) return gueltig(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  m = /^(\d{1,2})\.(\d{1,2})\.?$/.exec(x);
  if (m) {
    // Ohne Jahr: das Jahr, in dem der Tag ab „heute minus 2 Monate“ als Nächstes kommt.
    const [hj] = heute.split('-').map(Number);
    for (const j of [hj, hj + 1]) {
      const d = gueltig(j, +m[2], +m[1]);
      if (d && Date.parse(d) >= Date.parse(heute) - 60 * 864e5) return d;
    }
    return null;
  }
  if (/^\d{5}$/.test(x)) { // Excel-Seriennummer (Tage seit 30.12.1899)
    const d = new Date(Date.UTC(1899, 11, 30) + +x * 864e5);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  return null;
}

function gueltig(j: number, mo: number, t: number): string | null {
  const d = new Date(Date.UTC(j, mo - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === mo - 1 && d.getUTCDate() === t ? `${j}-${pad(mo)}-${pad(t)}` : null;
}

/** „19:30“, „19.30 Uhr“, „19 Uhr“, „7:30 PM“ → HH:MM. */
export function leseZeit(s: string): string | null {
  const x = s.trim().toLowerCase();
  const m = /^(\d{1,2})(?:[:.](\d{2}))?\s*(uhr|h|am|pm)?$/.exec(x);
  if (!m || (!m[2] && !m[3])) return null;
  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  if (m[3] === 'pm' && h < 12) h += 12;
  if (m[3] === 'am' && h === 12) h = 0;
  return h < 24 && min < 60 ? `${pad(h)}:${pad(min)}` : null;
}

/** „H“, „Heim“ → true · „A“, „Auswärts“, „Gast“ → false · sonst null. */
export function leseHeim(s: string): boolean | null {
  const x = norm(s);
  if (/^(h|heim|heimspiel|zuhause|home)$/.test(x)) return true;
  if (/^(a|g|ausw(ä|ae)rts|auswärtsspiel|gast|away)$/.test(x)) return false;
  return null;
}

/** „Freibad Bazis – DC Beispiel“ → Gegner + Heim, wenn eine Seite das eigene Team ist. */
function lesePaarung(s: string, team: string): { gegner: string; heim: boolean } | null {
  const teile = s.split(/\s+(?:-|–|—|vs\.?|gegen|:)\s+/i);
  if (teile.length !== 2) return null;
  const eigen = (x: string) => { const a = norm(x), b = norm(team); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); };
  if (eigen(teile[0]) && !eigen(teile[1])) return { gegner: teile[1].trim(), heim: true };
  if (eigen(teile[1]) && !eigen(teile[0])) return { gegner: teile[0].trim(), heim: false };
  return null;
}

export interface ImportZeile {
  nr: number;            // Zeile im eingefügten Text (1 = erste)
  roh: string[];
  eingabe: TerminEingabe | null;
  fehler: string | null;
  doppelt: boolean;      // gibt es schon (vorhanden oder weiter oben)
}

export interface ImportVorgaben { art: TerminArt; liga: string; farbe: string | null; teamName: string; heute: string }

/** Erkennt die Kopfzeile; null = keine (dann wird je Zelle geraten). */
function kopfzeile(zeile: string[]): (Feld | null)[] | null {
  const felder = zeile.map(z => KOPF.find(([, re]) => re.test(norm(z)))?.[0] ?? null);
  return felder.filter(Boolean).length >= 2 && felder.includes('datum') ? felder : null;
}

const schluessel = (e: Pick<TerminEingabe, 'event_date' | 'start_time' | 'kind' | 'opponent' | 'title'>) =>
  `${e.event_date}|${e.start_time ?? ''}|${norm((e.kind === 'spiel' ? e.opponent : e.title) ?? '')}`;

export function werteAus(text: string, v: ImportVorgaben, vorhanden: TeamTermin[] = []): { zeilen: ImportZeile[]; mitKopf: boolean } {
  const tabelle = leseTabelle(text);
  if (!tabelle.length) return { zeilen: [], mitKopf: false };
  const kopf = kopfzeile(tabelle[0]);
  const daten = (kopf ? tabelle.slice(1) : tabelle).slice(0, IMPORT_MAX);
  const gesehen = new Set(vorhanden.map(schluessel));

  const zeilen = daten.map((roh, i): ImportZeile => {
    const nr = i + 1 + (kopf ? 1 : 0);
    const w: Partial<Record<Feld, string>> = {};
    if (kopf) {
      roh.forEach((z, j) => { const f = kopf[j]; if (f && z && !w[f]) w[f] = z; });
    } else {
      // Ohne Kopfzeile: Datum, Uhrzeiten und H/A erkennen, Rest der Reihe nach.
      const texte: string[] = [];
      for (const z of roh) {
        if (!z) continue;
        if (!w.datum && leseDatum(z, v.heute)) w.datum = z;
        else if (leseZeit(z)) { if (!w.beginn) w.beginn = z; else if (!w.ende) w.ende = z; }
        else if (!w.heim && leseHeim(z) !== null) w.heim = z;
        else if (!w.paarung && lesePaarung(z, v.teamName)) w.paarung = z;
        else texte.push(z);
      }
      const ziel: Feld[] = v.art === 'spiel' && !w.paarung ? ['gegner', 'ort', 'adresse'] : v.art === 'spiel' ? ['ort', 'adresse'] : ['titel', 'ort', 'adresse'];
      texte.forEach((t, k) => { if (ziel[k]) w[ziel[k]] = t; });
    }

    const fehler = (f: string): ImportZeile => ({ nr, roh, eingabe: null, fehler: f, doppelt: false });
    if (!w.datum) {
      const fast = roh.find(z => /\d{1,2}[./]\d{1,2}[./]/.test(z));
      return fehler(fast ? `Datum „${fast}“ gibt es nicht.` : 'Kein Datum gefunden.');
    }
    const datum = leseDatum(w.datum, v.heute);
    if (!datum) return fehler(`Datum „${w.datum}“ nicht lesbar.`);
    const beginn = w.beginn ? leseZeit(w.beginn) : null;
    if (w.beginn && !beginn) return fehler(`Uhrzeit „${w.beginn}“ nicht lesbar.`);
    const ende = w.ende ? leseZeit(w.ende) : null;

    // Art: Spalte „Art“ (Spiel/Sonstiges/Training …) schlägt die Vorgabe.
    let art: TerminArt = v.art;
    if (w.art) art = /^(spiel|match|liga|pokal)/.test(norm(w.art)) ? 'spiel' : 'sonstiges';
    const paarung = w.paarung ? lesePaarung(w.paarung, v.teamName) : null;
    const heim = paarung ? paarung.heim : w.heim ? leseHeim(w.heim) : null;
    if (w.heim && heim === null && !paarung) return fehler(`„${w.heim}“ – bitte H (Heim) oder A (Auswärts).`);

    const eingabe: TerminEingabe = {
      kind: art,
      title: art === 'sonstiges' ? w.titel ?? (w.art && !/^sonst/.test(norm(w.art)) ? w.art : null) ?? null : null,
      league: art === 'spiel' ? w.liga || v.liga || null : null,
      opponent: art === 'spiel' ? paarung?.gegner ?? w.gegner ?? null : null,
      is_home: art === 'spiel' ? heim ?? true : null,
      event_date: datum, start_time: beginn, end_time: ende,
      venue: w.ort ?? null, address: w.adresse ?? null, color: v.farbe,
    };
    const { werte, fehler: f } = pruefeTermin(eingabe);
    if (!werte) return fehler(f ?? 'Unvollständig.');
    const k = schluessel(werte);
    const doppelt = gesehen.has(k);
    gesehen.add(k);
    return { nr, roh, eingabe: werte, fehler: null, doppelt };
  });
  return { zeilen, mitKopf: !!kopf };
}

/** Vorlage zum Herunterladen: Semikolon + BOM, damit deutsches Excel sie direkt richtig öffnet. */
export function vorlageCsv(): string {
  const zeilen = [
    ['Datum', 'Beginn', 'Ende', 'Art', 'Gegner', 'Heim/Auswärts', 'Liga', 'Titel (nur Sonstiges)', 'Ort', 'Adresse'],
    ['23.10.2026', '19:30', '', 'Spiel', 'DC Beispiel', 'A', 'DSAB Bezirksliga', '', 'Gaststätte zum Pfeil', 'Beispielstr. 1, München'],
    ['30.10.2026', '20:00', '', 'Spiel', 'Pfeilwerfer Nord', 'H', 'DSAB Bezirksliga', '', '', ''],
    ['04.11.2026', '19:00', '21:00', 'Sonstiges', '', '', '', 'Training', 'Vereinsheim', ''],
  ];
  return '﻿' + zeilen.map(z => z.join(';')).join('\r\n') + '\r\n';
}
