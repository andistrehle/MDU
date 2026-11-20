// ============================================================
// Suche in der Kopfzeile (Betreiber, 20.11.2026) — reine Logik
// ============================================================
// Der Index (lib/server/suche.ts) kommt einmal vom Server, gefiltert wird im Browser.

export type SuchArt = 'team' | 'spieler' | 'ort' | 'seite' | 'faq';
export interface SuchEintrag {
  art: SuchArt;
  /** Titel (Name, Frage) */
  t: string;
  /** Zweite Zeile (Team · Liga, Adresse …) */
  u?: string;
  /** Ziel */
  h: string;
  /** Weitere Suchwörter, die nicht angezeigt werden */
  k?: string;
  /** Spieler, der nur 2025/26 gespielt hat */
  archiv?: boolean;
}

export const ART_TITEL: Record<SuchArt, string> = { team: 'Teams', spieler: 'Spieler', ort: 'Spielstätten', seite: 'Seiten', faq: 'Häufige Fragen' };
export const ART_FOLGE: SuchArt[] = ['team', 'spieler', 'ort', 'seite', 'faq'];
export const MIN_ZEICHEN = 2;

/** Klein, Umlaute ohne Punkte, Akzente und Satzzeichen weg — „Böhme“ = „bohme“, „Dart's“ = „darts“. */
export const glatt = (s: string) => s.toLowerCase()
  .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’`´]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Wie gut passt ein Eintrag? 0 = gar nicht. Jedes Suchwort muss vorkommen (Titel, 2. Zeile oder Suchwörter).
 *  Titel beginnt mit der Eingabe 100 · ein Titelwort beginnt mit jedem Suchwort 70 · alle im Titel 50 ·
 *  sonst (2. Zeile/Suchwörter) 20. Archiv-Spieler −5, damit aktuelle bei gleichem Namen vorn stehen. */
export function treffer(e: SuchEintrag, eingabe: string): number {
  const q = glatt(eingabe);
  if (q.length < MIN_ZEICHEN) return 0;
  const woerter = q.split(' ');
  const titel = glatt(e.t);
  const rest = glatt(`${e.u ?? ''} ${e.k ?? ''}`);
  const titelWoerter = titel.split(' ');
  if (!woerter.every(w => titel.includes(w) || rest.includes(w))) return 0;
  let p: number;
  if (titel.startsWith(q)) p = 100;
  else if (woerter.every(w => titelWoerter.some(tw => tw.startsWith(w)))) p = 70;
  else if (woerter.every(w => titel.includes(w))) p = 50;
  else p = 20;
  return e.archiv ? p - 5 : p;
}

export interface SuchGruppe { art: SuchArt; eintraege: SuchEintrag[]; mehr: number }

/** Treffer nach Art gruppiert; die Gruppe mit dem besten Treffer zuerst, bei Gleichstand ART_FOLGE.
 *  Je Gruppe höchstens `jeGruppe`, `mehr` = wie viele weitere es gäbe. */
export function suche(index: SuchEintrag[], eingabe: string, jeGruppe = 6): SuchGruppe[] {
  const bewertet = index.map(e => ({ e, p: treffer(e, eingabe) })).filter(x => x.p > 0);
  const gruppen: (SuchGruppe & { best: number })[] = [];
  for (const art of ART_FOLGE) {
    const g = bewertet.filter(x => x.e.art === art).sort((a, b) => b.p - a.p || a.e.t.localeCompare(b.e.t, 'de'));
    if (g.length) gruppen.push({ art, eintraege: g.slice(0, jeGruppe).map(x => x.e), mehr: Math.max(0, g.length - jeGruppe), best: g[0].p });
  }
  return gruppen.sort((a, b) => b.best - a.best || ART_FOLGE.indexOf(a.art) - ART_FOLGE.indexOf(b.art)).map(({ best: _b, ...g }) => g);
}
