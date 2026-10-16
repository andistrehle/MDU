'use client';

// ============================================================
// Team Manager — Dashboard (Kopf der Seite /mein-team/zusagen)
// ============================================================
//
// Vom Betreiber gewünscht (16.10.2026): beim Öffnen des Team Managers ein
// Überblick — nächstes Spiel mit Countdown und Stand der Zusagen, Teamkasse,
// eigene offene Antworten, Aufgaben, die nächsten Termine. Jede Kachel führt
// per Klick zum Thema. Zeigt nur, was wirklich in den Daten steht.
// ============================================================

import Link from 'next/link';
import type { Begegnung27 } from '@/lib/data/saison-2027';
import { team27 } from '@/lib/data/saison-2027';
import type { Zusage, ZusageStatus, Aufgabe } from '@/lib/supabase/zusagen';
import { terminTitel, terminPfad, terminFarbe, type TeamTermin } from '@/lib/supabase/termine';
import { euro } from '@/lib/supabase/kasse';
import { spieltagPfad, wochentag, tagMonat } from '@/lib/spieltag';
import { TeamBadge } from './team-badge';
import { Icon } from './icon';
import { STATUS, StatusIcon } from './zusagen-ui';

export type DashEintrag = { key: string; datum: string; zeit: string } & ({ art: 'mdu'; b: Begegnung27 } | { art: 'ext'; t: TeamTermin });

export interface DashKasse { stand: number; offen: number; meinOffen: number | null }

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const tageBis = (iso: string) => Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(heuteIso() + 'T00:00:00Z')) / 86400000);

function titelVon(e: DashEintrag, teamId: string) {
  if (e.art === 'ext') return terminTitel(e.t);
  const gegner = e.b.home === teamId ? e.b.away : e.b.home;
  return `${e.b.home === teamId ? 'gegen' : 'bei'} ${team27(gegner)?.name ?? gegner}`;
}
const pfadVon = (e: DashEintrag, teamId: string) => (e.art === 'mdu' ? spieltagPfad(teamId, e.key) : terminPfad(e.t.id));

