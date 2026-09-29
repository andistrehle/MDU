// Druck-/PDF-Vorlagen für die TC-Sitzung, clientseitig erzeugt: öffnet ein
// eigenes, in sich geschlossenes Dokument (schwarz auf weiß, A4) in einem neuen
// Tab und ruft den Druckdialog auf → dort „Als PDF speichern".
//   · Team-Blatt: alle Spiele eines Teams + Feld Datum/Uhrzeit zum Eintragen
//   · Masterplan: alle Spiele einer Liga zum Zusammentragen
//   · Spielort-Blatt: alle Heimspiele eines Lokals (Überblick)
// Reine Anzeige aus spielplan.json — schreibt nichts.

import type { SpielplanData } from './spielplan-view';
import { MDU_LOGO } from './mdu-logo-data';

const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dm = (iso: string) => { const [, m, day] = iso.split('-'); return `${+day}.${+m}.`; };
const LG_SHORT: Record<string, string> = { la: 'La', a: 'A', b1: 'B1', b2: 'B2', c: 'C' };
const LG_COLOR: Record<string, string> = { La: '#8a6d0b', A: '#2E7526', B1: '#4b5563', B2: '#4b5563', C: '#7a5a2a' };

const wkText = (data: SpielplanData, i: number) => { const w = data.weekends[i]; return `${dm(w.fri)}–${dm(w.sun)}`; };

// Kopf mit MDU-Logo, Titel, Liga-Chip und Unterzeile (Old-School-Stil).
function header(h1: string, chip: string, chipColor: string, sub: string): string {
  return `<header class="hd"><img class="logo" src="${MDU_LOGO}" alt="Münchner Dart Union" />
    <div class="htxt"><div class="brand">Münchner Dart Union · Saison 2026/2027</div>
      <div class="titlerow"><h1>${esc(h1)}</h1><span class="chip" style="--c:${chipColor}">${esc(chip)}</span></div>
      <div class="season">${sub}</div></div></header>`;
}

// Datum und Uhrzeit nebeneinander (mit „:"), große Felder zum Handausfüllen.
function terminCell(): string {
  return `<td class="term"><span class="fld"><span class="lab">Datum:</span><span class="wln d"></span></span>` +
    `<span class="fld"><span class="lab">Uhrzeit:</span><span class="wln t"></span><b class="cln">:</b><span class="wln t"></span></span></td>`;
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
    ${header(team, lg.label, LG_COLOR[LG_SHORT[lg.key]], 'Terminplanung TC-Sitzung · Start 23.–25.10.2026 · Ende 7.–9.05.2027')}
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
        `<td class="opp">${esc(g.home)}${g.derby ? ' <span class="db">⚔</span>' : ''}</td><td class="opp">${esc(g.away)}</td><td class="loc">${esc(g.venue)}</td>${terminCell()}</tr>`;
    });
    if (m.bye) rows += `<tr class="free"><td class="st">${m.nr}</td><td class="wk">${wkText(data, m.weekendIndex)}</td><td colspan="4">spielfrei: ${esc(m.bye)}</td></tr>`;
  }
  return `<section class="sheet">
    ${header('Masterplan', lg.label, '#1A1D24', `Alle Termine hier zusammentragen · ${lg.teams.length} Teams · ${mds.length} Spieltage`)}
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
        `<td class="opp">${esc(g.home)}${g.derby ? ' <span class="db">⚔</span>' : ''}</td><td class="opp">${esc(g.away)}</td>${terminCell()}</tr>`;
    });
  }
  return `<section class="sheet">
    ${header(venue, 'Spielort', '#2E7526', `${idx.length} Spielwochenenden · ${total} Heimspiele · Heimteams: ${esc(teamsAt.join(', '))}`)}
    <table><thead><tr><th>Vorschlag</th><th>Liga</th><th>Heim</th><th>Auswärts</th><th class="tw">Genauer Termin</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Saira+Condensed:wght@600;700;800&display=swap';
