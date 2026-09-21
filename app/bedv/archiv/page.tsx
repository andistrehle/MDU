// ============================================================
// Archiv — abgeschlossene Spielzeiten
// ============================================================
//
// Ein Verband lebt von seiner Geschichte. Auf einer klassischen Seite
// verschwindet die vergangene Saison beim nächsten Update; hier bleibt sie
// vollständig erreichbar — mit denselben Seiten, demselben Aufbau.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, SectionHead, Stat } from '@/components/bedv/ui/bausteine';
import { TeamWappen } from '@/components/bedv/teams/team-wappen';
import { SAISON_ARCHIV } from '@/data/bedv/saison';
import { ligenDerSaison } from '@/data/bedv/ligen';
import { tabelleDerLiga } from '@/data/bedv/tabelle';
import { ranglisteDerLiga } from '@/data/bedv/rangliste';
import { teamById, teamsDerSaison } from '@/data/bedv/teams';
import { spielerById } from '@/data/bedv/spieler';
import { BEGEGNUNGEN } from '@/data/bedv/spiele';

export const metadata: Metadata = {
  title: 'Archiv',
  description: 'Abgeschlossene Spielzeiten mit Endtabellen, Meistern und Ranglisten.',
};

export default function ArchivSeite() {
  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Vergangene Spielzeiten</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Archiv</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '60ch', lineHeight: 1.6 }}>
            Abgeschlossene Spielzeiten bleiben vollständig erreichbar — mit Endtabellen,
            Spielplänen, Ergebnissen und Einzelranglisten. Auch die Spielerprofile behalten
            ihre Ergebnisse.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        {SAISON_ARCHIV.map(saison => {
          const ligen = ligenDerSaison(saison.id);
          const teams = teamsDerSaison(saison.id);
          const begegnungen = BEGEGNUNGEN.filter(b => b.saisonId === saison.id);

          return (
            <section key={saison.id} style={{ marginBottom: 40 }}>
              <SectionHead
                eyebrow="Abgeschlossen"
                titel={saison.name}
                text={`${ligen.length} Staffeln · ${teams.length} Mannschaften · ${begegnungen.length} Begegnungen`}
              />

              <div className="bedv-grid bedv-grid--4" style={{ marginBottom: 20 }}>
                <Card padding="15px 16px"><Stat wert={ligen.length} label="Staffeln" /></Card>
                <Card padding="15px 16px"><Stat wert={teams.length} label="Mannschaften" /></Card>
                <Card padding="15px 16px"><Stat wert={begegnungen.length} label="Begegnungen" /></Card>
                <Card padding="15px 16px"><Stat wert={begegnungen.length * 18} label="Einzelspiele" /></Card>
              </div>

              <div className="bedv-grid bedv-grid--3">
                {ligen.map(liga => {
                  const tabelle = tabelleDerLiga(liga.slug);
                  const meister = teamById(tabelle[0]?.teamId ?? '');
                  const bester = ranglisteDerLiga(liga.slug)[0];
                  const besterSpieler = bester ? spielerById(bester.spielerId) : null;

                  return (
                    <Card key={liga.slug} href={bedvPath(`/ligen/${liga.slug}`)} padding="15px 16px">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <h3 style={{ fontSize: '1.1rem' }}>{liga.name}</h3>
                        <Badge ton="leise">Endstand</Badge>
                      </div>

                      {meister && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, padding: '9px 10px', borderRadius: 9, background: 'var(--bedv-accent-soft)' }}>
                          <span aria-hidden="true" style={{ fontSize: '1.05rem' }}>🏆</span>
                          <TeamWappen team={meister} groesse={26} />
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span className="bedv-kicker" style={{ display: 'block', fontSize: '0.6rem', color: 'var(--bedv-accent-deep)' }}>
                              Staffelsieger
                            </span>
                            <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {meister.name}
                            </span>
                          </span>
                          <span className="bedv-score" style={{ color: 'var(--bedv-accent-deep)', flex: 'none' }}>
                            {tabelle[0].punkte}
                          </span>
                        </div>
                      )}

                      {besterSpieler && (
                        <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--bedv-line-soft)', fontSize: '0.82rem', color: 'var(--bedv-ink-dim)' }}>
                          Beste Einzelwertung:{' '}
                          <strong style={{ color: 'var(--bedv-ink)' }}>{besterSpieler.name}</strong>{' '}
                          ({bester.punkte} Punkte, {bester.quote} %)
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}

        <Card padding="18px 20px">
          <h3 style={{ fontSize: '1.05rem' }}>Was ein Archiv leisten muss</h3>
          <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 8, fontSize: '0.9rem', lineHeight: 1.62, maxWidth: '72ch' }}>
            Eine abgeschlossene Spielzeit darf nicht zur PDF-Ablage werden. In dieser Demo
            führt jede archivierte Staffel auf dieselbe Ligaseite wie die laufende — mit
            Tabelle, Spielplan, Ergebnissen, Einzelrangliste und Highlights. Mannschaften
            und Spieler behalten ihre Profile, ihre Ergebnisse bleiben ihnen zugeordnet.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Link href={bedvPath('/ligen')} className="bedv-btn bedv-btn--ghost bedv-btn--sm">Alle Ligen</Link>
            <Link href={bedvPath('/teams')} className="bedv-btn bedv-btn--ghost bedv-btn--sm">Alle Mannschaften</Link>
          </div>
        </Card>
      </div>
    </>
  );
}
