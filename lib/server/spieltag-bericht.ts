// ============================================================
// Spieltagsbericht 2026/27 (Server) — Migration 0058
// ============================================================
//
// Betreiber, 25.10.2026: Sonntagabend entsteht je Spielwochenende ein
// News-ENTWURF; die Ligaleitung prüft ihn unter Admin → News und
// veröffentlicht ihn — erst dann geht der Push an alle Geräte raus
// (/api/spieltag-bericht, aktion 'push').
//
// Gerechnet wird alles hier (lib/spieltag-bericht.ts); Claude bekommt nur die
// fertigen Zahlen und formuliert daraus die Abschnitte. Die Liste ALLER
// Ergebnisse und die offenen Spiele setzt der Code selbst zusammen — die
// sollen nie von einer Formulierung abhängen. Ohne Schlüssel oder bei einem
// Fehler entsteht der Text aus einer schlichten Vorlage (ehrlich vermerkt in
// spieltag_berichte.quelle), der Entwurf kommt also immer.
// ============================================================

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod/v4';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { LIGEN_2027, alleBegegnungen27, team27, wochenendeText, datumKurz27, type Begegnung27, type Liga27Code } from '@/lib/data/saison-2027';
import { berechneTabelle, type Ergebnis27 } from '@/lib/tabelle-2027';
import { ladeErgebnisse27, ladeBericht27 } from '@/lib/server/ergebnisse-2027';
import { berichtPfad } from '@/lib/spieltag';
import { SPIELTAG_HINWEISE_2027 } from '@/lib/data/spieltag-hinweise-2027';
import { berichtLink, type SocialDaten } from '@/lib/spieltag-social';
import {
  fenster, spielverlauf, spielerWertung, spielerDesSpieltages, meisteHighlights, tabellenAenderung,
  type BegegnungDaten, type SpielerWertung,
} from '@/lib/spieltag-bericht';

const MODELL = process.env.SPIELTAG_MODEL || 'claude-opus-5-5';
const KNAPP = 2;      // Spiel-Differenz bis hier = knapp (10:8, 9:9)
const DEUTLICH = 8;   // ab hier = deutlich (13:5 und mehr)

export const newsIdFuer = (fri: string) => `spieltag-${fri}`;
const name = (id: string) => team27(id)?.name ?? id;
const ligaName = (c: string) => LIGEN_2027.find(l => l.code === c)?.name ?? c;
const heuteMuenchen = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

export function planWochenenden(): { fri: string; sun: string }[] {
  const m = new Map<string, string>();
  for (const b of alleBegegnungen27()) m.set(b.fri, b.sun);
  return [...m].map(([fri, sun]) => ({ fri, sun })).sort((a, b) => a.fri.localeCompare(b.fri));
}

/** Plan-Wochenende, dessen Sonntag heute ist (Cron), sonst null. */
export const wochenendeMitSonntag = (heute = heuteMuenchen()) => planWochenenden().find(w => w.sun === heute) ?? null;
/** Letztes Plan-Wochenende, das schon begonnen hat (Knopf in Admin → News). */
export const letztesWochenende = (heute = heuteMuenchen()) => planWochenenden().filter(w => w.fri <= heute).pop() ?? null;

// ── Fakten sammeln ───────────────────────────────────────────

interface Eintrag { b: Begegnung27; e: Ergebnis27; datum: string; art: 'gespielt' | 'nachgereicht' }
interface Offen { b: Begegnung27; grund: string }

export interface Fakten {
  fri: string; sun: string;
  eintraege: Eintrag[];
  offen: Offen[];
  daten: Map<string, BegegnungDaten>;
  wertung: SpielerWertung[];
  sieger: SpielerWertung[];
  /** die meisten Highlights (eigene Erwähnung) */
  meiste: SpielerWertung[];
  tabellen: Partial<Record<Liga27Code, ReturnType<typeof tabellenAenderung>>>;
}

const spieldatum = (b: Begegnung27, e?: Ergebnis27) => (e?.datum ?? b.termin?.datum ?? b.fri).slice(0, 10);

