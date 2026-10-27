'use client';

// ============================================================
// Team Manager: eigene Termine außerhalb der MDU (Migration 0048)
// ============================================================
// Kopf, Kachel und Formular. Optisch wie die MDU-Spiele (dunkle Tafel),
// aber VIOLETT leuchtend und mit dem Chip „Extern“ — so ist auf einen Blick
// klar, dass der Termin nicht zum MDU-Spielbetrieb gehört.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from './icon';
import { TeamBadge } from './team-badge';
import { Zeitleiste, StandLeiste, KachelFuss, chip, karte, knopf, h2, namenJeGruppe, gruppenAnker } from './zusagen-ui';
import { NotizAufgabenHinweis } from './spiel-kachel';
import { team27 } from '@/lib/data/saison-2027';
import { wochentag, tagMonat } from '@/lib/spieltag';
import { terminPfad, terminTitel, pruefeTermin, terminFarbe, TERMIN_FARBEN, type TeamTermin, type TerminEingabe, type TerminArt } from '@/lib/supabase/termine';
import type { Zusage, ZusageStatus, Aufgabe } from '@/lib/supabase/zusagen';

export const EXTERN_FARBE = TERMIN_FARBEN[0].hex;
const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
/** Getönter Kartengrund in der Farbe des Termins (hebt ihn von den MDU-Spielen ab). */
export const terminGrund = (farbe: string) => `color-mix(in srgb, ${farbe} 12%, var(--th-bg-card))`;

/** Dunkle Tafel eines eigenen Termins (Kachel + Terminseite). */
export function TerminKopf({ t, teamId, gross = false, rechts }: { t: TeamTermin; teamId: string; gross?: boolean; rechts?: React.ReactNode }) {
  const fg = '#fff', fgLeise = 'rgba(255,255,255,0.75)', chipGrund = 'rgba(255,255,255,0.14)';
  const tm = team27(teamId);
  const logo = gross ? 52 : 40;
  const spiel = t.kind === 'spiel';
  const farbe = terminFarbe(t);
  const gegnerBadge = (
    <div style={{ width: logo, height: logo, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.45)', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: gross ? 18 : 15 }}>
      {(t.opponent ?? '?').replace(/[^A-Za-zÄÖÜäöü0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0]).join('').toUpperCase() || '?'}
    </div>
  );
  const seite = (wir: boolean) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
      {wir ? <TeamBadge initials={tm?.short ?? teamId.slice(0, 3).toUpperCase()} color={tm?.color} logoUrl={tm?.logoUrl ?? undefined} size={logo} ring="#fff" /> : gegnerBadge}
      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: gross ? 14 : 12.5, lineHeight: 1.2, color: wir ? fg : fgLeise, overflowWrap: 'anywhere' }}>{wir ? tm?.name ?? teamId : t.opponent}</span>
    </div>
  );
  const zeit = (
    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: gross ? 78 : 64 }}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: gross ? 34 : 26, lineHeight: 1, letterSpacing: '0.02em', color: fg }}>{t.start_time ?? '–:–'}</div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: fgLeise, marginTop: 4 }}>{t.start_time ? (spiel ? 'Anwurf' : 'Beginn') : 'Uhrzeit folgt'}</div>
    </div>
  );
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', color: fg, padding: gross ? '16px 16px 18px' : '12px 14px 14px',
      background: `radial-gradient(120% 90% at 100% 0%, rgba(${rgb(farbe)},0.7) 0%, transparent 62%), linear-gradient(160deg, rgba(${rgb(farbe)},0.28) 0%, #12101C 75%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: gross ? 14 : 10 }}>
        <span style={chip(chipGrund, fg)}>{wochentag(t.event_date)} {tagMonat(t.event_date)}</span>
        <span style={{ ...chip(farbe, '#fff'), display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={12} stroke={2.4} />Extern</span>
        {spiel && (
          <span style={{ ...chip('rgba(255,255,255,0.22)', '#fff'), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name={t.is_home === false ? 'arrow-right' : 'home'} size={12} stroke={2.4} />{t.is_home === false ? 'Auswärts' : 'Heimspiel'}
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: fgLeise, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spiel ? t.league ?? 'Spiel außerhalb der MDU' : 'Termin'}</span>
          {rechts}
        </span>
      </div>
      {spiel ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {seite(t.is_home !== false)}
          {zeit}
          {seite(t.is_home === false)}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: gross ? 28 : 22, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.02em', overflowWrap: 'anywhere' }}>{t.title}</div>
            {t.venue && <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: fgLeise, marginTop: 4 }}>{t.venue}</div>}
          </div>
          {zeit}
        </div>
      )}
    </div>
  );
}

/** Kachel eines eigenen Termins in der Übersicht → /termin/<id>. */
export function TerminKachel({ t, teamId, zusagen, kaderAnzahl, ichId, treffenMin, meetTime, notiz = null, aufgaben = [], personen, onAntwort }: {
  t: TeamTermin; teamId: string; zusagen: Zusage[]; kaderAnzahl: number; ichId: string | null;
  treffenMin: number; meetTime: string | null; notiz?: string | null; aufgaben?: Aufgabe[];
  /** Kader (+ ich) — macht die Zahlen interaktiv (Namen, Sprung zur Teilnehmerliste). */
  personen?: { id: string; name: string }[];
  /** Eigene Antwort direkt in der Kachel (Terminliste). */
  onAntwort?: (status: ZusageStatus, note: string | null) => Promise<string | null>;
}) {
  const router = useRouter();
  const pfad = terminPfad(t.id);
  const meins = ichId ? zusagen.find(z => z.player_id === ichId)?.status ?? null : undefined;
  const zahl = (s: ZusageStatus) => zusagen.filter(z => z.status === s).length;
  const farbe = terminFarbe(t);
  return (
    <div className="mdu-spiel-kachel" style={{ borderRadius: 16, overflow: 'hidden', background: terminGrund(farbe), border: `1.5px solid ${farbe}`, boxShadow: '0 2px 12px var(--th-shadow)' }}>
    <Link href={pfad} style={{ display: 'block', textDecoration: 'none' }}>
      <TerminKopf t={t} teamId={teamId} rechts={<Icon name="chevron" size={14} style={{ opacity: 0.7 }} />} />
      <Zeitleiste beginn={t.start_time ?? undefined} treffenMin={t.kind === 'spiel' ? treffenMin : 0} meetTime={meetTime} ende={t.end_time ?? (t.kind === 'spiel' ? undefined : null)} />
      <NotizAufgabenHinweis notiz={notiz} aufgaben={aufgaben} ichId={ichId} />
    </Link>
      {/* Außerhalb des Links: eigene Antwort + Stand (aufklappbar: Namen, Sprung zur Teilnehmerliste). */}
      <KachelFuss zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={Math.max(0, kaderAnzahl - zusagen.length)} meins={meins}
        meineNotiz={ichId ? zusagen.find(z => z.player_id === ichId)?.note ?? null : null} onAntwort={ichId ? onAntwort : undefined}>
        <StandLeiste zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={Math.max(0, kaderAnzahl - zusagen.length)} meins={meins}
          namen={personen ? namenJeGruppe(personen, id => zusagen.find(z => z.player_id === id)) : undefined}
          zurListe={g => router.push(`${pfad}#${gruppenAnker(g)}`)} />
      </KachelFuss>
      <style>{'.mdu-spiel-kachel{transition:transform 160ms ease,box-shadow 160ms ease}.mdu-spiel-kachel:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--th-shadow)!important}'}</style>
    </div>
  );
}

