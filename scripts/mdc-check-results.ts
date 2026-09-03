// ============================================================
// MDC — Ergebnislisten nachprüfen
// ============================================================
//
//   npx tsx scripts/mdc-check-results.ts
//
// Prüft die abgetippten Ergebnislisten der laufenden Saison gegen sich
// selbst. Bei jeder neuen Liste laufen lassen — die Prüfungen finden genau
// die Fehler, die beim Abtippen von Handschrift passieren.
//
// 1. PUNKTE GEGEN FELDGRÖSSE. Der Punkteschlüssel (`lib/mdc/points.ts`) hängt
//    an Platz und Teilnehmerzahl. Aus den Punkten einer Liste lässt sich
//    deshalb ableiten, wie groß das Feld war — und das muss mit der Zahl der
//    abgetippten Zeilen zusammenpassen. Eine übersehene oder doppelt
//    abgetippte Zeile fällt hier auf, ein verlesener Platz ebenso.
//
// 2. PASSNUMMER GEGEN NAMEN. Steht die Nummer im Spielerstamm, muss der dort
//    gespeicherte Name zum Namen auf dem Zettel passen. Verlesene Ziffern
//    fallen dadurch auf: 427 statt 428 ergibt einen fremden Namen.
//
// 3. SUMMENPROBE. Die Punkte der Rangliste müssen die Summe der Zettelpunkte
//    sein, die Teilnahmen die Zahl der Zeilen — abzüglich der Zeilen, deren
//    Wertungsklasse offen ist.
//
// 4. SCHNITT. Punkte / Teilnahmen, auf zwei Stellen.
//
// Rückgabe: Beendet sich mit Code 1, wenn eine harte Prüfung scheitert.
// Zeilen, die nur zur Bestätigung durch den Betreiber anstehen, sind Hinweise
// und kein Fehler.
// ============================================================

import { RESULT_SHEETS, unsureRows, rowsWithoutPass } from '../data/results-2026-27';
import { runningRankingOf, openSheetRows } from '../data/ranking';
import { PLAYERS, getPlayer, getPlayerByPassNr, playerName } from '../data/players';
import { pointsFor } from '../lib/mdc/points';
import { getVenue } from '../data/venues';

let fehler = 0;
const meldung = (text: string) => { console.log('  FEHLER  ' + text); fehler++; };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, '');

console.log('MDC — Ergebnislisten der Saison 2026/27\n');

for (const sheet of RESULT_SHEETS) {
  const n = sheet.rows.length;
  const venue = getVenue(sheet.venueId);
  // Welche Feldgrößen wären mit allen Punktwerten dieser Liste vereinbar?
  const moeglich: number[] = [];
  for (let k = 2; k <= 64; k++) {
    if (sheet.rows.every(r => pointsFor(r.place, k) === r.points)) moeglich.push(k);
  }
  console.log(`${(venue?.name ?? sheet.venueId).padEnd(18)} ${sheet.date}  ${n} Zeilen`);
  if (!moeglich.length) meldung(`${sheet.id}: kein Feld von 2 bis 64 passt zu diesen Punktwerten`);
  else if (!moeglich.includes(n)) {
    meldung(`${sheet.id}: Punkte passen zu ${moeglich.join('/')} Startern, abgetippt sind ${n} Zeilen`);
  }

  for (const row of sheet.rows) {
    if (row.passNr === null) continue;
    const stamm = getPlayerByPassNr(row.passNr);
    if (!stamm) continue;                       // neue Nummer — Hinweis, kein Fehler
    const teile = [stamm.firstName, stamm.lastName, stamm.nickname ?? '']
      .map(norm).filter(t => t.length >= 3);
    const gesucht = row.writtenName.split(/[\s.()]+/).map(norm).filter(t => t.length >= 3);
    const passt = gesucht.some(g => teile.some(t => t.includes(g) || g.includes(t)));
    if (!passt && !row.unsure) {
      console.log(`  Hinweis  Passnr ${row.passNr}: Zettel „${row.writtenName}", Stamm „${playerName(stamm)}"`);
    }
  }
}

// ── Summenprobe ─────────────────────────────────────────────
const zettelPunkte = RESULT_SHEETS.reduce((a, s) => a + s.rows.reduce((b, r) => b + r.points, 0), 0);
const zettelZeilen = RESULT_SHEETS.reduce((a, s) => a + s.rows.length, 0);
const wertung = [...runningRankingOf('men'), ...runningRankingOf('women')];
const offen = openSheetRows();
const wertungPunkte = wertung.reduce((a, e) => a + e.points, 0);
const wertungStarts = wertung.reduce((a, e) => a + e.tournaments, 0);
const offenePunkte = offen.reduce((a, o) => a + o.row.points, 0);

console.log('\n── Summenprobe ──');
console.log(`Punkte     Zettel ${zettelPunkte} · Wertung ${wertungPunkte} + offen ${offenePunkte}`);
if (zettelPunkte !== wertungPunkte + offenePunkte) meldung('Punktsummen gehen nicht auf');
console.log(`Teilnahmen Zettel ${zettelZeilen} · Wertung ${wertungStarts} + offen ${offen.length}`);
if (zettelZeilen !== wertungStarts + offen.length) meldung('Teilnahmen gehen nicht auf');

for (const e of wertung) {
  if (Math.abs(e.points / e.tournaments - e.average) > 0.005) meldung(`Schnitt falsch bei ${e.playerId}`);
  if (!getPlayer(e.playerId)) meldung(`kein Spieler im Stamm für ${e.playerId}`);
}

// ── Offene Punkte für den Betreiber ─────────────────────────
console.log('\n── Beim Betreiber nachfragen ──');
console.log(`Zeilen ohne Wertungsklasse (${offen.length}):`);
for (const o of offen) {
  console.log(`  · ${o.row.writtenName}, Passnr ${o.row.passNr ?? '—'} (${o.sheetId})`);
}
console.log(`Zuordnung zu bestätigen (${unsureRows().length}):`);
for (const { sheet, row } of unsureRows()) {
  console.log(`  · ${row.writtenName}, Passnr ${row.passNr ?? '—'} (${sheet.id})`);
}
console.log(`Noch ohne Passnummer (${rowsWithoutPass().length}):`);
for (const { sheet, row } of rowsWithoutPass()) {
  console.log(`  · ${row.writtenName} (${sheet.id})`);
}

console.log(`\nSpielerstamm ${PLAYERS.length} · Männerwertung ${runningRankingOf('men').length}` +
            ` · Frauenwertung ${runningRankingOf('women').length}`);
console.log(fehler === 0 ? '\nAlle harten Prüfungen bestanden.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
