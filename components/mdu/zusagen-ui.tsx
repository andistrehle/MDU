'use client';

// Gemeinsame Bausteine der Zu-/Absagen (Übersicht /mein-team/zusagen und
// Spieltag-Seite /spieltag/[team]/[spiel]).

import { useState } from 'react';
import { NOTIZ_MAX, GRUND_MIN, braucheGrund, type Zusage, type ZusageStatus } from '@/lib/supabase/zusagen';

// Darstellung je Status (keine Zeile = offen).
export const STATUS: Record<ZusageStatus, { text: string; zeichen: string; farbe: string; knopf: string; senden: string }> = {
  yes:   { text: 'zugesagt', zeichen: '👍', farbe: 'var(--th-win)', knopf: 'Zusagen',  senden: 'Zusage senden' },
  maybe: { text: 'unsicher', zeichen: '?',  farbe: '#B7791F',      knopf: 'Unsicher', senden: 'Als unsicher melden' },
  no:    { text: 'abgesagt', zeichen: '👎', farbe: '#C0392B',      knopf: 'Absagen',  senden: 'Absage senden' },
};
export const REIHE: ZusageStatus[] = ['yes', 'maybe', 'no'];

/** Eingabe der Begründung (Pflicht bei Absage/unsicher, min. GRUND_MIN Zeichen). */
export function GrundEingabe({ status, start, onSenden, onAbbrechen }: {
  status: ZusageStatus; start: string; onSenden: (grund: string) => void; onAbbrechen: () => void;
}) {
  const [grund, setGrund] = useState(start);
  const ok = grund.trim().length >= GRUND_MIN;
  return (
    <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${STATUS[status].farbe}`, background: 'var(--th-bg-card)' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 800, color: 'var(--th-text-body)', marginBottom: 6 }}>
        Begründung {status === 'no' ? 'für die Absage' : '(warum unsicher?)'} <span style={{ fontWeight: 600, color: 'var(--th-text-faint)' }}>– Pflicht, mind. {GRUND_MIN} Zeichen</span>
        <textarea autoFocus value={grund} onChange={e => setGrund(e.target.value.slice(0, NOTIZ_MAX))} maxLength={NOTIZ_MAX} rows={2}
          placeholder={status === 'no' ? 'z. B. bin im Urlaub' : 'z. B. Spätschicht, weiß ich erst Mittwoch'}
          style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 8, fontSize: 13.5, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)', resize: 'vertical', boxSizing: 'border-box' }} />
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" disabled={!ok} onClick={() => onSenden(grund.trim())} style={{ ...knopf(true, STATUS[status].farbe), opacity: ok ? 1 : 0.45, cursor: ok ? 'pointer' : 'not-allowed' }}>{STATUS[status].senden}</button>
        <button type="button" onClick={onAbbrechen} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>Abbrechen</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: ok ? 'var(--th-text-faint)' : '#C0392B' }}>{grund.trim().length}/{NOTIZ_MAX}</span>
      </div>
    </div>
  );
}

/** Eigene Zu-/Absage: Zusage sofort (Notiz freiwillig), Absage/unsicher nur mit Begründung. */
export function MeineAntwort({ z, onSetze }: { z?: Zusage; onSetze: (s: ZusageStatus | null, note: string | null) => void | Promise<void> }) {
  const [notiz, setNotiz] = useState(z?.status === 'yes' ? z.note ?? '' : '');
  const [offenNotiz, setOffenNotiz] = useState(z?.status === 'yes' && !!z.note);
  const [grundFuer, setGrundFuer] = useState<ZusageStatus | null>(null);
  const st = z ? STATUS[z.status] : null;
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)' }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 800, color: 'var(--th-text-body)', marginBottom: 8 }}>
        Du: {st ? <span style={{ color: st.farbe }}>{st.text}</span> : <span style={{ color: 'var(--th-text-faint)' }}>noch offen</span>}
        {z?.note && z.status !== 'yes' && <span style={{ fontWeight: 500, color: 'var(--th-text-muted)' }}> – „{z.note}“</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {REIHE.map(s => (
          <button key={s} type="button" style={knopf(z?.status === s || grundFuer === s, STATUS[s].farbe)}
            onClick={() => (braucheGrund(s) ? setGrundFuer(s) : (setGrundFuer(null), void onSetze('yes', notiz)))}>
            {STATUS[s].zeichen} {STATUS[s].knopf}
          </button>
        ))}
        {!offenNotiz && !grundFuer && <button type="button" onClick={() => setOffenNotiz(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>+ Notiz zur Zusage</button>}
      </div>
      {grundFuer && (
        <GrundEingabe status={grundFuer} start={z?.status === grundFuer ? z.note ?? '' : ''}
          onAbbrechen={() => setGrundFuer(null)}
          onSenden={g => { setGrundFuer(null); void onSetze(grundFuer, g); }} />
      )}
      {offenNotiz && !grundFuer && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input value={notiz} onChange={e => setNotiz(e.target.value.slice(0, NOTIZ_MAX))} maxLength={NOTIZ_MAX}
            placeholder="z. B. komme 30 Min. später" aria-label="Notiz zur Zusage"
            style={{ flex: '1 1 220px', padding: '8px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' }} />
          {z?.status === 'yes' && <button type="button" onClick={() => void onSetze('yes', notiz)} style={knopf(false)}>Notiz speichern</button>}
        </div>
      )}
    </div>
  );
}

/** Eine Zeile im Kader; der Kapitän setzt den Status, bei ✗/? mit Begründung. */
export function KaderZeile({ name, z, darfSetzen, onSetze }: {
  name: string; z?: Zusage; darfSetzen: boolean; onSetze: (s: ZusageStatus | null, note: string | null) => void | Promise<void>;
}) {
  const [grundFuer, setGrundFuer] = useState<ZusageStatus | null>(null);
  const st = z ? STATUS[z.status] : null;
  return (
    <div style={{ padding: '7px 0', borderTop: '1px solid var(--th-line-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ ...punkt, background: st ? st.farbe : 'var(--th-line-18)' }} aria-hidden />
        <span style={{ flex: '1 1 160px', minWidth: 0, fontFamily: 'var(--font-manrope)', fontSize: 13.5, fontWeight: 700, color: 'var(--th-text-strong)' }}>
          {name}
          <span style={{ fontWeight: 600, color: st ? st.farbe : 'var(--th-text-faint)', fontSize: 12.5 }}>{' · '}{st ? st.text : 'offen'}</span>
          {z?.note && <span style={{ display: 'block', fontWeight: 500, fontSize: 12.5, color: 'var(--th-text-muted)' }}>„{z.note}“</span>}
        </span>
        {darfSetzen && (
          <span style={{ display: 'flex', gap: 6 }}>
            {REIHE.map(s => (
              <button key={s} type="button" title={`${STATUS[s].knopf} setzen`} style={klein(z?.status === s || grundFuer === s, STATUS[s].farbe)}
                onClick={() => (braucheGrund(s) ? setGrundFuer(s) : (setGrundFuer(null), void onSetze('yes', z?.status === 'yes' ? z.note : null)))}>
                {STATUS[s].zeichen}
              </button>
            ))}
            <button type="button" onClick={() => { setGrundFuer(null); void onSetze(null, null); }} disabled={!z} style={{ ...klein(false, 'var(--th-text-muted)'), opacity: z ? 1 : 0.4 }} title="Zurück auf offen">↺</button>
          </span>
        )}
      </div>
      {grundFuer && (
        <GrundEingabe status={grundFuer} start={z?.status === grundFuer ? z.note ?? '' : ''}
          onAbbrechen={() => setGrundFuer(null)}
          onSenden={g => { setGrundFuer(null); void onSetze(grundFuer, g); }} />
      )}
    </div>
  );
}

export const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 };
export const badge: React.CSSProperties = { display: 'inline-block', width: 22, textAlign: 'center', padding: '2px 0', borderRadius: 5, fontSize: 11, fontWeight: 800, verticalAlign: '2px' };
export const punkt: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, flexShrink: 0 };

export function knopf(aktiv: boolean, farbe = 'var(--th-accent)'): React.CSSProperties {
  return {
    padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
    border: `1.5px solid ${farbe}`, background: aktiv ? farbe : 'transparent', color: aktiv ? '#fff' : farbe,
  };
}
export function klein(aktiv: boolean, farbe: string): React.CSSProperties {
  return {
    width: 34, height: 30, borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 800,
    border: `1.5px solid ${farbe}`, background: aktiv ? farbe : 'transparent', color: aktiv ? '#fff' : farbe,
  };
}
