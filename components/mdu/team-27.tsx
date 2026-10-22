// ============================================================
// Teamseite 2026/27 — Inhalte der Reiter (Server)
// ============================================================
//
// Aufbau wie im Archiv 2025/26 (team-detail-client.tsx): Übersicht, Kader,
// Spielplan, Ergebnisse, Statistik. Zahlen kommen aus den Spielberichten
// (lib/server/ergebnisse-2027.ts), der Kader aus der DB. Im Kader steht jeder
// Spieler mit Profilbild (nur mit Einwilligung) und führt auf sein Profil.
// ============================================================

import Link from 'next/link';
import { Icon } from './icon';
import { TeamSpielplan27, type ErgebnisMap27 } from './spielplan-27';
import type { TabellenZeile } from '@/lib/tabelle-2027';
import type { EinzelZeile } from '@/lib/einzelrangliste-2027';

export interface Kader27Eintrag {
  playerId: string | null;
  name: string;
  licenseNumber: string | null;
  isCaptain: boolean;
  neu: boolean;
  photoUrl: string | null;
  stats: (EinzelZeile & { liga: string }) | null;
}

const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '22px 24px' };

function Label({ children, color }: { children: React.ReactNode; color: string }) {
  return <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color, textTransform: 'uppercase', marginBottom: 14 }}>{children}</div>;
}

function Leer({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)', fontStyle: 'italic', lineHeight: 1.6 }}>{children}</div>;
}

const vz = (n: number) => (n > 0 ? `+${n}` : String(n));

// ── Übersicht ──────────────────────────────────────────────────