export function TeamDashboard({ teamId, teamName, liga, spiele, zusagen, kaderAnzahl, ichId, aufgaben, kasse }: {
  teamId: string; teamName: string; liga: string; spiele: DashEintrag[]; zusagen: Zusage[]; kaderAnzahl: number;
  ichId: string | null; aufgaben: Aufgabe[]; kasse: DashKasse | null;
}) {
  const t = team27(teamId);
  const naechstes = spiele[0];
  const zu = (key: string) => zusagen.filter(z => z.match_key === key);
  const meins = (key: string): ZusageStatus | null => (ichId ? zu(key).find(z => z.player_id === ichId)?.status ?? null : null);

  // Eigene offene Antworten in den nächsten 4 Terminen.
  const bald = spiele.slice(0, 4);
  const ohneAntwort = ichId ? bald.filter(e => !meins(e.key)) : [];
  const keys = new Set(spiele.map(e => e.key));
  const offeneAufgaben = aufgaben.filter(a => !a.done && keys.has(a.match_key));
  const meineAufgaben = ichId ? offeneAufgaben.filter(a => a.assignee_id === ichId) : [];

  return (
    <section aria-label="Überblick" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Hero: nächstes Spiel ── */}
      <Hero teamId={teamId} teamName={teamName} liga={liga} logo={t?.logoUrl ?? null} kurz={t?.short ?? teamName.slice(0, 3)} farbe={t?.color ?? '#3E9C33'}
        e={naechstes} zusagen={naechstes ? zu(naechstes.key) : []} kaderAnzahl={kaderAnzahl} meins={naechstes ? meins(naechstes.key) : null} ichDabei={!!ichId} />

      {/* ── Kacheln ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {kasse && (
          <Kachel href="/mein-team/kasse" icon={<span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: 15 }}>€</span>} farbe="#E8B84A" titel="Teamkasse"
            gross={euro(kasse.stand)} grossFarbe={kasse.stand < 0 ? '#E24B4A' : undefined}
            klein={kasse.meinOffen ? <span style={{ color: '#E24B4A', fontWeight: 800 }}>Du: {euro(kasse.meinOffen)} offen</span>
              : kasse.offen ? `${euro(kasse.offen)} offen im Team` : 'Alles bezahlt ✓'} />
        )}
        <Kachel href="#termine" icon={<Icon name="check" size={16} stroke={2.6} />} farbe={ohneAntwort.length ? '#E8B84A' : '#3E9C33'} titel="Deine Antworten"
          gross={ichId ? (ohneAntwort.length ? `${ohneAntwort.length} offen` : 'Alles klar') : '–'}
          klein={ichId ? (ohneAntwort.length ? `bei den nächsten ${bald.length} Terminen` : `für die nächsten ${bald.length} Termine`) : 'Konto nicht mit Spieler verknüpft'} />
        <Kachel href="#termine" icon={<Icon name="list" size={16} />} farbe={offeneAufgaben.length ? '#7C5CD6' : '#3E9C33'} titel="Aufgaben"
          gross={offeneAufgaben.length ? `${offeneAufgaben.length} offen` : 'Keine offen'}
          klein={meineAufgaben.length ? <span style={{ fontWeight: 800, color: '#7C5CD6' }}>{meineAufgaben.length} für dich</span> : 'an den Spieltagen'} />
        <Kachel href="/mein-team/spielplan" icon={<Icon name="calendar" size={16} />} farbe="#4E7DBD" titel="Spielplan"
          gross={`${spiele.filter(e => e.art === 'mdu').length} Spiele`} klein={`noch in der Saison · ${liga}`} />
      </div>

      {/* ── Nächste Termine kompakt ── */}
      {spiele.length > 1 && (
        <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 16, padding: '12px 14px', boxShadow: '0 2px 12px var(--th-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>Danach</span>
            <a href="#termine" style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-accent)', textDecoration: 'none' }}>Alle Termine ↓</a>
          </div>
          {spiele.slice(1, 4).map(e => {
            const m = meins(e.key);
            const farbe = e.art === 'ext' ? terminFarbe(e.t) : e.b.home === teamId ? '#3E9C33' : '#4E7DBD';
            return (
              <Link key={e.key} href={pfadVon(e, teamId)} className="mdu-dash-zeile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderTop: '1px solid var(--th-line-5)', textDecoration: 'none' }}>
                <span style={{ width: 46, flexShrink: 0, textAlign: 'center', borderRadius: 8, padding: '4px 0', background: `${farbe}1F`, color: farbe, fontFamily: 'var(--font-manrope)', fontWeight: 800, lineHeight: 1.15 }}>
                  <span style={{ display: 'block', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{wochentag(e.datum)}</span>
                  <span style={{ fontSize: 13 }}>{tagMonat(e.datum)}</span>
                </span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)' }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titelVon(e, teamId)}</span>
                  <span style={{ fontSize: 12, color: 'var(--th-text-muted)' }}>{e.zeit ? `${e.zeit} Uhr` : 'Uhrzeit folgt'}{e.art === 'ext' ? ' · Extern' : ''} · {zu(e.key).filter(z => z.status === 'yes').length} dabei</span>
                </span>
                {ichId && (m ? <StatusIcon s={m} size={22} /> : <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, color: '#B07A00', background: 'rgba(232,184,74,0.18)', borderRadius: 999, padding: '3px 8px' }}>antworten</span>)}
              </Link>
            );
          })}
        </div>
      )}
      <style>{'.mdu-dash-kachel{transition:transform 160ms ease,box-shadow 160ms ease}.mdu-dash-kachel:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--th-shadow)!important}.mdu-dash-zeile:hover{background:var(--th-bg-card3)}'}</style>
    </section>
  );
}

