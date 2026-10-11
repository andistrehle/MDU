import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { Icon } from './icon';
import {
  team27, venue27, spieltage27, spieleFuerTeam27, wochenendeText, begegnungKey,
  termin27, terminVerlegt,
  type Liga27, type Spieltag27,
} from '@/lib/data/saison-2027';
import type { Ergebnis27 } from '@/lib/tabelle-2027';
import type { Termin27 } from '@/lib/data/termine-2027';

/** Ergebnisse je Begegnung (Heim|Gast), aus lib/server/ergebnisse-2027.ts. */
export type ErgebnisMap27 = Record<string, Ergebnis27>;

const WERTUNG_TEXT: Record<string, string> = {
  home_no_show: 'Wertung: Heimteam nicht angetreten',
  guest_no_show: 'Wertung: Gastteam nicht angetreten',
  no_report: 'Wertung: kein Spielbericht',
};

/** Zusatzzeile unter einem Ergebnis: Legs bzw. Wertung, Bestätigt-Status. */
function ErgebnisZeile({ e, gast = false }: { e: Ergebnis27; gast?: boolean }) {
  return (
    <>
      {e.wertung ? WERTUNG_TEXT[e.wertung] : gast ? `Legs ${e.legsAway}:${e.legsHome}` : `Legs ${e.legsHome}:${e.legsAway}`}
      {!e.bestaetigt && <span style={{ color: '#9A6B00' }}> · noch nicht bestätigt</span>}
    </>
  );
}

// Anzeige des Spielplans 2026/27 (Server-tauglich, keine Hooks).

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
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>
        <span style={{ display: 'inline-block', width: 3, height: 14, background: color, borderRadius: 2, marginRight: 8, verticalAlign: '-1px' }} />
        {md.nr}. Spieltag
      </span>
      <span style={{ ...mono, color: 'var(--th-text-muted)' }}>Wochenende {wochenendeText(md.fri, md.sun)}</span>
    </div>
  );
}

const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const dIso = (iso: string) => new Date(iso + 'T12:00:00Z');
/** „Fr 23.10." */
const tagKurz = (iso: string) => { const x = dIso(iso); return `${WT[x.getUTCDay()]} ${x.getUTCDate()}.${x.getUTCMonth() + 1}.`; };

/** Kleines Etikett (verlegt, wird geprüft, Derby). */
function Etikett({ children, ton = 'gold' }: { children: React.ReactNode; ton?: 'gold' | 'grau' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800,
      letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      background: ton === 'gold' ? 'rgba(232,184,74,0.16)' : 'var(--th-line-6)', color: ton === 'gold' ? '#9A6B00' : 'var(--th-text-muted)',
    }}>{children}</span>
  );
}

/** Kopfzeile eines Spiels: Termin (oder Wochenende) links, Etiketten rechts. */
function TerminKopf({ t, fri, sun, derby }: { t: Termin27 | null; fri: string; sun: string; derby: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.02em', color: t ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>
        {t ? <>{tagKurz(t.datum)}{t.uhrzeit && <span style={{ color: 'var(--th-text-muted)', fontWeight: 700 }}>{'  ·  '}{t.uhrzeit} Uhr</span>}</> : <>Wochenende {wochenendeText(fri, sun, false)}</>}
      </span>
      <span style={{ display: 'flex', gap: 6 }}>
        {t?.vorlaeufig && <Etikett>wird geprüft</Etikett>}
        {terminVerlegt(t, fri, sun) && <Etikett>verlegt</Etikett>}
        {derby && <Etikett ton="grau">Derby</Etikett>}
      </span>
    </div>
  );
}

/** Ein Team pro Zeile, Spielstand rechts — braucht keine Spalten und quetscht am Handy nichts. */
function TeamZeile({ id, tore, sieger }: { id: string; tore?: number; sieger?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }}>
      <div style={{ flex: 1, minWidth: 0 }}><TeamChip27 id={id} size={28} /></div>
      {tore != null && (
        <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, minWidth: 26, textAlign: 'right', color: sieger ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>{tore}</span>
      )}
    </div>
  );
}

