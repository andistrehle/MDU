// ============================================================
// Spielstätten
// ============================================================
//
// Im E-Dart ist die Spielstätte der Engpass: ohne Automaten kein Heimspiel.
// Deshalb steht bei jedem Lokal die Zahl der Automaten und welche
// Mannschaften dort antreten.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Cpu } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, SectionHead } from '@/components/bedv/ui/bausteine';
import { TeamWappen } from '@/components/bedv/teams/team-wappen';
import { SPIELSTAETTEN, adresse } from '@/data/bedv/spielstaetten';
import { TEAMS } from '@/data/bedv/teams';
import { ligaBySlug } from '@/data/bedv/ligen';
import { SAISON_AKTUELL } from '@/data/bedv/saison';

export const metadata: Metadata = {
  title: 'Spielstätten',
  description: 'Alle Lokale im Verbandsgebiet mit Adresse, Automatenzahl und den dort spielenden Mannschaften.',
};

export default function SpielstaettenSeite() {
  const automatenGesamt = SPIELSTAETTEN.reduce((s, v) => s + v.automaten, 0);
  const orte = new Set(SPIELSTAETTEN.map(v => v.ort)).size;

  // Nach Ort sortieren — so liest sich die Liste wie eine Landkarte.
  const sortiert = SPIELSTAETTEN.slice().sort((a, b) => a.ort.localeCompare(b.ort, 'de'));

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Verbandsgebiet</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Spielstätten</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            {SPIELSTAETTEN.length} Lokale in {orte} bayerischen Städten mit zusammen{' '}
            {automatenGesamt} Automaten.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <div style={{ marginBottom: 22 }}>
          <DemoHinweis>
            Lokalnamen und Adressen sind Demo-Angaben. Die Städte sind echt, damit die
            Verteilung über den Freistaat stimmt.
          </DemoHinweis>
        </div>

        <SectionHead eyebrow="Alle Lokale" titel={`${SPIELSTAETTEN.length} Spielstätten`} />

        <div className="bedv-grid bedv-grid--2">
          {sortiert.map(v => {
            const mannschaften = TEAMS.filter(
              t => t.spielstaetteId === v.id && t.saisonId === SAISON_AKTUELL.id,
            );
            return (
              <Card key={v.id} padding="16px 17px" style={{ scrollMarginTop: 80 }}>
                <div id={v.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: '1.1rem' }}>{v.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bedv-ink-dim)', fontSize: '0.86rem', marginTop: 5 }}>
                        <MapPin size={14} aria-hidden="true" style={{ flex: 'none' }} />
                        {adresse(v)}
                      </div>
                    </div>
                    <Badge ton="blau">
                      <Cpu size={12} aria-hidden="true" /> {v.automaten}
                    </Badge>
                  </div>

                  {mannschaften.length > 0 ? (
                    <div style={{ marginTop: 13, paddingTop: 12, borderTop: '1px solid var(--bedv-line-soft)' }}>
                      <div className="bedv-kicker" style={{ marginBottom: 8 }}>
                        {mannschaften.length} {mannschaften.length === 1 ? 'Mannschaft' : 'Mannschaften'} · {SAISON_AKTUELL.kurz}
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {mannschaften.map(t => {
                          const liga = ligaBySlug(t.ligaSlug);
                          return (
                            <Link key={t.id} href={bedvPath(`/teams/${t.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                              <TeamWappen team={t} groesse={24} />
                              <span style={{ flex: 1, minWidth: 0, fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.name}
                              </span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--bedv-ink-dim)', flex: 'none' }}>
                                {liga?.kurz} · {t.spieltag.slice(0, 2)} {t.beginn}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 13, paddingTop: 12, borderTop: '1px solid var(--bedv-line-soft)', fontSize: '0.83rem', color: 'var(--bedv-ink-faint)' }}>
                      In der laufenden Spielzeit tritt hier keine Mannschaft an.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
