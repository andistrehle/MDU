// ============================================================
// Ligatabelle
// ============================================================
//
// Auf dem Desktop alle Spalten, auf dem Handy die, die etwas erklären.
// WEGGELASSEN statt zusammengequetscht: Eine Tabelle mit acht Spalten auf
// 360 px Breite ist unlesbar, egal wie klein man die Schrift macht. Auf dem
// Handy bleiben Platz, Mannschaft, Spiele, Differenz und Punkte — der Rest
// (Siege, Unentschieden, Niederlagen, Spiele für/gegen) steht auf der
// Mannschaftsseite.
//
// Aufstiegs- und Abstiegsplätze bekommen einen schmalen Farbbalken links
// statt einer eingefärbten Zeile: Die Zeile bleibt lesbar, der Hinweis ist
// trotzdem eindeutig.
// ============================================================

import Link from 'next/link';
import type { TabellenZeile } from '@/data/bedv/typen';
import { teamById } from '@/data/bedv/teams';
import { bedvPath } from '@/lib/bedv/site';
import { TeamWappen } from '../teams/team-wappen';
import { FormKurve } from '../ui/bausteine';

export interface TabelleProps {
  zeilen: TabellenZeile[];
  /** Wie viele Plätze oben sind Aufstiegsplätze? */
  aufstieg?: number;
  /** Wie viele Plätze unten sind Abstiegsplätze? */
  abstieg?: number;
  /** Nur die ersten n Zeilen (Tabellenkarte auf der Startseite). */
  grenze?: number;
  /** Diese Mannschaft hervorheben (Mannschaftsprofil, „mein Team"). */
  hervorheben?: string;
  /** Schlanke Fassung ohne Formkurve und Nebenspalten. */
  kompakt?: boolean;
}

export function Tabelle({
  zeilen, aufstieg = 0, abstieg = 0, grenze, hervorheben, kompakt = false,
}: TabelleProps) {
  const gezeigt = grenze ? zeilen.slice(0, grenze) : zeilen;
  const gesamt = zeilen.length;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="bedv-table">
        <thead>
          <tr>
            <th style={{ width: 34 }}>#</th>
            <th>Mannschaft</th>
            <th>Sp</th>
            {!kompakt && <th className="bedv-col-md">S</th>}
            {!kompakt && <th className="bedv-col-md">U</th>}
            {!kompakt && <th className="bedv-col-md">N</th>}
            {!kompakt && <th className="bedv-col-sm">Spiele</th>}
            <th>Diff</th>
            {!kompakt && <th className="bedv-col-md">Form</th>}
            <th>Pkt</th>
          </tr>
        </thead>
        <tbody>
          {gezeigt.map(z => {
            const team = teamById(z.teamId);
            if (!team) return null;
            const istAufstieg = aufstieg > 0 && z.platz <= aufstieg;
            const istAbstieg = abstieg > 0 && z.platz > gesamt - abstieg;
            const markiert = hervorheben === z.teamId;
            return (
              <tr
                key={z.teamId}
                style={markiert ? { background: 'var(--bedv-accent-soft)' } : undefined}
              >
                <td
                  className={`bedv-rank ${istAufstieg ? 'bedv-rank--gold' : istAbstieg ? 'bedv-rank--down' : ''}`}
                  style={{ fontWeight: 700, color: 'var(--bedv-ink-dim)' }}
                >
                  {z.platz}
                </td>
                <td>
                  <Link
                    href={bedvPath(`/teams/${team.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}
                  >
                    <TeamWappen team={team} groesse={26} />
                    <span
                      style={{
                        fontWeight: markiert ? 700 : 500, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {team.name}
                    </span>
                  </Link>
                </td>
                <td>{z.spiele}</td>
                {!kompakt && <td className="bedv-col-md">{z.siege}</td>}
                {!kompakt && <td className="bedv-col-md">{z.unentschieden}</td>}
                {!kompakt && <td className="bedv-col-md">{z.niederlagen}</td>}
                {!kompakt && (
                  <td className="bedv-col-sm" style={{ color: 'var(--bedv-ink-dim)', whiteSpace: 'nowrap' }}>
                    {z.spieleFuer}:{z.spieleGegen}
                  </td>
                )}
                <td style={{ color: z.differenz > 0 ? 'var(--bedv-green)' : z.differenz < 0 ? 'var(--bedv-red)' : 'var(--bedv-ink-dim)' }}>
                  {z.differenz > 0 ? '+' : ''}{z.differenz}
                </td>
                {!kompakt && (
                  <td className="bedv-col-md" style={{ textAlign: 'right' }}>
                    <FormKurve form={z.form} />
                  </td>
                )}
                <td className="bedv-strong" style={{ fontSize: '1rem' }}>{z.punkte}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {(aufstieg > 0 || abstieg > 0) && !grenze && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: '0.76rem', color: 'var(--bedv-ink-dim)' }}>
          {aufstieg > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true" style={{ width: 3, height: 13, borderRadius: 2, background: 'var(--bedv-accent)' }} />
              Aufstieg
            </span>
          )}
          {abstieg > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true" style={{ width: 3, height: 13, borderRadius: 2, background: 'var(--bedv-red)' }} />
              Abstieg
            </span>
          )}
          <span>Sp = Spiele · Diff = Differenz der gewonnenen Einzelspiele · Pkt = Punkte</span>
        </div>
      )}
    </div>
  );
}