export async function sammeln(fri: string): Promise<Fakten | null> {
  const db = supabaseAdmin;
  const w = planWochenenden().find(x => x.fri === fri);
  const f = fenster(planWochenenden(), fri);
  if (!db || !w || !f) return null;
  const { byKey } = await ladeErgebnisse27();
  const { data: frueher } = await db.from('spieltag_berichte').select('wochenende, keys').neq('wochenende', fri);
  const schonDrin = new Set(((frueher ?? []) as { keys: string[] }[]).flatMap(r => r.keys));

  const eintraege: Eintrag[] = [], offen: Offen[] = [];
  for (const b of alleBegegnungen27()) {
    const e = byKey[b.key];
    const datum = spieldatum(b, e);
    if (e) {
      if (datum >= f.von && datum <= f.bis) eintraege.push({ b, e, datum, art: 'gespielt' });
      else if (datum < f.von && !schonDrin.has(b.key)) eintraege.push({ b, e, datum, art: 'nachgereicht' });
    } else if (b.fri === fri || (datum >= f.von && datum <= f.bis)) {
      offen.push({ b, grund: datum > w.sun ? `verlegt auf ${datumKurz27(datum)}` : SPIELTAG_HINWEISE_2027[b.key] ?? 'Bericht steht noch aus' });
    }
  }

  const daten = new Map<string, BegegnungDaten>();
  for (const x of eintraege) {
    const r = x.e.wertung ? null : await ladeBericht27(x.b.key);
    daten.set(x.b.key, { key: x.b.key, liga: x.b.liga, spieltag: x.b.spieltag, e: x.e, spieler: r?.spieler ?? [], spiele: r?.spiele ?? [], highlights: r?.highlights ?? [] });
  }

  const neu = new Set(eintraege.map(x => x.b.key));
  const tabellen: Fakten['tabellen'] = {};
  for (const l of LIGEN_2027) {
    if (!eintraege.some(x => x.b.liga === l.code)) continue;
    const teams = new Set(l.teams);
    const alle = Object.values(byKey).filter(e => teams.has(e.home) && teams.has(e.away));
    tabellen[l.code] = tabellenAenderung(
      berechneTabelle(l.teams, alle.filter(e => !neu.has(e.key)), name),
      berechneTabelle(l.teams, alle, name),
    );
  }
  const wertung = spielerWertung([...daten.values()]);
  return { fri, sun: w.sun, eintraege, offen, daten, wertung, sieger: spielerDesSpieltages(wertung), meiste: meisteHighlights(wertung), tabellen };
}

// ── Für Claude: nur Zahlen, als JSON ─────────────────────────

const ergText = (e: Ergebnis27) => `${e.spieleHome}:${e.spieleAway}`;
const WERTUNG_TEXT: Record<string, string> = { home_no_show: 'Nichtantritt Heim', guest_no_show: 'Nichtantritt Gast', no_report: 'kein Spielbericht' };