export function Uebersicht27({ teamId, color, seasonName, ligaName, ligaHref, venueName, venueAddress, captain, zeile, ergebnisse }: {
  teamId: string; color: string; seasonName: string; ligaName: string; ligaHref: string;
  venueName: string | null; venueAddress: string | null; captain: string | null;
  zeile: TabellenZeile | null; ergebnisse: ErgebnisMap27;
}) {
  const gespielt = zeile && zeile.sp > 0 ? zeile : null;
  return (
    <div className="mdu-team-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        <div>
          <Label color={color}>Nächstes Spiel</Label>
          <TeamSpielplan27 teamId={teamId} ergebnisse={ergebnisse} nur="offen" max={1} leer="Keine offenen Spiele mehr in dieser Saison." />
        </div>
        <div>
          <Label color={color}>Letztes Ergebnis</Label>
          <TeamSpielplan27 teamId={teamId} ergebnisse={ergebnisse} nur="gespielt" max={1} leer="Noch kein Ergebnis — die Saison läuft gerade an." />
        </div>
        <div style={karte}>
          <Label color={color}>Team Info</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="trophy" size={14} stroke={2} style={{ flexShrink: 0, color: 'var(--th-text-muted)' }} />
              <Link href={ligaHref} style={{ color: 'inherit', textDecoration: 'none' }}>{ligaName}</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="pin" size={14} stroke={2} style={{ flexShrink: 0, marginTop: 1, color: 'var(--th-text-muted)' }} />
              <div>
                <div>{venueName ?? 'Spielort folgt'}</div>
                {venueName && venueAddress && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName}, ${venueAddress}`)}`}
                    target="_blank" rel="noopener noreferrer" title="In Google Maps öffnen"
                    style={{ display: 'inline-block', fontSize: 11, color: 'var(--th-accent)', marginTop: 3, lineHeight: 1.5, textDecoration: 'none' }}>
                    {venueAddress}
                  </a>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="user" size={14} stroke={2} style={{ flexShrink: 0, color: 'var(--th-text-muted)' }} />
              {captain
                ? <span><span style={{ color: 'var(--th-text-dim)', marginRight: 4 }}>TC:</span>{captain}</span>
                : <span style={{ color: 'var(--th-text-faint)', fontStyle: 'italic' }}>Teamcaptain noch nicht eingetragen</span>}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={karte}>
          <Label color={color}>{seasonName}</Label>
          {gespielt ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Platz', value: `#${gespielt.pos}`, accent: color },
                  { label: 'Punkte', value: String(gespielt.pts), accent: 'var(--th-text-strong)' },
                  { label: 'Gespielt', value: String(gespielt.sp), accent: 'var(--th-text-strong)' },
                ].map(c => (
                  <div key={c.label} style={{ flex: 1, minWidth: 56, textAlign: 'center', background: 'var(--th-line-4)', borderRadius: 8, padding: '8px 6px' }}>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: c.accent, lineHeight: 1 }}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--th-line-4)', marginBottom: 8 }}>
                <div style={{ width: `${(gespielt.s / gespielt.sp) * 100}%`, background: 'var(--th-win, #22C55E)' }} />
                <div style={{ width: `${(gespielt.u / gespielt.sp) * 100}%`, background: '#9AA4B2' }} />
                <div style={{ width: `${(gespielt.n / gespielt.sp) * 100}%`, background: '#C0392B' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginBottom: 14 }}>
                <span>{gespielt.s} S</span><span>{gespielt.u} U</span><span>{gespielt.n} N</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Spiele</span><span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{gespielt.spieleFor}:{gespielt.spieleAgainst} ({vz(gespielt.spieleFor - gespielt.spieleAgainst)})</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Legs</span><span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{gespielt.legsFor}:{gespielt.legsAgainst} ({vz(gespielt.legsFor - gespielt.legsAgainst)})</span></div>
                {gespielt.abzug !== 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Punktabzug</span><span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#C0392B' }}>{gespielt.abzug}</span></div>}
              </div>
              {gespielt.offen > 0 && (
                <div style={{ marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)' }}>
                  * {gespielt.offen === 1 ? 'Ein Ergebnis ist' : `${gespielt.offen} Ergebnisse sind`} noch nicht vom Gegner bestätigt.
                </div>
              )}
            </>
          ) : (
            <Leer>Noch kein Spiel gewertet. Platz, Punkte und Bilanz stehen hier, sobald der erste Spielbericht eingereicht ist.</Leer>
          )}
          <Link href={ligaHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 16, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, color: 'var(--th-accent)', textDecoration: 'none' }}>
            Zur Tabelle der {ligaName} <Icon name="chevron" size={12} stroke={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Kader ──────────────────────────────────────────────────────

function Bild({ name, url, color, size }: { name: string; url: string | null; color: string; size: number }) {
  const initialen = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: url ? 'var(--th-bg-inset)' : `${color}22`, border: `1px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: Math.round(size * 0.37), color,
    }}>
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
        : initialen}
    </div>
  );
}

function Zeile({ p, children }: { p: Kader27Eintrag; children: React.ReactNode }) {
  const style: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', textDecoration: 'none', color: 'inherit' };
  return p.playerId
    ? <Link href={`/spieler/${p.playerId}`} className="mdu-kader-row" style={style}>{children}</Link>
    : <div style={style}>{children}</div>;
}

const TC = ({ size = 9 }: { size?: number }) => (
  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: size, color: 'var(--th-gold)', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>TC</span>
);

export function Kader27({ kader, color }: { kader: Kader27Eintrag[]; color: string }) {
  if (!kader.length) return <div style={karte}><Leer>Noch kein Kader übernommen.</Leer></div>;
  const mitStats = kader.some(p => p.stats);
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', fontStyle: 'italic', margin: '0 0 12px 2px' }}>
        {mitStats ? 'Sortiert nach der Einzelrangliste · aus den Spielberichten · ' : ''}Tipp auf einen Spieler öffnet sein Profil
      </div>
      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden' }}>
        {kader.map((p, i) => {
          const s = p.stats;
          return (
            <div key={p.playerId ?? `${p.name}-${i}`} style={{ borderBottom: i < kader.length - 1 ? '1px solid var(--th-line-4)' : 'none' }}>
              <Zeile p={p}>
                <Bild name={p.name} url={p.photoUrl} color={color} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name || 'Name nicht verfügbar'}
                    </span>
                    {p.isCaptain && <TC size={10} />}
                    {p.neu && <span style={{ fontSize: 9, fontWeight: 700, color: '#A77A00', textTransform: 'uppercase' }}>neu</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)', marginTop: 3 }}>
                    {s
                      ? `${s.wins}:${s.losses} Einzel · Legs ${s.legsWon}:${s.legsLost}${s.b180 ? ` · ${s.b180}× 180` : ''}`
                      : (p.licenseNumber ? `Passnr. ${p.licenseNumber}` : 'Noch kein Einsatz')}
                  </div>
                </div>
                {s && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--th-text-strong)', lineHeight: 1 }}>{s.points} Pkt.</div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, color: s.pos <= 3 ? 'var(--th-gold)' : 'var(--th-text-faint)', marginTop: 3 }}>#{s.pos} Einzelrangliste</div>
                  </div>
                )}
                {p.playerId && <Icon name="chevron" size={15} stroke={2} style={{ color: 'var(--th-text-faint2)', flexShrink: 0 }} />}
              </Zeile>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Statistik ──────────────────────────────────────────────────

export function Statistik27({ spieler, color }: { spieler: EinzelZeile[]; color: string }) {
  if (!spieler.length) {
    return <div style={karte}><Leer>Noch keine Spielberichte — die Statistik füllt sich mit dem ersten Spiel.</Leer></div>;
  }
  const summe = (f: (z: EinzelZeile) => number) => spieler.reduce((a, z) => a + f(z), 0);
  const singles = summe(z => z.singles), wins = summe(z => z.wins);
  const hf = spieler.filter(z => z.highFinish).sort((a, b) => (b.highFinish ?? 0) - (a.highFinish ?? 0))[0];
  const sl = spieler.filter(z => z.shortLeg).sort((a, b) => (a.shortLeg ?? 99) - (b.shortLeg ?? 99))[0];
  const kacheln: { l: string; n: string; sub?: string }[] = [
    { l: 'Einzel gewonnen', n: `${wins}/${singles}`, sub: singles ? `${Math.round((wins / singles) * 100)} %` : undefined },
    { l: 'Legs', n: `${summe(z => z.legsWon)}:${summe(z => z.legsLost)}` },
    { l: '180er', n: String(summe(z => z.b180)) },
    { l: '171er', n: String(summe(z => z.b171)) },
    { l: 'Höchstes Finish', n: hf ? String(hf.highFinish) : '–', sub: hf?.name },
    { l: 'Kürzestes Leg', n: sl ? `${sl.shortLeg} Darts` : '–', sub: sl?.name },
  ];
  const top = [...spieler].sort((a, b) => a.pos - b.pos).slice(0, 5);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="mdu-kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--th-line-6)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden' }}>
        {kacheln.map(k => (
          <div key={k.l} className="mdu-kpi-cell" style={{ background: 'var(--th-bg-card)', padding: '18px 18px' }}>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, color: 'var(--th-text-strong)', lineHeight: 1 }}>{k.n}</div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--th-text-dim)', textTransform: 'uppercase', marginTop: 8 }}>{k.l}</div>
            {k.sub && <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 4 }}>{k.sub}</div>}
          </div>
        ))}
      </div>
      <div style={karte}>
        <Label color={color}>Beste Spieler im Team</Label>
        {top.map((z, i) => (
          <div key={z.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i ? '1px solid var(--th-line-4)' : 'none', fontFamily: 'var(--font-manrope)', fontSize: 13.5 }}>
            <span style={{ width: 22, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-faint2)' }}>{i + 1}.</span>
            {z.playerId
              ? <Link href={`/spieler/${z.playerId}`} style={{ flex: 1, fontWeight: 700, color: 'var(--th-text-strong)', textDecoration: 'none' }}>{z.name}</Link>
              : <span style={{ flex: 1, fontWeight: 700, color: 'var(--th-text-strong)' }}>{z.name}</span>}
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11.5, color: 'var(--th-text-muted)' }}>{z.wins}:{z.losses}</span>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 16, minWidth: 54, textAlign: 'right' }}>{z.points} Pkt.</span>
          </div>
        ))}
        <div style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)' }}>
          Nur Einzel, gezählt wie in der Einzelrangliste (2:0 = 3, 2:1 = 2, 1:2 = 1 Punkt).
        </div>
      </div>
    </div>
  );
}
