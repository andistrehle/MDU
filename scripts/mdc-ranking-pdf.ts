// ============================================================
// MDC — Einzelrangliste als PDF
// ============================================================
//
//   npx tsx scripts/mdc-ranking-pdf.ts
//
// Erzeugt aus der laufenden Wertung ein druckfertiges A4-Dokument mit beiden
// Wertungsklassen. Die Zahlen kommen aus derselben Quelle wie die Webseite
// (`data/ranking.ts`) — es gibt also keine zweite Wahrheit, die auseinander-
// laufen könnte. Nach jeder neuen Ergebnisliste einmal laufen lassen.
//
// Das Skript schreibt immer eine HTML-Datei. Eine PDF macht es nur daraus,
// wenn `playwright` verfügbar ist; das Paket gehört NICHT zu den Abhängig-
// keiten dieses Projekts, nur um einen Ausdruck zu erzeugen. Ohne Playwright
// öffnet man die HTML im Browser und druckt sie mit Strg+P als PDF — das
// Seitenlayout (A4, Kopfzeilen-Wiederholung, Seitenzahlen) steckt im CSS und
// kommt dabei genauso heraus.
//
// Beides landet unter `out/` und ist bewusst nicht im Repo (siehe
// .gitignore): Es ist ein Ausdruck des Datenstands, kein Quelltext.
// ============================================================

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { runningRankingOf } from '../data/ranking';
import { getPlayer, playerName } from '../data/players';
import { RESULT_SHEETS } from '../data/results-2026-27';
import { getVenue } from '../data/venues';
import { RUNNING_SEASON } from '../data/season';
import { unsureRows, rowsWithoutPass } from '../data/results-2026-27';

const de = (n: number) => n.toLocaleString('de-DE');
const zwei = (n: number) => n.toFixed(2).replace('.', ',');
const datum = (iso: string) => { const [j, m, t] = iso.split('-'); return `${t}.${m}.${j}`; };

const logo = existsSync('public/mdc/logo.png')
  ? `data:image/png;base64,${readFileSync('public/mdc/logo.png').toString('base64')}`
  : null;

function tabelle(division: 'men' | 'women'): string {
  const rows = runningRankingOf(division);
  return `
  <h2>${division === 'men' ? 'Männer' : 'Frauen'} <span class="anzahl">${rows.length} in der Wertung</span></h2>
  <table>
    <thead><tr>
      <th class="r">Platz</th><th class="r">Passnr.</th><th>Name</th><th>Vorname</th>
      <th class="r">Anzahl TN</th><th class="r">Punkte</th><th class="r">Schnitt</th>
    </tr></thead>
    <tbody>
    ${rows.map(e => {
      const p = getPlayer(e.playerId);
      const podium = !e.sharedRank && e.rank <= 3 ? ` class="p${e.rank}"` : '';
      return `<tr${podium}>
        <td class="r stark">${e.sharedRank ? '' : e.rank}</td>
        <td class="r nr">${p?.passNr ?? '—'}</td>
        <td>${p?.lastName || playerName(p!)}</td>
        <td class="leise">${p?.lastName ? p.firstName : ''}${p?.nickname ? ` „${p.nickname}“` : ''}</td>
        <td class="r nr">${e.tournaments}</td>
        <td class="r nr stark">${de(e.points)}</td>
        <td class="r nr leise">${zwei(e.average)}</td>
      </tr>`;
    }).join('\n')}
    </tbody>
  </table>`;
}

const turniere = [...RESULT_SHEETS]
  .sort((a, b) => a.date.localeCompare(b.date) || a.venueId.localeCompare(b.venueId))
  .map(s => `<li><span class="nr">${datum(s.date)}</span> ${getVenue(s.venueId)?.name ?? s.venueId}
     <span class="leise">· ${s.rows.length} Starter</span></li>`).join('');

