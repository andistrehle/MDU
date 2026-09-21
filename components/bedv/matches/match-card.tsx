// ============================================================
// Begegnungskarten
// ============================================================
//
// Zwei Formen, ein Baustein: die kommende Begegnung (Termin, Ort) und das
// Ergebnis (Stand groß in der Mitte). Beide zeigen dieselben Mannschaften
// an derselben Stelle — wer im Spielplan nach unten scrollt, muss nicht
// umlernen, sobald der gespielte Teil beginnt.
// ============================================================

import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import type { Begegnung } from '@/data/bedv/typen';
import { teamById } from '@/data/bedv/teams';
import { spielstaetteById } from '@/data/bedv/spielstaetten';
import { ligaBySlug } from '@/data/bedv/ligen';
import { bedvPath } from '@/lib/bedv/site';
import { datumKurz, heute, relativerTag, tagUndDatum, wochentag } from '@/lib/bedv/format';
import { TeamWappen } from '../teams/team-wappen';
import { Badge } from '../ui/bausteine';

function TeamZeile({
  teamId, punkte, gewinner, rechts = false,
}: {
  teamId: string; punkte?: number; gewinner?: boolean; rechts?: boolean;
}) {
  const team = teamById(teamId);
  if (!team) return null;
  return (
    <Link
      href={bedvPath(`/teams/${team.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1,
        flexDirection: rechts ? 'row-reverse' : 'row',
        textAlign: rechts ? 'right' : 'left',
      }}
    >
      <TeamWappen team={team} groesse={30} />
      <span
        style={{
          minWidth: 0, fontWeight: gewinner ? 700 : 500, fontSize: '0.92rem',
          color: gewinner === false ? 'var(--bedv-ink-dim)' : 'var(--bedv-ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {team.name}
      </span>
      {punkte !== undefined && (
        <span
          className="bedv-score"
          style={{
            fontSize: '1.15rem', marginInline: rechts ? '0 auto' : 'auto 0',
            color: gewinner ? 'var(--bedv-navy-900)' : 'var(--bedv-ink-dim)',
          }}
        >
          {punkte}
        </span>
      )}
    </Link>
  );
}

export function MatchCard({
  begegnung, mitLiga = true, kompakt = false,
}: {
  begegnung: Begegnung; mitLiga?: boolean; kompakt?: boolean;
}) {
  const liga = ligaBySlug(begegnung.ligaSlug);
  const ort = spielstaetteById(begegnung.spielstaetteId);
  const gespielt = begegnung.status === 'gespielt';
  const heimGewinnt = gespielt && begegnung.heimPunkte > begegnung.gastPunkte;
  const gastGewinnt = gespielt && begegnung.gastPunkte > begegnung.heimPunkte;
  const unentschieden = gespielt && begegnung.heimPunkte === begegnung.gastPunkte;

  return (
    <div className="bedv-card" style={{ padding: kompakt ? '12px 14px' : '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          {mitLiga && liga && (
            <Link href={bedvPath(`/ligen/${liga.slug}`)}>
              <Badge ton={liga.ebene === 1 ? 'accent' : 'blau'}>{liga.name}</Badge>
            </Link>
          )}
          <span className="bedv-kicker" style={{ whiteSpace: 'nowrap' }}>
            {begegnung.spieltag}. Spieltag
          </span>
        </div>
        {gespielt
          ? <Badge ton="leise">{datumKurz(begegnung.datum)}</Badge>
          : <Badge ton="gruen">{relativerTag(begegnung.datum, heute())}</Badge>}
      </div>

      {gespielt ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamZeile teamId={begegnung.heimTeamId} punkte={begegnung.heimPunkte} gewinner={unentschieden ? undefined : heimGewinnt} />
          <span aria-hidden="true" style={{ color: 'var(--bedv-line-hard)', fontWeight: 700, flex: 'none' }}>:</span>
          <TeamZeile teamId={begegnung.gastTeamId} punkte={begegnung.gastPunkte} gewinner={unentschieden ? undefined : gastGewinnt} rechts />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 7 }}>
          <TeamZeile teamId={begegnung.heimTeamId} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
            <span className="bedv-kicker" style={{ color: 'var(--bedv-ink-faint)' }}>gegen</span>
            <hr className="bedv-divider" style={{ flex: 1 }} />
          </div>
          <TeamZeile teamId={begegnung.gastTeamId} />
        </div>
      )}

      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 11, paddingTop: 10,
          borderTop: '1px solid var(--bedv-line-soft)',
          fontSize: '0.79rem', color: 'var(--bedv-ink-dim)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Clock size={13} aria-hidden="true" />
          {wochentag(begegnung.datum)}, {datumKurz(begegnung.datum)} · {begegnung.uhrzeit}
        </span>
        {ort && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
            <MapPin size={13} aria-hidden="true" style={{ flex: 'none' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ort.name}, {ort.ort}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

/** Schmale Ergebniszeile — für Listen im Mannschafts- und Spielerprofil. */
export function ErgebnisZeile({ begegnung, ausSichtVon }: { begegnung: Begegnung; ausSichtVon?: string }) {
  const heim = teamById(begegnung.heimTeamId);
  const gast = teamById(begegnung.gastTeamId);
  if (!heim || !gast) return null;

  const gespielt = begegnung.status === 'gespielt';
  const istHeim = ausSichtVon === begegnung.heimTeamId;
  const gegner = ausSichtVon ? (istHeim ? gast : heim) : null;
  const eigene = istHeim ? begegnung.heimPunkte : begegnung.gastPunkte;
  const fremde = istHeim ? begegnung.gastPunkte : begegnung.heimPunkte;
  const ergebnis = !gespielt ? null : eigene > fremde ? 'S' : eigene < fremde ? 'U-N' : 'U';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
        borderBottom: '1px solid var(--bedv-line-soft)',
      }}
    >
      <span className="bedv-kicker" style={{ width: 52, flex: 'none' }}>{datumKurz(begegnung.datum)}</span>

      {gegner ? (
        <>
          <span style={{ width: 24, flex: 'none' }} className="bedv-kicker">{istHeim ? 'H' : 'A'}</span>
          <Link href={bedvPath(`/teams/${gegner.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <TeamWappen team={gegner} groesse={24} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
              {gegner.name}
            </span>
          </Link>
          {gespielt ? (
            <span
              className="bedv-score"
              style={{
                fontSize: '0.95rem', flex: 'none',
                color: ergebnis === 'S' ? 'var(--bedv-green)' : ergebnis === 'U' ? 'var(--bedv-ink-dim)' : 'var(--bedv-red)',
              }}
            >
              {eigene}:{fremde}
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-faint)', flex: 'none' }}>{tagUndDatum(begegnung.datum)}</span>
          )}
        </>
      ) : (
        <>
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {heim.name} – {gast.name}
          </span>
          <span className="bedv-score" style={{ fontSize: '0.95rem', flex: 'none' }}>
            {gespielt ? `${begegnung.heimPunkte}:${begegnung.gastPunkte}` : '–'}
          </span>
        </>
      )}
    </div>
  );
}
