// ============================================================
// Spielerprofil
// ============================================================
//
// Alles, was sonst über vier Ranglisten verstreut ist, an einer Stelle:
// Ligaplatzierung, Bilanz, Highlights, letzte Begegnungen der Mannschaft.
//
// WICHTIG: Alle Personen dieser Demo sind erfunden (siehe
// `data/bedv/spieler.ts`). Es wurden keine Namen und keine Sportdaten von
// der bestehenden BeDV-Seite übernommen — Sportdaten echter Menschen
// gehören in eine offizielle Plattform, nicht in eine Verkaufsdemo.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, Feld, LeerZustand, SectionHead, Stat, DemoHinweis } from '@/components/bedv/ui/bausteine';
import { SpielerAvatar, TeamWappen } from '@/components/bedv/teams/team-wappen';
import { ErgebnisZeile } from '@/components/bedv/matches/match-card';
import { RanglisteTabelle } from '@/components/bedv/players/rangliste-tabelle';
import { SPIELER, kaderVon, spielerById } from '@/data/bedv/spieler';
import { teamById } from '@/data/bedv/teams';
import { ligaBySlug } from '@/data/bedv/ligen';
import { saisonById } from '@/data/bedv/saison';
import { ranglisteDerLiga } from '@/data/bedv/rangliste';
import { highlightsDerLiga, highlightsVonSpieler } from '@/data/bedv/highlights';
import { begegnungenVonTeam } from '@/data/bedv/spiele';

export function generateStaticParams() {
  return SPIELER.map(s => ({ slug: s.id }));
}

export async function generateMetadata(props: PageProps<'/bedv/spieler/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const s = spielerById(slug);
  if (!s) return { title: 'Spieler nicht gefunden' };
  const team = teamById(s.teamId);
  return {
    title: s.name,
    description: `${s.name} — ${team?.name ?? ''}. Statistik, Highlights und Ergebnisse (Demo-Daten).`,
  };
}

/** Eine Highlight-Kachel mit Platzierung innerhalb der Liga. */
function HighlightKachel({
  symbol, titel, wert, einheit, platz, gesamt, farbe,
}: {
  symbol: string; titel: string; wert: number | null; einheit: string;
  platz: number | null; gesamt: number; farbe: string;
}) {
  return (
    <Card padding="14px 15px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true" style={{ fontSize: '1.05rem' }}>{symbol}</span>
        <span className="bedv-kicker">{titel}</span>
      </div>
      <div className="bedv-score" style={{ fontSize: '1.8rem', color: farbe, marginTop: 7, lineHeight: 1.05 }}>
        {wert ?? '–'}
        {wert !== null && <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--bedv-ink-dim)', marginLeft: 4 }}>{einheit}</span>}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--bedv-ink-dim)', marginTop: 4 }}>
        {platz ? `Platz ${platz} von ${gesamt} in der Liga` : 'nicht in der Wertung'}
      </div>
    </Card>
  );
}

