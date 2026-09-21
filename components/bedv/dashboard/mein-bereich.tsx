'use client';

// ============================================================
// Mein Bereich — Übersicht nach dem Demo-Login
// ============================================================
//
// Der Bildschirm, an dem sich „Homepage" und „Plattform" scheiden. Oben
// steht, was mich betrifft (mein Team, meine Liga, meine Statistik, mein
// nächstes Spiel), darunter das, was ich TUN kann — und das hängt an der
// Rolle.
//
// Ohne Rollenwahl führt die Seite zur Auswahl zurück statt eine leere
// Hülle zu zeigen: In einer Vorführung ist ein leerer Bildschirm der
// schlimmste Zustand.
// ============================================================

import Link from 'next/link';
import {
  ArrowRight, CalendarClock, ClipboardList, ScanLine, ShieldCheck,
  Trophy, Users, BarChart3, Bell,
} from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, LeerZustand, SectionHead, Stat } from '@/components/bedv/ui/bausteine';
import { SpielerAvatar, TeamWappen } from '../teams/team-wappen';
import { useDemoAuth } from '../layout/demo-auth';
import { kontoVon } from '@/data/bedv/demo-konten';
import { benachrichtigungenFuer } from '@/data/bedv/benachrichtigungen';
import type { Team } from '@/data/bedv/typen';

export interface DashboardDaten {
  team: Pick<Team, 'id' | 'name' | 'farben' | 'spieltag' | 'beginn'>;
  ligaSlug: string;
  ligaName: string;
  saisonName: string;
  kaderGroesse: number;
  spielstaette: { name: string; adresse: string } | null;
  tabelle: { platz: number; punkte: number; spiele: number; siege: number; unentschieden: number; niederlagen: number; differenz: number } | null;
  naechstesSpiel: {
    datumText: string; relativ: string; uhrzeit: string;
    gegner: string; heim: boolean; ort: string;
  } | null;
  letztesSpiel: { datumText: string; gegner: string; eigene: number; fremde: number; heim: boolean } | null;
  meineStatistik: {
    id: string; name: string; initialen: string; platz: number; vonWievielen: number;
    spiele: number; siege: number; punkte: number; quote: number;
    hundertachtziger: number; highFinish: number | null; shortLeg: number | null;
  } | null;
  verwaltung: { label: string; wert: number; ziel: string }[];
}

function Kachel({
  icon: Icon, titel, text, ziel, ton = 'normal',
}: {
  icon: typeof Users; titel: string; text: string; ziel: string; ton?: 'normal' | 'accent';
}) {
  return (
    <Card href={bedvPath(ziel)} padding="16px 17px">
      <span
        aria-hidden="true"
        style={{
          width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center',
          background: ton === 'accent' ? 'var(--bedv-accent-soft)' : 'var(--bedv-blue-mist)',
          color: ton === 'accent' ? 'var(--bedv-accent-deep)' : 'var(--bedv-blue-deep)',
        }}
      >
        <Icon size={19} />
      </span>
      <h3 style={{ fontSize: '1.02rem', marginTop: 11 }}>{titel}</h3>
      <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.86rem', marginTop: 5, lineHeight: 1.55 }}>{text}</p>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, color: 'var(--bedv-blue-deep)', fontWeight: 600, fontSize: '0.85rem' }}>
        Öffnen <ArrowRight size={14} aria-hidden="true" />
      </span>
    </Card>
  );
}

