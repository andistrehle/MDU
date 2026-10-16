'use client';

// Gemeinsame Bausteine der Zu-/Absagen (Übersicht /mein-team/zusagen und
// Spieltag-Seite /spieltag/[team]/[spiel]). Gestaltung wie die Hauptseite:
// eigene Strich-Icons statt Emojis, Signalfarben aus dem Theme (--th-win /
// --th-gold / --th-loss), Saira Condensed für Zahlen und Überschriften.

import { useState, useSyncExternalStore } from 'react';
import { Icon } from './icon';
import { TeamBadge } from './team-badge';
import { team27, wochenendeText, type Begegnung27 } from '@/lib/data/saison-2027';
import { NOTIZ_MAX, GRUND_MIN, braucheGrund, type Zusage, type ZusageStatus } from '@/lib/supabase/zusagen';
import { endeZeit, treffZeit, wochentag, tagMonat } from '@/lib/spieltag';

// Darstellung je Status (keine Zeile = offen).
export const STATUS: Record<ZusageStatus, { text: string; icon: string; farbe: string; knopf: string; senden: string }> = {
  yes:   { text: 'zugesagt', icon: 'check', farbe: 'var(--th-win)',  knopf: 'Dabei',    senden: 'Zusage senden' },
  maybe: { text: 'unsicher', icon: 'help',  farbe: 'var(--th-gold)', knopf: 'Unsicher', senden: 'Als unsicher melden' },
  no:    { text: 'abgesagt', icon: 'close', farbe: 'var(--th-loss)', knopf: 'Absage',   senden: 'Absage senden' },
};
export const REIHE: ZusageStatus[] = ['yes', 'maybe', 'no'];
const OFFEN_FARBE = 'var(--th-text-faint)';

/** Runder Status-Knopf mit Icon (gefüllt = gewählt). */
export function StatusIcon({ s, size = 22, voll = true }: { s: ZusageStatus | null; size?: number; voll?: boolean }) {
  const farbe = s ? STATUS[s].farbe : OFFEN_FARBE;
  return (
    <span aria-hidden style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: voll ? farbe : 'transparent', border: `1.5px solid ${farbe}`, color: voll ? '#fff' : farbe,
    }}>
      {s ? <Icon name={STATUS[s].icon} size={Math.round(size * 0.6)} stroke={2.6} /> : <span style={{ width: size * 0.28, height: size * 0.28, borderRadius: 999, background: farbe }} />}
    </span>
  );
}

