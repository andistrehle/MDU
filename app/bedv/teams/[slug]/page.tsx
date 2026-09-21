// ============================================================
// Mannschaftsprofil
// ============================================================
//
// Der größte sichtbare Gewinn gegenüber einer klassischen Verbandsseite:
// Dort ist eine Mannschaft eine Zeile in einer Tabelle. Hier hat sie eine
// Adresse, einen Kader, eine Spielstätte, eine Saisonbilanz und eine
// Ergebnisliste — und jeder Spieler darin führt weiter auf sein Profil.
//
// Im Gespräch ist das der Moment, in dem es klickt: „Jede Mannschaft
// bekommt ihre eigene Seite."
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, CalendarClock, Users, Trophy } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, Feld, FormKurve, LeerZustand, SectionHead, Stat } from '@/components/bedv/ui/bausteine';
import { SpielerAvatar, TeamWappen } from '@/components/bedv/teams/team-wappen';
import { MatchCard, ErgebnisZeile } from '@/components/bedv/matches/match-card';
import { Tabelle } from '@/components/bedv/standings/tabelle';
import { TEAMS, teamById } from '@/data/bedv/teams';
import { kaderVon } from '@/data/bedv/spieler';
import { ligaBySlug } from '@/data/bedv/ligen';
import { saisonById } from '@/data/bedv/saison';
import { adresse, kartenSuche, spielstaetteById } from '@/data/bedv/spielstaetten';
import { begegnungenVonTeam } from '@/data/bedv/spiele';
import { tabelleDerLiga } from '@/data/bedv/tabelle';
import { ranglisteDerLiga } from '@/data/bedv/rangliste';
import { highlightsVonSpieler } from '@/data/bedv/highlights';
import { pokalspieleVon, gesamtstand } from '@/data/bedv/pokal';
import {  } from '@/lib/bedv/format';

export function generateStaticParams() {
  return TEAMS.map(t => ({ slug: t.id }));
}

export async function generateMetadata(props: PageProps<'/bedv/teams/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const team = teamById(slug);
  if (!team) return { title: 'Mannschaft nicht gefunden' };
  const liga = ligaBySlug(team.ligaSlug);
  return {
    title: team.name,
    description: `${team.name} — ${liga?.name ?? ''}. Kader, Spielstätte, Spielplan und Saisonbilanz.`,
  };
}