export function faktenJson(f: Fakten) {
  const spieler = (z: SpielerWertung) => ({
    name: z.name, team: name(z.teamId), liga: ligaName(team27(z.teamId)?.league ?? ''),
    einzel: `${z.einzelSiege}:${z.einzelNiederlagen}`, legs: `${z.legsFor}:${z.legsAgainst}`, highlights: z.highlightAnzahl,
    '180er': z.b180, '171er': z.b171, highFinishes: z.hf, shortLegsDarts: z.sl,
  });
  return {
    wochenende: wochenendeText(f.fri, f.sun),
    ligen: LIGEN_2027.filter(l => f.eintraege.some(x => x.b.liga === l.code) || f.offen.some(x => x.b.liga === l.code)).map(l => ({
      liga: l.name,
      spieltage: [...new Set(f.eintraege.concat().filter(x => x.b.liga === l.code && x.art === 'gespielt').map(x => x.b.spieltag))],
      ergebnisse: f.eintraege.filter(x => x.b.liga === l.code).map(x => {
        const d = f.daten.get(x.b.key)!;
        const diff = Math.abs(x.e.spieleHome - x.e.spieleAway);
        const v = !x.e.wertung && diff <= KNAPP ? spielverlauf(d.spiele) : null;
        return {
          heim: name(x.e.home), gast: name(x.e.away), spiele: ergText(x.e), legs: `${x.e.legsHome}:${x.e.legsAway}`,
          bestaetigt: x.e.bestaetigt, art: x.art, datum: x.datum, spieltag: x.b.spieltag, derby: x.b.derby,
          wertung: x.e.wertung ? WERTUNG_TEXT[x.e.wertung] : null,
          knapp: !x.e.wertung && diff <= KNAPP, deutlich: !x.e.wertung && diff >= DEUTLICH,
          spielverlauf: v && {
            zwischenstaende: v.staende.map(([a, b]) => `${a}:${b}`).join(' '),
            doppelSpielNr: d.spiele.filter(g => g.doppel).map(g => g.nr),
            fuehrungswechsel: v.fuehrungswechsel, groessterRueckstandDesSiegers: v.groessterRueckstand,
            entschiedenNachSpiel: v.entschiedenNach,
          },
        };
      }),
      tabelle: (f.tabellen[l.code] ?? []).map(t => ({ platz: t.nachher, platzVorher: t.vorher || null, team: name(t.teamId), punkte: t.punkte, spiele: t.spiele })),
      offen: f.offen.filter(x => x.b.liga === l.code).map(x => ({ heim: name(x.b.home), gast: name(x.b.away), grund: x.grund })),
    })),
    hoechstesFinish: hoechstesFinish(f),
    besondereHighlights: besondere(f),
    spielerDesSpieltages: f.sieger.map(spieler),
    bestenliste: f.wertung.slice(0, 6).map(spieler),
    meisteHighlights: f.meiste.map(spieler),
    alleHighlights: f.wertung.filter(z => z.highlightAnzahl > 0).map(spieler),
  };
}

/** Höchstes High Finish des Wochenendes (bei Gleichstand alle mit dem Wert). */
function hoechstesFinish(f: Fakten): { wert: number; spieler: { name: string; team: string; liga: string }[] } | null {
  const hf = f.wertung.flatMap(z => z.hf.map(wert => ({ wert, z })));
  if (!hf.length) return null;
  const wert = Math.max(...hf.map(x => x.wert));
  const spieler = hf.filter(x => x.wert === wert).map(({ z }) => ({ name: z.name, team: name(z.teamId), liga: ligaName(team27(z.teamId)?.league ?? '') }));
  return { wert, spieler: spieler.filter((s, i) => spieler.findIndex(t => t.name === s.name && t.team === s.team) === i) };
}

/** Eigens zu erwähnen (Betreiber, 27.10.2026): Finishes ab 140, Short Legs bis 15 Darts, 180er/171er ab zwei. */
function besondere(f: Fakten) {
  const wer = (z: SpielerWertung) => ({ name: z.name, team: name(z.teamId) });
  return {
    finishesAb140: f.wertung.flatMap(z => z.hf.filter(v => v >= 140).map(wert => ({ ...wer(z), wert }))).sort((a, b) => b.wert - a.wert),
    shortLegsBis15: f.wertung.flatMap(z => z.sl.filter(v => v <= 15).map(darts => ({ ...wer(z), darts }))).sort((a, b) => a.darts - b.darts),
    mehrfach180: f.wertung.filter(z => z.b180 >= 2).map(z => ({ ...wer(z), anzahl: z.b180 })),
    mehrfach171: f.wertung.filter(z => z.b171 >= 2).map(z => ({ ...wer(z), anzahl: z.b171 })),
  };
}

const TextSchema = z.object({
  titel: z.string().describe('Überschrift, höchstens 80 Zeichen'),
  teaser: z.string().describe('Ein bis zwei Sätze Vorschau, auch als Push-Text genutzt, höchstens 160 Zeichen'),
  einleitung: z.array(z.string()),
  highlights: z.array(z.string()),
  knappe: z.array(z.string()),
  deutliche: z.array(z.string()),
  spieler: z.array(z.string()),
  tabelle: z.array(z.string()),
  facebook: z.string().describe('Kurzer Facebook-Teaser, 3–5 Sätze, ein paar passende Emojis, ohne Link und ohne Hashtags'),
});
export type BerichtText = z.infer<typeof TextSchema>;

