// ============================================================
// Einzelrangliste
// ============================================================

import Link from 'next/link';
import type { RanglistenZeile } from '@/data/bedv/typen';
import { spielerById } from '@/data/bedv/spieler';
import { teamById } from '@/data/bedv/teams';
import { bedvPath } from '@/lib/bedv/site';
import { SpielerAvatar } from '../teams/team-wappen';

export function RanglisteTabelle({
  zeilen, grenze, hervorheben, mitTeam = true,
}: {
  zeilen: RanglistenZeile[]; grenze?: number; hervorheben?: string; mitTeam?: boolean;
}) {
  const gezeigt = grenze ? zeilen.slice(0, grenze) : zeilen;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="bedv-table">
        <thead>
          <tr>
            <th style={{ width: 34 }}>#</th>
            <th>Spieler</th>
            {mitTeam && <th className="bedv-col-sm" style={{ textAlign: 'left' }}>Mannschaft</th>}
            <th>Sp</th>
            <th>S</th>
            <th className="bedv-col-md">N</th>
            <th className="bedv-col-md">Legs</th>
            <th className="bedv-col-sm">Quote</th>
            <th>Pkt</th>
          </tr>
        </thead>
        <tbody>
          {gezeigt.map(z => {
            const s = spielerById(z.spielerId);
            const team = teamById(z.teamId);
            if (!s) return null;
            const markiert = hervorheben === z.spielerId;
            return (
              <tr key={z.spielerId} style={markiert ? { background: 'var(--bedv-accent-soft)' } : undefined}>
                <td
                  className={`bedv-rank ${z.platz <= 3 ? 'bedv-rank--gold' : ''}`}
                  style={{ fontWeight: 700, color: 'var(--bedv-ink-dim)' }}
                >
                  {z.platz}
                </td>
                <td>
                  <Link href={bedvPath(`/spieler/${s.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <SpielerAvatar initialen={s.initialen} groesse={26} akzent={z.platz === 1} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: markiert ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.name}
                      </span>
                      {s.spitzname && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--bedv-ink-faint)' }}>
                          {`„${s.spitzname}“`}
                        </span>
                      )}
                    </span>
                  </Link>
                </td>
                {mitTeam && (
                  <td className="bedv-col-sm" style={{ textAlign: 'left', color: 'var(--bedv-ink-dim)' }}>
                    {team && (
                      <Link href={bedvPath(`/teams/${team.id}`)} style={{ whiteSpace: 'nowrap' }}>{team.kurz}</Link>
                    )}
                  </td>
                )}
                <td>{z.spiele}</td>
                <td>{z.siege}</td>
                <td className="bedv-col-md">{z.niederlagen}</td>
                <td className="bedv-col-md" style={{ color: 'var(--bedv-ink-dim)', whiteSpace: 'nowrap' }}>
                  {z.legsFuer}:{z.legsGegen}
                </td>
                <td className="bedv-col-sm" style={{ color: 'var(--bedv-ink-dim)' }}>{z.quote} %</td>
                <td className="bedv-strong" style={{ fontSize: '1rem' }}>{z.punkte}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
