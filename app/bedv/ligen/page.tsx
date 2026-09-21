// ============================================================
// Liga-Übersicht
// ============================================================
//
// Die zentrale Seite des Spielbetriebs: alle Staffeln beider Spielzeiten,
// nach Spielklasse geordnet. Die laufende Saison steht oben und vollständig,
// die abgeschlossene darunter als Archiv — mit demselben Aufbau, damit man
// nichts Neues lernen muss.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { SectionHead, Badge, Card } from '@/components/bedv/ui/bausteine';
import { TeamWappen } from '@/components/bedv/teams/team-wappen';
import { LIGEN, ligaFarbe, ligenDerSaison } from '@/data/bedv/ligen';
import { SAISONS } from '@/data/bedv/saison';
import { tabelleDerLiga, gespielteSpieltage, spieltageGesamt } from '@/data/bedv/tabelle';
import { teamById, teamsDerLiga } from '@/data/bedv/teams';

export const metadata: Metadata = {
  title: 'Ligen',
  description: 'Alle Staffeln der Winter- und Sommerliga — Tabellen, Spielpläne, Ergebnisse und Ranglisten.',
};

function LigaKarte({ slug }: { slug: string }) {
  const liga = LIGEN.find(l => l.slug === slug)!;
  const tabelle = tabelleDerLiga(slug);
  const gespielt = gespielteSpieltage(slug);
  const gesamt = spieltageGesamt(slug);
  const fertig = gespielt === gesamt;
  const farbe = ligaFarbe(liga.stufe);

  return (
    <Card href={bedvPath(`/ligen/${slug}`)} padding={0} style={{ overflow: 'hidden' }}>
      <span aria-hidden="true" style={{ height: 4, background: farbe, display: 'block' }} />
      <div style={{ padding: '15px 17px 17px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <h3 style={{ fontSize: '1.2rem' }}>{liga.name}</h3>
          <Badge ton={fertig ? 'leise' : 'gruen'}>
            {fertig ? 'abgeschlossen' : `${gespielt}. Spieltag`}
          </Badge>
        </div>

        <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.86rem', marginTop: 8, lineHeight: 1.55 }}>
          {liga.beschreibung}
        </p>

        <div style={{ marginTop: 13, paddingTop: 12, borderTop: '1px solid var(--bedv-line-soft)' }}>
          <div className="bedv-kicker" style={{ marginBottom: 8 }}>
            {fertig ? 'Endstand' : 'Spitze der Tabelle'}
          </div>
          {tabelle.slice(0, 3).map(z => {
            const team = teamById(z.teamId);
            if (!team) return null;
            return (
              <div key={z.teamId} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0' }}>
                <span className="bedv-kicker" style={{ width: 16, flex: 'none' }}>{z.platz}</span>
                <TeamWappen team={team} groesse={22} />
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {team.name}
                </span>
                <span className="bedv-num" style={{ fontWeight: 700, flex: 'none' }}>{z.punkte}</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--bedv-ink-faint)' }}>
          {teamsDerLiga(slug).length} Mannschaften · {gesamt} Spieltage
        </div>
      </div>
    </Card>
  );
}

export default function LigenSeite() {
  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '38px 34px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Spielbetrieb</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Ligen</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Winter- und Sommerliga mit allen Staffeln. Jede Liga führt auf eine Seite mit
            Tabelle, Spielplan, Ergebnissen, Einzelrangliste und Highlights.
          </p>
        </div>
      </header>

      {SAISONS.map(saison => {
        const ligen = ligenDerSaison(saison.id);
        if (ligen.length === 0) return null;
        return (
          <section
            key={saison.id}
            className={`bedv-section ${saison.aktuell ? '' : 'bedv-section--tinted'}`}
          >
            <div className="bedv-shell">
              <SectionHead
                eyebrow={saison.aktuell ? 'Laufende Spielzeit' : 'Archiv'}
                titel={saison.name}
                text={saison.aktuell
                  ? 'Aufstieg über die Staffelsieger, Abstieg über die letzten Plätze. Gespielt wird über 18 Einzelspiele je Begegnung.'
                  : 'Abgeschlossen. Tabellen, Spielpläne und Ranglisten bleiben vollständig erreichbar.'}
                aktion={saison.aktuell ? undefined : { label: 'Zum Archiv', href: bedvPath('/archiv') }}
              />
              <div className="bedv-grid bedv-grid--3">
                {ligen.map(l => <LigaKarte key={l.slug} slug={l.slug} />)}
              </div>
            </div>
          </section>
        );
      })}

      <section className="bedv-shell" style={{ paddingBottom: 52 }}>
        <Card padding="18px 20px">
          <h3 style={{ fontSize: '1.05rem' }}>Wie die Staffeln zusammenhängen</h3>
          <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 8, fontSize: '0.9rem', lineHeight: 1.62, maxWidth: '72ch' }}>
            Die <strong style={{ color: 'var(--bedv-ink)' }}>Bezirksliga</strong> ist die höchste
            Spielklasse. Darunter folgt die <strong style={{ color: 'var(--bedv-ink)' }}>A-Liga</strong>,
            dann die beiden <strong style={{ color: 'var(--bedv-ink)' }}>B-Staffeln</strong> und
            schließlich die <strong style={{ color: 'var(--bedv-ink)' }}>C-Staffeln</strong> als
            Einstieg für neue Mannschaften. Staffelsieger steigen auf, die letzten Plätze ab.
            Die Sommerliga läuft ohne Auf- und Abstieg.
          </p>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
            {[1, 2, 3, 4].map(ebene => {
              const beispiel = LIGEN.find(l => l.ebene === ebene && l.saisonId === SAISONS[0].id);
              if (!beispiel) return null;
              return (
                <Link key={ebene} href={bedvPath(`/ligen/${beispiel.slug}`)}>
                  <Badge ton={ebene === 1 ? 'accent' : 'blau'}>
                    {ebene}. Ebene · {beispiel.name}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>
    </>
  );
}