const LEER: TerminEingabe = { kind: 'spiel', title: null, league: null, opponent: null, is_home: true, event_date: '', start_time: null, end_time: null, venue: null, address: null, color: null };

/** Formular „Termin eintragen“ / „Termin ändern“ (nur TC). */
/** Häkchen „Team benachrichtigen“ (Glocke + Push ans Team, /api/team/nachricht) — vorausgewählt. */
export function TeamBenachrichtigen({ an, setAn, was }: { an: boolean; setAn: (v: boolean) => void; was: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
      <input type="checkbox" checked={an} onChange={x => setAn(x.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--th-accent)' }} />
      <span><strong style={{ color: 'var(--th-text-strong)' }}>Team benachrichtigen</strong> – {was}</span>
    </label>
  );
}

export function TerminFormular({ start, titel, onSpeichern, onAbbrechen, onLoeschen }: {
  start?: TeamTermin | null; titel: string;
  onSpeichern: (e: TerminEingabe, team: boolean) => Promise<boolean>; onAbbrechen: () => void; onLoeschen?: (team: boolean) => void;
}) {
  const [e, setE] = useState<TerminEingabe>(start ? { ...start } : LEER);
  const [team, setTeam] = useState(true);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const set = <K extends keyof TerminEingabe>(k: K, v: TerminEingabe[K]) => setE(x => ({ ...x, [k]: v }));
  const farbe = terminFarbe(e);
  const art = (k: TerminArt) => setE(x => ({ ...x, kind: k, is_home: k === 'spiel' ? x.is_home ?? true : null }));

  async function senden() {
    const { fehler: f } = pruefeTermin(e);
    if (f) { setFehler(f); return; }
    setFehler(null); setLaeuft(true);
    const ok = await onSpeichern(e, team);
    setLaeuft(false);
    if (!ok) setFehler(null);
  }

  return (
    <section style={{ ...karte, gap: 10, border: `1.5px solid ${farbe}`, background: terminGrund(farbe) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ ...chip(farbe, '#fff') }}>Extern</span>
        <h2 style={h2}>{titel}</h2>
      </div>
      <div role="radiogroup" aria-label="Art des Termins" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 4, borderRadius: 12, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
        {([['spiel', 'Spiel (andere Liga/Pokal)'], ['sonstiges', 'Sonstiges (z. B. Training)']] as [TerminArt, string][]).map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={e.kind === k} onClick={() => art(k)} style={{ padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, background: e.kind === k ? farbe : 'transparent', color: e.kind === k ? '#fff' : 'var(--th-text-body)' }}>{l}</button>
        ))}
      </div>

      {e.kind === 'spiel' ? (
        <>
          <Feld label="Gegner *"><input value={e.opponent ?? ''} onChange={x => set('opponent', x.target.value)} maxLength={80} placeholder="z. B. DC Beispiel" style={eingabe} /></Feld>
          <Feld label="Liga / Wettbewerb"><input value={e.league ?? ''} onChange={x => set('league', x.target.value)} maxLength={60} placeholder="z. B. DSAB Bezirksliga, Pokal" style={eingabe} /></Feld>
          <div style={{ display: 'flex', gap: 6 }}>
            {[true, false].map(h => (
              <button key={String(h)} type="button" onClick={() => set('is_home', h)} style={{ ...knopf(e.is_home === h, farbe), flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name={h ? 'home' : 'arrow-right'} size={14} stroke={2.4} />{h ? 'Heimspiel' : 'Auswärts'}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Feld label="Titel *"><input value={e.title ?? ''} onChange={x => set('title', x.target.value)} maxLength={80} placeholder="z. B. Training, Teamabend, Turnier" style={eingabe} /></Feld>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        <Feld label="Datum *"><input type="date" value={e.event_date} onChange={x => set('event_date', x.target.value)} style={eingabe} /></Feld>
        <Feld label="Beginn"><input type="time" value={e.start_time ?? ''} onChange={x => set('start_time', x.target.value || null)} style={eingabe} /></Feld>
        <Feld label="Ende"><input type="time" value={e.end_time ?? ''} onChange={x => set('end_time', x.target.value || null)} style={eingabe} /></Feld>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-text-muted)' }}>Farbe</span>
        <div role="radiogroup" aria-label="Farbe des Termins" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TERMIN_FARBEN.map(f => {
            const an = farbe === f.hex;
            return (
              <button key={f.hex} type="button" role="radio" aria-checked={an} aria-label={f.name} title={f.name} onClick={() => set('color', f.hex)}
                style={{ width: 34, height: 34, borderRadius: 999, cursor: 'pointer', background: f.hex, border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  boxShadow: an ? `0 0 0 3px var(--th-bg-card), 0 0 0 5px ${f.hex}` : 'none' }}>
                {an && <Icon name="check" size={16} stroke={3} />}
              </button>
            );
          })}
        </div>
      </div>
      <Feld label="Ort"><input value={e.venue ?? ''} onChange={x => set('venue', x.target.value)} maxLength={80} placeholder="z. B. Gaststätte zum Pfeil" style={eingabe} /></Feld>
      <Feld label="Adresse"><input value={e.address ?? ''} onChange={x => set('address', x.target.value)} maxLength={120} placeholder="Straße, Ort (für die Route)" style={eingabe} /></Feld>

      <TeamBenachrichtigen an={team} setAn={setTeam} was={start ? 'alle im Team bekommen die Änderung (bzw. die Absage beim Löschen) in die Glocke und aufs Handy.' : 'alle im Team bekommen den neuen Termin in die Glocke und aufs Handy.'} />
      {fehler && <div role="alert" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-loss)' }}>{fehler}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" disabled={laeuft} onClick={() => void senden()} style={{ ...knopf(true, farbe), opacity: laeuft ? 0.6 : 1 }}>{laeuft ? 'Speichere …' : start ? 'Änderungen speichern' : 'Termin eintragen'}</button>
        <button type="button" onClick={onAbbrechen} style={knopf(false, 'var(--th-text-muted)')}>Abbrechen</button>
        {onLoeschen && <button type="button" onClick={() => onLoeschen(team)} style={{ ...knopf(false, 'var(--th-loss)'), marginLeft: 'auto' }}>Termin löschen</button>}
      </div>
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.5 }}>
        Der Termin steht bei allen im Team, alle können zu- oder absagen. Er erscheint auch im Kalender-Abo, mit „Extern“ im Titel.
      </span>
    </section>
  );
}

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-text-muted)', minWidth: 0 }}>
      {label}{children}
    </label>
  );
}

const eingabe: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' };

/** Text eines eigenen Termins für Glocke/Teilen: „Fr 23.10. · Training“. */
export function terminLabel(t: TeamTermin): string {
  return `${wochentag(t.event_date)} ${tagMonat(t.event_date)}${t.start_time ? ` · ${t.start_time}` : ''} · ${terminTitel(t)} (Extern)`;
}
