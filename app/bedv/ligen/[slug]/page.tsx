// ============================================================
// Ligadetailseite
// ============================================================
//
// Alles zu einer Staffel auf EINER Adresse, verteilt auf sechs Reiter.
// Das ist der wichtigste Unterschied zu einer klassischen Verbandsseite,
// auf der Tabelle, Spielplan und Ergebnisse drei getrennte Seiten mit drei
// getrennten Menüpunkten sind.
//
// Gerendert wird alles auf dem Server; die Reiter schalten im Browser nur
// um (`components/bedv/leagues/liga-tabs.tsx`).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bedvPath } from '@/lib/bedv/site';
import { LigaTabs } from '@/components/bedv/leagues/liga-tabs';
import { HighlightsPanel } from '@/components/bedv/leagues/highlights-panel';
import { Tabelle } from '@/components/bedv/standings/tabelle';
import { RanglisteTabelle } from '@/components/bedv/players/rangliste-tabelle';
import { Spielplan } from '@/components/bedv/matches/spielplan';
import { MatchCard } from '@/components/bedv/matches/match-card';
import { Badge, Card, LeerZustand, SectionHead, Stat } from '@/components/bedv/ui/bausteine';
import { TeamWappen } from '@/components/bedv/teams/team-wappen';
import { LIGEN, ligaBySlug, ligaFarbe } from '@/data/bedv/ligen';
import { saisonById } from '@/data/bedv/saison';
import { begegnungenDerLiga } from '@/data/bedv/spiele';
import { gespielteSpieltage, spieltageGesamt, tabelleDerLiga } from '@/data/bedv/tabelle';
import { ranglisteDerLiga } from '@/data/bedv/rangliste';
import { highlightsDerLiga } from '@/data/bedv/highlights';
import { teamsDerLiga } from '@/data/bedv/teams';
import { spielstaetteById } from '@/data/bedv/spielstaetten';
import { spielerDerLiga } from '@/data/bedv/spieler';

export function generateStaticParams() {
  return LIGEN.map(l => ({ slug: l.slug }));
}

export async function generateMetadata(props: PageProps<'/bedv/ligen/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const liga = ligaBySlug(slug);
  if (!liga) return { title: 'Liga nicht gefunden' };
  const saison = saisonById(liga.saisonId);
  return {
    title: `${liga.name} — ${saison?.name ?? ''}`,
    description: liga.beschreibung,
  };
}

