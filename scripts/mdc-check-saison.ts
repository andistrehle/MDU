// ============================================================
// MDC — Einzelergebnisse und Wertungen nachprüfen
// ============================================================
//
//   npx tsx scripts/mdc-check-saison.ts
//
// Der Import aus den Arbeitsmappen (`scripts/mdc-import-saison.py`) prüft die
// Daten schon beim Einlesen. Dieses Skript prüft, was danach in der Webseite
// daraus wird — also die TypeScript-Seite, für BEIDE Saisons:
//
// 1. PUNKTE GEGEN SCHLÜSSEL. Jede Ergebniszeile: Ergibt `pointsFor(Platz,
//    Feldgröße)` genau die Punktzahl, die der Betreiber verbucht hat?
//    Das prüft in beide Richtungen — die Daten gegen den Schlüssel und den
//    Schlüssel (`lib/mdc/points.ts`) gegen den echten Spielbetrieb.
//
// 2. TURNIERE IN SICH. Feldgröße 4–32, Plätze lückenlos, Datum in der Saison,
//    Spielort bekannt, ID eindeutig.
//
// 3. SPIELERZUORDNUNG. Jede Passnummer muss auf einen Spieler im Stamm
//    zeigen — sonst stünde in der Ergebnisliste eine Zeile ohne Namen.
//
// 4. SUMMENPROBE GEGEN DIE WERTUNG. Punkte und Starts je Spieler müssen die
//    Rangliste derselben Saison ergeben.
//
// Rückgabe: Code 1, sobald eine Prüfung scheitert.
// ============================================================

import { tournamentsOfSeason, seasonStats, getTournamentRecord } from '../data/tournament-results';
import { CORRECTIONS } from '../data/corrections';
import { FINAL_RANKING_2025_26 } from '../data/ranking-final';
import {
  getPlayer, playerName, PARSED_RUNNING_MEN, PARSED_RUNNING_WOMEN,
} from '../data/players';
import { pointsFor, TABLE_RANGE } from '../lib/mdc/points';
import { FINAL_SEASON, RUNNING_SEASON } from '../data/season';
import { getVenue, isFormerVenue } from '../data/venues';
import type { Division, Season } from '../data/types';

/** Was die Summenprobe von einer Ranglistenzeile braucht. */
interface WertungsZeile {
  playerId: string;
  points: number;
  tournaments: number;
}

let fehler = 0;
const meldung = (text: string) => { console.log('  FEHLER  ' + text); fehler++; };