// ── Anzeigetafel: Kopf eines Spiels (Kachel + Spielseite) ─────────────
export function SpielKopf({ b, teamId, liga, ligaFarbe, gross = false, rechts }: {
  b: Begegnung27; teamId: string; liga: string; ligaFarbe: string; gross?: boolean; rechts?: React.ReactNode;
}) {
  const heim = b.home === teamId;
  const t = b.termin;
  const H = team27(b.home), G = team27(b.away);
  const logo = gross ? 52 : 40;
  // Dunkle Tafel (Variante E, vom Betreiber gewählt): Heimspiel mit grünem,
  // Auswärts mit blauem Leuchten — Grün/Blau wie Akzent und Kopfleiste der Seite.
  const leucht = heim ? '62,156,51' : '78,125,189';
  const fg = '#fff';
  const fgLeise = 'rgba(255,255,255,0.75)';
  const chipGrund = 'rgba(255,255,255,0.14)';
  const seite = (tm: typeof H, id: string) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
      <TeamBadge initials={tm?.short ?? id.slice(0, 3).toUpperCase()} color={tm?.color} logoUrl={tm?.logoUrl ?? undefined} size={logo}
        ring={id === teamId ? '#fff' : 'rgba(255,255,255,0.45)'} />
      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: gross ? 14 : 12.5, lineHeight: 1.2, color: id === teamId ? fg : fgLeise, overflowWrap: 'anywhere' }}>{tm?.name ?? id}</span>
    </div>
  );
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', color: fg, padding: gross ? '16px 16px 18px' : '12px 14px 14px',
      background: `radial-gradient(120% 90% at 100% 0%, rgba(${leucht},0.55) 0%, transparent 60%), linear-gradient(160deg, #1B2230 0%, #10141C 100%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: gross ? 14 : 10 }}>
        <span style={chip(chipGrund, fg)}>{t ? `${wochentag(t.datum)} ${tagMonat(t.datum)}` : `WE ${wochenendeText(b.fri, b.sun, false)}`}</span>
        <span style={{ ...chip(`rgb(${leucht})`, '#fff'), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name={heim ? 'home' : 'arrow-right'} size={12} stroke={2.4} />{heim ? 'Heimspiel' : 'Auswärts'}
        </span>
        {b.derby && <span style={chip('rgba(232,184,74,0.95)', '#3A2A00')}>Derby</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: fgLeise }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: ligaFarbe }} />
          <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{liga} · {b.spieltag}. ST</span>
          {rechts}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {seite(H, b.home)}
        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: gross ? 78 : 64 }}>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: gross ? 34 : 26, lineHeight: 1, letterSpacing: '0.02em', color: fg }}>{t?.uhrzeit ?? '–:–'}</div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: fgLeise, marginTop: 4 }}>{t?.uhrzeit ? 'Anwurf' : 'Uhrzeit folgt'}</div>
        </div>
        {seite(G, b.away)}
      </div>
    </div>
  );
}

/** Zeitleiste Treffen → Beginn → Ende. */
export function Zeitleiste({ beginn, treffenMin, meetTime, ende }: {
  beginn: string | undefined; treffenMin: number; meetTime: string | null;
  /** Eigenes Ende (eigene Termine); sonst Beginn + 3,5 Std. */
  ende?: string | null;
}) {
  const zeiten: [string, string, string | null][] = [
    ['meet', 'Treffen', treffZeit(beginn, treffenMin, meetTime)],
    ['clock', 'Beginn', beginn ?? null],
    ['flag-end', ende ? 'Ende' : 'Ende ca.', ende ?? (ende === null ? null : endeZeit(beginn))],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '12px 12px 4px' }}>
      {zeiten.map(([icon, lab, wert]) => (
        <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
          <Icon name={icon} size={16} style={{ color: 'var(--th-accent)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 19, lineHeight: 1, color: wert ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>{wert ?? '—'}</div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', marginTop: 3 }}>{lab}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Gruppe der Teilnehmerliste: Anker-ID zum Hinspringen aus der StandLeiste. */
export type StandGruppe = ZusageStatus | 'offen';
export const gruppenAnker = (g: StandGruppe) => `teilnehmer-${g}`;

/** Namen je Gruppe für die StandLeiste (Hover-Liste). */
export function namenJeGruppe(personen: { id: string; name: string }[], zuVon: (id: string) => { status: ZusageStatus } | undefined): Record<StandGruppe, string[]> {
  const out: Record<StandGruppe, string[]> = { yes: [], maybe: [], no: [], offen: [] };
  for (const p of personen) out[zuVon(p.id)?.status ?? 'offen'].push(p.name);
  return out;
}

/** Zur Gruppe in der Teilnehmerliste scrollen (kurz hervorgehoben). */
export function springeZuGruppe(g: StandGruppe) {
  const el = document.getElementById(gruppenAnker(g));
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.animate?.([{ background: 'var(--th-accent-a12)' }, { background: 'transparent' }], { duration: 1400, easing: 'ease-out' });
}

// Kann das Gerät „darüberfahren“? Am Handy (hover: none) klappt Antippen die Namen auf.
const HOVER = '(hover: hover) and (pointer: fine)';
const hoverAbo = (cb: () => void) => { const m = window.matchMedia(HOVER); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const useKannHover = () => useSyncExternalStore(hoverAbo, () => window.matchMedia(HOVER).matches, () => true);

/**
 * Stand als Balken + Zahlen; `meins` hebt den eigenen Status hervor.
 * Mit `namen` (nur für Teammitglieder) werden die Felder interaktiv: Darüberfahren
 * zeigt, wer in der Gruppe ist, Klicken springt zur Gruppe in der Teilnehmerliste.
 * Am Handy klappt Antippen die Namen unter den Zahlen auf (nochmal tippen = zu),
 * von dort geht es mit „In der Liste anzeigen“ weiter.
 */
export function StandLeiste({ zahl, offen, meins, namen }: {
  zahl: Record<ZusageStatus, number>; offen: number | null; meins?: ZusageStatus | null;
  namen?: Record<StandGruppe, string[]>;
}) {
  const [zeige, setZeige] = useState<StandGruppe | null>(null);
  const [aufgeklappt, setAufgeklappt] = useState<StandGruppe | null>(null);
  const kannHover = useKannHover();
  const summe = zahl.yes + zahl.maybe + zahl.no + (offen ?? 0);
  const teile: [string, number][] = [['var(--th-win)', zahl.yes], ['var(--th-gold)', zahl.maybe], ['var(--th-loss)', zahl.no], ['var(--th-line-10)', offen ?? 0]];
  const zellen: { g: StandGruppe; text: string; farbe: string; inhalt: React.ReactNode; an: boolean }[] = [
    ...REIHE.map(s => ({
      g: s as StandGruppe, text: STATUS[s].text, farbe: STATUS[s].farbe, an: meins === s,
      inhalt: <><StatusIcon s={s} size={20} voll={meins === s} /><span style={standZahl}>{zahl[s]}</span></>,
    })),
    {
      g: 'offen', text: 'noch offen', farbe: OFFEN_FARBE, an: meins === null,
      inhalt: <><Icon name="users" size={17} style={{ color: 'var(--th-text-muted)' }} /><span style={{ ...standZahl, color: 'var(--th-text-muted)' }}>{offen ?? '–'}</span></>,
    },
  ];
  return (
    <div style={{ padding: '10px 12px 12px' }}>
      <div aria-hidden style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--th-line-8)', gap: summe ? 2 : 0 }}>
        {summe > 0 && teile.filter(([, n]) => n > 0).map(([f, n], i) => <span key={i} style={{ flex: n, background: f }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 10 }}>
        {zellen.map(z => {
          if (!namen) return <div key={z.g} title={z.text} style={standZelle(z.an, z.farbe)}>{z.inhalt}</div>;
          const liste = namen[z.g];
          return (
            <div key={z.g} style={{ position: 'relative' }}
              onMouseEnter={kannHover ? () => setZeige(z.g) : undefined} onMouseLeave={kannHover ? () => setZeige(g => (g === z.g ? null : g)) : undefined}>
              <button type="button"
                onClick={() => {
                  if (kannHover) { setZeige(null); if (liste.length) springeZuGruppe(z.g); }
                  else setAufgeklappt(g => (g === z.g ? null : z.g));
                }}
                onFocus={kannHover ? () => setZeige(z.g) : undefined} onBlur={kannHover ? () => setZeige(g => (g === z.g ? null : g)) : undefined}
                aria-label={`${z.text}: ${liste.length ? liste.join(', ') : 'niemand'}`} aria-expanded={kannHover ? undefined : aufgeklappt === z.g}
                style={{ ...standZelle(z.an || aufgeklappt === z.g, z.farbe), width: '100%', cursor: 'pointer', font: 'inherit' }}>
                {z.inhalt}
              </button>
              {kannHover && zeige === z.g && (
                <div role="tooltip" style={{
                  position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
                  minWidth: 140, maxWidth: 220, padding: '8px 10px', borderRadius: 10, pointerEvents: 'none',
                  background: 'var(--th-bg-card)', border: `1.5px solid ${z.farbe}`, boxShadow: '0 6px 20px var(--th-shadow)',
                  fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: z.farbe, marginBottom: 4 }}>{z.text}</div>
                  {liste.length ? liste.map(n => <div key={n} style={{ fontWeight: 700, lineHeight: 1.45 }}>{n}</div>)
                    : <div style={{ color: 'var(--th-text-muted)' }}>niemand</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 4 }}>
        {[...REIHE.map(s => STATUS[s].text), 'offen'].map(l => (
          <span key={l} style={{ textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--th-text-faint)' }}>{l}</span>
        ))}
      </div>
      {namen && !kannHover && aufgeklappt && (() => {
        const z = zellen.find(x => x.g === aufgeklappt)!;
        const liste = namen[aufgeklappt];
        return (
          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--th-bg-card3)', border: `1.5px solid ${z.farbe}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: z.farbe }}>{z.text} · {liste.length}</span>
              <button type="button" onClick={() => setAufgeklappt(null)} aria-label="Zuklappen" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-muted)', padding: 2, display: 'flex' }}><Icon name="close" size={14} stroke={2.4} /></button>
            </div>
            {liste.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {liste.map(n => <span key={n} style={{ padding: '5px 10px', borderRadius: 999, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-strong)' }}>{n}</span>)}
              </div>
            ) : <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>niemand</div>}
            {liste.length > 0 && (
              <button type="button" onClick={() => springeZuGruppe(aufgeklappt)} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, color: 'var(--th-accent)' }}>In der Liste anzeigen ↓</button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

/** Eingabe der Begründung (Pflicht bei Absage/unsicher, min. GRUND_MIN Zeichen). */
export function GrundEingabe({ status, start, onSenden, onAbbrechen, freiwillig = false }: {
  status: ZusageStatus; start: string; onSenden: (grund: string) => void; onAbbrechen: () => void;
  /** TC setzt für jemand anderen: Begründung optional, eigener Knopf „ohne Begründung“. */
  freiwillig?: boolean;
}) {
  const [grund, setGrund] = useState(start);
  const ok = grund.trim().length >= GRUND_MIN;
  return (
    <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${STATUS[status].farbe}`, background: 'var(--th-bg-card)' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 800, color: 'var(--th-text-body)', marginBottom: 6 }}>
        Begründung {status === 'no' ? 'für die Absage' : '(warum unsicher?)'} <span style={{ fontWeight: 600, color: 'var(--th-text-faint)' }}>{freiwillig ? '– freiwillig' : `– Pflicht, mind. ${GRUND_MIN} Zeichen`}</span>
        <textarea autoFocus value={grund} onChange={e => setGrund(e.target.value.slice(0, NOTIZ_MAX))} maxLength={NOTIZ_MAX} rows={2}
          placeholder={status === 'no' ? 'z. B. bin im Urlaub' : 'z. B. Spätschicht, weiß ich erst Mittwoch'}
          style={{ display: 'block', width: '100%', marginTop: 6, padding: '9px 11px', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)', resize: 'vertical', boxSizing: 'border-box' }} />
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" disabled={!ok} onClick={() => onSenden(grund.trim())} style={{ ...knopf(true, STATUS[status].farbe), opacity: ok ? 1 : 0.45, cursor: ok ? 'pointer' : 'not-allowed' }}>{STATUS[status].senden}</button>
        {freiwillig && (
          <button type="button" onClick={() => onSenden('')} style={knopf(false, STATUS[status].farbe)}>
            {status === 'no' ? 'Ohne Begründung absagen' : 'Ohne Begründung unsicher'}
          </button>
        )}
        <button type="button" onClick={onAbbrechen} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>Abbrechen</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: ok || freiwillig ? 'var(--th-text-faint)' : 'var(--th-loss)' }}>{freiwillig && !grund.trim() ? '' : `${grund.trim().length}/${NOTIZ_MAX}`}</span>
      </div>
    </div>
  );
}

/** Eigene Zu-/Absage als Segment-Schalter: Zusage sofort, Absage/unsicher nur mit Begründung. */
export function MeineAntwort({ z, onSetze }: { z?: Zusage; onSetze: (s: ZusageStatus | null, note: string | null) => void | Promise<void> }) {
  const [notiz, setNotiz] = useState(z?.status === 'yes' ? z.note ?? '' : '');
  const [offenNotiz, setOffenNotiz] = useState(z?.status === 'yes' && !!z.note);
  const [grundFuer, setGrundFuer] = useState<ZusageStatus | null>(null);
  return (
    <section style={karte}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={h2}>Bist du dabei?</h2>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: z ? STATUS[z.status].farbe : 'var(--th-text-faint)' }}>{z ? `Du hast ${STATUS[z.status].text}` : 'noch keine Antwort'}</span>
      </div>
      {z?.note && z.status !== 'yes' && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)' }}>„{z.note}“</span>}
      <div role="radiogroup" aria-label="Deine Antwort" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8, padding: 4, borderRadius: 14, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
        {REIHE.map(s => {
          const an = z?.status === s || grundFuer === s;
          return (
            <button key={s} type="button" role="radio" aria-checked={z?.status === s}
              onClick={() => (braucheGrund(s) ? setGrundFuer(s) : (setGrundFuer(null), void onSetze('yes', notiz)))}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', borderRadius: 11, cursor: 'pointer',
                border: 'none', background: an ? STATUS[s].farbe : 'transparent', color: an ? '#fff' : 'var(--th-text-body)',
                boxShadow: an ? '0 4px 14px var(--th-shadow)' : 'none', transition: 'background 160ms ease, color 160ms ease',
                fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
              }}>
              <span style={{ width: 30, height: 30, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: an ? 'rgba(255,255,255,0.22)' : 'transparent', border: an ? 'none' : `1.5px solid ${STATUS[s].farbe}`, color: an ? '#fff' : STATUS[s].farbe }}>
                <Icon name={STATUS[s].icon} size={17} stroke={2.6} />
              </span>
              {STATUS[s].knopf}
            </button>
          );
        })}
      </div>
      {!offenNotiz && !grundFuer && (
        <button type="button" onClick={() => setOffenNotiz(true)} style={{ alignSelf: 'flex-start', marginTop: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>+ Notiz zur Zusage</button>
      )}
      {grundFuer && (
        <GrundEingabe status={grundFuer} start={z?.status === grundFuer ? z.note ?? '' : ''}
          onAbbrechen={() => setGrundFuer(null)}
          onSenden={g => { setGrundFuer(null); void onSetze(grundFuer, g); }} />
      )}
      {offenNotiz && !grundFuer && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input value={notiz} onChange={e => setNotiz(e.target.value.slice(0, NOTIZ_MAX))} maxLength={NOTIZ_MAX}
            placeholder="z. B. komme 30 Min. später" aria-label="Notiz zur Zusage"
            style={{ flex: '1 1 220px', padding: '9px 11px', borderRadius: 10, fontSize: 13.5, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' }} />
          {z?.status === 'yes' && <button type="button" onClick={() => void onSetze('yes', notiz)} style={knopf(false)}>Notiz speichern</button>}
        </div>
      )}
    </section>
  );
}

/** Eine Zeile in der Teilnehmerliste; der Kapitän setzt den Status, bei ✗/? mit Begründung. */
export function KaderZeile({ name, z, darfSetzen, ohneGrund = false, onSetze }: {
  name: string; z?: Zusage; darfSetzen: boolean; onSetze: (s: ZusageStatus | null, note: string | null) => void | Promise<void>;
  /** TC setzt für einen anderen Spieler → Begründung freiwillig. */
  ohneGrund?: boolean;
}) {
  const [grundFuer, setGrundFuer] = useState<ZusageStatus | null>(null);
  return (
    <div style={{ padding: '9px 0', borderTop: '1px solid var(--th-line-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <StatusIcon s={z?.status ?? null} size={24} />
        <span style={{ flex: '1 1 150px', minWidth: 0, fontFamily: 'var(--font-manrope)', fontSize: 14, fontWeight: 700, color: 'var(--th-text-strong)' }}>
          {name}
          {z?.note && <span style={{ display: 'block', fontWeight: 500, fontSize: 12.5, color: 'var(--th-text-muted)' }}>„{z.note}“</span>}
        </span>
        {darfSetzen && (
          <span style={{ display: 'flex', gap: 5 }}>
            {REIHE.map(s => (
              <button key={s} type="button" title={`${STATUS[s].text} setzen`} aria-label={`${name}: ${STATUS[s].text}`} style={klein(z?.status === s || grundFuer === s, STATUS[s].farbe)}
                onClick={() => (braucheGrund(s) ? setGrundFuer(s) : (setGrundFuer(null), void onSetze('yes', z?.status === 'yes' ? z.note : null)))}>
                <Icon name={STATUS[s].icon} size={14} stroke={2.6} />
              </button>
            ))}
            <button type="button" onClick={() => { setGrundFuer(null); void onSetze(null, null); }} disabled={!z} style={{ ...klein(false, 'var(--th-text-muted)'), opacity: z ? 1 : 0.35 }} title="Zurück auf offen" aria-label={`${name}: zurück auf offen`}>
              <Icon name="arrow-up" size={14} stroke={2.2} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </span>
        )}
      </div>
      {grundFuer && (
        <GrundEingabe status={grundFuer} start={z?.status === grundFuer ? z.note ?? '' : ''} freiwillig={ohneGrund}
          onAbbrechen={() => setGrundFuer(null)}
          onSenden={g => { setGrundFuer(null); void onSetze(grundFuer, g); }} />
      )}
    </div>
  );
}

export const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 16, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 2px 12px var(--th-shadow)' };
export const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 19, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: 0 };
export const badge: React.CSSProperties = { display: 'inline-block', width: 22, textAlign: 'center', padding: '2px 0', borderRadius: 5, fontSize: 11, fontWeight: 800, verticalAlign: '2px' };
export const punkt: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, flexShrink: 0 };

export function chip(bg: string, fg: string): React.CSSProperties {
  return { padding: '4px 9px', borderRadius: 999, background: bg, color: fg, fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
}
const standZahl: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, lineHeight: 1, color: 'var(--th-text-strong)' };
function standZelle(an: boolean, farbe: string): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '7px 4px', borderRadius: 10, border: `1.5px solid ${an ? farbe : 'transparent'}`, background: an ? 'var(--th-bg-card3)' : 'transparent' };
}

export function knopf(aktiv: boolean, farbe = 'var(--th-accent)'): React.CSSProperties {
  return {
    padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
    border: `1.5px solid ${farbe}`, background: aktiv ? farbe : 'transparent', color: aktiv ? '#fff' : farbe,
  };
}
export function klein(aktiv: boolean, farbe: string): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: `1.5px solid ${farbe}`, background: aktiv ? farbe : 'transparent', color: aktiv ? '#fff' : farbe,
  };
}