export default async function LigaSeite(props: PageProps<'/bedv/ligen/[slug]'>) {
  const { slug } = await props.params;
  const liga = ligaBySlug(slug);
  if (!liga) notFound();

  const saison = saisonById(liga.saisonId)!;
  const teams = teamsDerLiga(slug);
  const tabelle = tabelleDerLiga(slug);
  const rangliste = ranglisteDerLiga(slug);
  const highlights = highlightsDerLiga(slug);
  const alle = begegnungenDerLiga(slug);
  const gespielt = gespielteSpieltage(slug);
  const gesamt = spieltageGesamt(slug);
  const laeuft = gespielt < gesamt;

  const naechste = alle.filter(b => b.status === 'geplant').slice(0, 4);
  const letzte = alle.filter(b => b.status === 'gespielt').slice(-6).reverse();
  const farbe = ligaFarbe(liga.stufe);

  // Auf- und Abstieg gibt es nur im Winter; die Sommerliga läuft ohne.
  const aufstieg = saison.typ === 'winter' && liga.ebene > 1 ? 1 : 0;
  const abstieg = saison.typ === 'winter' && liga.ebene < 4 ? 2 : 0;

  const reiter = [
    {
      id: 'uebersicht',
      label: 'Übersicht',
      inhalt: (
        <div style={{ display: 'grid', gap: 26 }}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }} className="bedv-liga-split">
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--bedv-line)', background: 'var(--bedv-tint)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.02rem' }}>Tabelle</h3>
                <span className="bedv-kicker">nach {gespielt} Spieltagen</span>
              </div>
              <div style={{ padding: '4px 10px 12px' }}>
                {/* KOMPAKT, nicht vollständig: Die Übersicht teilt sich die
                    Breite mit der Rangliste daneben, für zehn Spalten bleiben
                    keine 640 px. Ungekürzt wurde ausgerechnet die
                    Punktespalte rechts abgeschnitten. Alle Spalten stehen im
                    Reiter „Tabelle". */}
                <Tabelle zeilen={tabelle} grenze={6} aufstieg={aufstieg} abstieg={0} kompakt />
              </div>
            </Card>

            <Card padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--bedv-line)', background: 'var(--bedv-tint)' }}>
                <h3 style={{ fontSize: '1.02rem' }}>Beste Einzelspieler</h3>
              </div>
              <div style={{ padding: '4px 10px 12px' }}>
                <RanglisteTabelle zeilen={rangliste} grenze={6} mitTeam={false} />
              </div>
            </Card>
          </div>

          {naechste.length > 0 && (
            <div>
              <SectionHead eyebrow="Als nächstes" titel="Kommende Begegnungen" />
              <div className="bedv-grid bedv-grid--2">
                {naechste.map(b => <MatchCard key={b.id} begegnung={b} mitLiga={false} kompakt />)}
              </div>
            </div>
          )}

          {letzte.length > 0 && (
            <div>
              <SectionHead eyebrow="Zuletzt gespielt" titel="Ergebnisse" />
              <div className="bedv-grid bedv-grid--3">
                {letzte.map(b => <MatchCard key={b.id} begegnung={b} mitLiga={false} kompakt />)}
              </div>
            </div>
          )}

          <div>
            <SectionHead eyebrow="Mannschaften" titel={`${teams.length} Mannschaften`} />
            <div className="bedv-grid bedv-grid--4">
              {teams.map(t => {
                const ort = spielstaetteById(t.spielstaetteId);
                return (
                  <Card key={t.id} href={bedvPath(`/teams/${t.id}`)} padding="13px 14px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <TeamWappen team={t} groesse={34} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--bedv-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ort?.ort ?? ''} · {t.spieltag}
                        </span>
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tabelle',
      label: 'Tabelle',
      inhalt: (
        <Card padding="6px 14px 18px">
          <Tabelle zeilen={tabelle} aufstieg={aufstieg} abstieg={abstieg} />
        </Card>
      ),
    },
    {
      id: 'spielplan',
      label: 'Spielplan',
      inhalt: <Spielplan begegnungen={alle} />,
    },
    {
      id: 'ergebnisse',
      label: 'Ergebnisse',
      inhalt: alle.some(b => b.status === 'gespielt')
        ? (
          <Spielplan
            begegnungen={alle.filter(b => b.status === 'gespielt').slice().reverse()}
          />
        )
        : <LeerZustand titel="Noch keine Ergebnisse" text="Die Staffel hat noch nicht begonnen. Sobald der erste Spielbericht vorliegt, steht das Ergebnis hier." />,
    },
    {
      id: 'rangliste',
      label: 'Einzelrangliste',
      inhalt: (
        <>
          <Card padding="6px 14px 18px">
            <RanglisteTabelle zeilen={rangliste} />
          </Card>
          <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', lineHeight: 1.6, maxWidth: '76ch' }}>
            Punkte: zwei je gewonnenem Spiel, dazu ein Punkt je gewonnenem Leg in einem
            verlorenen Spiel. Doppel zählen für beide beteiligten Spieler. Quote = Anteil
            gewonnener Spiele.
          </p>
        </>
      ),
    },
    {
      id: 'highlights',
      label: 'Highlights',
      inhalt: (
        <>
          <HighlightsPanel {...highlights} />
          <p style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', lineHeight: 1.6, maxWidth: '76ch' }}>
            Highlights werden über den Spielbericht gemeldet. In der Demo sind die Werte
            errechnet — sie sind keine Ergebnisse echter Spielerinnen und Spieler.
          </p>
        </>
      ),
    },
  ];

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '30px 30px' }}>
          <Link href={bedvPath('/ligen')} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem' }}>
            ← Alle Ligen
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginTop: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden="true" style={{ width: 5, height: 30, borderRadius: 3, background: farbe }} />
                <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}>{liga.name}</h1>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <Badge ton="dunkel">{saison.name}</Badge>
                <Badge ton={laeuft ? 'accent' : 'leise'}>
                  {laeuft ? `${gespielt} von ${gesamt} Spieltagen` : 'abgeschlossen'}
                </Badge>
              </div>
              <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 12, maxWidth: '58ch', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {liga.beschreibung}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
              <Stat wert={teams.length} label="Mannschaften" ton="dunkel" />
              <Stat wert={spielerDerLiga(slug).length} label="Spieler" ton="dunkel" />
              <Stat wert={alle.filter(b => b.status === 'gespielt').length} label="Begegnungen" ton="dunkel" />
            </div>
          </div>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '18px 52px' }}>
        <LigaTabs reiter={reiter} />
      </div>
    </>
  );
}
