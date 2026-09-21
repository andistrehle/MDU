// ============================================================
// BeDV-Demo — Suchindex
// ============================================================
//
// Ein flacher Index über Ligen, Mannschaften, Spieler, Spielstätten,
// Beiträge und Termine. Er wird im Browser durchsucht — ohne Server,
// ohne Netzabfrage, deshalb ohne Wartezeit zwischen Tastendruck und Treffer.
//
// WICHTIG: Diese Datei wird NUR NACHGELADEN, wenn jemand die Suche öffnet
// (`await import('@/data/bedv/suchindex')` in `components/bedv/search/`).
// Fest eingebunden läge sie im Bündel JEDER Seite — bei über 600 Einträgen
// wäre das ein spürbarer Brocken auf dem ersten Bildschirm, und der erste
// Bildschirm entscheidet in dieser Demo alles.
// ============================================================

import { LIGEN } from './ligen';
import { TEAMS, teamById } from './teams';
import { SPIELER } from './spieler';
import { SPIELSTAETTEN } from './spielstaetten';
import { NEWS } from './news';
import { TERMINE } from './events';
import { saisonById } from './saison';

export type TrefferArt = 'liga' | 'team' | 'spieler' | 'spielstaette' | 'news' | 'termin';

export interface Treffer {
  art: TrefferArt;
  /** Was groß angezeigt wird. */
  titel: string;
  /** Die Zeile darunter — Liga, Mannschaft, Ort. */
  zusatz: string;
  /** Pfad ohne `/bedv`-Präfix. */
  ziel: string;
  /** Kleinbuchstaben, ohne Umlaute — danach wird gesucht. */
  such: string;
}

/** „Böhme" und „bohme" sollen dasselbe finden. */
export function normalisiere(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function baue(): Treffer[] {
  const out: Treffer[] = [];

  for (const l of LIGEN) {
    const saison = saisonById(l.saisonId);
    out.push({
      art: 'liga',
      titel: l.name,
      zusatz: saison?.name ?? 'Liga',
      ziel: `/ligen/${l.slug}`,
      such: normalisiere(`${l.name} ${l.kurz} ${saison?.name ?? ''}`),
    });
  }

  for (const t of TEAMS) {
    const liga = LIGEN.find(l => l.slug === t.ligaSlug);
    const saison = saisonById(t.saisonId);
    out.push({
      art: 'team',
      titel: t.name,
      zusatz: `Mannschaft · ${liga?.name ?? ''}${saison?.aktuell ? '' : ` · ${saison?.kurz ?? ''}`}`,
      ziel: `/teams/${t.id}`,
      such: normalisiere(`${t.name} ${t.kurz} ${liga?.name ?? ''} ${liga?.kurz ?? ''}`),
    });
  }

  for (const s of SPIELER) {
    const team = teamById(s.teamId);
    out.push({
      art: 'spieler',
      titel: s.name,
      zusatz: `Spieler · ${team?.name ?? ''}`,
      ziel: `/spieler/${s.id}`,
      such: normalisiere(`${s.name} ${s.spitzname ?? ''} ${s.passnummer} ${team?.name ?? ''}`),
    });
  }

  for (const v of SPIELSTAETTEN) {
    out.push({
      art: 'spielstaette',
      titel: v.name,
      zusatz: `Spielstätte · ${v.ort}`,
      ziel: `/spielstaetten#${v.id}`,
      such: normalisiere(`${v.name} ${v.ort} ${v.strasse} ${v.plz}`),
    });
  }

  for (const n of NEWS) {
    out.push({
      art: 'news',
      titel: n.titel,
      zusatz: `Beitrag · ${n.kategorie}`,
      ziel: `/news/${n.slug}`,
      such: normalisiere(`${n.titel} ${n.teaser} ${n.kategorie}`),
    });
  }

  for (const t of TERMINE) {
    out.push({
      art: 'termin',
      titel: t.titel,
      zusatz: `Termin · ${t.ort}`,
      ziel: `/events#${t.slug}`,
      such: normalisiere(`${t.titel} ${t.ort} ${t.kategorie}`),
    });
  }

  return out;
}

export const SUCHINDEX: Treffer[] = baue();

/** Reihenfolge der Arten in der Trefferliste. */
const GEWICHT: Record<TrefferArt, number> = {
  liga: 0, team: 1, spieler: 2, spielstaette: 3, news: 4, termin: 5,
};

/**
 * Suche. Zwei Stufen, damit „Ghost" die Mannschaft „Ghost Darts" vor einem
 * Spieler mit Ghost im Vereinsnamen zeigt:
 *   1. Treffer am Wortanfang
 *   2. Treffer irgendwo im Text
 */
export function suche(begriff: string, grenze = 12): Treffer[] {
  const q = normalisiere(begriff);
  if (q.length < 2) return [];

  const anfang: Treffer[] = [];
  const mitte: Treffer[] = [];

  for (const e of SUCHINDEX) {
    const pos = e.such.indexOf(q);
    if (pos < 0) continue;
    const amWortanfang = pos === 0 || e.such[pos - 1] === ' ';
    (amWortanfang ? anfang : mitte).push(e);
    if (anfang.length >= grenze * 3) break;
  }

  const sortiere = (liste: Treffer[]) =>
    liste.sort((a, b) => GEWICHT[a.art] - GEWICHT[b.art] || a.titel.localeCompare(b.titel, 'de'));

  return [...sortiere(anfang), ...sortiere(mitte)].slice(0, grenze);
}