const SYSTEM = `Du schreibst für die News-Seite der Münchner Dart Union (MDU, Steeldart-Ligabetrieb in München) den Bericht zu einem Spielwochenende.

Ton: freundlich, sachlich, lebendig wie eine Lokalsport-Redaktion — kein Marketing-Sprech, keine leeren Superlative. Deutsch.

Wichtig: Verwende ausschließlich die Fakten aus dem JSON. Erfinde keine Spielszenen, Zitate, Gründe, Stimmungen, Zuschauer oder Zahlen, die dort nicht stehen. Namen von Spielern und Teams exakt wie angegeben. Ein Ergebnis „spiele“ ist Heim:Gast nach Spielen (18 Spiele je Begegnung, Sieg 3 Punkte, Remis 1). Ergebnisse mit bestaetigt=false sind vorläufig — das musst du nicht erwähnen. art="nachgereicht" heißt: Spiel lag früher, der Bericht kam erst jetzt. Bei Wertungen (Nichtantritt/kein Bericht) nichts dramatisieren.

Abschnitte (jeweils Liste von Absätzen, meist 1–2 kurze Absätze; leere Liste, wenn es dazu nichts gibt):
- einleitung: kurzer Überblick über das Wochenende.
- highlights: 180er, 171er, High Finishes (Wert = Checkout), Short Legs (Wert = Darts) — wer, für welches Team. Eigens hervorheben: das höchste Finish (hoechstesFinish) und alles aus besondereHighlights (Finishes ab 140, Short Legs bis 15 Darts, wer zwei oder mehr 180er bzw. 171er hatte). Kleinere Highlights gern zusammengefasst.
- knappe: Begegnungen mit knapp=true; beschreibe den Spielverlauf anhand der Zwischenstände (nach jedem Spiel Heim:Gast), Führungswechsel, Rückstand, wann es entschieden war.
- deutliche: Begegnungen mit deutlich=true.
- spieler: zuerst der Spieler des Spieltages (spielerDesSpieltages; bei mehreren geteilter Titel) — gewählt nach der Einzelbilanz (die meisten Siege ohne Niederlage), bei Gleichstand nach Highlights; nenne seine Bilanz und seine Highlights. Danach eigens, wer die meisten Highlights hatte (meisteHighlights, mit Anzahl und welche) — auch wenn es dieselbe Person ist. Gern die nächsten aus der bestenliste kurz erwähnen. Nenne KEINE Punkte, keine Formel und keine Gewichtung.
- tabelle: Auswirkungen auf die Tabellen je Liga (Tabellenführung, Sprünge nach oben/unten über platzVorher → platz; platzVorher null = erstes Spiel).
- facebook: EIN kurzer Teaser für die Facebook-Gruppe der MDU, 3–5 Sätze, locker, Du/Ihr-Ansprache erlaubt, ein paar passende Emojis (🎯 🔥 💯 …, nicht übertreiben). Das Spannendste des Wochenendes (Krimi, deutlichster Sieg, Spieler des Spieltages, höchstes Finish) — macht Lust auf den ganzen Bericht. KEIN Link, KEINE Hashtags, kein „Link in Bio“ — das fügt das System an. Kein Markdown, kein **fett**.

Die vollständige Ergebnisliste und offene Spiele fügt das System selbst an — wiederhole nicht jedes Ergebnis. Fettdruck mit **…** sparsam erlaubt, sonst kein Markdown, keine Überschriften.`;

async function mitClaude(f: Fakten): Promise<BerichtText | null> {
  const key = (process.env.OCR_API_KEY || process.env.ANTHROPIC_API_KEY || '').trim();
  if (!key) return null;
  try {
    const client = new Anthropic({ apiKey: key });
    const r = await client.beta.messages.parse({
      model: MODELL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
      output_config: { effort: 'medium', format: betaZodOutputFormat(TextSchema) },
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(faktenJson(f)) }],
    });
    if (r.stop_reason === 'refusal' || r.stop_reason === 'max_tokens') return null;
    return r.parsed_output ?? null;
  } catch (e) {
    console.error('Spieltagsbericht: Claude fehlgeschlagen', e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
    return null;
  }
}

// ── Vorlage (ohne Claude) ────────────────────────────────────

