import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import {
  team27, venue27, spieltage27, spieleFuerTeam27, wochenendeText,
  type Liga27, type Spieltag27,
} from '@/lib/data/saison-2027';

// Anzeige des vorläufigen Spielplans 2026/27 (Server-tauglich, keine Hooks).

const mono: React.CSSProperties = { fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11.5 };
const faint: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' };

export function TeamChip27({ id, align = 'left', size = 26 }: { id: string; align?: 'left' | 'right'; size?: number }) {
  const t = team27(id);
  const name = t?.name ?? id;
  return (
    <TeamLink teamId={id} teamName={name} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, justifyContent: align === 'right' ? 'flex-end' : 'flex-start', flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
      <TeamBadge initials={(t?.short ?? name).slice(0, 3)} color={t?.color} logoUrl={t?.logoUrl ?? undefined} size={size} />
      <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, lineHeight: 1.25, color: 'var(--th-text-strong)', overflowWrap: 'break-word', hyphens: 'auto', textAlign: align }}>{name}</span>
    </TeamLink>
  );
}

function SpieltagKopf({ md, color }: { md: Spieltag27; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>
        <span style={{ display: 'inline-block', width: 3, height: 14, background: color, borderRadius: 2, marginRight: 8, verticalAlign: '-1px' }} />
        {md.nr}. Spieltag
      </span>
      <span style={{ ...mono, color: 'var(--th-text-muted)' }}>Wochenende {wochenendeText(md.fri, md.sun)}</span>
    </div>
  );
}

export function SpieltagKarte27({ md, color }: { md: Spieltag27; color: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)' }}>
      <SpieltagKopf md={md} color={color} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {md.games.map(g => {
          const v = venue27(team27(g.home)?.venueId);
          return (
            <div key={g.home + g.away} style={{ borderTop: '1px solid var(--th-line-4)', paddingTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: 8 }}>
                <TeamChip27 id={g.home} />
                <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 12, color: 'var(--th-text-faint)' }}>VS</span>
                <TeamChip27 id={g.away} align="right" />
              </div>
              <div style={{ ...faint, marginTop: 4 }}>
                {v?.name ?? 'Spielort folgt'}{g.derby ? ' · Derby' : ''}
              </div>
            </div>
          );
        })}
        {md.bye && (
          <div style={{ ...faint, borderTop: '1px solid var(--th-line-4)', paddingTop: 8 }}>
            Spielfrei: {team27(md.bye)?.name ?? md.bye}
          </div>
        )}
      </div>
    </div>
  );
}

/** Alle Spieltage einer Liga, Hin- und Rückrunde mit Zwischenüberschrift. */
export function LigaSpielplan27({ liga }: { liga: Liga27 }) {
  const mds = spieltage27(liga.code);
  const hin = mds.filter(m => m.half === 'hin'), rueck = mds.filter(m => m.half === 'rueck');
  const block = (titel: string, list: Spieltag27[]) => (
    <div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--th-text-muted)', margin: '0 0 10px' }}>{titel}</div>
      <div className="mdu-spieltag-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 12 }}>
        {list.map(md => <SpieltagKarte27 key={md.nr} md={md} color={liga.color} />)}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {block('Hinrunde', hin)}
      {block('Rückrunde', rueck)}
    </div>
  );
}

/** Spiele eines Teams als Liste (Spieltag, Wochenende, H/A, Gegner, Spielort). */
export function TeamSpielplan27({ teamId }: { teamId: string }) {
  const spiele = spieleFuerTeam27(teamId);
  const self = team27(teamId);
  if (!self) return null;
  return (
    <div style={{ borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', overflow: 'hidden' }}>
      {spiele.map((s, i) => {
        const ort = venue27(team27(s.heim ? teamId : s.gegner)?.venueId);
        return (
          <div key={s.spieltag} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 12, alignItems: 'center', padding: '10px 14px', borderTop: i ? '1px solid var(--th-line-4)' : 'none' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>{s.spieltag}. ST</div>
              <div style={{ ...mono, fontSize: 10.5, color: 'var(--th-text-faint)' }}>{wochenendeText(s.fri, s.sun, false)}</div>
            </div>
            {s.gegner ? (
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span title={s.heim ? 'Heimspiel' : 'Auswärtsspiel'} style={{ flexShrink: 0, width: 22, textAlign: 'center', padding: '2px 0', borderRadius: 5, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, background: s.heim ? 'var(--th-accent)' : 'var(--th-line-8)', color: s.heim ? '#fff' : 'var(--th-text-muted)' }}>{s.heim ? 'H' : 'A'}</span>
                  <TeamChip27 id={s.gegner} size={22} />
                </div>
                <div style={{ ...faint, marginTop: 3, marginLeft: 30 }}>{ort?.name ?? 'Spielort folgt'}{s.derby ? ' · Derby' : ''}</div>
              </div>
            ) : (
              <div style={faint}>Spielfrei</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