// Offene Punkte nicht von Hand pflegen — sie stehen in den Daten.
const offen = [
  ...unsureRows().map(({ row }) =>
    `Passnr. ${row.passNr} „${row.writtenName}" ist noch nicht bestätigt`),
  rowsWithoutPass().length
    ? `${rowsWithoutPass().length} Spieler haben noch keine Passnummer: ` +
      rowsWithoutPass().map(({ row }) => row.writtenName).join(', ')
    : '',
].filter(Boolean);

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>MDC Ranking ${RUNNING_SEASON.label}</title>
<style>
  @page { size: A4; margin: 14mm 12mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #141A24; font-size: 8.6pt; margin: 0; }
  header { display: flex; align-items: center; gap: 14px; border-bottom: 2.5px solid #D61A1A;
           padding-bottom: 9px; margin-bottom: 14px; }
  header img { height: 34px; }
  h1 { font-size: 15pt; margin: 0; color: #142748; letter-spacing: -.2px; }
  .stand { margin-top: 2px; color: #5A6880; font-size: 8pt; }
  h2 { font-size: 11pt; color: #142748; margin: 16px 0 6px; border-bottom: 1px solid #C3D2E6; padding-bottom: 3px; }
  h2 .anzahl { float: right; font-weight: 400; font-size: 8pt; color: #5A6880; padding-top: 3px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1F3B73; color: #fff; font-size: 7pt; text-transform: uppercase; letter-spacing: .5px;
       padding: 4px 6px; text-align: left; }
  td { padding: 2.6px 6px; border-bottom: .5px solid #EBF0F7; }
  tr:nth-child(even) td { background: #FAFCFE; }
  .r { text-align: right; }
  .nr { font-variant-numeric: tabular-nums; }
  .stark { font-weight: 700; }
  .leise { color: #46536A; }
  tr.p1 td { background: #FBF3DE !important; }
  tr.p2 td { background: #F1F3F6 !important; }
  tr.p3 td { background: #F8EFE8 !important; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  .fuss { margin-top: 14px; padding-top: 8px; border-top: 1px solid #C3D2E6;
          color: #5A6880; font-size: 7.4pt; line-height: 1.5; }
  .fuss ul { margin: 4px 0 0; padding-left: 14px; columns: 2; }
  .fuss li { margin-bottom: 1px; }
  .hinweis { margin-top: 8px; }
</style></head><body>
<header>
  ${logo ? `<img src="${logo}" alt="">` : ''}
  <div>
    <h1>MDC Ranking — Saison ${RUNNING_SEASON.label}</h1>
    <div class="stand">Einzelrangliste, Zwischenstand vom ${datum(RUNNING_SEASON.asOf)}
      · Männer und Frauen spielen dieselben Turniere und werden getrennt gewertet</div>
  </div>
</header>
${tabelle('men')}
${tabelle('women')}
<div class="fuss">
  <strong>Grundlage:</strong> ${RESULT_SHEETS.length} Ergebnislisten,
  ${RESULT_SHEETS.reduce((a, s) => a + s.rows.length, 0)} Teilnahmen. Schnitt = Punkte / Anzahl TN.
  <ul>${turniere}</ul>
  ${offen.length ? `<div class="hinweis"><strong>Noch zu klären:</strong> ${offen.join('. ')}.</div>` : ''}
</div>
</body></html>`;

mkdirSync('out', { recursive: true });
const htmlPfad = 'out/mdc-ranking.html';
const pdfPfad = `out/MDC-Ranking-${RUNNING_SEASON.id}_Stand-${RUNNING_SEASON.asOf}.pdf`;
writeFileSync(htmlPfad, html);

// PDF nur, wenn Playwright zur Hand ist.
let playwrightDa = true;
try { require.resolve('playwright'); } catch { playwrightDa = false; }

if (!playwrightDa) {
  console.log(`${htmlPfad} geschrieben.`);
  console.log('Playwright ist nicht installiert — für die PDF die Datei im Browser öffnen');
  console.log('und mit Strg+P als PDF speichern (A4, Hintergrundgrafiken an).');
  console.log(`Alternativ: npm i -D playwright && npx playwright install chromium`);
  process.exit(0);
}

const skript = `
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(${process.env.PW_EXEC ? `{ executablePath: '${process.env.PW_EXEC}' }` : '{}'});
  const p = await (await b.newContext()).newPage();
  await p.goto('file://' + process.cwd() + '/${htmlPfad}', { waitUntil: 'networkidle' });
  await p.pdf({
    path: '${pdfPfad}', format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:7pt;color:#5A6880;padding:0 12mm;font-family:Arial;display:flex;justify-content:space-between;"><span>Munich Darts Challenge · Einzelrangliste Saison ${RUNNING_SEASON.label}</span><span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span></div>',
    margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
  });
  await b.close();
})();
`;
writeFileSync('out/.pdf-runner.cjs', skript);
execFileSync('node', ['out/.pdf-runner.cjs'], { stdio: 'inherit' });

console.log(`${pdfPfad} · ${runningRankingOf('men').length} Männer, ${runningRankingOf('women').length} Frauen`);
