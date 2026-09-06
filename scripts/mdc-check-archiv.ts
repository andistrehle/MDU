// ============================================================
// MDC — Einzelergebnisse der Saison 2025/26 nachprüfen
// ============================================================
//
//   npx tsx scripts/mdc-check-archiv.ts
//
// Der Import aus der Arbeitsmappe (`scripts/mdc-import-saison-2025-26.py`)
// prüft die Daten schon beim Einlesen. Dieses Skript prüft, was danach in der
// Webseite daraus wird — also die TypeScript-Seite:
//
// 1. PUNKTE GEGEN SCHLÜSSEL. Jede der 9411 Zeilen: Ergibt `pointsFor(Platz,
//    Feldgröße)` genau die Punktzahl, die der Betreiber verbucht hat?
//    Das prüft in beide Richtungen — die Daten gegen den Schlüssel und den
//    Schlüssel (`lib/mdc/points.ts`) gegen eine ganze Saison.
//
// 2. TURNIERE IN SICH. Feldgröße 4–32, Plätze lückenlos, Datum in der Saison,
//    Spielort bekannt, ID eindeutig.
//
// 3. SPIELERZUORDNUNG. Jede Passnummer muss auf einen Spieler im Stamm
//    zeigen — sonst stünde in der Ergebnisliste eine Zeile ohne Namen.
//
// 4. SUMMENPROBE GEGEN DIE ENDRANGLISTE. Punkte und Starts je Spieler müssen
//    die Endrangliste derselben Saison ergeben.
//
// Rückgabe: Code 1, sobald eine Prüfung scheitert.
// ============================================================

import {
  ARCHIVE_TOURNAMENTS, ARCHIVE_STATS, archivePlayerStats,
} from '../data/archive-2025-26';
import { FINAL_RANKING_2025_26 } from '../data/ranking-final';
import { getPlayer, playerName } from '../data/players';
import { pointsFor, TABLE_RANGE } from '../lib/mdc/points';
import { FINAL_SEASON } from '../data/season';
import { getVenue, isFormerVenue } from '../data/venues';

let fehler = 0;
const meldung = (text: string) => { console.log('  FEHLER  ' + text); fehler++; };

console.log(`\nMDC — Einzelergebnisse ${FINAL_SEASON.label}\n`);
console.log(`  ${ARCHIVE_STATS.tournaments} Turniere, ${ARCHIVE_STATS.entries} Ergebniszeilen, ` +
  `${ARCHIVE_STATS.players} Spieler, ${ARCHIVE_STATS.venues} Spielorte`);
console.log(`  ${ARCHIVE_STATS.firstDate} bis ${ARCHIVE_STATS.lastDate}, ` +
  `${ARCHIVE_STATS.points.toLocaleString('de-DE')} Punkte vergeben\n`);

// ── 1 + 2: Turniere und Punkte ──────────────────────────────
const ids = new Set<string>();
let geprüfteZeilen = 0;

for (const t of ARCHIVE_TOURNAMENTS) {
  if (ids.has(t.id)) meldung(`Turnier-ID doppelt: ${t.id}`);
  ids.add(t.id);

  if (t.participants < TABLE_RANGE.from || t.participants > TABLE_RANGE.to) {
    meldung(`${t.id}: Feldgröße ${t.participants} außerhalb ${TABLE_RANGE.from}–${TABLE_RANGE.to}`);
  }
  if (t.date < FINAL_SEASON.startDate || t.date > FINAL_SEASON.endDate) {
    meldung(`${t.id}: Datum liegt außerhalb der Saison ${FINAL_SEASON.label}`);
  }
  if (!getVenue(t.venueId) && !isFormerVenue(t.venueId)) {
    meldung(`${t.id}: Spielort „${t.venueId}" ist weder aktuell noch als ehemaliges Lokal bekannt`);
  }

  t.results.forEach((r, i) => {
    if (r.rank !== i + 1) meldung(`${t.id}: Platz ${r.rank} an Position ${i + 1}`);
    const soll = pointsFor(r.rank, t.participants);
    if (soll !== r.points) {
      meldung(`${t.id}: Platz ${r.rank} von ${t.participants} → ` +
        `verbucht ${r.points}, Schlüssel sagt ${soll}`);
    }
    if (!r.playerId) meldung(`${t.id}: Passnr. ${r.passNr} steht in keiner Wertung`);
    else if (!getPlayer(r.playerId)) meldung(`${t.id}: Spieler „${r.playerId}" fehlt im Stamm`);
    geprüfteZeilen++;
  });
}
console.log(`  ${geprüfteZeilen} Zeilen gegen den Punkteschlüssel gerechnet`);

// ── 4: Summenprobe gegen die Endrangliste ───────────────────
let abgeglichen = 0;
for (const division of ['men', 'women'] as const) {
  for (const eintrag of FINAL_RANKING_2025_26[division]) {
    const stats = archivePlayerStats(eintrag.playerId);
    const spieler = getPlayer(eintrag.playerId);
    const name = spieler ? playerName(spieler) : eintrag.playerId;
    if (!stats) { meldung(`${name}: steht in der Endrangliste, aber in keinem Turnier`); continue; }
    if (stats.points !== eintrag.points) {
      meldung(`${name}: Einzelergebnisse ${stats.points} Punkte, Rangliste ${eintrag.points}`);
    }
    if (stats.starts !== eintrag.tournaments) {
      meldung(`${name}: ${stats.starts} Starts in den Ergebnissen, ${eintrag.tournaments} in der Rangliste`);
    }
    abgeglichen++;
  }
}
console.log(`  ${abgeglichen} Ranglistenzeilen gegen die Einzelergebnisse abgeglichen\n`);

if (fehler === 0) console.log('  Alles stimmig.\n');
else console.log(`  ${fehler} Fehler.\n`);
process.exit(fehler === 0 ? 0 : 1);