const liste = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} und ${xs[xs.length - 1]}`);

function hlText(z: SpielerWertung): string {
  const t: string[] = [];
  if (z.b180) t.push(`${z.b180}× 180`);
  if (z.b171) t.push(`${z.b171}× 171`);
  if (z.hf.length) t.push(`High Finish ${z.hf.join(', ')}`);
  if (z.sl.length) t.push(`Short Leg ${z.sl.join(', ')} Darts`);
  return t.join(', ');
}

export function vorlage(f: Fakten): BerichtText {
  const gespielt = f.eintraege.filter(x => x.art === 'gespielt');
  const knapp = f.eintraege.filter(x => !x.e.wertung && Math.abs(x.e.spieleHome - x.e.spieleAway) <= KNAPP);
  const deutlich = f.eintraege.filter(x => !x.e.wertung && Math.abs(x.e.spieleHome - x.e.spieleAway) >= DEUTLICH);
  const hl = f.wertung.filter(z => z.highlightAnzahl > 0);
  const top = hoechstesFinish(f), bes = besondere(f);
  const besText = [
    ...bes.finishesAb140.filter(x => x.wert !== top?.wert).map(x => `Finish ${x.wert} von ${x.name} (${x.team})`),
    ...bes.shortLegsBis15.map(x => `Short Leg mit ${x.darts} Darts von ${x.name} (${x.team})`),
    ...bes.mehrfach180.map(x => `${x.anzahl}× 180 von ${x.name} (${x.team})`),
    ...bes.mehrfach171.map(x => `${x.anzahl}× 171 von ${x.name} (${x.team})`),
  ];
  const paar = (x: Eintrag) => `${name(x.e.home)} – ${name(x.e.away)} ${ergText(x.e)}`;
  return {
    facebook: `🎯 Spielwochenende ${wochenendeText(f.fri, f.sun, false)}: ${gespielt.length} Begegnungen, alle Ergebnisse, Highlights und Tabellen im Überblick.`,
    titel: `Spielwochenende ${wochenendeText(f.fri, f.sun, false)}: alle Ergebnisse`,
    teaser: `${gespielt.length} Begegnungen am Wochenende ${wochenendeText(f.fri, f.sun, false)} — Ergebnisse, Highlights und Tabellen.`,
    einleitung: [`Am Wochenende ${wochenendeText(f.fri, f.sun)} wurden ${gespielt.length} Begegnungen gespielt${f.offen.length ? `, ${f.offen.length} stehen noch aus` : ''}.`],
    highlights: [
      ...(top ? [`Höchstes Finish des Wochenendes: **${top.wert}** von ${liste(top.spieler.map(s => `${s.name} (${s.team})`))}.`] : []),
      ...(besText.length ? [`Außerdem: ${liste(besText)}.`] : []),
      ...(hl.length ? [hl.map(z => `**${z.name}** (${name(z.teamId)}): ${hlText(z)}`).join('\n')] : []),
    ],
    knappe: knapp.map(x => {
      const v = spielverlauf(f.daten.get(x.b.key)?.spiele ?? []);
      const remis = x.e.spieleHome === x.e.spieleAway;
      const spiele = (n: number) => (n === 1 ? 'einem Spiel' : `${n} Spielen`);
      const teile = [
        v.fuehrungswechsel ? `${v.fuehrungswechsel} Führungswechsel` : '',
        v.groessterRueckstand ? (remis ? `zwischenzeitlich lag eine Seite mit ${spiele(v.groessterRueckstand)} vorn` : `der Sieger lag zwischenzeitlich mit ${spiele(v.groessterRueckstand)} hinten`) : '',
      ].filter(Boolean);
      return `${paar(x)}${teile.length ? ` — ${teile.join(', ')}` : ''}.`;
    }),
    deutliche: deutlich.length ? [liste(deutlich.map(paar)) + '.'] : [],
    spieler: [
      ...(f.sieger.length ? [`${liste(f.sieger.map(z => `**${z.name}** (${name(z.teamId)})`))}: Einzel ${f.sieger[0].einzelSiege}:${f.sieger[0].einzelNiederlagen}${hlText(f.sieger[0]) ? `, dazu ${hlText(f.sieger[0])}` : ''}.`] : []),
      ...(f.meiste.length ? [`Die meisten Highlights: ${liste(f.meiste.map(z => `**${z.name}** (${name(z.teamId)})`))} mit ${f.meiste[0].highlightAnzahl} (${hlText(f.meiste[0])}).`] : []),
    ],
    tabelle: LIGEN_2027.filter(l => f.tabellen[l.code]).map(l => {
      const erster = f.tabellen[l.code]!.filter(t => t.nachher === 1);
      return `${l.name}: an der Spitze ${liste(erster.map(t => name(t.teamId)))} mit ${erster[0]?.punkte ?? 0} Punkten.`;
    }),
  };
}

// ── Beitrag zusammensetzen ───────────────────────────────────

function ergebnisZeile(x: Eintrag): string {
  const titel = `${name(x.e.home)} – ${name(x.e.away)}`;
  const stern = x.e.bestaetigt ? '' : '*';
  const zusatz = x.art === 'nachgereicht' ? ` (nachgereicht, gespielt ${datumKurz27(x.datum)})` : '';
  if (x.e.wertung) return `${titel} **${ergText(x.e)}** (Wertung: ${WERTUNG_TEXT[x.e.wertung]})${zusatz}`;
  return `[${titel}](${berichtPfad(x.b.key)}) **${ergText(x.e)}${stern}**${zusatz}`;
}

export function inhalt(f: Fakten, t: BerichtText): string[] {
  const out: string[] = [...t.einleitung];
  const abschnitt = (titel: string, absaetze: string[]) => { if (absaetze.length) out.push(`## ${titel}`, ...absaetze); };
  abschnitt('Highlights', t.highlights);
  abschnitt('Knappe Kisten', t.knappe);
  abschnitt('Deutliche Siege', t.deutliche);
  abschnitt('Spieler des Spieltages', t.spieler);

  out.push('## Alle Ergebnisse');
  for (const l of LIGEN_2027) {
    const xs = f.eintraege.filter(x => x.b.liga === l.code);
    const os = f.offen.filter(x => x.b.liga === l.code);
    if (!xs.length && !os.length) continue;
    const st = [...new Set(xs.filter(x => x.art === 'gespielt').map(x => x.b.spieltag))];
    out.push([
      `**${l.name}**${st.length ? ` · ${st.join('/')}. Spieltag` : ''}`,
      ...xs.map(ergebnisZeile),
      ...os.map(x => `${name(x.b.home)} – ${name(x.b.away)}: ${x.grund}`),
    ].join('\n'));
  }
  if (f.eintraege.some(x => !x.e.bestaetigt)) out.push('* = vom Gegner noch nicht bestätigt');
  abschnitt('Tabellen', [...t.tabelle, '[Zu allen Tabellen](/tabellen)']);
  return out;
}

