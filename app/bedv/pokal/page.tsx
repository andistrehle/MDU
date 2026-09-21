// ============================================================
// Verbandspokal
// ============================================================
//
// Der Pokal ist in einer klassischen Verbandsseite meist eine PDF-Liste mit
// Paarungen. Hier bekommt er einen Turnierbaum — und damit das, was ihn
// ausmacht: den Blick nach vorne. Wer wem im Halbfinale begegnen könnte,
// steht in einer Liste nicht.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { Turnierbaum, PaarungKarte } from '@/components/bedv/leagues/turnierbaum';
import { Badge, Card, DemoHinweis, SectionHead, Stat } from '@/components/bedv/ui/bausteine';
import { TeamWappen } from '@/components/bedv/teams/team-wappen';
import { AKTUELLE_RUNDE, POKAL, POKAL_NAME, POKAL_RUNDEN, nochImWettbewerb, paarungenDerRunde } from '@/data/bedv/pokal';
import { teamById } from '@/data/bedv/teams';
import { ligaBySlug } from '@/data/bedv/ligen';
import { TERMINE } from '@/data/bedv/events';
import { datumLang } from '@/lib/bedv/format';

export const metadata: Metadata = {
  title: 'Pokal',
  description: 'Verbandspokal mit Turnierbaum über alle Runden, Hin- und Rückspielen und dem Finale.',
};

export default function PokalSeite() {
  const halbfinale = paarungenDerRunde(AKTUELLE_RUNDE);
  const drin = nochImWettbewerb();
  const gespielt = POKAL.filter(p => p.hinspiel !== null).length;
  const finaltermin = TERMINE.find(t => t.slug === 'pokalfinale');
  const aktuelleRundeName = POKAL_RUNDEN.find(r => r.runde === AKTUELLE_RUNDE)?.name ?? '';

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>K.-o.-Wettbewerb</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>{POKAL_NAME}</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '60ch', lineHeight: 1.6 }}>
            16 Mannschaften aus allen Spielklassen, Hin- und Rückspiel bis zum Halbfinale,
            das Finale an neutralem Ort. Bei Gleichstand nach beiden Spielen entscheidet ein
            Stechleg.
          </p>

          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--bedv-line-dark)' }}>
            <Stat wert={16} label="Teilnehmer" ton="dunkel" />
            <Stat wert={gespielt} label="Paarungen gespielt" ton="dunkel" />
            <Stat wert={drin.length} label="noch im Rennen" ton="dunkel" />
            <Stat wert={aktuelleRundeName} label="Aktuelle Runde" ton="dunkel" />
          </div>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 20px' }}>
        <SectionHead
          eyebrow="Aktuelle Runde"
          titel={aktuelleRundeName}
          text="Die Hinspiele sind gespielt, die Rückspiele stehen an. Beide Ergebnisse werden zusammengezählt."
        />
        <div className="bedv-grid bedv-grid--2">
          {halbfinale.map(p => <PaarungKarte key={p.id} paarung={p} />)}
        </div>
      </div>

      <section className="bedv-section bedv-section--tinted">
        <div className="bedv-shell">
          <SectionHead
            eyebrow="Alle Runden"
            titel="Turnierbaum"
            text="Vom Achtelfinale bis zum Endspiel. Auf schmalen Geräten stehen die Runden untereinander."
          />
          <Card padding="18px 14px">
            <Turnierbaum />
          </Card>
        </div>
      </section>

      <section className="bedv-section bedv-shell">
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }} className="bedv-liga-split">
          <div>
            <SectionHead eyebrow="Teilnehmerfeld" titel={`Noch im Wettbewerb: ${drin.length}`} />
            <div style={{ display: 'grid', gap: 10 }}>
              {drin.map(id => {
                const team = teamById(id);
                if (!team) return null;
                const liga = ligaBySlug(team.ligaSlug);
                return (
                  <Card key={id} href={bedvPath(`/teams/${team.id}`)} padding="12px 14px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <TeamWappen team={team} groesse={34} />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {team.name}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--bedv-ink-dim)' }}>
                          {liga?.name}
                        </span>
                      </span>
                      <Badge ton="accent">{aktuelleRundeName}</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <SectionHead eyebrow="Modus" titel="So läuft der Pokal" />
            <Card padding="16px 18px">
              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 9, color: 'var(--bedv-ink-soft)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                <li>16 Mannschaften, quer durch alle Spielklassen — die beiden Bestplatzierten jeder Staffel plus die nächstbesten.</li>
                <li>Achtel-, Viertel- und Halbfinale mit <strong style={{ color: 'var(--bedv-ink)' }}>Hin- und Rückspiel</strong>; gezählt wird die Summe beider Ergebnisse.</li>
                <li>Bei Gleichstand entscheidet ein <strong style={{ color: 'var(--bedv-ink)' }}>Stechleg</strong> am Automaten der Heimmannschaft des Rückspiels.</li>
                <li>Das Finale ist ein Einzelspiel an neutralem Ort.</li>
                <li>Gespielt wird wie in der Liga über 18 Einzelspiele.</li>
              </ul>

              {finaltermin && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--bedv-line)' }}>
                  <div className="bedv-kicker">Finaltermin</div>
                  <div style={{ fontFamily: 'var(--bedv-font-display)', fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>
                    {datumLang(finaltermin.datum)}
                  </div>
                  <div style={{ fontSize: '0.87rem', color: 'var(--bedv-ink-dim)', marginTop: 2 }}>
                    {finaltermin.uhrzeit} Uhr · {finaltermin.ort}
                  </div>
                  <Link href={bedvPath('/events')} className="bedv-btn bedv-btn--ghost bedv-btn--sm" style={{ marginTop: 12 }}>
                    Alle Termine
                  </Link>
                </div>
              )}
            </Card>

            <div style={{ marginTop: 16 }}>
              <DemoHinweis>
                Teilnehmerfeld, Auslosung und Ergebnisse sind Demo-Daten und stammen nicht
                vom BeDV.
              </DemoHinweis>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
