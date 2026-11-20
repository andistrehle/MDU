import 'server-only';
import { PLAYERS } from '@/lib/data/players';
import { FAQ } from '@/lib/data/faq';
import { alleTeams27, alleVenues27, findLiga27, venue27, team27, LIGEN_2027, NEUE_SAISON } from '@/lib/data/saison-2027';
import { getSeasonKaderAlle } from '@/lib/server/season-data';
import type { SuchEintrag } from '@/lib/suche';

const SEITEN: [string, string, string][] = [
  ['Spielplan', '/spielplan', 'termine spieltage wann'],
  ['Ergebnisse', '/ergebnisse', 'resultate spielberichte'],
  ['Tabellen', '/tabellen', 'tabelle platz punkte auf abstieg'],
  ['Ligen', '/ligen', 'liga übersicht einzelrangliste'],
  ['Teams', '/teams', 'mannschaften'],
  ['Spielstätten', '/spielstaetten', 'lokale kneipen adresse route'],
  ['Live-Ticker', '/live', 'live heute zwischenstand'],
  ['News', '/news', 'aktuelles spieltagsberichte neuigkeiten'],
  ['Häufige Fragen', '/faq', 'faq hilfe'],
  ['Downloads', '/downloads', 'spielberichtsbogen formulare pdf'],
  ['Kontakt', '/kontakt', 'ligaleitung mail nachricht'],
  ['Spielbedingungen', '/spielbedingungen', 'regeln regelwerk'],
  ['Anmelden', '/login', 'login konto einloggen'],
  ['Registrieren', '/registrieren', 'konto anlegen'],
  ['Mein Bereich', '/mein-bereich', 'profil spielbericht erfassen team manager'],
  ['Archiv Saison 2025/26', '/ligen/2025-26', 'alte saison vorjahr'],
];

/** Suchindex: Teams, Spieler (Kader 2026/27 + nur-Archiv), Spielstätten, Seiten, FAQ.
 *  Nur, was ohnehin öffentlich auf der Seite steht — keine Spitznamen, keine Passnummern. */
export async function baueSuchIndex(): Promise<SuchEintrag[]> {
  const out: SuchEintrag[] = [];
  const teams = alleTeams27();
  for (const t of teams) {
    const liga = findLiga27(t.league);
    out.push({ art: 'team', t: t.name, u: [liga?.name, venue27(t.venueId)?.name].filter(Boolean).join(' · '), h: `/teams/${t.id}`, k: t.short });
  }
  const kader = await getSeasonKaderAlle(NEUE_SAISON.id);
  const aktuell = new Set<string>();
  for (const p of kader) {
    const t = team27(p.teamId);
    if (!t) continue;                                     // Team steht (noch) nicht im Spielplan
    aktuell.add(p.playerId);
    out.push({ art: 'spieler', t: p.name, u: `${t.name} · ${findLiga27(t.league)?.name ?? ''}`, h: `/spieler/${p.playerId}` });
  }
  for (const p of PLAYERS) {
    if (aktuell.has(p.id)) continue;
    const name = `${p.firstName} ${p.lastName}`.trim();
    if (name) out.push({ art: 'spieler', t: name, u: 'Archiv 2025/26', h: `/spieler/${p.id}`, archiv: true });
  }
  for (const v of alleVenues27()) {
    const dort = teams.filter(t => t.venueId === v.id);
    if (!dort.length) continue;
    out.push({ art: 'ort', t: v.name, u: v.address ?? undefined, h: `/spielstaetten/${v.id}`, k: dort.map(t => t.name).join(' ') });
  }
  for (const l of LIGEN_2027) out.push({ art: 'seite', t: l.name, u: 'Tabelle, Spielplan, Einzelrangliste', h: `/ligen/${l.code}`, k: 'liga tabelle' });
  for (const [t, h, k] of SEITEN) out.push({ art: 'seite', t, h, k });
  for (const thema of FAQ) for (const f of thema.fragen) out.push({ art: 'faq', t: f.frage, u: thema.titel, h: `/faq#${f.id}`, k: (f.stichworte ?? []).join(' ') });
  return out;
}
