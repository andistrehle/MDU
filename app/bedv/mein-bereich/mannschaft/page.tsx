// ============================================================
// Kader verwalten
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { KaderVerwaltung, type KaderSpieler } from '@/components/bedv/forms/kader-verwaltung';
import { DEMO_TEAM_ID } from '@/data/bedv/demo-konten';
import { teamById } from '@/data/bedv/teams';
import { kaderVon } from '@/data/bedv/spieler';
import { ligaBySlug } from '@/data/bedv/ligen';
import { ranglisteDerLiga } from '@/data/bedv/rangliste';

export const metadata: Metadata = {
  title: 'Meine Mannschaft',
  description: 'Kader pflegen, Spieler nachmelden und die Mannschaftsführung festlegen (Demo).',
};

export default function MannschaftSeite() {
  const team = teamById(DEMO_TEAM_ID)!;
  const liga = ligaBySlug(team.ligaSlug)!;
  const rangliste = ranglisteDerLiga(team.ligaSlug);

  const kader: KaderSpieler[] = kaderVon(team.id).map(s => {
    const z = rangliste.find(r => r.spielerId === s.id);
    return {
      id: s.id,
      name: s.name,
      initialen: s.initialen,
      passnummer: s.passnummer,
      wertung: s.wertung,
      kapitaen: s.kapitaen,
      spiele: z?.spiele ?? 0,
      siege: z?.siege ?? 0,
    };
  });

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '30px 28px' }}>
          <Link href={bedvPath('/mein-bereich')} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem' }}>
            ← Mein Bereich
          </Link>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)', marginTop: 12 }}>Mannschaftsführung</div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 4.6vw, 2.4rem)', marginTop: 7 }}>Kader verwalten</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 9, maxWidth: '58ch', lineHeight: 1.6 }}>
            Heute ist eine Nachmeldung ein Formular per Mail und ein Anruf. Hier ist sie ein
            Vorgang, der einen Stand hat.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <KaderVerwaltung
          ausgangslage={kader}
          teamId={team.id}
          teamName={team.name}
          ligaName={liga.name}
        />
      </div>
    </>
  );
}
