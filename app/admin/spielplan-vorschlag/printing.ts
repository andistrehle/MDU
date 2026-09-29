// Druck-/PDF-Vorlagen für die TC-Sitzung, clientseitig erzeugt: öffnet ein
// eigenes, in sich geschlossenes Dokument (schwarz auf weiß, A4) in einem neuen
// Tab und ruft den Druckdialog auf → dort „Als PDF speichern".
//   · Team-Blatt: alle Spiele eines Teams + Feld Datum/Uhrzeit zum Eintragen
//   · Masterplan: alle Spiele einer Liga zum Zusammentragen
//   · Spielort-Blatt: alle Heimspiele eines Lokals (Überblick)
// Reine Anzeige aus spielplan.json — schreibt nichts.

import type { SpielplanData } from './spielplan-view';

const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dm = (iso: string) => { const [, m, day] = iso.split('-'); return `${+day}.${+m}.`; };
const LG_SHORT: Record<string, string> = { la: 'La', a: 'A', b1: 'B1', b2: 'B2', c: 'C' };
const LG_COLOR: Record<string, string> = { La: '#8a6d0b', A: '#2E7526', B1: '#4b5563', B2: '#4b5563', C: '#7a5a2a' };

const wkText = (data: SpielplanData, i: number) => { const w = data.weekends[i]; return `${dm(w.fri)}–${dm(w.sun)}`; };

// Zwei beschreibbare Felder Datum / Uhrzeit (compact = nebeneinander in einer Zeile).
function terminCell(compact = false): string {
  const f = (lab: string) => `<span class="ff"><span class="lab">${lab}</span><span class="ln"></span></span>`;
  return `<td class="term${compact ? ' compact' : ''}">${f('Datum')}${f('Uhrzeit')}</td>`;
}