function pruefe(saison: Season, wertung: Record<Division, WertungsZeile[]>) {
  const stats = seasonStats(saison.id);
  console.log(`\nSaison ${saison.label}`);
  console.log(`  ${stats.tournaments} Turniere, ${stats.entries} Ergebniszeilen, ` +
    `${stats.players} Spieler, ${stats.venues} Spielorte`);
  console.log(`  ${stats.firstDate} bis ${stats.lastDate}, ` +
    `${stats.points.toLocaleString('de-DE')} Punkte vergeben`);

  const ids = new Set<string>();
  let zeilen = 0;

  for (const t of tournamentsOfSeason(saison.id)) {
    if (ids.has(t.id)) meldung(`Turnier-ID doppelt: ${t.id}`);
    ids.add(t.id);

    if (t.participants < TABLE_RANGE.from || t.participants > TABLE_RANGE.to) {
      meldung(`${t.id}: Feldgröße ${t.participants} außerhalb ${TABLE_RANGE.from}–${TABLE_RANGE.to}`);
    }
    if (t.date < saison.startDate || t.date > saison.endDate) {
      meldung(`${t.id}: Datum liegt außerhalb der Saison ${saison.label}`);
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
      zeilen++;
    });
  }
  console.log(`  ${zeilen} Zeilen gegen den Punkteschlüssel gerechnet`);

  // ── Summenprobe gegen die Wertung der Arbeitsmappe ──
  //
  // Verglichen werden die Turniere AUS DER MAPPE gegen die Wertung AUS DER
  // MAPPE — beides derselbe Stand, beides muss aufgehen. Hochgeladene Turniere
  // bleiben außen vor: Die Mappe kennt sie noch nicht, ihre Punkte dürfen die
  // dortige Wertung also übersteigen. Würde man sie mitzählen, meldete diese
  // Probe jeden hochgeladenen Abend als Abweichung und wäre wertlos.
  const konten = new Map<string, { points: number; starts: number }>();
  for (const t of tournamentsOfSeason(saison.id)) {
    if (t.source !== 'workbook') continue;
    for (const r of t.results) {
      if (!r.playerId) continue;
      const konto = konten.get(r.playerId) ?? { points: 0, starts: 0 };
      konto.points += r.points;
      konto.starts += 1;
      konten.set(r.playerId, konto);
    }
  }

  // Berichtigte Turniere weichen absichtlich von der Mappe ab (siehe
  // `data/corrections.ts`). Wer in einem steckt, wird übergangen statt falsch
  // gemeldet — die Berichtigung selbst wird weiter unten eigens geprüft.
  const berichtigt = new Set<string>();
  for (const t of tournamentsOfSeason(saison.id)) {
    if (!t.corrected) continue;
    for (const r of t.results) if (r.playerId) berichtigt.add(r.playerId);
  }

  let abgeglichen = 0;
  let uebergangen = 0;
  for (const division of ['men', 'women'] as const) {
    for (const eintrag of wertung[division]) {
      const spieler = getPlayer(eintrag.playerId);
      const name = spieler ? playerName(spieler) : eintrag.playerId;
      if (berichtigt.has(eintrag.playerId)) { uebergangen++; continue; }
      const konto = konten.get(eintrag.playerId);
      if (!konto) { meldung(`${name}: steht in der Wertung, aber in keinem Turnier`); continue; }
      if (konto.points !== eintrag.points) {
        meldung(`${name}: Einzelergebnisse ${konto.points} Punkte, Wertung ${eintrag.points}`);
      }
      if (konto.starts !== eintrag.tournaments) {
        meldung(`${name}: ${konto.starts} Starts in den Ergebnissen, ${eintrag.tournaments} in der Wertung`);
      }
      abgeglichen++;
    }
  }
  console.log(`  ${abgeglichen} Ranglistenzeilen gegen die Einzelergebnisse abgeglichen`
    + (uebergangen ? `, ${uebergangen} wegen einer Berichtigung übergangen` : ''));

  const hochgeladen = tournamentsOfSeason(saison.id).filter(t => t.source === 'upload');
  if (hochgeladen.length) {
    console.log(`  davon ${hochgeladen.length} vom Ergebniszettel hochgeladen ` +
      '(noch nicht in der Arbeitsmappe):');
    for (const t of hochgeladen) {
      console.log(`    ${t.date}  ${t.venueName} — ${t.participants} Starter`);
    }
  }
}

console.log('\nMDC — Einzelergebnisse und Wertungen');
pruefe(FINAL_SEASON, FINAL_RANKING_2025_26);
// Für die laufende Saison wird gegen die Wertung DER MAPPE geprüft, nicht
// gegen die gerechnete: Die entsteht selbst aus den Einzelergebnissen, ein
// Vergleich damit wäre eine Probe gegen sich selbst.
pruefe(RUNNING_SEASON, { men: PARSED_RUNNING_MEN, women: PARSED_RUNNING_WOMEN });

// ── Berichtigungen: noch nötig oder erledigt? ───────────────
if (CORRECTIONS.length > 0) {
  console.log('\nBerichtigungen (data/corrections.ts)');
  for (const eintrag of CORRECTIONS) {
    const turnier = getTournamentRecord(eintrag.tournamentId);
    if (!turnier) {
      meldung(`Berichtigung verweist auf ein Turnier, das es nicht gibt: ${eintrag.tournamentId}`);
      continue;
    }
    if (turnier.participantsInWorkbook !== eintrag.workbookParticipants) {
      // Als Fehler und nicht als Hinweis: Eine überholte Berichtigung würde
      // sonst still weiterlaufen und die Zahlen verfälschen.
      meldung(`ERLEDIGT: ${eintrag.tournamentId} — die Mappe führt jetzt ` +
        `${turnier.participantsInWorkbook} statt ${eintrag.workbookParticipants} Starter. ` +
        'Eintrag aus data/corrections.ts entfernen.');
      continue;
    }
    const zeile = turnier.results.find(r => r.passNr === eintrag.passNr);
    if (!zeile) {
      meldung(`${eintrag.tournamentId}: Passnr. ${eintrag.passNr} fehlt trotz Berichtigung`);
    } else if (!zeile.playerId) {
      meldung(`${eintrag.tournamentId}: Passnr. ${eintrag.passNr} gehört zu keinem Spieler im Stamm`);
    } else {
      console.log(`  aktiv     ${eintrag.tournamentId}: Passnr. ${eintrag.passNr} auf Platz ` +
        `${zeile.rank} ergänzt, ${turnier.participants} statt ${turnier.participantsInWorkbook} Starter`);
    }
  }
}

if (fehler === 0) console.log('\n  Alles stimmig.\n');
else console.log(`\n  ${fehler} Fehler.\n`);
process.exit(fehler === 0 ? 0 : 1);