export function MeinBereich({ daten }: { daten: DashboardDaten }) {
  const { rolle, bereit } = useDemoAuth();

  if (!bereit) {
    // Kurzer Moment, bis der Speicher gelesen ist. Platzhalter statt
    // Sprung: Sonst blitzt „nicht angemeldet" auf, obwohl eine Rolle da ist.
    return (
      <div className="bedv-shell" style={{ paddingBlock: 52 }}>
        <div className="bedv-skeleton" style={{ height: 120, borderRadius: 14 }} />
      </div>
    );
  }

  if (!rolle) {
    return (
      <div className="bedv-shell" style={{ paddingBlock: 52 }}>
        <LeerZustand
          titel="Noch keine Rolle gewählt"
          text="Mein Bereich zeigt, was die Plattform nach dem Login kann. Wähle eine Demo-Rolle — es braucht kein Passwort."
          aktion={{ label: 'Rolle wählen', href: bedvPath('/login') }}
        />
      </div>
    );
  }

  const konto = kontoVon(rolle);
  const istKapitaen = rolle === 'kapitaen';
  const istVerwaltung = rolle === 'ligaleitung' || rolle === 'admin';
  const nachrichten = benachrichtigungenFuer(rolle);
  const { team, tabelle, naechstesSpiel, letztesSpiel, meineStatistik } = daten;

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '30px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Angemeldet als {konto.titel}</div>
              <h1 style={{ fontSize: 'clamp(1.7rem, 4.6vw, 2.4rem)', marginTop: 8 }}>Mein Bereich</h1>
              <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 8, maxWidth: '54ch', lineHeight: 1.6 }}>
                {konto.beschreibung}
              </p>
            </div>
            <Link href={bedvPath('/login')} className="bedv-btn bedv-btn--ondark bedv-btn--sm">
              Rolle wechseln
            </Link>
          </div>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px', display: 'grid', gap: 28 }}>
        {/* Verwaltungsrolle: Hinweis auf das eigene Dashboard */}
        {istVerwaltung && (
          <Card padding="17px 19px" style={{ borderColor: 'var(--bedv-accent)', background: 'var(--bedv-accent-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
              <ShieldCheck size={22} aria-hidden="true" style={{ color: 'var(--bedv-accent-deep)' }} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--bedv-accent-deep)' }}>
                  {daten.verwaltung.reduce((s, v) => s + v.wert, 0)} Vorgänge warten
                </h3>
                <p style={{ fontSize: '0.87rem', color: 'var(--bedv-accent-deep)', marginTop: 4 }}>
                  Mannschaftsmeldungen, Spielberichte und Spielberechtigungen liegen im
                  Bereich der Ligaleitung.
                </p>
              </div>
              <Link href={bedvPath('/ligaleitung')} className="bedv-btn bedv-btn--accent bedv-btn--sm">
                Zur Ligaleitung <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </Card>
        )}

        {/* Obere Reihe: Team, Liga, nächstes Spiel */}
        <div className="bedv-grid bedv-grid--3">
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 15px', background: 'var(--bedv-tint)', borderBottom: '1px solid var(--bedv-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />
              <span className="bedv-kicker">Mein Team</span>
            </div>
            <div style={{ padding: '15px 16px' }}>
              <Link href={bedvPath(`/teams/${team.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TeamWappen team={team} groesse={44} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontFamily: 'var(--bedv-font-display)', fontSize: '1.05rem' }}>
                    {team.name}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--bedv-ink-dim)' }}>
                    {daten.kaderGroesse} Spieler · {team.spieltag}, {team.beginn} Uhr
                  </span>
                </span>
              </Link>
              {daten.spielstaette && (
                <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--bedv-line-soft)', fontSize: '0.82rem', color: 'var(--bedv-ink-dim)' }}>
                  {daten.spielstaette.name}<br />{daten.spielstaette.adresse}
                </div>
              )}
            </div>
          </Card>

          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 15px', background: 'var(--bedv-tint)', borderBottom: '1px solid var(--bedv-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={15} aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />
              <span className="bedv-kicker">Meine Liga</span>
            </div>
            <div style={{ padding: '15px 16px' }}>
              <Link href={bedvPath(`/ligen/${daten.ligaSlug}`)}>
                <div style={{ fontWeight: 700, fontFamily: 'var(--bedv-font-display)', fontSize: '1.05rem' }}>
                  {daten.ligaName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-dim)' }}>{daten.saisonName}</div>
              </Link>
              {tabelle && (
                <div style={{ display: 'flex', gap: 20, marginTop: 13, paddingTop: 11, borderTop: '1px solid var(--bedv-line-soft)' }}>
                  <Stat wert={`${tabelle.platz}.`} label="Platz" ton="accent" />
                  <Stat wert={tabelle.punkte} label="Punkte" />
                  <Stat wert={`${tabelle.siege}-${tabelle.unentschieden}-${tabelle.niederlagen}`} label="S–U–N" />
                </div>
              )}
            </div>
          </Card>

          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 15px', background: 'var(--bedv-tint)', borderBottom: '1px solid var(--bedv-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarClock size={15} aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />
              <span className="bedv-kicker">Nächstes Spiel</span>
            </div>
            <div style={{ padding: '15px 16px' }}>
              {naechstesSpiel ? (
                <>
                  <Badge ton="gruen">{naechstesSpiel.relativ}</Badge>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--bedv-font-display)', fontSize: '1.05rem', marginTop: 9 }}>
                    {naechstesSpiel.heim ? 'gegen' : 'bei'} {naechstesSpiel.gegner}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--bedv-ink-dim)', marginTop: 4 }}>
                    {naechstesSpiel.datumText}, {naechstesSpiel.uhrzeit} Uhr<br />
                    {naechstesSpiel.ort}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.88rem' }}>
                  Für diese Spielzeit stehen keine weiteren Begegnungen an.
                </div>
              )}
              {letztesSpiel && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--bedv-line-soft)', fontSize: '0.8rem', color: 'var(--bedv-ink-dim)' }}>
                  Zuletzt: {letztesSpiel.heim ? 'gegen' : 'bei'} {letztesSpiel.gegner}{' '}
                  <strong
                    style={{
                      color: letztesSpiel.eigene > letztesSpiel.fremde ? 'var(--bedv-green)'
                        : letztesSpiel.eigene < letztesSpiel.fremde ? 'var(--bedv-red)' : 'var(--bedv-ink)',
                    }}
                  >
                    {letztesSpiel.eigene}:{letztesSpiel.fremde}
                  </strong>{' '}
                  ({letztesSpiel.datumText})
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Eigene Statistik */}
        {meineStatistik && !istVerwaltung && (
          <div>
            <SectionHead
              eyebrow="Meine Statistik"
              titel={meineStatistik.name}
              aktion={{ label: 'Zum Profil', href: bedvPath(`/spieler/${meineStatistik.id}`) }}
            />
            <Card padding="17px 19px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                <SpielerAvatar initialen={meineStatistik.initialen} groesse={46} akzent={meineStatistik.platz === 1} />
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--bedv-font-display)', fontSize: '1.1rem' }}>
                    {meineStatistik.name}
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--bedv-ink-dim)' }}>
                    Platz {meineStatistik.platz} von {meineStatistik.vonWievielen} in der {daten.ligaName}
                  </div>
                </div>
              </div>
              <div className="bedv-grid bedv-grid--4 bedv-grid--keep2">
                <Stat wert={meineStatistik.spiele} label="Spiele" />
                <Stat wert={meineStatistik.siege} label="Siege" ton="accent" />
                <Stat wert={`${meineStatistik.quote} %`} label="Siegquote" />
                <Stat wert={meineStatistik.hundertachtziger} label="180er" />
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 15, paddingTop: 13, borderTop: '1px solid var(--bedv-line-soft)', fontSize: '0.85rem', color: 'var(--bedv-ink-dim)' }}>
                <span>Höchstes Finish: <strong style={{ color: 'var(--bedv-ink)' }}>{meineStatistik.highFinish ?? '–'}</strong></span>
                <span>Kürzestes Leg: <strong style={{ color: 'var(--bedv-ink)' }}>{meineStatistik.shortLeg ?? '–'} Darts</strong></span>
                <span>Ranglistenpunkte: <strong style={{ color: 'var(--bedv-ink)' }}>{meineStatistik.punkte}</strong></span>
              </div>
            </Card>
          </div>
        )}

        {/* Aufgaben nach Rolle */}
        <div>
          <SectionHead
            eyebrow={istVerwaltung ? 'Verwaltung' : istKapitaen ? 'Meine Mannschaft' : 'Für mich'}
            titel="Was du hier erledigen kannst"
            text={istKapitaen
              ? 'Als Mannschaftsführer läuft der ganze Papierkram über diese vier Wege.'
              : istVerwaltung
                ? 'Prüfen, freigeben, verwalten — an einer Stelle statt über Mail und Telefon.'
                : 'Als Spieler brauchst du nichts zu verwalten. Das Wichtigste steht oben.'}
          />
          <div className="bedv-grid bedv-grid--4">
            {(istKapitaen || istVerwaltung) && (
              <>
                <Kachel icon={Users} titel="Kader verwalten" text="Aufstellung pflegen, Spieler nachmelden, Mannschaftsführung festlegen." ziel="/mein-bereich/mannschaft" />
                <Kachel icon={ClipboardList} titel="Mannschaft melden" text="Sechs geführte Schritte bis zur Meldung bei der Ligaleitung." ziel="/mein-bereich/mannschaft-anmelden" ton="accent" />
                <Kachel icon={BarChart3} titel="Spielbericht erfassen" text="Paarungen und Legs eintragen, Gesamtstand rechnet automatisch mit." ziel="/mein-bereich/spielbericht" />
                <Kachel icon={ScanLine} titel="Papierbogen hochladen" text="Foto aufnehmen, erkennen lassen, prüfen — als Zukunftsfeature." ziel="/mein-bereich/spielbericht/upload" />
              </>
            )}
            {!istKapitaen && !istVerwaltung && (
              <>
                <Kachel icon={Trophy} titel="Meine Liga" text="Tabelle, Spielplan, Ergebnisse und Einzelrangliste." ziel={`/ligen/${daten.ligaSlug}`} />
                <Kachel icon={Users} titel="Meine Mannschaft" text="Kader, Spielstätte, Termine und Saisonbilanz." ziel={`/teams/${team.id}`} />
                <Kachel icon={BarChart3} titel="Spielbericht ansehen" text="So sieht der digitale Bericht aus, den dein Kapitän einreicht." ziel="/mein-bereich/spielbericht" />
                <Kachel icon={CalendarClock} titel="Termine" text="Finaltag, Turniere und Veranstaltungen des Verbands." ziel="/events" />
              </>
            )}
          </div>
        </div>

        {/* Benachrichtigungen */}
        <div>
          <SectionHead eyebrow="Postfach" titel="Benachrichtigungen" />
          <Card padding="6px 17px 14px">
            {nachrichten.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: '1px solid var(--bedv-line-soft)', alignItems: 'flex-start' }}>
                <Bell
                  size={15}
                  aria-hidden="true"
                  style={{
                    marginTop: 3, flex: 'none',
                    color: n.art === 'aktion' ? 'var(--bedv-accent-deep)' : n.art === 'erfolg' ? 'var(--bedv-green)' : 'var(--bedv-blue)',
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.titel}</div>
                  <div style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.84rem', marginTop: 2 }}>{n.text}</div>
                </div>
                {n.ziel && (
                  <Link href={bedvPath(n.ziel)} className="bedv-btn bedv-btn--quiet bedv-btn--sm" style={{ flex: 'none' }}>
                    Öffnen
                  </Link>
                )}
              </div>
            ))}
            <p style={{ fontSize: '0.78rem', color: 'var(--bedv-ink-faint)', marginTop: 11 }}>
              In der echten Plattform zusätzlich als E-Mail oder Push-Nachricht.
            </p>
          </Card>
        </div>

        <DemoHinweis>
          Alles in diesem Bereich ist eine Oberflächen-Demo: Es wird nichts gespeichert,
          nichts versendet und nichts an einen Server übertragen.
        </DemoHinweis>
      </div>
    </>
  );
}