export function teamSheet(data: SpielplanData, lg: SpielplanData['leagues'][number], team: string): string {
  const games: { w: number; nr: number; ha: 'H' | 'A'; opp: string; venue: string; derby: boolean }[] = [];
  for (const m of data.schedule[lg.key]) for (const g of m.games) {
    if (g.home === team) games.push({ w: m.weekendIndex, nr: m.nr, ha: 'H', opp: g.away, venue: g.venue, derby: g.derby });
    else if (g.away === team) games.push({ w: m.weekendIndex, nr: m.nr, ha: 'A', opp: g.home, venue: g.venue, derby: g.derby });
  }
  games.sort((a, b) => a.w - b.w);
  const rows = games.map(x =>
    `<tr class="${x.derby ? 'derby' : ''}"><td class="st">${x.nr}</td><td class="wk">${wkText(data, x.w)}</td>` +
    `<td class="ha"><span class="${x.ha === 'H' ? 'bH' : 'bA'}">${x.ha === 'H' ? 'Heim' : 'Ausw.'}</span></td>` +
    `<td class="opp">${esc(x.opp)}${x.derby ? ' <span class="db">⚔</span>' : ''}</td><td class="loc">${esc(x.venue)}</td>${terminCell()}</tr>`).join('');
  return `<section class="sheet">
    <header class="hd"><div class="brand">Münchner Dart Union · Terminplanung TC-Sitzung</div>
      <div class="titlerow"><h1>${esc(team)}</h1><span class="chip" style="--c:${LG_COLOR[LG_SHORT[lg.key]]}">${esc(lg.label)}</span></div>
      <div class="season">Saison 2026/2027 · Start 23.–25.10. · Ende 7.–9.05.</div></header>
    <p class="hint"><b>Vorschlag</b> = Rahmen-Wochenende (Fr–So). Den genauen Termin macht ihr mit dem Gegner aus und tragt Datum &amp; Uhrzeit ein. <span class="db">⚔</span> = Derby (gleiches Lokal).</p>
    <table><thead><tr><th>ST</th><th>Vorschlag</th><th>H/A</th><th>Gegner</th><th>Spielort</th><th class="tw">Genauer Termin</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

export function masterSheet(data: SpielplanData, lg: SpielplanData['leagues'][number]): string {
  const mds = [...data.schedule[lg.key]].sort((a, b) => a.weekendIndex - b.weekendIndex);
  let rows = '';
  for (const m of mds) {
    m.games.forEach((g, i) => {
      rows += `<tr class="${i === 0 ? 'sep ' : ''}${g.derby ? 'derby' : ''}">` +
        (i === 0 ? `<td class="st" rowspan="${m.games.length}">${m.nr}</td><td class="wk" rowspan="${m.games.length}">${wkText(data, m.weekendIndex)}</td>` : '') +
        `<td class="opp">${esc(g.home)}${g.derby ? ' <span class="db">⚔</span>' : ''}</td><td class="opp">${esc(g.away)}</td><td class="loc">${esc(g.venue)}</td>${terminCell(true)}</tr>`;
    });
    if (m.bye) rows += `<tr class="free"><td class="st">${m.nr}</td><td class="wk">${wkText(data, m.weekendIndex)}</td><td colspan="4">spielfrei: ${esc(m.bye)}</td></tr>`;
  }
  return `<section class="sheet">
    <header class="hd"><div class="brand">Münchner Dart Union · Terminplanung TC-Sitzung</div>
      <div class="titlerow"><h1>Masterplan</h1><span class="chip" style="--c:#1A1D24">${esc(lg.label)}</span></div>
      <div class="season">Alle Termine hier zusammentragen · ${lg.teams.length} Teams · ${mds.length} Spieltage</div></header>
    <table><thead><tr><th>ST</th><th>Vorschlag</th><th>Heim</th><th>Auswärts</th><th>Spielort</th><th class="tw">Genauer Termin</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

export function venueSheet(data: SpielplanData, venue: string): string {
  const teamsAt: string[] = [];
  for (const lg of data.leagues) for (const t of lg.teams) if (t.venue === venue) teamsAt.push(`${t.name} (${LG_SHORT[lg.key]})`);
  const byWk: Record<number, { lg: string; home: string; away: string; derby: boolean }[]> = {};
  for (const lg of data.leagues) for (const m of data.schedule[lg.key]) for (const g of m.games)
    if (g.venue === venue) (byWk[m.weekendIndex] ??= []).push({ lg: LG_SHORT[lg.key], home: g.home, away: g.away, derby: g.derby });
  const idx = Object.keys(byWk).map(Number).sort((a, b) => a - b);
  const total = idx.reduce((n, i) => n + byWk[i].length, 0);
  let rows = '';
  for (const i of idx) {
    byWk[i].forEach((g, k) => {
      rows += `<tr class="${k === 0 ? 'sep ' : ''}${g.derby ? 'derby' : ''}">` +
        (k === 0 ? `<td class="wk" rowspan="${byWk[i].length}">${wkText(data, i)}</td>` : '') +
        `<td class="ha"><span class="tag" style="background:${LG_COLOR[g.lg]}">${g.lg}</span></td>` +
        `<td class="opp">${esc(g.home)}${g.derby ? ' <span class="db">⚔</span>' : ''}</td><td class="opp">${esc(g.away)}</td>${terminCell(true)}</tr>`;
    });
  }
  return `<section class="sheet">
    <header class="hd"><div class="brand">Münchner Dart Union · Spielplan-Vorschlag 2026/2027</div>
      <div class="titlerow"><h1>${esc(venue)}</h1><span class="chip" style="--c:#2E7526">Spielort</span></div>
      <div class="season">${idx.length} Spielwochenenden · ${total} Heimspiele · Heimteams: ${esc(teamsAt.join(', '))}</div></header>
    <table><thead><tr><th>Vorschlag</th><th>Liga</th><th>Heim</th><th>Auswärts</th><th class="tw">Genauer Termin</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm 10mm 12mm; }
*{ box-sizing:border-box; }
html,body{ margin:0; background:#fff; color:#111; font-family:'Segoe UI',Arial,'Liberation Sans',sans-serif; }
.toolbar{ position:sticky; top:0; z-index:9; display:flex; gap:10px; align-items:center; padding:12px 16px; background:#1A1D24; color:#fff; }
.toolbar b{ font-size:14px; margin-right:auto; }
.toolbar button{ padding:9px 16px; border:0; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer; }
.toolbar .p{ background:#2E7526; color:#fff; } .toolbar .c{ background:#3a3f49; color:#fff; }
.wrap{ padding:16px; }
.sheet{ max-width:190mm; margin:0 auto 10mm; page-break-after:always; }
.sheet:last-child{ page-break-after:auto; }
.hd{ border-left:5px solid #2E7526; padding:2px 0 8px 12px; margin-bottom:10px; }
.brand{ font-size:9.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#6b7280; }
.titlerow{ display:flex; align-items:center; gap:12px; margin:3px 0 2px; }
h1{ font-size:23px; margin:0; text-transform:uppercase; letter-spacing:.01em; }
.chip{ font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#fff; background:var(--c,#2E7526); padding:3px 10px; border-radius:999px; }
.season{ font-size:11px; color:#555; }
.hint{ font-size:10.5px; color:#333; background:#f3f6f3; border:1px solid #dbe4db; border-radius:6px; padding:7px 10px; margin:0 0 10px; }
table{ width:100%; border-collapse:collapse; }
th,td{ border:1px solid #cfd4d9; padding:5px 8px; font-size:11px; text-align:left; vertical-align:middle; }
th{ background:#2E7526; color:#fff; font-size:9.5px; text-transform:uppercase; letter-spacing:.04em; border-color:#256020; }
tbody tr:nth-child(even){ background:#f7f9f7; }
td.st{ font-weight:800; text-align:center; width:30px; }
td.wk{ white-space:nowrap; font-variant-numeric:tabular-nums; width:78px; font-weight:600; }
td.ha{ text-align:center; width:52px; }
.bH{ color:#fff; background:#2E7526; padding:1px 7px; border-radius:4px; font-weight:800; font-size:9.5px; }
.bA{ color:#374151; background:#e5e7eb; padding:1px 7px; border-radius:4px; font-weight:800; font-size:9.5px; }
.tag{ color:#fff; padding:1px 7px; border-radius:4px; font-weight:800; font-size:9.5px; }
td.opp{ font-weight:600; } td.loc{ color:#374151; }
.db{ color:#8a6d0b; font-weight:800; }
tr.derby td{ background:#fbf5e6 !important; }
tr.free td{ background:#f0f0f0 !important; color:#666; font-style:italic; }
tr.sep td{ border-top:2px solid #9aa1ab; }
th.tw{ width:150px; } td.term{ width:150px; }
.ff{ display:flex; align-items:flex-end; gap:6px; margin:3px 0; }
.ff .lab{ font-size:7.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#9aa1ab; width:34px; }
.ff .ln{ flex:1; border-bottom:1px solid #9aa1ab; height:11px; }
td.term.compact{ width:190px; } td.term.compact .ff{ display:inline-flex; width:48%; }
.foot{ font-size:9px; color:#777; margin-top:6px; }
@media print { .toolbar{ display:none; } .wrap{ padding:0; } body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

export function wrapDoc(title: string, body: string, toolbar = false): string {
  const bar = toolbar ? `<div class="toolbar"><b>${esc(title)}</b>` +
    `<button class="p" onclick="window.print()">Drucken / Als PDF speichern</button>` +
    `<button class="c" onclick="window.close()">Schließen</button></div>` : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>${bar}<div class="wrap">${body}</div></body></html>`;
}

function openPrint(title: string, body: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Bitte Pop-ups für diese Seite erlauben und erneut auf „Drucken" tippen.'); return; }
  w.document.write(wrapDoc(title, body, true) + `<` + `script>window.onload=function(){setTimeout(function(){try{window.print();}catch(e){}},350);};<` + `/script>`);
  w.document.close();
}

// ── Öffentliche Druck-Aktionen ────────────────────────────────
export function printLeague(data: SpielplanData, lgKey: string) {
  const lg = data.leagues.find(l => l.key === lgKey);
  if (!lg) return;
  const teams = [...lg.teams].map(t => t.name).sort((a, b) => a.localeCompare(b, 'de'));
  openPrint(`${lg.label} – Team-Blätter + Masterplan`, teams.map(t => teamSheet(data, lg, t)).join('') + masterSheet(data, lg));
}
export function printAllLeagues(data: SpielplanData) {
  const body = data.leagues.map(lg => {
    const teams = [...lg.teams].map(t => t.name).sort((a, b) => a.localeCompare(b, 'de'));
    return teams.map(t => teamSheet(data, lg, t)).join('') + masterSheet(data, lg);
  }).join('');
  openPrint('Alle Ligen – Team-Blätter + Masterpläne', body);
}
export function printMaster(data: SpielplanData, lgKey: string) {
  const lg = data.leagues.find(l => l.key === lgKey);
  if (!lg) return;
  openPrint(`${lg.label} – Masterplan`, masterSheet(data, lg));
}
export function printVenue(data: SpielplanData, venue: string) {
  openPrint(`${venue} – Spielort-Plan`, venueSheet(data, venue));
}
export function printAllVenues(data: SpielplanData) {
  const venues = new Set<string>();
  for (const lg of data.leagues) for (const t of lg.teams) venues.add(t.venue);
  const list = [...venues].sort((a, b) => a.localeCompare(b, 'de'));
  openPrint('Alle Spielorte', list.map(v => venueSheet(data, v)).join(''));
}
