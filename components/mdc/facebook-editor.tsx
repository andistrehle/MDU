'use client';

// ============================================================
// MDC — Rangliste als Facebook-Beitrag
// ============================================================
//
// Der Text steht fertig da und ist trotzdem ein Textfeld: Vor dem Einstellen
// will man oft noch einen Satz davorschreiben („Heute im Fiakerstüberl geht's
// weiter"). Kopiert und abgeschickt wird immer das, was im Feld steht — nicht
// das, was die Seite gerechnet hat.
//
// Der Kopierweg ist der Hauptweg und nicht der Notbehelf: In eine
// Facebook-GRUPPE kann kein Programm schreiben, seit Meta die Groups-API
// abgeschaltet hat. Für die MDC-Gruppe heißt das: kopieren, einfügen, fertig.
// Der Knopf zum direkten Einstellen erscheint nur, wenn eine Facebook-SEITE
// hinterlegt ist — dort geht es.
// ============================================================

import { useState } from 'react';
import {
  AlertTriangle, Check, Copy, ExternalLink, Loader2, Megaphone, RotateCcw, Send,
} from 'lucide-react';
import { posteRangliste } from '@/app/mdc/admin/facebook/actions';

// Das Megafon statt eines Facebook-Zeichens: lucide führt keine Markenlogos
// mehr. Passt hier ohnehin besser — es geht ums Hinausrufen, nicht um Facebook.

export interface FacebookEditorProps {
  /** Der gerechnete Beitrag — Ausgangspunkt, nicht Zwang. */
  vorlage: string;
  /** Adresse der MDC-Gruppe, in die der Text eingefügt wird. */
  gruppe: string;
  /** Kann die Seite selbst posten (Facebook-Seite hinterlegt)? */
  canPost: boolean;
  /** Was dafür fehlt — steht dann als Hinweis dabei. */
  missing: string[];
  /** Kurzfassung dessen, was im Beitrag steht. */
  zusammenfassung: string;
}

export function FacebookEditor({
  vorlage, gruppe, canPost, missing, zusammenfassung,
}: FacebookEditorProps) {
  const [text, setText] = useState(vorlage);
  const [kopiert, setKopiert] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(text);
      setKopiert(true);
      setFehler(null);
      window.setTimeout(() => setKopiert(false), 4000);
    } catch {
      // Ohne Zwischenablage (ältere Browser, kein HTTPS) bleibt der ehrliche
      // Weg: markieren und von Hand kopieren.
      setFehler(
        'Der Browser hat das Kopieren nicht zugelassen. Bitte den Text im Feld markieren '
        + 'und von Hand kopieren.',
      );
    }
  }

  async function posten() {
    setLaeuft(true);
    setFehler(null);
    setErfolg(null);
    const antwort = await posteRangliste(text);
    setLaeuft(false);
    if (!antwort.ok) { setFehler(antwort.fehler); return; }
    setErfolg(antwort.url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {fehler && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {erfolg && (
        <div className="mdc-card mdc-card-accent" style={{ padding: '18px 20px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
            <Check size={18} style={{ color: 'var(--mdc-win)' }} />
            Der Beitrag steht bei Facebook.
          </p>
          <a href={erfolg} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
            Beitrag ansehen
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <Megaphone size={19} style={{ color: 'var(--mdc-red)' }} />
            Beitrag
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
            {zusammenfassung} · {text.length} Zeichen
          </span>
        </div>

        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Der Text ist der Stand von heute. Du kannst ihn ändern, bevor du ihn kopierst —
          etwa einen Satz voranstellen.
        </p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          spellCheck={false}
          rows={22}
          style={{
            marginTop: 14, width: '100%', padding: '12px 14px',
            fontFamily: 'var(--mdc-font-num, ui-monospace), ui-monospace, monospace',
            fontSize: '0.86rem', lineHeight: 1.6,
            border: '1px solid var(--mdc-line-hard)', borderRadius: 10,
            background: 'var(--mdc-card-2)', color: 'var(--mdc-ink)',
            resize: 'vertical',
          }}
        />

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="mdc-btn mdc-btn-primary" onClick={kopieren}>
            {kopiert ? <Check size={17} /> : <Copy size={17} />}
            {kopiert ? 'Kopiert' : 'Text kopieren'}
          </button>
          <a href={gruppe} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost">
            <Megaphone size={17} />
            MDC-Gruppe öffnen
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            className="mdc-btn mdc-btn-ghost"
            onClick={() => { setText(vorlage); setFehler(null); }}
            disabled={text === vorlage}
          >
            <RotateCcw size={16} />
            Zurücksetzen
          </button>
        </div>

        <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--mdc-line)' }}>
          {canPost ? (
            <>
              <button
                type="button"
                className="mdc-btn mdc-btn-primary"
                onClick={posten}
                disabled={laeuft}
              >
                {laeuft
                  ? <><Loader2 size={17} className="mdc-spin" /> Wird eingestellt …</>
                  : <><Send size={17} /> Auf der Facebook-Seite einstellen</>}
              </button>
              <p style={{ marginTop: 10, fontSize: '0.84rem', lineHeight: 1.65, color: 'var(--mdc-ink-dim)' }}>
                Geht auf die hinterlegte Facebook-<strong>Seite</strong>. In die Gruppe kann kein
                Programm schreiben — dort bleibt es beim Kopieren.
              </p>
            </>
          ) : (
            <>
              <h3 className="mdc-display" style={{ fontSize: '1rem' }}>Direkt einstellen geht noch nicht</h3>
              <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
                {'In eine Facebook-'}<strong>Gruppe</strong>{' kann kein Programm schreiben — Meta hat '}
                die Schnittstelle dafür abgeschaltet. Das gilt für jedes Werkzeug, nicht nur für
                dieses. Der Weg in die MDC-Gruppe ist deshalb: kopieren, einfügen, abschicken.
              </p>
              <p style={{ marginTop: 10, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
                Auf eine Facebook-<strong>Seite</strong> kann die MDC dagegen selbst posten. Falls
                es die einmal gibt, fehlen dafür nur diese Angaben im Vercel-Projekt:
              </p>
              <ul style={{ marginTop: 10, paddingLeft: 18, listStyle: 'disc', fontSize: '0.86rem', lineHeight: 1.8, color: 'var(--mdc-ink-soft)' }}>
                {missing.map(m => <li key={m}><code>{m}</code></li>)}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
