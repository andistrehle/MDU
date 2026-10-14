'use client';

// ============================================================
// Team Manager: Termine importieren (nur TC)
// ============================================================
// Einfügen aus Excel / Google Tabellen (oder eine .csv wählen) → Vorschau je
// Zeile (übernehmen / doppelt / Fehler) → alle gültigen auf einmal anlegen.
// Liga und Farbe gelten für alle Zeilen, eine Spalte in der Tabelle schlägt
// die Vorgabe. Logik: lib/termin-import.ts.
// ============================================================

import { useMemo, useState } from 'react';
import { Icon } from './icon';
import { karte, knopf, h2, chip } from './zusagen-ui';
import { terminGrund } from './termin-ui';
import { werteAus, vorlageCsv, IMPORT_MAX } from '@/lib/termin-import';
import { TERMIN_FARBEN, terminFarbe, terminTitel, type TeamTermin, type TerminArt, type TerminEingabe } from '@/lib/supabase/termine';
import { wochentag, tagMonat } from '@/lib/spieltag';

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

export function TerminImport({ teamName, vorhanden, onImport, onAbbrechen }: {
  teamName: string; vorhanden: TeamTermin[];
  onImport: (liste: TerminEingabe[]) => Promise<boolean>; onAbbrechen: () => void;
}) {
  const [text, setText] = useState('');
  const [art, setArt] = useState<TerminArt>('spiel');
  const [liga, setLiga] = useState('');
  const [farbe, setFarbe] = useState<string>(TERMIN_FARBEN[0].hex);
  const [laeuft, setLaeuft] = useState(false);

  const { zeilen, mitKopf } = useMemo(() => werteAus(text, { art, liga, farbe, teamName, heute: heuteIso() }, vorhanden), [text, art, liga, farbe, teamName, vorhanden]);
  const neu = zeilen.filter(z => z.eingabe && !z.doppelt);
  const fehler = zeilen.filter(z => z.fehler).length;
  const doppelt = zeilen.filter(z => z.doppelt).length;

  function vorlage() {
    const url = URL.createObjectURL(new Blob([vorlageCsv()], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'termine-vorlage.csv' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function datei(f: File | undefined) {
    if (!f) return;
    setText(await f.text());
  }
  async function uebernehmen() {
    setLaeuft(true);
    await onImport(neu.map(z => z.eingabe!));
    setLaeuft(false);
  }

  return (
    <section style={{ ...karte, gap: 12, border: `1.5px solid ${farbe}`, background: terminGrund(farbe) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={chip(farbe, '#fff')}>Extern</span>
        <h2 style={h2}>Termine importieren</h2>
      </div>
      <ol style={{ margin: 0, paddingLeft: 20, fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.6, color: 'var(--th-text-body)' }}>
        <li>Termine in Excel oder Google Tabellen markieren und kopieren – am besten mit Kopfzeile (Datum, Beginn, Gegner, Heim/Auswärts, Ort …).</li>
        <li>Unten einfügen. Die Vorschau zeigt, was erkannt wurde.</li>
        <li>Passt alles: übernehmen. Doppelte Termine werden übersprungen.</li>
      </ol>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={vorlage} style={{ ...knopf(false, farbe), display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="download" size={15} /> Vorlage herunterladen</button>
        <label style={{ ...knopf(false, farbe), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="upload" size={15} /> CSV-Datei wählen
          <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={e => void datei(e.target.files?.[0])} style={{ display: 'none' }} />
        </label>
      </div>

      <textarea value={text} onChange={e => setText(e.target.value)} rows={6} aria-label="Termine einfügen"
        placeholder={'Hier einfügen, z. B.\nDatum\tBeginn\tGegner\tHeim/Auswärts\tOrt\n23.10.2026\t19:30\tDC Beispiel\tA\tGaststätte zum Pfeil'}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-jetbrains-mono)', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)', resize: 'vertical' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, alignItems: 'end' }}>
        <label style={feld}>Termine ohne Spalte „Art“ sind
          <select value={art} onChange={e => setArt(e.target.value as TerminArt)} style={eingabe}>
            <option value="spiel">Spiele</option>
            <option value="sonstiges">Sonstiges (Training …)</option>
          </select>
        </label>
        <label style={feld}>Liga für alle (wenn nicht in der Tabelle)
          <input value={liga} onChange={e => setLiga(e.target.value)} maxLength={60} placeholder="z. B. DSAB Bezirksliga" style={eingabe} />
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ ...feld, flexDirection: 'row' }}>Farbe für alle</span>
        {TERMIN_FARBEN.map(f => (
          <button key={f.hex} type="button" aria-label={f.name} title={f.name} aria-pressed={farbe === f.hex} onClick={() => setFarbe(f.hex)}
            style={{ width: 28, height: 28, borderRadius: 999, cursor: 'pointer', background: f.hex, border: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: farbe === f.hex ? `0 0 0 3px var(--th-bg-card), 0 0 0 5px ${f.hex}` : 'none' }}>
            {farbe === f.hex && <Icon name="check" size={14} stroke={3} />}
          </button>
        ))}
      </div>

      {zeilen.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 800, color: 'var(--th-text-body)' }}>
            Vorschau{mitKopf ? ' (Kopfzeile erkannt)' : ''}: <span style={{ color: 'var(--th-win)' }}>{neu.length} neu</span>
            {doppelt > 0 && <> · <span style={{ color: 'var(--th-text-muted)' }}>{doppelt} schon vorhanden</span></>}
            {fehler > 0 && <> · <span style={{ color: 'var(--th-loss)' }}>{fehler} mit Fehler</span></>}
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--th-line-8)', background: 'var(--th-bg-card)' }}>
            {zeilen.map(z => (
              <div key={z.nr} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderTop: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 12.5, opacity: z.doppelt ? 0.55 : 1 }}>
                <span style={{ width: 22, flexShrink: 0, textAlign: 'center', color: z.fehler ? 'var(--th-loss)' : z.doppelt ? 'var(--th-text-faint)' : 'var(--th-win)' }}>
                  <Icon name={z.fehler ? 'close' : z.doppelt ? 'help' : 'check'} size={15} stroke={2.6} />
                </span>
                {z.eingabe ? (
                  <>
                    <span style={{ width: 92, flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-strong)' }}>
                      {wochentag(z.eingabe.event_date)} {tagMonat(z.eingabe.event_date)}{z.eingabe.start_time ? <span style={{ display: 'block', fontWeight: 600, color: 'var(--th-text-muted)' }}>{z.eingabe.start_time}{z.eingabe.end_time ? `–${z.eingabe.end_time}` : ''}</span> : null}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 800, color: 'var(--th-text-strong)' }}>
                        {terminTitel(z.eingabe)}{z.eingabe.kind === 'spiel' && <span style={{ fontWeight: 600, color: 'var(--th-text-muted)' }}> · {z.eingabe.is_home === false ? 'Auswärts' : 'Heim'}</span>}
                      </span>
                      <span style={{ display: 'block', color: 'var(--th-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[z.eingabe.league, z.eingabe.venue, z.eingabe.address].filter(Boolean).join(' · ') || (z.eingabe.kind === 'spiel' ? 'ohne Liga/Ort' : 'Sonstiges')}
                        {z.doppelt && ' · schon vorhanden'}
                      </span>
                    </span>
                    <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, background: terminFarbe(z.eingabe) }} />
                  </>
                ) : (
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 800, color: 'var(--th-loss)' }}>Zeile {z.nr}: {z.fehler}</span>
                    <span style={{ display: 'block', color: 'var(--th-text-faint)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.roh.join(' | ')}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
          {zeilen.length >= IMPORT_MAX && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-gold)' }}>Höchstens {IMPORT_MAX} Zeilen auf einmal – den Rest bitte in einem zweiten Durchgang.</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" disabled={!neu.length || laeuft} onClick={() => void uebernehmen()} style={{ ...knopf(true, farbe), opacity: !neu.length || laeuft ? 0.5 : 1, cursor: !neu.length || laeuft ? 'not-allowed' : 'pointer' }}>
          {laeuft ? 'Übernehme …' : neu.length ? `${neu.length} ${neu.length === 1 ? 'Termin' : 'Termine'} übernehmen` : 'Termine übernehmen'}
        </button>
        <button type="button" onClick={onAbbrechen} style={knopf(false, 'var(--th-text-muted)')}>Abbrechen</button>
        {fehler > 0 && neu.length > 0 && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>Zeilen mit Fehler werden nicht übernommen.</span>}
      </div>
    </section>
  );
}

const feld: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-text-muted)' };
const eingabe: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 10, fontSize: 13.5, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' };
