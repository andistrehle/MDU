// ============================================================
// Mannschaftsübersicht
// ============================================================

import type { Metadata } from 'next';
import { TeamsListe, type StaffelFilter, type TeamEintrag } from '@/components/bedv/teams/teams-liste';
import { TEAMS } from '@/data/bedv/teams';
import { LIGEN, ligaBySlug } from '@/data/bedv/ligen';
import { SAISONS } from '@/data/bedv/saison';
import { spielstaetteById } from '@/data/bedv/spielstaetten';
import { tabelleDerLiga } from '@/data/bedv/tabelle';
import { kaderVon } from '@/data/bedv/spieler';

export const metadata: Metadata = {
  title: 'Mannschaften',
  description: 'Alle gemeldeten Mannschaften beider Spielzeiten mit Spielstätte, Spieltag und Tabellenplatz.',
};

export default function TeamsSeite() {
  // Die Tabellen werden EINMAL je Staffel gerechnet, nicht je Mannschaft —
  // sonst liefe die Rechnung für jede der 86 Zeilen erneut.
  const platzierung = new Map<string, { platz: number; punkte: number }>();
  for (const liga of LIGEN) {
    for (const z of tabelleDerLiga(liga.slug)) {
      platzierung.set(z.teamId, { platz: z.platz, punkte: z.punkte });
    }
  }

  const teams: TeamEintrag[] = TEAMS.map(t => {
    const ort = spielstaetteById(t.spielstaetteId);
    const p = platzierung.get(t.id);
    return {
      id: t.id,
      name: t.name,
      farben: t.farben,
      ligaSlug: t.ligaSlug,
      ligaName: ligaBySlug(t.ligaSlug)?.name ?? '',
      saisonId: t.saisonId,
      ort: ort?.ort ?? '',
      spielstaette: ort?.name ?? '',
      spieltag: t.spieltag,
      platz: p?.platz ?? null,
      punkte: p?.punkte ?? null,
      spieler: kaderVon(t.id).length,
    };
  });

  const staffeln: StaffelFilter[] = LIGEN.map(l => ({
    slug: l.slug, name: l.name, saisonId: l.saisonId,
  }));

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Spielbetrieb</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Mannschaften</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Jede Mannschaft hat eine eigene Seite mit Kader, Spielstätte, Spielplan und
            Saisonbilanz — statt einer Zeile in einer Tabelle.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <TeamsListe
          teams={teams}
          staffeln={staffeln}
          saisons={SAISONS.map(s => ({ id: s.id, name: s.name, aktuell: s.aktuell }))}
        />
      </div>
    </>
  );
}
