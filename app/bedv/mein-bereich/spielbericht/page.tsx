// ============================================================
// Digitaler Spielbericht
// ============================================================
//
// Gezeigt wird die zuletzt gespielte Begegnung der Demo-Mannschaft — mit
// den echten Einzelspielen aus der Datenschicht. Wer den Bericht mit dem
// Ergebnis in der Tabelle vergleicht, findet dieselbe Zahl; das ist in
// einer Vorführung mehr wert als jede Erklärung.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { Spielbericht, type BerichtKopf, type BerichtSpiel } from '@/components/bedv/forms/spielbericht';
import { LeerZustand } from '@/components/bedv/ui/bausteine';
import { DEMO_TEAM_ID } from '@/data/bedv/demo-konten';
import { teamById } from '@/data/bedv/teams';
import { spielerById } from '@/data/bedv/spieler';
import { ligaBySlug } from '@/data/bedv/ligen';
import { spielstaetteById } from '@/data/bedv/spielstaetten';
import { begegnungenVonTeam, einzelspieleVon } from '@/data/bedv/spiele';
import { datum, wochentag } from '@/lib/bedv/format';

export const metadata: Metadata = {
  title: 'Spielbericht',
  description: 'Digitaler Spielbericht: Paarungen und Legs erfassen, Gesamtstand rechnet mit (Demo).',
};

export const revalidate = 3600;

export default function SpielberichtSeite() {
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
          text="Sobald die Mannschaft gespielt hat, lässt sich hier der Bericht erfassen."
          aktion={{ label: 'Zum Spielplan', href: bedvPath(`/teams/${team.id}`) }}
        />
      </div>
    );
  }

  const heim = teamById(begegnung.heimTeamId)!;
  const gast = teamById(begegnung.gastTeamId)!;
  const liga = ligaBySlug(begegnung.ligaSlug)!;
  const ort = spielstaetteById(begegnung.spielstaetteId);

  const kopf: BerichtKopf = {
    ligaName: liga.name,
    spieltag: begegnung.spieltag,
    datumText: `${wochentag(begegnung.datum)}, ${datum(begegnung.datum)}`,
    uhrzeit: begegnung.uhrzeit,
    spielstaette: ort ? `${ort.name}, ${ort.ort}` : '—',
    heim: { id: heim.id, name: heim.name, farben: heim.farben },
    gast: { id: gast.id, name: gast.name, farben: gast.farben },
  };

  const namen = (ids: string[]) => ids.map(id => spielerById(id)?.name ?? '—');

  const spiele: BerichtSpiel[] = einzelspieleVon(begegnung).map(s => ({
    nummer: s.nummer,
    art: s.art,
    heim: namen(s.heimSpielerIds),
    gast: namen(s.gastSpielerIds),
    heimLegs: s.heimLegs,
    gastLegs: s.gastLegs,
  }));

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '30px 28px' }}>
          <Link href={bedvPath('/mein-bereich')} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem' }}>
            ← Mein Bereich
          </Link>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)', marginTop: 12 }}>Mannschaftsführung</div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 4.6vw, 2.4rem)', marginTop: 7 }}>Digitaler Spielbericht</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 9, maxWidth: '62ch', lineHeight: 1.6 }}>
            18 Paarungen, Legs antippen — der Gesamtstand rechnet oben mit und kann gar nicht
            falsch sein, weil ihn niemand tippt. Beide Mannschaften bestätigen am Ende.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '22px 52px', maxWidth: 940 }}>
        <Spielbericht kopf={kopf} spiele={spiele} />
      </div>
    </>
  );
}