export default async function SpielerSeite(props: PageProps<'/bedv/spieler/[slug]'>) {
  const { slug } = await props.params;
  const spieler = spielerById(slug);
  if (!spieler) notFound();

  const team = teamById(spieler.teamId);
  const liga = ligaBySlug(spieler.ligaSlug);
  const saison = saisonById(spieler.saisonId);
  const rangliste = ranglisteDerLiga(spieler.ligaSlug);
  const zeile = rangliste.find(z => z.spielerId === spieler.id);
  const hl = highlightsVonSpieler(spieler.id, spieler.ligaSlug);
  const ligaHl = highlightsDerLiga(spieler.ligaSlug);
  const mannschaftsspiele = team
    ? begegnungenVonTeam(team.id).filter(b => b.status === 'gespielt').slice(-6).reverse()
    : [];
  const umfeld = zeile
    ? rangliste.slice(Math.max(0, zeile.platz - 3), zeile.platz + 2)
    : [];

  const platzVon = (liste: { spielerId: string; platz: number }[]) =>
    liste.find(z => z.spielerId === spieler.id)?.platz ?? null;

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '28px 30px' }}>
          {team && (
            <Link href={bedvPath(`/teams/${team.id}`)} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem' }}>
              ← {team.name}
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <SpielerAvatar initialen={spieler.initialen} groesse={66} akzent={zeile?.platz === 1} />
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 'clamp(1.6rem, 4.6vw, 2.4rem)' }}>{spieler.name}</h1>
                {spieler.spitzname && (
                  <div style={{ color: 'var(--bedv-accent)', fontSize: '1rem', marginTop: 4, fontFamily: 'var(--bedv-font-display)' }}>
                    {`„${spieler.spitzname}“`}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {team && <Link href={bedvPath(`/teams/${team.id}`)}><Badge ton="dunkel">{team.name}</Badge></Link>}
                  {liga && <Link href={bedvPath(`/ligen/${liga.slug}`)}><Badge ton="dunkel">{liga.name}</Badge></Link>}
                  {spieler.kapitaen && <Badge ton="accent">Mannschaftsführer</Badge>}
                </div>
              </div>
            </div>

            {zeile && (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <Stat wert={zeile.platz} label="Ligaplatz" ton="dunkel" hinweis={`von ${rangliste.length}`} />
                <Stat wert={zeile.punkte} label="Punkte" ton="dunkel" />
                <Stat wert={`${zeile.quote} %`} label="Siegquote" ton="dunkel" />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px', display: 'grid', gap: 26 }}>
        <DemoHinweis>
          Demo-Profil. Diese Person ist erfunden, die Werte sind errechnet — es wurden
          keine Namen oder Sportdaten von der bestehenden BeDV-Seite übernommen.
        </DemoHinweis>

        {/* Highlights */}
        <div>
          <SectionHead eyebrow="Highlights" titel="Bestwerte dieser Spielzeit" />
          <div className="bedv-grid bedv-grid--4 bedv-grid--keep2">
            <HighlightKachel
              symbol="🔥" titel="180er" wert={hl.hundertachtziger} einheit="×"
              platz={platzVon(ligaHl.hundertachtziger)} gesamt={ligaHl.hundertachtziger.length}
              farbe="var(--bedv-red)"
            />
            <HighlightKachel
              symbol="⚡" titel="171er" wert={hl.einhunderteinundsiebzig} einheit="×"
              platz={platzVon(ligaHl.einhunderteinundsiebzig)} gesamt={ligaHl.einhunderteinundsiebzig.length}
              farbe="var(--bedv-accent-deep)"
            />
            <HighlightKachel
              symbol="🎯" titel="Höchstes Finish" wert={hl.highFinish} einheit="Pkt"
              platz={platzVon(ligaHl.highFinish)} gesamt={ligaHl.highFinish.length}
              farbe="var(--bedv-blue-deep)"
            />
            <HighlightKachel
              symbol="🏁" titel="Kürzestes Leg" wert={hl.shortLeg} einheit="Darts"
              platz={platzVon(ligaHl.shortLeg)} gesamt={ligaHl.shortLeg.length}
              farbe="var(--bedv-green)"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }} className="bedv-liga-split">
          {/* Bilanz */}
          <div>
            <SectionHead eyebrow="Statistik" titel="Bilanz" />
            <Card padding="15px 17px">
              {zeile ? (
                <>
                  <div className="bedv-grid bedv-grid--3 bedv-grid--keep2" style={{ marginBottom: 14 }}>
                    <Stat wert={zeile.spiele} label="Spiele" />
                    <Stat wert={zeile.siege} label="Siege" ton="accent" />
                    <Stat wert={zeile.niederlagen} label="Niederlagen" />
                  </div>
                  <Feld label="Gewonnene Legs">{zeile.legsFuer}</Feld>
                  <Feld label="Verlorene Legs">{zeile.legsGegen}</Feld>
                  <Feld label="Legdifferenz">
                    <span style={{ color: zeile.legsFuer >= zeile.legsGegen ? 'var(--bedv-green)' : 'var(--bedv-red)' }}>
                      {zeile.legsFuer - zeile.legsGegen > 0 ? '+' : ''}{zeile.legsFuer - zeile.legsGegen}
                    </span>
                  </Feld>
                  <Feld label="Passnummer">{spieler.passnummer}</Feld>
                  <Feld label="Wertungsklasse">{spieler.wertung === 'damen' ? 'Damen' : 'Herren'}</Feld>
                  <Feld label="Spielzeit">{saison?.name ?? '—'}</Feld>
                </>
              ) : (
                <LeerZustand titel="Noch kein Einsatz" text="Für diese Spielzeit liegt noch kein gewerteter Einsatz vor." />
              )}
            </Card>
          </div>

          {/* Mannschaftsergebnisse */}
          <div>
            <SectionHead
              eyebrow="Mannschaft"
              titel="Letzte Begegnungen"
              aktion={team ? { label: 'Zum Team', href: bedvPath(`/teams/${team.id}`) } : undefined}
            />
            <Card padding="4px 16px 12px">
              {mannschaftsspiele.length > 0
                ? mannschaftsspiele.map(b => <ErgebnisZeile key={b.id} begegnung={b} ausSichtVon={team?.id} />)
                : <div style={{ padding: 16 }}><LeerZustand titel="Noch nichts gespielt" text="Sobald die Mannschaft angetreten ist, stehen die Ergebnisse hier." /></div>}
            </Card>

            {team && (
              <Card padding="14px 16px" style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <TeamWappen team={team} groesse={36} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--bedv-font-display)' }}>{team.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-dim)' }}>
                      {kaderVon(team.id).length} Spieler im Kader · {team.spieltag}, {team.beginn} Uhr
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Umfeld in der Rangliste */}
        {umfeld.length > 0 && liga && (
          <div>
            <SectionHead
              eyebrow="Einzelrangliste"
              titel={`Umfeld in der ${liga.name}`}
              aktion={{ label: 'Komplette Rangliste', href: bedvPath(`/ligen/${liga.slug}#rangliste`) }}
            />
            <Card padding="6px 14px 14px">
              <RanglisteTabelle zeilen={umfeld} hervorheben={spieler.id} />
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