// ── Entwurf anlegen ──────────────────────────────────────────

// ── Social Media (Migration 0060) ────────────────────────────

const HASHTAGS = '#münchnerdartunion #mdu #darts #steeldarts #dartsliga #münchen';

/** Fertiger Facebook-Text: Claudes Teaser + Hinweis + Direktlink + Hashtags. */
export const facebookText = (teaser: string, newsId: string) =>
  `${teaser.trim()}\n\nDen vollständigen Bericht mit allen Ergebnissen und Tabellen gibt's auf mdudarts.de:\n👉 ${berichtLink(newsId)}\n\n${HASHTAGS}`;

export function socialDaten(f: Fakten, newsId: string, titel: string): SocialDaten {
  const spieler = (z: SpielerWertung) => ({ name: z.name, team: name(z.teamId), text: [`Einzel ${z.einzelSiege}:${z.einzelNiederlagen}`, hlText(z)].filter(Boolean).join(' · ') });
  const top = hoechstesFinish(f);
  return {
    newsId, titel, wochenende: wochenendeText(f.fri, f.sun),
    ligen: LIGEN_2027.map(l => {
      const xs = f.eintraege.filter(x => x.b.liga === l.code);
      const st = [...new Set(xs.filter(x => x.art === 'gespielt').map(x => x.b.spieltag))];
      return {
        name: l.name, farbe: l.color, spieltag: st.length ? `${st.join('/')}. Spieltag` : 'Nachholspiele',
        ergebnisse: xs.map(x => ({ heim: name(x.e.home), gast: name(x.e.away), erg: ergText(x.e), bestaetigt: x.e.bestaetigt })),
      };
    }).filter(l => l.ergebnisse.length),
    sieger: f.sieger.map(spieler),
    meiste: f.meiste.filter(z => !f.sieger.includes(z)).map(spieler),
    finish: top ? { wert: top.wert, spieler: top.spieler.map(s => `${s.name} (${s.team})`) } : null,
    fuehrer: LIGEN_2027.filter(l => f.tabellen[l.code]).map(l => {
      const erste = f.tabellen[l.code]!.filter(t => t.nachher === 1);
      return { liga: l.name, farbe: l.color, teams: erste.map(t => name(t.teamId)), punkte: erste[0]?.punkte ?? 0 };
    }),
  };
}

