// ============================================================
// Papier-Spielbericht hochladen (Zukunftsfeature)
// ============================================================
//
// Die „erkannten" Werte stammen aus derselben Begegnung wie der digitale
// Spielbericht — nur mit zwei absichtlich unsicheren Zeilen. So lässt sich
// im Gespräch beides nebeneinanderlegen: derselbe Bericht, einmal getippt,
// einmal aus dem Foto.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { OcrUpload, type ErkanntesErgebnis, type ErkanntesSpiel } from '@/components/bedv/forms/ocr-upload';
import { LeerZustand } from '@/components/bedv/ui/bausteine';
import { DEMO_TEAM_ID } from '@/data/bedv/demo-konten';
import { teamById } from '@/data/bedv/teams';
import { spielerById } from '@/data/bedv/spieler';
import { ligaBySlug } from '@/data/bedv/ligen';
import { begegnungenVonTeam, einzelspieleVon } from '@/data/bedv/spiele';
import { datum, wochentag } from '@/lib/bedv/format';

export const metadata: Metadata = {
  title: 'Papierbogen hochladen',
  description: 'Spielbericht fotografieren, erkennen lassen und prüfen — als Zukunftsfeature gekennzeichnet.',
};

export const revalidate = 3600;

/**
 * Welche Zeilen kommen „unsicher" zurück?
 *
 * Fest gewählt statt zufällig: Die Demo soll bei jedem Vorführen dieselben
 * zwei Zeilen zur Prüfung stellen. Handschrift ist an zwei Stellen
 * besonders schwer — ein Doppel mit zwei Namen in einem Feld, und eine
 * Zeile, in der eine Ziffer korrigiert wurde.
 */
const UNSICHERE_ZEILEN = new Map<number, string>([
  [5, 'Zwei Namen in einem Feld — die Zuordnung im Doppel ist nicht eindeutig lesbar.'],
  [13, 'Die erste Ziffer wurde überschrieben. Gelesen als 3, möglich wäre auch 2.'],
]);

export default function OcrSeite() {
  const team = teamById(DEMO_TEAM_ID)!;
  // Bevorzugt das letzte HEIMSPIEL: Dann steht die eigene Mannschaft links,
  // so wie sie auch auf dem Papierbogen steht. Bei einem Auswärtsspiel stünde
  // im Kopf des Berichts der Gegner vorn — verwirrend in dem Moment, in dem
  // man sagt „so füllt euer Mannschaftsführer das aus".
  const gespielteSpiele = begegnungenVonTeam(team.id).filter(b => b.status === 'gespielt');
  const begegnung = gespielteSpiele.filter(b => b.heimTeamId === team.id).slice(-1)[0]
    ?? gespielteSpiele.slice(-1)[0];

  if (!begegnung) {
    return (
      <div className="bedv-shell" style={{ paddingBlock: 52 }}>
        <LeerZustand
          titel="Noch keine Begegnung"
          text="Sobald die Mannschaft gespielt hat, lässt sich hier ein Bogen hochladen."
          aktion={{ label: 'Mein Bereich', href: bedvPath('/mein-bereich') }}
        />
      </div>
    );
  }

  const heim = teamById(begegnung.heimTeamId)!;
  const gast = teamById(begegnung.gastTeamId)!;
  const liga = ligaBySlug(begegnung.ligaSlug)!;
  const namen = (ids: string[]) => ids.map(id => spielerById(id)?.name ?? '—').join(' / ');

  const spiele: ErkanntesSpiel[] = einzelspieleVon(begegnung).map(s => ({
    nummer: s.nummer,
    art: s.art,
    heim: namen(s.heimSpielerIds),
    gast: namen(s.gastSpielerIds),
    heimLegs: s.heimLegs,
    gastLegs: s.gastLegs,
    sicher: !UNSICHERE_ZEILEN.has(s.nummer),
    hinweis: UNSICHERE_ZEILEN.get(s.nummer),
  }));

  const ergebnis: ErkanntesErgebnis = {
    liga: liga.name,
    begegnung: `${heim.name} – ${gast.name}`,
    datumText: `${wochentag(begegnung.datum)}, ${datum(begegnung.datum)}`,
    heimName: heim.name,
    gastName: gast.name,
    stand: [begegnung.heimPunkte, begegnung.gastPunkte],
    spiele,
    highlights: [
      { label: '180er', wert: '2', sicher: true },
      { label: '171er', wert: '0', sicher: true },
      { label: 'Höchstes Finish', wert: '121', sicher: true },
      { label: 'Kürzestes Leg', wert: '15 Darts', sicher: false },
    ],
  };

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '30px 28px' }}>
          <Link href={bedvPath('/mein-bereich/spielbericht')} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem' }}>
            ← Digitaler Spielbericht
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Ausblick</div>
            <span className="bedv-badge bedv-badge--dark">Zukunftsfeature — nicht implementiert</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 4.6vw, 2.4rem)', marginTop: 7 }}>Papierbogen hochladen</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 9, maxWidth: '62ch', lineHeight: 1.6 }}>
            Der Papierweg muss nicht abgeschafft werden. Bogen abfotografieren, erkennen
            lassen, prüfen, freigeben — die Abtipparbeit fällt weg, die Entscheidung bleibt
            beim Menschen.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px', maxWidth: 940 }}>
        <OcrUpload ergebnis={ergebnis} />
      </div>
    </>
  );
}
