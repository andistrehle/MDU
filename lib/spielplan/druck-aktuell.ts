// ============================================================
// Spielplan drucken — AKTUELLER Stand (Betreiber, 09.11.2026)
// ============================================================
// Anders als die Blätter der TC-Sitzung (printing.ts: teamSheet/masterSheet mit
// leeren Feldern zum Eintragen) stehen hier die echten Termine: Masterplan +
// Heimrechttausch + bestätigte Verlegungen — dieselbe Quelle wie die Seite
// (termin27 / spieleFuerTeam27 / spieltage27 / heimspieleImLokal27).
// Genutzt auf „Mein Spielplan“ (alle Mitglieder) und im Admin-Bereich.
// ============================================================

import {
  alleTeams27, alleVenues27, datumKurz27, findLiga27, heimspieleImLokal27, kalenderwoche, spieleFuerTeam27, spieltage27,
  team27, termin27, terminVerlegt, venue27, venueBloecke27, wochenendeText, LIGEN_2027, type Liga27Code,
} from '@/lib/data/saison-2027';
import { esc, header, openPrint, venueTermineSheet, type VenueTerminBlock } from './printing';

const LIGA_DRUCKFARBE: Record<string, string> = { la: '#8a6d0b', a: '#2E7526', b1: '#4b5563', b2: '#4b5563', c: '#7a5a2a' };
const heute = () => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
const stand = () => `Stand ${heute()} · aktuelle Termine immer auf mdudarts.de`;
const name = (id: string) => team27(id)?.name ?? id;
const ort = (heimId: string) => venue27(team27(heimId)?.venueId)?.name ?? 'Spielort folgt';

interface Zeile { tag: string; zeit: string; hinweis: string[]; sort: string }
function terminZeile(home: string, away: string, fri: string, sun: string): Zeile {
  const t = termin27(home, away);
  const hinweis: string[] = [];
  if (!t) hinweis.push('Termin folgt');
  else {
    if (terminVerlegt(t, fri, sun)) hinweis.push('verlegt');
    if (t.vorlaeufig) hinweis.push('wird geprüft');
    if (!t.uhrzeit) hinweis.push('Uhrzeit folgt');
  }
  return {
    tag: t ? datumKurz27(t.datum) : `Wochenende ${wochenendeText(fri, sun, false)}`,
    zeit: t?.uhrzeit ?? '—', hinweis, sort: t?.datum ?? fri,
  };
}
const eti = (h: string[]) => h.map(x => `<span class="eti">${esc(x)}</span>`).join(' ');

/** Alle Spiele eines Teams mit echtem Datum, Uhrzeit und Spielort. */
export function teamSheetAktuell(teamId: string): string {
  const t = team27(teamId); const lg = findLiga27(t?.league);
  if (!t || !lg) return '';
  const zeilen = spieleFuerTeam27(teamId).map(s => {
    if (!s.gegner) return { s, z: { tag: `Wochenende ${wochenendeText(s.fri, s.sun, false)}`, zeit: '', hinweis: [], sort: s.fri } as Zeile };
    const [h, a] = s.heim ? [teamId, s.gegner] : [s.gegner, teamId];
    return { s, z: terminZeile(h, a, s.fri, s.sun) };
  }).sort((x, y) => x.z.sort.localeCompare(y.z.sort) || x.s.spieltag - y.s.spieltag);
  const rows = zeilen.map(({ s, z }) => !s.gegner
    ? `<tr class="free"><td class="st">${s.spieltag}</td><td class="tg" colspan="2">${esc(z.tag)}</td><td colspan="4">spielfrei</td></tr>`
    : `<tr class="${s.derby ? 'derby' : ''}"><td class="st">${s.spieltag}</td><td class="tg">${esc(z.tag)}</td><td class="zt">${esc(z.zeit)}</td>` +
      `<td class="ha"><span class="${s.heim ? 'bH' : 'bA'}">${s.heim ? 'Heim' : 'Ausw.'}</span></td>` +
      `<td class="opp">${esc(name(s.gegner))}${s.derby ? ' <span class="db">⚔</span>' : ''}</td>` +
      `<td class="loc">${esc(ort(s.heim ? teamId : s.gegner))}</td><td>${eti(z.hinweis)}</td></tr>`).join('');
  return `<section class="sheet team">
    ${header(t.name, lg.name, LIGA_DRUCKFARBE[lg.code] ?? '#2E7526', esc(stand()))}
    <table><thead><tr><th>ST</th><th>Tag</th><th>Uhrzeit</th><th>H/A</th><th>Gegner</th><th>Spielort</th><th>Hinweis</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="hint" style="margin-top:10px"><span class="db">⚔</span> = Derby (gleiches Lokal). Wochenende statt Datum = genauer Termin steht noch nicht fest.</p>
  </section>`;
}