export type ErzeugenErgebnis =
  | { ok: true; newsId: string; quelle: 'claude' | 'vorlage'; begegnungen: number; offen: number }
  | { ok: false; grund: string };

export async function erzeugen(fri: string, opts: { benachrichtigen?: boolean } = {}): Promise<ErzeugenErgebnis> {
  const db = supabaseAdmin;
  if (!db) return { ok: false, grund: 'Server-Datenbank ist nicht konfiguriert.' };
  const id = newsIdFuer(fri);
  const { data: vorhanden, error: ve } = await db.from('news').select('status').eq('id', id).maybeSingle();
  if (ve) return { ok: false, grund: ve.message };
  if (vorhanden && vorhanden.status !== 'draft') return { ok: false, grund: 'Der Bericht ist schon veröffentlicht oder archiviert — zum Neuerzeugen erst wieder auf Entwurf stellen.' };

  const f = await sammeln(fri);
  if (!f) return { ok: false, grund: 'Kein Spielwochenende an diesem Datum.' };
  if (!f.eintraege.length) return { ok: false, grund: 'Noch kein Ergebnis für dieses Wochenende eingereicht.' };

  const claude = await mitClaude(f);
  const t = claude ?? vorlage(f);
  const zeile = {
    title: t.titel.trim().slice(0, 120), teaser: t.teaser.trim().slice(0, 240), source: 'Münchner Dart Union',
    display_date: new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()),
    category: 'Spieltag', content: inhalt(f, t), status: 'draft',
  };
  const { error } = vorhanden
    ? await db.from('news').update(zeile).eq('id', id)
    : await db.from('news').insert({ ...zeile, id });
  if (error) return { ok: false, grund: error.message };
  const basis = { wochenende: fri, news_id: id, keys: f.eintraege.map(x => x.b.key), quelle: claude ? 'claude' : 'vorlage', erstellt_at: new Date().toISOString() };
  let { error: le } = await db.from('spieltag_berichte').upsert({
    ...basis, facebook: facebookText(t.facebook || t.teaser, id), social: socialDaten(f, id, zeile.title),
  });
  // Ohne Migration 0060 (Spalten facebook/social) trotzdem den Bericht ablegen.
  if (le && /facebook|social/.test(le.message)) ({ error: le } = await db.from('spieltag_berichte').upsert(basis));
  if (le) return { ok: false, grund: /spieltag_berichte/.test(le.message) ? 'Migration 0058 fehlt noch.' : le.message };

  if (opts.benachrichtigen) {
    const { data: ll } = await db.from('profiles').select('id').in('role', ['league_admin', 'super_admin']);
    const text = `Der Spieltagsbericht ${wochenendeText(fri, f.sun, false)} liegt als Entwurf bereit (${f.eintraege.length} Begegnungen${f.offen.length ? `, ${f.offen.length} offen` : ''}). Bitte prüfen und veröffentlichen.`;
    const ids = ((ll ?? []) as { id: string }[]).map(p => p.id);
    if (ids.length) await db.from('notifications').insert(ids.map(rid => ({
      recipient_user_id: rid, type: 'spieltag_bericht', title: 'Spieltagsbericht bereit', message: text, short_text: text,
      related_entity_type: 'news', action_url: `/admin/news?id=${id}`,
    })));
  }
  return { ok: true, newsId: id, quelle: claude ? 'claude' : 'vorlage', begegnungen: f.eintraege.length, offen: f.offen.length };
}
