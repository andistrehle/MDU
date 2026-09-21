// ============================================================
// Spielplan — nach Spieltagen gebündelt
// ============================================================
//
// Nicht eine endlose Tabelle, sondern Blöcke je Spieltag mit Datum als
// Überschrift. Der nächste Spieltag ist hervorgehoben — das ist die Frage,
// mit der neun von zehn Besuchern auf diese Seite kommen.
// ============================================================

import type { Begegnung } from '@/data/bedv/typen';
import { nachSpieltagen } from '@/data/bedv/tabelle';
import { datumLang, heute, wochentag } from '@/lib/bedv/format';
import { Badge } from '../ui/bausteine';
import { MatchCard } from './match-card';

export function Spielplan({
  begegnungen, mitLiga = false, hervorhebenTeam,
}: {
  begegnungen: Begegnung[]; mitLiga?: boolean; hervorhebenTeam?: string;
}) {
  const bloecke = nachSpieltagen(begegnungen);
  const heuteTag = heute();
  // Der erste Spieltag, der noch nicht gespielt ist.
  const naechster = bloecke.find(b => b.spiele.some(s => s.status === 'geplant'))?.spieltag;

  return (
    <div style={{ display: 'grid', gap: 26 }}>
      {bloecke.map(({ spieltag, spiele }) => {
        const tag = spiele[0]?.datum;
        const offen = spiele.some(s => s.status === 'geplant');
        const istNaechster = spieltag === naechster;

        return (
          <section key={spieltag} id={`spieltag-${spieltag}`}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap',
                marginBottom: 12, paddingBottom: 9,
                borderBottom: `2px solid ${istNaechster ? 'var(--bedv-accent)' : 'var(--bedv-line)'}`,
              }}
            >
              <h3 style={{ fontSize: '1.14rem' }}>{spieltag}. Spieltag</h3>
              {tag && (
                <span style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.88rem' }}>
                  {wochentag(tag)}, {datumLang(tag)}
                </span>
              )}
              {istNaechster && <Badge ton="accent">Als nächstes</Badge>}
              {!offen && <Badge ton="leise">Abgeschlossen</Badge>}
              {tag && tag === heuteTag && <Badge ton="gruen">Heute</Badge>}
            </div>

            <div className="bedv-grid bedv-grid--2">
              {spiele.map(b => (
                <div
                  key={b.id}
                  style={
                    hervorhebenTeam && (b.heimTeamId === hervorhebenTeam || b.gastTeamId === hervorhebenTeam)
                      ? { outline: '2px solid var(--bedv-accent)', borderRadius: 'var(--bedv-radius)' }
                      : undefined
                  }
                >
                  <MatchCard begegnung={b} mitLiga={mitLiga} kompakt />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