/** Ganze Liga nach Spieltagen, je Spiel echter Termin. */
export function ligaSheetAktuell(code: Liga27Code): string {
  const lg = findLiga27(code);
  if (!lg) return '';
  let rows = '';
  for (const st of spieltage27(code)) {
    rows += `<tr class="wkh"><td colspan="6">${st.nr}. Spieltag · ${esc(wochenendeText(st.fri, st.sun))}<span>KW ${kalenderwoche(st.fri)}</span></td></tr>`;
    const spiele = st.games.map(g => ({ g, z: terminZeile(g.home, g.away, st.fri, st.sun) })).sort((x, y) => x.z.sort.localeCompare(y.z.sort) || x.z.zeit.localeCompare(y.z.zeit));
    for (const { g, z } of spiele) {
      rows += `<tr class="${g.derby ? 'derby' : ''}"><td class="tg">${esc(z.tag)}</td><td class="zt">${esc(z.zeit)}</td>` +
        `<td class="opp">${esc(name(g.home))}${g.derby ? ' <span class="db">⚔</span>' : ''}</td><td class="aw">${esc(name(g.away))}</td>` +
        `<td class="loc">${esc(ort(g.home))}</td><td>${eti(z.hinweis)}</td></tr>`;
    }
    if (st.bye) rows += `<tr class="free"><td colspan="6">spielfrei: ${esc(name(st.bye))}</td></tr>`;
  }
  return `<section class="sheet vt">
    ${header(`Spielplan`, lg.name, LIGA_DRUCKFARBE[lg.code] ?? '#2E7526', esc(stand()))}
    <table><thead><tr><th>Tag</th><th>Uhrzeit</th><th>Heim</th><th>Gast</th><th>Spielort</th><th>Hinweis</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

/** Heimspiele eines Lokals mit den festen Terminen (wie der Knopf auf der Spielstätten-Seite). */
export function spielortBloeckeAktuell(venueId: string): { name: string; teams: string; bloecke: VenueTerminBlock[] } | null {
  const v = venue27(venueId);
  if (!v) return null;
  const teams = alleTeams27().filter(t => t.venueId === venueId).sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .map(t => `${t.name} (${findLiga27(t.league)?.name ?? ''})`).join(', ');
  const bloecke: VenueTerminBlock[] = venueBloecke27(heimspieleImLokal27(venueId)).map(b => b.art === 'frei'
    ? { art: 'frei', text: `${wochenendeText(b.fri, b.sun, false)} · kein Heimspiel${b.anzahl > 1 ? ` (${b.anzahl} Wochenenden)` : ''}` }
    : {
      art: 'woche', titel: `KW ${kalenderwoche(b.w.fri)} · Wochenende ${wochenendeText(b.w.fri, b.w.sun)}`,
      spiele: b.w.spiele.map(s => ({
        tag: s.termin ? datumKurz27(s.termin.datum) : 'offen', zeit: s.termin?.uhrzeit ?? '—',
        liga: s.liga.name.replace(/\s*Liga$/, ''), ligaFarbe: LIGA_DRUCKFARBE[s.liga.code] ?? '#4b5563', spieltag: s.spieltag,
        home: name(s.spiel.home), away: name(s.spiel.away), derby: s.spiel.derby,
        hinweis: [...(s.verlegt ? ['verlegt'] : []), ...(s.termin?.vorlaeufig ? ['wird geprüft'] : [])],
      })),
    });
  return { name: v.name, teams, bloecke };
}

// ── Druck-Aktionen ────────────────────────────────────────────
export function printTeamAktuell(teamId: string, mitLiga = false) {
  const t = team27(teamId);
  if (!t) return;
  openPrint(`${t.name} – Spielplan`, teamSheetAktuell(teamId) + (mitLiga ? ligaSheetAktuell(t.league) : ''));
}
export function printLigaAktuell(code: Liga27Code, mitTeams = false) {
  const lg = findLiga27(code);
  if (!lg) return;
  const teams = mitTeams ? alleTeams27().filter(t => t.league === code).sort((a, b) => a.name.localeCompare(b.name, 'de')).map(t => teamSheetAktuell(t.id)).join('') : '';
  openPrint(`${lg.name} – Spielplan`, teams + ligaSheetAktuell(code));
}
export function printAlleLigenAktuell() {
  openPrint('Alle Ligen – Spielpläne', LIGEN_2027.map(l => ligaSheetAktuell(l.code)).join(''));
}
export function printSpielortAktuell(venueId: string) {
  const b = spielortBloeckeAktuell(venueId);
  if (b) openPrint(`${b.name} – Spielort-Plan`, venueTermineSheet(b.name, b.teams, b.bloecke, `Stand ${heute()}`));
}
export function printAlleSpielorteAktuell() {
  const body = alleVenues27().filter(v => alleTeams27().some(t => t.venueId === v.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .map(v => spielortBloeckeAktuell(v.id)).filter(Boolean).map(b => venueTermineSheet(b!.name, b!.teams, b!.bloecke, `Stand ${heute()}`)).join('');
  openPrint('Alle Spielorte – Pläne', body);
}
/** Admin: Team über den Namen aus dem Vorschlag finden. */
export const teamIdNachName = (n: string) => alleTeams27().find(t => t.name === n)?.id;
export const venueIdNachName = (n: string) => alleVenues27().find(v => v.name === n)?.id;
