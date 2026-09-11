'use client';

// ============================================================
// MDC — Rangliste als Facebook-Beitrag
// ============================================================
//
// Der Beitrag besteht aus zwei Bildern (Herren, Damen) und einem kurzen Text
// darüber. Die Rangliste als Bleiwüste aus 49 Zeilen hat niemand gelesen —
// als Tabellenbild schon.
//
// Ablauf am Handy: EIN Knopf. „Beitrag fertig machen" legt den Text in die
// Zwischenablage und reicht beide Bilder ans Teilen-Fenster des Geräts weiter
// — dort steht Facebook mit drin. Alles andere auf der Seite ist der Weg zu
// Fuß für den Fall, dass das Teilen-Fenster nicht mitspielt.
//
// Der Text ist ein Textfeld: Vor dem Einstellen will man oft noch einen Satz
// davorschreiben („Heute im Fiakerstüberl geht's weiter"). Kopiert und
// abgeschickt wird immer das, was im Feld steht — nicht das, was die Seite
// gerechnet hat. Wer die Namen doch lieber als Text hätte, schaltet auf die
// Langfassung um.
//
// Der Kopierweg ist der Hauptweg und nicht der Notbehelf: In eine
// Facebook-GRUPPE kann kein Programm schreiben, seit Meta die Groups-API
// abgeschaltet hat. Für die MDC-Gruppe heißt das: kopieren, einfügen, fertig.
// Der Knopf zum direkten Einstellen erscheint nur, wenn eine Facebook-SEITE
// hinterlegt ist — dort geht es.
// ============================================================

import { useRef, useState } from 'react';
import {
  AlertTriangle, Check, Copy, Download, ExternalLink, FileText, Image as ImageIcon,
  Info, Loader2, Megaphone, RotateCcw, Send, Share2,
} from 'lucide-react';
import { posteRangliste } from '@/app/mdc/admin/facebook/actions';

// Das Megafon statt eines Facebook-Zeichens: lucide führt keine Markenlogos
// mehr. Passt hier ohnehin besser — es geht ums Hinausrufen, nicht um Facebook.

export interface BeitragsBild {
  /** Adresse, unter der das PNG erzeugt wird. */
  src: string;
  titel: string;
  /** Dateiname beim Herunterladen. */
  dateiname: string;
  breite: number;
  hoehe: number;
  zeilen: number;
}

