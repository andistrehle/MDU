// ============================================================
// Mein Bereich
// ============================================================
//
// Die Seite selbst ist ein Server-Baustein: Sie stellt die Daten der
// Demo-Mannschaft zusammen. Was davon gezeigt wird, entscheidet die im
// Browser gewählte Rolle (`components/bedv/dashboard/mein-bereich.tsx`).
// ============================================================

import type { Metadata } from 'next';
import { MeinBereich, type DashboardDaten } from '@/components/bedv/dashboard/mein-bereich';
import { DEMO_TEAM_ID, kontoVon } from '@/data/bedv/demo-konten';
import { teamById } from '@/data/bedv/teams';
import { kaderVon, spielerById } from '@/data/bedv/spieler';
import { ligaBySlug } from '@/data/bedv/ligen';
import { saisonById } from '@/data/bedv/saison';
import { adresse, spielstaetteById } from '@/data/bedv/spielstaetten';
import { begegnungenVonTeam } from '@/data/bedv/spiele';
import { tabelleDerLiga } from '@/data/bedv/tabelle';
import { ranglisteDerLiga } from '@/data/bedv/rangliste';
import { highlightsVonSpieler } from '@/data/bedv/highlights';
import { VERWALTUNG_KENNZAHLEN } from '@/data/bedv/verwaltung';
import { datum, heute, relativerTag, wochentag } from '@/lib/bedv/format';

export const metadata: Metadata = {
  title: 'Mein Bereich',
  description: 'Mannschaft, Liga, eigene Statistik und die Aufgaben der gewählten Rolle.',
};

/** Hier stehen Datumsangaben („in 4 Tagen") — die müssen mitlaufen. */
export const revalidate = 3600;

export default function MeinBereichSeite() {
  const team = teamById(DEMO_TEAM_ID)!;
  const liga = ligaBySlug(team.ligaSlug)!;
  const saison = saisonById(team.saisonId)!;
  const ort = spielstaetteById(team.spielstaetteId);
  const kader = kaderVon(team.id);
  const spiele = begegnungenVonTeam(team.id);
  const heuteTag = heute();

  const naechsteBegegnung = spiele.find(b => b.status === 'geplant');
  const letzteBegegnung = spiele.filter(b => b.status === 'gespielt').slice(-1)[0];

  const tabelle = tabelleDerLiga(team.ligaSlug).find(z => z.teamId === team.id) ?? null;
  const rangliste = ranglisteDerLiga(team.ligaSlug);

  // Die Statistik zeigt den Spieler der Rolle „Spieler" — die Rolle wird
  // erst im Browser bekannt, deshalb liefert der Server beide Fälle über
  // denselben Datensatz: Kapitän und Spieler gehören derselben Mannschaft an.
  const konto = kontoVon('spieler');
  const ich = konto.spielerId ? spielerById(konto.spielerId) : null;
  const meineZeile = ich ? rangliste.find(z => z.spielerId === ich.id) : undefined;
  const meineHighlights = ich ? highlightsVonSpieler(ich.id, ich.ligaSlug) : null;

  const daten: DashboardDaten = {
    team: { id: team.id, name: team.name, farben: team.farben, spieltag: team.spieltag, beginn: team.beginn },
    ligaSlug: liga.slug,
    ligaName: liga.name,
    saisonName: saison.name,
    kaderGroesse: kader.length,
    spielstaette: ort ? { name: ort.name, adresse: adresse(ort) } : null,
    tabelle: tabelle
      ? {
        platz: tabelle.platz, punkte: tabelle.punkte, spiele: tabelle.spiele,
        siege: tabelle.siege, unentschieden: tabelle.unentschieden,
        niederlagen: tabelle.niederlagen, differenz: tabelle.differenz,
      }
      : null,
    naechstesSpiel: naechsteBegegnung
      ? {
        datumText: `${wochentag(naechsteBegegnung.datum)}, ${datum(naechsteBegegnung.datum)}`,
        relativ: relativerTag(naechsteBegegnung.datum, heuteTag),
        uhrzeit: naechsteBegegnung.uhrzeit,
        gegner: teamById(
          naechsteBegegnung.heimTeamId === team.id ? naechsteBegegnung.gastTeamId : naechsteBegegnung.heimTeamId,
        )?.name ?? '',
        heim: naechsteBegegnung.heimTeamId === team.id,
        ort: spielstaetteById(naechsteBegegnung.spielstaetteId)?.name ?? '',
      }
      : null,
    letztesSpiel: letzteBegegnung
      ? {
        datumText: datum(letzteBegegnung.datum),
        gegner: teamById(
          letzteBegegnung.heimTeamId === team.id ? letzteBegegnung.gastTeamId : letzteBegegnung.heimTeamId,
        )?.name ?? '',
        eigene: letzteBegegnung.heimTeamId === team.id ? letzteBegegnung.heimPunkte : letzteBegegnung.gastPunkte,
        fremde: letzteBegegnung.heimTeamId === team.id ? letzteBegegnung.gastPunkte : letzteBegegnung.heimPunkte,
        heim: letzteBegegnung.heimTeamId === team.id,
      }
      : null,
    meineStatistik: ich && meineZeile && meineHighlights
      ? {
        id: ich.id,
        name: ich.name,
        initialen: ich.initialen,
        platz: meineZeile.platz,
        vonWievielen: rangliste.length,
        spiele: meineZeile.spiele,
        siege: meineZeile.siege,
        punkte: meineZeile.punkte,
        quote: meineZeile.quote,
        hundertachtziger: meineHighlights.hundertachtziger,
        highFinish: meineHighlights.highFinish,
        shortLeg: meineHighlights.shortLeg,
      }
      : null,
    verwaltung: VERWALTUNG_KENNZAHLEN.map(k => ({ label: k.label, wert: k.wert, ziel: k.ziel })),
  };

  return <MeinBereich daten={daten} />;
}
