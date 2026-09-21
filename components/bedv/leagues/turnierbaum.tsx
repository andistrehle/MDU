// ============================================================
// Pokal-Turnierbaum
// ============================================================
//
// Vier Spalten — Achtel-, Viertel-, Halbfinale, Finale. Jede Spalte verteilt
// ihre Paarungen gleichmäßig über die volle Höhe (`space-around`), dadurch
// sitzt jede Partie automatisch mittig zwischen ihren beiden Vorgängern,
// ohne dass irgendwo Koordinaten stehen. Das trägt für jede Feldgröße.
//
// Die Verbindungslinien sind schmale Flächen zwischen den Spalten, keine
// SVG-Pfade: Sie richten sich damit von selbst mit, wenn Karten wachsen —
// etwa weil ein Mannschaftsname umbricht.
//
// Auf schmalen Geräten fällt das Nebeneinander weg: Dort stehen die Runden
// untereinander. Ein waagrecht gequetschter Turnierbaum ist auf 375 px
// unbrauchbar, eine Liste nach Runden nicht.
// ============================================================

import Link from 'next/link';
import type { PokalPaarung, PokalRunde } from '@/data/bedv/typen';
import { teamById } from '@/data/bedv/teams';
import { gesamtstand, paarungenDerRunde, POKAL_RUNDEN } from '@/data/bedv/pokal';
import { bedvPath } from '@/lib/bedv/site';
import { datumKurz } from '@/lib/bedv/format';
import { TeamWappen } from '../teams/team-wappen';

function Seite({
  teamId, punkte, sieger, offen,
}: {
  teamId: string | null; punkte: number | undefined; sieger: boolean; offen: boolean;
}) {
  const team = teamId ? teamById(teamId) : null;

  if (!team) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bedv-tint-2)', flex: 'none' }}
        />
        <span style={{ color: 'var(--bedv-ink-faint)', fontSize: '0.82rem', fontStyle: 'italic' }}>
          noch offen
        </span>
      </div>
    );
  }

  return (
    <Link
      href={bedvPath(`/teams/${team.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', minWidth: 0,
        background: sieger ? 'var(--bedv-accent-soft)' : undefined,
        borderRadius: 7,
      }}
    >
      <TeamWappen team={team} groesse={22} />
      <span
        style={{
          flex: 1, minWidth: 0, fontSize: '0.82rem',
          fontWeight: sieger ? 700 : 500,
          color: offen ? 'var(--bedv-ink)' : sieger ? 'var(--bedv-ink)' : 'var(--bedv-ink-dim)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {team.name}
      </span>
      <span className="bedv-score" style={{ fontSize: '0.9rem', flex: 'none', color: sieger ? 'var(--bedv-accent-deep)' : 'var(--bedv-ink-dim)' }}>
        {punkte ?? '–'}
      </span>
    </Link>
  );
}

export function PaarungKarte({ paarung }: { paarung: PokalPaarung }) {
  const stand = gesamtstand(paarung);
  const offen = paarung.siegerTeamId === null;

  return (
    <div
      className="bedv-card"
      style={{
        padding: 4,
        borderColor: offen && paarung.hinspiel ? 'var(--bedv-accent)' : undefined,
      }}
    >
      <Seite
        teamId={paarung.heimTeamId}
        punkte={stand?.[0]}
        sieger={paarung.siegerTeamId !== null && paarung.siegerTeamId === paarung.heimTeamId}
        offen={offen}
      />
      <hr className="bedv-divider" style={{ marginInline: 9 }} />
      <Seite
        teamId={paarung.gastTeamId}
        punkte={stand?.[1]}
        sieger={paarung.siegerTeamId !== null && paarung.siegerTeamId === paarung.gastTeamId}
        offen={offen}
      />
      {paarung.hinspiel && (
        <div
          style={{
            padding: '5px 9px 3px', fontSize: '0.69rem', color: 'var(--bedv-ink-faint)',
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}
        >
          <span>Hin {datumKurz(paarung.hinspiel.datum)} · {paarung.hinspiel.heim}:{paarung.hinspiel.gast}</span>
          {paarung.rueckspiel
            ? <span>Rück {datumKurz(paarung.rueckspiel.datum)} · {paarung.rueckspiel.heim}:{paarung.rueckspiel.gast}</span>
            : <span style={{ color: 'var(--bedv-accent-deep)', fontWeight: 600 }}>Rückspiel steht aus</span>}
        </div>
      )}
    </div>
  );
}

export function Turnierbaum() {
  return (
    <div className="bedv-baum-huelle">
      <div className="bedv-baum">
        {POKAL_RUNDEN.map(({ runde, name }, spalte) => (
          <div key={runde} className="bedv-baum-spalte">
            <div className="bedv-kicker bedv-baum-kopf">{name}</div>
            <div className="bedv-baum-partien">
              {paarungenDerRunde(runde as PokalRunde).map(p => (
                <div key={p.id} className="bedv-baum-partie">
                  <PaarungKarte paarung={p} />
                  {spalte < POKAL_RUNDEN.length - 1 && <span aria-hidden="true" className="bedv-baum-linie" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