export interface FacebookEditorProps {
  /** Kurzer Text über den Bildern — Ausgangspunkt, nicht Zwang. */
  vorlage: string;
  /** Dieselbe Rangliste als reiner Text, falls die Bilder nicht passen. */
  langfassung: string;
  /** Die beiden Tabellenbilder. */
  bilder: BeitragsBild[];
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
  vorlage, langfassung, bilder, gruppe, canPost, missing, zusammenfassung,
}: FacebookEditorProps) {
  const [text, setText] = useState(vorlage);
  const [lang, setLang] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [teilt, setTeilt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const feldRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Kopieren mit drei Anläufen — auf dem Handy scheitert der erste öfter, als
   * man denkt:
   *
   *   1. `navigator.clipboard` — der richtige Weg, braucht aber HTTPS und
   *      wird in den eingebauten Browsern von Facebook und Instagram gern
   *      verweigert. Genau dort landet man, wenn man den Link in der Gruppe
   *      antippt.
   *   2. Das alte `execCommand('copy')` über das Textfeld selbst. Sieht aus
   *      wie von gestern, funktioniert aber auch dort, wo Nummer 1 nichts tut.
   *   3. Wenn beides nichts hilft: Text markieren und ehrlich sagen, dass
   *      jetzt „Kopieren" aus dem Menü des Browsers dran ist. Vorher stand da
   *      nur eine Fehlermeldung — und der Text war nicht einmal markiert.
   */
  async function kopieren(): Promise<boolean> {
    setFehler(null);
    setHinweis(null);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        gelungen();
        return true;
      }
    } catch {
      // Weiter zum zweiten Anlauf.
    }

    const feld = feldRef.current;
    if (feld) {
      try {
        feld.focus();
        feld.setSelectionRange(0, feld.value.length);
        // `execCommand` gilt als veraltet und ist hier trotzdem richtig: Es ist
        // der einzige Weg, der in den eingebauten Browsern zuverlässig greift.
        if (document.execCommand('copy')) {
          gelungen();
          return true;
        }
      } catch {
        // Dann bleibt der dritte Anlauf.
      }
      feld.focus();
      feld.setSelectionRange(0, feld.value.length);
    }

    setHinweis(
      'Dieser Browser lässt das Kopieren nicht zu — der Text ist jetzt markiert. '
      + 'Lange darauf tippen und „Kopieren" wählen. (In den eingebauten Browsern von '
      + 'Facebook oder Instagram passiert das öfter; im normalen Browser geht der Knopf.)',
    );
    return false;
  }

  function gelungen() {
    setKopiert(true);
    window.setTimeout(() => setKopiert(false), 4000);
  }

  /**
   * Ein Knopf für den ganzen Beitrag: Text in die Zwischenablage, beide Bilder
   * ins Teilen-Fenster des Handys — dort steht Facebook mit drin, und der
   * Beitrag ist mit Bildern fertig, ohne dass irgendetwas gespeichert werden
   * muss.
   *
   * Am Schreibtisch gibt es dieses Fenster nicht; dann werden beide Bilder
   * heruntergeladen und der Text liegt in der Zwischenablage. Zwei Handgriffe
   * statt einem, aber dasselbe Ergebnis.
   *
   * Zu Facebook selbst, damit die Überraschung ausbleibt: Bilder übernimmt es
   * zuverlässig, den mitgeschickten Text je nach Fassung nicht. Deshalb wird
   * er VORHER kopiert — dann genügt Einfügen.
   */
  async function beitragFertig() {
    setTeilt(true);
    setFehler(null);
    setHinweis(null);
    setErfolg(null);

    const textKopiert = await kopieren();

    try {
      const dateien = await Promise.all(bilder.map(async bild => {
        // `same-origin` ist entscheidend: Die Bilder liegen hinter der
        // Passwortabfrage, ohne Anmeldedaten käme eine 401 zurück.
        const antwort = await fetch(bild.src, { credentials: 'same-origin' });
        if (!antwort.ok) throw new Error(`Bild ${bild.titel}: HTTP ${antwort.status}`);
        return new File([await antwort.blob()], bild.dateiname, { type: 'image/png' });
      }));

      if (navigator.canShare?.({ files: dateien })) {
        await navigator.share({ files: dateien, text });
        setTeilt(false);
        setHinweis(
          textKopiert
            ? 'Weitergereicht. Falls Facebook den Text nicht übernommen hat: Er liegt in der '
              + 'Zwischenablage, einfach einfügen.'
            : 'Bilder weitergereicht. Den Text bitte noch aus dem Feld kopieren.',
        );
        return;
      }

      // Kein Teilen-Fenster (Schreibtisch): beide Bilder herunterladen.
      for (const datei of dateien) {
        const url = URL.createObjectURL(datei);
        const a = document.createElement('a');
        a.href = url;
        a.download = datei.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      setTeilt(false);
      setHinweis(
        textKopiert
          ? 'Beide Bilder sind heruntergeladen, der Text liegt in der Zwischenablage. '
            + 'Bei Facebook Beitrag anlegen, Bilder anhängen, Text einfügen.'
          : 'Beide Bilder sind heruntergeladen. Den Text bitte noch aus dem Feld kopieren.',
      );
    } catch (problem) {
      setTeilt(false);
      // Wer das Teilen-Fenster wegwischt, hat keinen Fehler gemacht.
      if (problem instanceof DOMException && problem.name === 'AbortError') return;
      setFehler(
        'Die Bilder konnten nicht vorbereitet werden: '
        + `${problem instanceof Error ? problem.message : String(problem)}\n\n`
        + 'Die Bilder lassen sich weiter einzeln über „speichern" holen.',
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

      {hinweis && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, borderColor: 'var(--mdc-blue-soft)', background: 'var(--mdc-blue-a08)' }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-blue)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65 }}>{hinweis}</p>
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

      {/* ── Der eine Knopf ── */}
      <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Share2 size={20} style={{ color: 'var(--mdc-red)' }} />
          Beitrag fertig machen
        </h2>
        <p style={{ marginTop: 8, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Ein Druck, und alles ist beisammen: Der Text geht in die Zwischenablage, beide Bilder
          ins Teilen-Fenster. Dort Facebook auswählen, Gruppe wählen, Text einfügen, abschicken.
        </p>

        <button
          type="button"
          className="mdc-btn mdc-btn-primary"
          style={{ marginTop: 16 }}
          onClick={beitragFertig}
          disabled={teilt || bilder.length === 0}
        >
          {teilt
            ? <><Loader2 size={18} className="mdc-spin" /> Wird vorbereitet …</>
            : <><Share2 size={18} /> Beitrag fertig machen</>}
        </button>

        <p style={{ marginTop: 12, fontSize: '0.84rem', lineHeight: 1.65, color: 'var(--mdc-ink-dim)' }}>
          Am Schreibtisch gibt es kein Teilen-Fenster — dort werden beide Bilder
          heruntergeladen, der Text liegt trotzdem in der Zwischenablage.{' '}
          <strong>Facebook übernimmt die Bilder zuverlässig, den Text aber nicht immer</strong> —
          deshalb wird er vorher kopiert, dann genügt Einfügen.
        </p>
      </div>

      {/* ── Die Bilder einzeln ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
          <ImageIcon size={19} style={{ color: 'var(--mdc-red)' }} />
          Die Rangliste als Bild
        </h2>
        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          So sehen die beiden Bilder aus, die der Knopf oben weiterreicht. Einzeln speichern
          geht auch. Der Verweis auf die Seite steht im Bild selbst — und noch einmal als
          anklickbarer Link im Text.
        </p>

        <div
          style={{
            marginTop: 16, display: 'grid', gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {bilder.map(bild => (
            <div key={bild.src} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Kein next/image: Das PNG wird bei jedem Aufruf frisch
                  gezeichnet und hat je nach Zahl der Plätze eine andere Höhe —
                  da gibt es nichts vorzuoptimieren. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bild.src}
                alt={`Rangliste ${bild.titel}`}
                width={bild.breite}
                height={bild.hoehe}
                style={{
                  width: '100%', height: 'auto', borderRadius: 10,
                  border: '1px solid var(--mdc-line)',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <a
                  href={bild.src}
                  download={bild.dateiname}
                  className="mdc-btn mdc-btn-primary mdc-btn-sm"
                >
                  <Download size={15} />
                  {bild.titel} speichern
                </a>
                <span style={{ fontSize: '0.8rem', color: 'var(--mdc-ink-dim)' }}>
                  {bild.zeilen} Plätze · {bild.breite} × {bild.hoehe}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 14, fontSize: '0.84rem', lineHeight: 1.65, color: 'var(--mdc-ink-dim)' }}>
          Am Handy: lange auf das Bild drücken und „Bild sichern" wählen, das geht genauso.
          Die Bilder entstehen bei jedem Aufruf neu — sie zeigen immer den Stand von jetzt.
        </p>
      </div>

      {/* ── 2. Der Text dazu ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <Megaphone size={19} style={{ color: 'var(--mdc-red)' }} />
            Text zum Beitrag
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
            {zusammenfassung} · {text.length} Zeichen
          </span>
        </div>

        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Steht bei Facebook über den Bildern. Du kannst ihn ändern, bevor du ihn kopierst —
          etwa einen Satz voranstellen. Wer die Namen lieber im Text hätte statt im Bild,
          schaltet unten auf die Langfassung um.
        </p>

        <textarea
          ref={feldRef}
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
          <button type="button" className="mdc-btn mdc-btn-ghost" onClick={() => { void kopieren(); }}>
            {kopiert ? <Check size={17} /> : <Copy size={17} />}
            {kopiert ? 'Kopiert' : 'Nur den Text kopieren'}
          </button>
          <a href={gruppe} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost">
            <Megaphone size={17} />
            MDC-Gruppe öffnen
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            className="mdc-btn mdc-btn-ghost"
            onClick={() => {
              const naechste = !lang;
              setLang(naechste);
              setText(naechste ? langfassung : vorlage);
              setFehler(null);
            }}
          >
            <FileText size={16} />
            {lang ? 'Kurzfassung' : 'Alle Namen als Text'}
          </button>
          <button
            type="button"
            className="mdc-btn mdc-btn-ghost"
            onClick={() => { setText(lang ? langfassung : vorlage); setFehler(null); }}
            disabled={text === (lang ? langfassung : vorlage)}
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