function Hero({ teamId, teamName, liga, logo, kurz, farbe, e, zusagen, kaderAnzahl, meins, ichDabei }: {
  teamId: string; teamName: string; liga: string; logo: string | null; kurz: string; farbe: string;
  e: DashEintrag | undefined; zusagen: Zusage[]; kaderAnzahl: number; meins: ZusageStatus | null; ichDabei: boolean;
}) {
  const n = { yes: 0, maybe: 0, no: 0 } as Record<ZusageStatus, number>;
  for (const z of zusagen) n[z.status]++;
  const offen = Math.max(0, kaderAnzahl - zusagen.length);
  const tage = e ? tageBis(e.datum) : null;
  const countdown = tage === null ? null : tage <= 0 ? 'Heute' : tage === 1 ? 'Morgen' : `${tage}`;
  const inhalt = (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 20, color: '#fff', padding: '16px 18px 18px',
      background: `radial-gradient(90% 120% at 100% 0%, ${farbe}AA 0%, transparent 55%), radial-gradient(70% 90% at 0% 100%, rgba(62,156,51,0.45) 0%, transparent 60%), linear-gradient(160deg, #1B2230 0%, #0D1117 100%)`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    }}>
      {/* Dartscheiben-Ringe als Deko */}
      <svg aria-hidden viewBox="0 0 200 200" style={{ position: 'absolute', right: -50, bottom: -60, width: 220, opacity: 0.09 }}>
        {[95, 75, 55, 35, 15].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#fff" strokeWidth="6" />)}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <TeamBadge initials={kurz} color={farbe} logoUrl={logo ?? undefined} size={38} ring="#fff" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Team Manager · {liga}</div>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{teamName}</div>
        </div>
      </div>

      {e ? (
        <div className="mdu-dash-hero" style={{ marginTop: 16, position: 'relative' }}>
          <div style={{ gridArea: 'cd', minWidth: 92 }}>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: tage !== null && tage > 1 ? 56 : 40, lineHeight: 0.9 }}>{countdown}</div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              {tage !== null && tage > 1 ? 'Tage bis zum Spiel' : 'ist Spieltag'}
            </div>
          </div>
          <div style={{ gridArea: 'info', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
              Nächster Termin · {wochentag(e.datum)} {tagMonat(e.datum)}{e.zeit ? ` · ${e.zeit} Uhr` : ''}
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: 18, lineHeight: 1.2, marginTop: 2, overflowWrap: 'anywhere' }}>{titelVon(e, teamId)}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {ichDabei && (meins
                ? <span style={pille('rgba(255,255,255,0.16)')}><StatusIcon s={meins} size={15} /> Du: {STATUS[meins].text}</span>
                : <span style={pille('#E8B84A', '#3A2A00')}>Du hast noch nicht geantwortet →</span>)}
            </div>
          </div>
          <div style={{ gridArea: 'ring', justifySelf: 'end' }}><Ring n={n} offen={offen} /></div>
          <style>{'.mdu-dash-hero{display:grid;gap:14px 16px;align-items:center;grid-template-columns:auto 1fr auto;grid-template-areas:"cd info ring"}@media (max-width:520px){.mdu-dash-hero{grid-template-columns:1fr auto;grid-template-areas:"cd ring" "info info"}}'}</style>
        </div>
      ) : (
        <div style={{ marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'rgba(255,255,255,0.85)', position: 'relative' }}>Keine anstehenden Termine.</div>
      )}
    </div>
  );
  return e ? <Link href={pfadVon(e, teamId)} className="mdu-dash-kachel" style={{ display: 'block', textDecoration: 'none', borderRadius: 20 }}>{inhalt}</Link> : inhalt;
}

/** Ring mit dem Stand der Zusagen (grün/gelb/rot/grau) und der Zahl „dabei“ in der Mitte. */
function Ring({ n, offen }: { n: Record<ZusageStatus, number>; offen: number }) {
  const teile: [number, string][] = [[n.yes, '#22C55E'], [n.maybe, '#E8B84A'], [n.no, '#E24B4A'], [offen, 'rgba(255,255,255,0.18)']];
  const summe = teile.reduce((s, [x]) => s + x, 0) || 1;
  const r = 30, u = 2 * Math.PI * r;
  let pos = 0;
  return (
    <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }} aria-label={`${n.yes} dabei, ${n.maybe} unsicher, ${n.no} abgesagt, ${offen} offen`}>
      <svg viewBox="0 0 84 84" width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="9" />
        {teile.filter(([x]) => x > 0).map(([x, f], i) => {
          const l = (x / summe) * u;
          const el = <circle key={i} cx="42" cy="42" r={r} fill="none" stroke={f} strokeWidth="9" strokeDasharray={`${Math.max(l - 2, 0.1)} ${u}`} strokeDashoffset={-pos} strokeLinecap="butt" />;
          pos += l;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24, lineHeight: 1 }}>{n.yes}</span>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>dabei</span>
      </div>
    </div>
  );
}

function Kachel({ href, icon, farbe, titel, gross, grossFarbe, klein }: {
  href: string; icon: React.ReactNode; farbe: string; titel: string; gross: React.ReactNode; grossFarbe?: string; klein: React.ReactNode;
}) {
  const inhalt = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 30, height: 30, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `${farbe}22`, color: farbe }}>{icon}</span>
        <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>{titel}</span>
        <Icon name="chevron" size={13} style={{ color: 'var(--th-text-faint)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26, lineHeight: 1.05, marginTop: 10, color: grossFarbe ?? 'var(--th-text-strong)' }}>{gross}</div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>{klein}</div>
    </>
  );
  const stil: React.CSSProperties = {
    display: 'block', textDecoration: 'none', padding: '12px 14px', borderRadius: 16, background: 'var(--th-bg-card)',
    border: '1px solid var(--th-line-6)', borderTop: `3px solid ${farbe}`, boxShadow: '0 2px 12px var(--th-shadow)',
  };
  return href.startsWith('#')
    ? <a href={href} className="mdu-dash-kachel" style={stil}>{inhalt}</a>
    : <Link href={href} className="mdu-dash-kachel" style={stil}>{inhalt}</Link>;
}

function pille(bg: string, fg = '#fff'): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: bg, color: fg, fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800 };
}