const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm 10mm 12mm; }
*{ box-sizing:border-box; }
html,body{ margin:0; background:#fff; color:#1A1D24; font-family:'Manrope','Segoe UI',Arial,sans-serif; }
h1,.brand,.chip,th{ font-family:'Saira Condensed','Arial Narrow','Segoe UI',sans-serif; }
.toolbar{ position:sticky; top:0; z-index:9; display:flex; gap:10px; align-items:center; padding:12px 16px; background:#1A1D24; color:#fff; }
.toolbar b{ font-size:14px; margin-right:auto; }
.toolbar button{ padding:9px 16px; border:0; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer; }
.toolbar .p{ background:#2E7526; color:#fff; } .toolbar .c{ background:#3a3f49; color:#fff; }
.wrap{ padding:16px; }
.sheet{ background:#fff; max-width:190mm; margin:0 auto 14px; padding:16px 18px; border-radius:10px; page-break-after:always; }
.sheet:last-child{ page-break-after:auto; }
.hd{ display:flex; align-items:center; gap:16px; border-bottom:2px solid #B8860B; padding-bottom:9px; margin-bottom:11px; }
.logo{ height:54px; width:auto; }
.htxt{ flex:1; min-width:0; }
.brand{ font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#6b7280; }
.titlerow{ display:flex; align-items:center; gap:12px; margin:2px 0 3px; flex-wrap:wrap; }
h1{ font-size:29px; font-weight:800; text-transform:uppercase; letter-spacing:.01em; margin:0; line-height:1; color:#1A1D24; }
.chip{ font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#fff; background:var(--c,#2E7526); padding:3px 12px; border-radius:999px; }
.season{ font-size:11px; color:#5C6470; }
.hint{ font-size:10.5px; color:#3D4452; background:#f3f6f3; border:1px solid #dbe4db; border-radius:6px; padding:8px 11px; margin:0 0 11px; }
table{ width:100%; border-collapse:collapse; }
th,td{ border:1px solid #cfd4d9; text-align:left; vertical-align:middle; }
th{ background:#2E7526; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; border-color:#256020; padding:7px 8px; }
td{ padding:9px 8px; font-size:11.5px; }
tbody tr:nth-child(even){ background:#f6f8f6; }
td.st{ font-weight:800; text-align:center; width:30px; font-size:13px; }
td.wk{ white-space:nowrap; font-variant-numeric:tabular-nums; width:80px; font-weight:700; }
td.ha{ text-align:center; width:56px; }
.bH{ color:#fff; background:#2E7526; padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px; }
.bA{ color:#374151; background:#e5e7eb; padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px; }
.tag{ color:#fff; padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px; }
td.opp{ font-weight:700; } td.loc{ color:#3D4452; }
.db{ color:#B8860B; font-weight:800; }
tr.derby td{ background:#fbf3df !important; }
tr.free td{ background:#eef0f2 !important; color:#5C6470; font-style:italic; }
tr.sep td{ border-top:2px solid #9aa1ab; }
th.tw{ width:218px; } td.term{ width:218px; white-space:nowrap; }
.fld{ display:inline-flex; align-items:flex-end; gap:5px; }
.fld+.fld{ margin-left:12px; }
.lab{ font-size:8.5px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#818793; }
.wln{ display:inline-block; border-bottom:1.4px solid #7c848f; height:22px; }
.wln.d{ width:76px; } .wln.t{ width:22px; } .cln{ color:#5C6470; font-weight:800; padding:0 1px; }
@media screen { .wrap{ background:#F2F4F7; } .sheet{ border:1px solid rgba(15,23,42,0.10); box-shadow:0 2px 12px rgba(15,23,42,0.07); } }
@media print { .toolbar{ display:none; } .wrap{ padding:0; background:#fff; } .sheet{ padding:0; margin:0 0 8mm; border-radius:0; } body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

export function wrapDoc(title: string, body: string, toolbar = false): string {
  const bar = toolbar ? `<div class="toolbar"><b>${esc(title)}</b>` +
    `<button class="p" onclick="window.print()">Drucken / Als PDF speichern</button>` +
    `<button class="c" onclick="window.close()">Schließen</button></div>` : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title>` +
    `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
    `<link href="${FONTS}" rel="stylesheet"><style>${PRINT_CSS}</style></head><body>${bar}<div class="wrap">${body}</div></body></html>`;
}

function openPrint(title: string, body: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Bitte Pop-ups für diese Seite erlauben und erneut auf „Drucken" tippen.'); return; }
  // Vor dem Druck auf die Schriften warten, damit das Old-School-Layout stimmt.
  const s = `<` + `script>window.addEventListener('load',function(){var go=function(){setTimeout(function(){try{window.print()}catch(e){}},250);};if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go);}else{go();}});<` + `/script>`;
  w.document.write(wrapDoc(title, body, true) + s);
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
