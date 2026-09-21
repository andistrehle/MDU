// ============================================================
// Spielerübersicht
// ============================================================

import type { Metadata } from 'next';
import { DemoHinweis } from '@/components/bedv/ui/bausteine';
import { SpielerListe, type SpielerEintrag } from '@/components/bedv/players/spieler-liste';
import { SPIELER } from '@/data/bedv/spieler';
import { teamById } from '@/data/bedv/teams';
import { LIGEN, ligaBySlug } from '@/data/bedv/ligen';
import { SAISONS } from '@/data/bedv/saison';
import { ranglisteDerLiga } from '@/data/bedv/rangliste';
import { highlightsDerLiga } from '@/data/bedv/highlights';

export const metadata: Metadata = {
  title: 'Spieler',
  description: 'Alle spielberechtigten Personen der Demo mit Bilanz, Ranglistenplatz und Highlights.',
};

export default function SpielerUebersicht() {
  // Rangliste und Highlights je Staffel EINMAL rechnen und in Karten legen —
  // sonst liefen beide Auswertungen für jeden der über 500 Einträge erneut.
  const rang = new Map<string, { platz: number; punkte: number; spiele: number; siege: number }>();
  const maxima = new Map<string, number>();
  for (const liga of LIGEN) {
    for (const z of ranglisteDerLiga(liga.slug)) {
      rang.set(z.spielerId, { platz: z.platz, punkte: z.punkte, spiele: z.spiele, siege: z.siege });
    }
    for (const z of highlightsDerLiga(liga.slug).hundertachtziger) {
      maxima.set(z.spielerId, z.wert);
    }
  }

  const spieler: SpielerEintrag[] = SPIELER
    .map(s => {
      const r = rang.get(s.id);
      return {
        id: s.id,
        name: s.name,
        spitzname: s.spitzname,
        initialen: s.initialen,
        passnummer: s.passnummer,
        wertung: s.wertung,
        teamId: s.teamId,
        teamName: teamById(s.teamId)?.name ?? '',
        ligaSlug: s.ligaSlug,
        ligaName: ligaBySlug(s.ligaSlug)?.name ?? '',
        saisonId: s.saisonId,
        platz: r?.platz ?? null,
        punkte: r?.punkte ?? 0,
        spiele: r?.spiele ?? 0,
        siege: r?.siege ?? 0,
        hundertachtziger: maxima.get(s.id) ?? 0,
      };
    })
    .sort((a, b) => b.punkte - a.punkte || a.name.localeCompare(b.name, 'de'));

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Spielbetrieb</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Spieler</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Suchbar nach Name, Spitzname oder Passnummer — quer über alle Staffeln.
            Jeder Eintrag führt auf ein Profil mit Bilanz und Bestwerten.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '22px 52px' }}>
        <div style={{ marginBottom: 20 }}>
          <DemoHinweis>
            Alle Personen dieser Demo sind erfunden. Von der bestehenden BeDV-Seite wurden
            weder Namen noch Sportdaten übernommen.
          </DemoHinweis>
        </div>
        <SpielerListe
          spieler={spieler}
          staffeln={LIGEN.map(l => ({ slug: l.slug, name: l.name, saisonId: l.saisonId }))}
          saisons={SAISONS.map(s => ({ id: s.id, name: s.name, aktuell: s.aktuell }))}
        />
      </div>
    </>
  );
}
