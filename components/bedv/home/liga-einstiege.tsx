// ============================================================
// Startseite — Einstieg in die Spielklassen
// ============================================================
//
// Für den allergrößten Teil der Besucher ist das der erste Klick: „Wo steht
// meine Liga?" Deshalb steht auf jeder Karte nicht nur der Name, sondern
// auch schon der Tabellenführer und der Spieltagsstand — die Frage ist
// damit zur Hälfte beantwortet, bevor jemand klickt.
// ============================================================

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { LIGEN_AKTUELL, ligaFarbe } from '@/data/bedv/ligen';
import { tabelleDerLiga, gespielteSpieltage, spieltageGesamt } from '@/data/bedv/tabelle';
import { teamById, teamsDerLiga } from '@/data/bedv/teams';
import { TeamWappen } from '../teams/team-wappen';

export function LigaEinstiege() {
  return (
    <div className="bedv-grid bedv-grid--4">
      {LIGEN_AKTUELL.map(liga => {
        const tabelle = tabelleDerLiga(liga.slug);
        const fuehrer = teamById(tabelle[0]?.teamId ?? '');
        const gespielt = gespielteSpieltage(liga.slug);
        const gesamt = spieltageGesamt(liga.slug);
        const farbe = ligaFarbe(liga.stufe);

        return (
          <Link
            key={liga.slug}
            href={bedvPath(`/ligen/${liga.slug}`)}
            className="bedv-card bedv-card--link"
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <span aria-hidden="true" style={{ height: 4, background: farbe, display: 'block' }} />
            <div style={{ padding: '14px 15px 15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ fontSize: '1.16rem' }}>{liga.name}</h3>
                <ArrowUpRight size={16} aria-hidden="true" style={{ color: 'var(--bedv-ink-faint)', flex: 'none', marginTop: 2 }} />
              </div>
              <div className="bedv-kicker" style={{ marginTop: 4 }}>
                {teamsDerLiga(liga.slug).length} Mannschaften · {gespielt}/{gesamt} Spieltage
              </div>

              {fuehrer && (
                <div
                  style={{
                    marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--bedv-line-soft)',
                    display: 'flex', alignItems: 'center', gap: 9, minWidth: 0,
                  }}
                >
                  <TeamWappen team={fuehrer} groesse={28} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="bedv-kicker" style={{ display: 'block', fontSize: '0.6rem' }}>Tabellenführer</span>
                    <span
                      style={{
                        display: 'block', fontWeight: 600, fontSize: '0.86rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {fuehrer.name}
                    </span>
                  </span>
                  <span className="bedv-score" style={{ fontSize: '1.05rem', flex: 'none', color: farbe }}>
                    {tabelle[0].punkte}
                  </span>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