export default async function TeamSeite(props: PageProps<'/bedv/teams/[slug]'>) {
  const { slug } = await props.params;
  const team = teamById(slug);
  if (!team) notFound();

  const liga = ligaBySlug(team.ligaSlug)!;
  const saison = saisonById(team.saisonId)!;
  const ort = spielstaetteById(team.spielstaetteId);
  const kader = kaderVon(team.id);
  const spiele = begegnungenVonTeam(team.id);
  const naechste = spiele.filter(b => b.status === 'geplant').slice(0, 3);
  const letzte = spiele.filter(b => b.status === 'gespielt').slice(-6).reverse();
  const tabelle = tabelleDerLiga(team.ligaSlug);
  const zeile = tabelle.find(z => z.teamId === team.id);
  const rangliste = ranglisteDerLiga(team.ligaSlug);
  const pokal = pokalspieleVon(team.id);

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '28px 30px' }}>
          <Link href={bedvPath(`/ligen/${liga.slug}`)} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem' }}>
            ← {liga.name}
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <TeamWappen team={team} groesse={64} />
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 'clamp(1.6rem, 4.6vw, 2.4rem)' }}>{team.name}</h1>
                <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
                  <Link href={bedvPath(`/ligen/${liga.slug}`)}><Badge ton="dunkel">{liga.name}</Badge></Link>
                  <Badge ton="dunkel">{saison.name}</Badge>
                  {zeile && <Badge ton={zeile.platz <= 2 ? 'accent' : 'dunkel'}>{zeile.platz}. Platz</Badge>}
                </div>
              </div>
            </div>

            {zeile && (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <Stat wert={zeile.punkte} label="Punkte" ton="dunkel" />
                <Stat wert={`${zeile.siege}-${zeile.unentschieden}-${zeile.niederlagen}`} label="S – U – N" ton="dunkel" />
                <Stat wert={`${zeile.spieleFuer}:${zeile.spieleGegen}`} label="Einzelspiele" ton="dunkel" />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px', display: 'grid', gap: 26 }}>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }} className="bedv-liga-split">
          {/* Kader */}
          <div>
            <SectionHead eyebrow="Kader" titel={`${kader.length} Spieler gemeldet`} />
            <div className="bedv-grid bedv-grid--2">
              {kader.map(s => {
                const rang = rangliste.find(z => z.spielerId === s.id);
                const hl = highlightsVonSpieler(s.id, s.ligaSlug);
                return (
                  <Card key={s.id} href={bedvPath(`/spieler/${s.id}`)} padding="13px 14px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <SpielerAvatar initialen={s.initialen} groesse={38} akzent={s.kapitaen} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.name}
                          </span>
                          {s.kapitaen && <span aria-label="Mannschaftsführer" title="Mannschaftsführer" style={{ color: 'var(--bedv-accent-deep)', flex: 'none' }}>★</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--bedv-ink-dim)' }}>
                          {s.spitzname ? `„${s.spitzname}" · ` : ''}Pass {s.passnummer}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex', gap: 14, marginTop: 11, paddingTop: 10,
                        borderTop: '1px solid var(--bedv-line-soft)', fontSize: '0.76rem',
                        color: 'var(--bedv-ink-dim)', flexWrap: 'wrap',
                      }}
                    >
                      <span><strong style={{ color: 'var(--bedv-ink)' }}>{rang?.siege ?? 0}</strong>/{rang?.spiele ?? 0} Spiele</span>
                      <span><strong style={{ color: 'var(--bedv-ink)' }}>{hl.hundertachtziger}</strong>× 180</span>
                      {hl.highFinish && <span>Finish <strong style={{ color: 'var(--bedv-ink)' }}>{hl.highFinish}</strong></span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Spielstätte + Eckdaten */}
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--bedv-line)', background: 'var(--bedv-tint)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />
                <h3 style={{ fontSize: '1rem' }}>Spielstätte</h3>
              </div>
              {ort ? (
                <>
                  {/* Kartenfläche: bewusst kein eingebetteter Kartendienst.
                      Der würde beim ersten Aufruf Daten an einen Dritten
                      schicken — in einer Demo ohne Datenschutzerklärung das
                      Letzte, was sein soll. */}
                  <div
                    aria-hidden="true"
                    style={{
                      height: 112, position: 'relative', overflow: 'hidden',
                      background: 'linear-gradient(135deg, #DCE8FB 0%, #EAF0F8 100%)',
                      borderBottom: '1px solid var(--bedv-line)',
                    }}
                  >
                    <svg viewBox="0 0 200 80" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}>
                      <g stroke="#9FBDE8" strokeWidth="1" fill="none">
                        <path d="M0 22 H200 M0 55 H200 M38 0 V80 M96 0 V80 M148 0 V80" />
                        <path d="M0 68 L60 40 L120 62 L200 30" strokeWidth="2" stroke="#7FA8DE" />
                      </g>
                    </svg>
                    <span
                      style={{
                        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -62%)',
                        width: 26, height: 26, borderRadius: '50% 50% 50% 0', rotate: '-45deg',
                        background: 'var(--bedv-red)', boxShadow: '0 3px 8px rgba(10,27,53,0.28)',
                      }}
                    />
                  </div>
                  <div style={{ padding: '12px 16px 15px' }}>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--bedv-font-display)' }}>{ort.name}</div>
                    <div style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.87rem', marginTop: 3 }}>{adresse(ort)}</div>
                    <div style={{ marginTop: 11 }}>
                      <Feld label="Automaten">{ort.automaten}</Feld>
                      <Feld label="Heimspieltag">{team.spieltag}</Feld>
                      <Feld label="Beginn">{team.beginn} Uhr</Feld>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--bedv-ink-faint)', marginTop: 10, lineHeight: 1.5 }}>
                      Kartenausschnitt als Platzhalter — in der echten Plattform mit Anfahrt
                      und Routenstart. Demo-Adresse: {kartenSuche(ort)}
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ padding: 16 }}>
                  <LeerZustand titel="Keine Spielstätte gemeldet" text="Die Mannschaft hat für diese Spielzeit noch keine Spielstätte hinterlegt." />
                </div>
              )}
            </Card>

            <Card padding="15px 17px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Users size={16} aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />
                <h3 style={{ fontSize: '1rem' }}>Eckdaten</h3>
              </div>
              <Feld label="Spielklasse">{liga.name}</Feld>
              <Feld label="Spielzeit">{saison.name}</Feld>
              <Feld label="Gegründet">{team.gruendung}</Feld>
              <Feld label="Mannschaftsführer">{kader.find(s => s.kapitaen)?.name ?? '—'}</Feld>
              {zeile && <Feld label="Form"><FormKurve form={zeile.form} /></Feld>}
            </Card>

            {pokal.length > 0 && (
              <Card padding="15px 17px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Trophy size={16} aria-hidden="true" style={{ color: 'var(--bedv-accent-deep)' }} />
                  <h3 style={{ fontSize: '1rem' }}>Im Verbandspokal</h3>
                </div>
                {pokal.map(p => {
                  const gegnerId = p.heimTeamId === team.id ? p.gastTeamId : p.heimTeamId;
                  const gegner = teamById(gegnerId ?? '');
                  const stand = gesamtstand(p);
                  const istHeim = p.heimTeamId === team.id;
                  const weiter = p.siegerTeamId === team.id;
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--bedv-line-soft)' }}>
                      <span className="bedv-kicker" style={{ width: 74, flex: 'none' }}>
                        {p.runde === 'achtelfinale' ? 'Achtelf.' : p.runde === 'viertelfinale' ? 'Viertelf.' : p.runde === 'halbfinale' ? 'Halbf.' : 'Finale'}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {gegner?.name ?? 'offen'}
                      </span>
                      <span className="bedv-score" style={{ fontSize: '0.9rem', color: weiter ? 'var(--bedv-green)' : p.siegerTeamId ? 'var(--bedv-red)' : 'var(--bedv-ink-dim)' }}>
                        {stand ? `${istHeim ? stand[0] : stand[1]}:${istHeim ? stand[1] : stand[0]}` : '–'}
                      </span>
                    </div>
                  );
                })}
                <Link href={bedvPath('/pokal')} className="bedv-btn bedv-btn--quiet bedv-btn--sm" style={{ marginTop: 10 }}>
                  Zum Turnierbaum →
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* Spiele */}
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }} className="bedv-liga-split">
          <div>
            <SectionHead eyebrow="Termine" titel="Nächste Spiele" />
            {naechste.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {naechste.map(b => <MatchCard key={b.id} begegnung={b} mitLiga={false} kompakt />)}
              </div>
            ) : (
              <LeerZustand titel="Keine offenen Spiele" text="Für diese Mannschaft stehen in dieser Spielzeit keine weiteren Begegnungen an." />
            )}
          </div>

          <div>
            <SectionHead eyebrow="Bilanz" titel="Letzte Ergebnisse" />
            <Card padding="4px 16px 12px">
              {letzte.length > 0
                ? letzte.map(b => <ErgebnisZeile key={b.id} begegnung={b} ausSichtVon={team.id} />)
                : <div style={{ padding: 16 }}><LeerZustand titel="Noch nichts gespielt" text="Sobald die ersten Begegnungen gewertet sind, stehen sie hier." /></div>}
            </Card>
          </div>
        </div>

        {/* Tabelle im Umfeld */}
        <div>
          <SectionHead
            eyebrow="Umfeld"
            titel={`Tabelle ${liga.name}`}
            aktion={{ label: 'Komplette Liga', href: bedvPath(`/ligen/${liga.slug}`) }}
          />
          <Card padding="6px 14px 16px">
            <Tabelle zeilen={tabelle} hervorheben={team.id} />
          </Card>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={bedvPath(`/ligen/${liga.slug}#spielplan`)} className="bedv-btn bedv-btn--ghost bedv-btn--sm">
            <CalendarClock size={15} aria-hidden="true" /> Kompletter Spielplan
          </Link>
          <Link href={bedvPath('/teams')} className="bedv-btn bedv-btn--ghost bedv-btn--sm">
            Alle Mannschaften
          </Link>
        </div>
      </div>
    </>
  );
}