export function SpieltagKarte27({ md, color, ergebnisse }: { md: Spieltag27; color: string; ergebnisse?: ErgebnisMap27 }) {
  return (
    <div style={{ padding: '16px 18px 6px', borderRadius: 14, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)' }}>
      <SpieltagKopf md={md} color={color} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {md.games.map(g => {
          const v = venue27(team27(g.home)?.venueId);
          const e = ergebnisse?.[begegnungKey(g.home, g.away)];
          const t = termin27(g.home, g.away);
          return (
            <div key={g.home + g.away} style={{ borderTop: '1px solid var(--th-line-4)', padding: '12px 0 14px' }}>
              <TerminKopf t={t} fri={md.fri} sun={md.sun} derby={g.derby} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <TeamZeile id={g.home} tore={e?.spieleHome} sieger={!!e && e.spieleHome >= e.spieleAway} />
                <TeamZeile id={g.away} tore={e?.spieleAway} sieger={!!e && e.spieleAway >= e.spieleHome} />
              </div>
              <div style={{ ...faint, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                {e ? <ErgebnisZeile e={e} /> : <><Icon name="pin" size={13} stroke={2} />{v?.name ?? 'Spielort folgt'}</>}
              </div>
            </div>
          );
        })}
        {md.bye && (
          <div style={{ ...faint, borderTop: '1px solid var(--th-line-4)', padding: '12px 0 14px' }}>
            Spielfrei: <span style={{ fontWeight: 700, color: 'var(--th-text-muted)' }}>{team27(md.bye)?.name ?? md.bye}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Alle Spieltage einer Liga, Hin- und Rückrunde mit Zwischenüberschrift. */
export function LigaSpielplan27({ liga, ergebnisse }: { liga: Liga27; ergebnisse?: ErgebnisMap27 }) {
  const mds = spieltage27(liga.code);
  const hin = mds.filter(m => m.half === 'hin'), rueck = mds.filter(m => m.half === 'rueck');
  const block = (titel: string, list: Spieltag27[]) => (
    <div>
      <div style={{ display: 'inline-block', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--th-text-body)', margin: '0 0 10px', padding: '4px 10px', borderRadius: 6, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)' }}>{titel}</div>
      <div className="mdu-spieltag-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 12 }}>
        {list.map(md => <SpieltagKarte27 key={md.nr} md={md} color={liga.color} ergebnisse={ergebnisse} />)}
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

/** Spiele eines Teams als Liste, nach dem echten Termin sortiert (verlegte
 *  Spiele und getauschtes Heimrecht stehen dort, wo sie wirklich stattfinden). */
export function TeamSpielplan27({ teamId, ergebnisse }: { teamId: string; ergebnisse?: ErgebnisMap27 }) {
  const self = team27(teamId);
  if (!self) return null;
  const zeilen = spieleFuerTeam27(teamId).map(s => {
    const t = s.gegner ? (s.heim ? termin27(teamId, s.gegner) : termin27(s.gegner, teamId)) : null;
    return { s, t, sort: t?.datum ?? s.fri };
  }).sort((a, b) => a.sort.localeCompare(b.sort) || a.s.spieltag - b.s.spieltag);
  return (
    <div style={{ borderRadius: 14, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', overflow: 'hidden' }}>
      {zeilen.map(({ s, t }, i) => {
        const ort = venue27(team27(s.heim ? teamId : s.gegner)?.venueId);
        const e = s.gegner ? ergebnisse?.[s.heim ? begegnungKey(teamId, s.gegner) : begegnungKey(s.gegner, teamId)] : undefined;
        // Aus Sicht dieses Teams: eigene Spiele zuerst.
        const eigen = e ? (s.heim ? e.spieleHome : e.spieleAway) : 0, fremd = e ? (s.heim ? e.spieleAway : e.spieleHome) : 0;
        return (
          <div key={s.spieltag} style={{ display: 'grid', gridTemplateColumns: '78px minmax(0,1fr)', gap: 14, alignItems: 'start', padding: '14px 16px', borderTop: i ? '1px solid var(--th-line-4)' : 'none', background: s.gegner ? undefined : 'var(--th-line-3, transparent)' }}>
            <div style={{ paddingTop: 2 }}>
              {t ? (
                <>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', whiteSpace: 'nowrap' }}>{tagKurz(t.datum)}</div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>{t.uhrzeit ? `${t.uhrzeit} Uhr` : 'Uhrzeit folgt'}</div>
                </>
              ) : (
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.35 }}>{wochenendeText(s.fri, s.sun, false)}</div>
              )}
            </div>
            {s.gegner ? (
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span title={s.heim ? 'Heimspiel' : 'Auswärtsspiel'} style={{ flexShrink: 0, width: 24, textAlign: 'center', padding: '3px 0', borderRadius: 6, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, background: s.heim ? 'var(--th-accent)' : 'var(--th-line-8)', color: s.heim ? '#fff' : 'var(--th-text-muted)' }}>{s.heim ? 'H' : 'A'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}><TeamChip27 id={s.gegner} size={26} /></div>
                  {e && (
                    <span style={{ flexShrink: 0, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: eigen > fremd ? 'var(--th-win)' : eigen < fremd ? '#C0392B' : 'var(--th-text-strong)' }}>
                      {eigen}:{fremd}{!e.bestaetigt && <span style={{ color: '#9A6B00' }}>*</span>}
                    </span>
                  )}
                </div>
                <div style={{ ...faint, marginTop: 6, marginLeft: 34, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                  {e ? <ErgebnisZeile e={e} gast={!s.heim} /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={12} stroke={2} />{ort?.name ?? 'Spielort folgt'}</span>}
                  <span style={{ color: 'var(--th-text-faint)' }}>· {s.spieltag}. ST</span>
                  {t?.vorlaeufig && <Etikett>wird geprüft</Etikett>}
                  {terminVerlegt(t, s.fri, s.sun) && <Etikett>verlegt</Etikett>}
                  {s.derby && <Etikett ton="grau">Derby</Etikett>}
                </div>
              </div>
            ) : (
              <div style={{ ...faint, paddingTop: 2 }}>Spielfrei · {s.spieltag}. Spieltag</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
