// ============================================================
// Highlight-Listen
// ============================================================
//
// Vier Bestenlisten nebeneinander: 180er, 171er, höchstes Finish, kürzestes
// Leg. Die ersten drei Plätze stehen groß, der Rest als Liste darunter —
// eine gleichmäßige Zehnerliste würde den Reiz wegnehmen, und genau der ist
// der Grund, warum Spieler diese Seite aufrufen.
// ============================================================

import Link from 'next/link';
import type { HighlightZeile } from '@/data/bedv/typen';
import { spielerById } from '@/data/bedv/spieler';
import { teamById } from '@/data/bedv/teams';
import { bedvPath } from '@/lib/bedv/site';
import { SpielerAvatar } from '../teams/team-wappen';
import { LeerZustand } from '../ui/bausteine';

const MEDAILLE = ['🥇', '🥈', '🥉'];

function HighlightListe({
  titel, symbol, einheit, zeilen, farbe, hinweis,
}: {
  titel: string; symbol: string; einheit: string;
  zeilen: HighlightZeile[]; farbe: string; hinweis: string;
}) {
  const podest = zeilen.slice(0, 3);
  const rest = zeilen.slice(3, 10);

  return (
    <div className="bedv-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '13px 16px', borderBottom: '1px solid var(--bedv-line)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bedv-tint)',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>{symbol}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--bedv-font-display)', fontWeight: 700, fontSize: '0.98rem' }}>{titel}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--bedv-ink-dim)' }}>{hinweis}</div>
        </div>
      </div>

      {podest.length === 0 ? (
        <div style={{ padding: 18 }}>
          <LeerZustand titel="Noch keine Werte" text="Sobald Spielberichte vorliegen, füllt sich diese Liste von selbst." />
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 16px', display: 'grid', gap: 9 }}>
            {podest.map((z, i) => {
              const s = spielerById(z.spielerId);
              const team = teamById(z.teamId);
              if (!s) return null;
              return (
                <Link
                  key={z.spielerId}
                  href={bedvPath(`/spieler/${s.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span aria-hidden="true" style={{ fontSize: '1.05rem', width: 22, flex: 'none' }}>
                    {MEDAILLE[i] ?? ''}
                  </span>
                  <SpielerAvatar initialen={s.initialen} groesse={30} akzent={i === 0} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--bedv-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {team?.name}
                    </span>
                  </span>
                  <span className="bedv-score" style={{ fontSize: '1.22rem', color: farbe, flex: 'none' }}>
                    {z.wert}
                    <span style={{ fontSize: '0.66rem', fontWeight: 600, marginLeft: 3, color: 'var(--bedv-ink-dim)' }}>
                      {einheit}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {rest.length > 0 && (
            <div style={{ borderTop: '1px solid var(--bedv-line-soft)', padding: '8px 16px 12px' }}>
              {rest.map(z => {
                const s = spielerById(z.spielerId);
                if (!s) return null;
                return (
                  <Link
                    key={z.spielerId}
                    href={bedvPath(`/spieler/${s.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span className="bedv-kicker" style={{ width: 22, flex: 'none' }}>{z.platz}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </span>
                    <span className="bedv-num" style={{ fontWeight: 700, flex: 'none' }}>{z.wert}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function HighlightsPanel({
  hundertachtziger, einhunderteinundsiebzig, highFinish, shortLeg,
}: {
  hundertachtziger: HighlightZeile[];
  einhunderteinundsiebzig: HighlightZeile[];
  highFinish: HighlightZeile[];
  shortLeg: HighlightZeile[];
}) {
  return (
    <div className="bedv-grid bedv-grid--2">
      <HighlightListe
        titel="Meiste 180er" symbol="🔥" einheit="×" farbe="var(--bedv-red)"
        hinweis="Das Maximum — drei Triple 20"
        zeilen={hundertachtziger}
      />
      <HighlightListe
        titel="Meiste 171er" symbol="⚡" einheit="×" farbe="var(--bedv-accent-deep)"
        hinweis="Drei Triple 19"
        zeilen={einhunderteinundsiebzig}
      />
      <HighlightListe
        titel="Höchstes Finish" symbol="🎯" einheit="Pkt" farbe="var(--bedv-blue-deep)"
        hinweis="Ausgecheckt in einer Aufnahme"
        zeilen={highFinish}
      />
      <HighlightListe
        titel="Kürzestes Leg" symbol="🏁" einheit="Darts" farbe="var(--bedv-green)"
        hinweis="Weniger ist besser"
        zeilen={shortLeg}
      />
    </div>
  );
}
