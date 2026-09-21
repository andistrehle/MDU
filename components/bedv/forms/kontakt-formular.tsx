'use client';

// ============================================================
// Kontaktformular (Demo)
// ============================================================
//
// Es wird NICHTS verschickt. Das Formular prüft die Eingaben und zeigt
// danach, was in der echten Plattform passieren würde — inklusive der
// Angabe, an welche Stelle im Verband die Anfrage ginge.
//
// Ehrlich statt hübsch: Ein Formular, das „Vielen Dank, Ihre Nachricht
// wurde gesendet" zeigt, ohne etwas zu senden, ist in einer Demo eine Lüge
// — und fliegt spätestens auf, wenn jemand auf die Antwort wartet.
// ============================================================

import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { DemoHinweis } from '../ui/bausteine';

const THEMEN = [
  'Neue Mannschaft melden',
  'Spielbetrieb / Spielplan',
  'Spielbericht / Ergebnis',
  'Spielberechtigung / Passwesen',
  'Pokal',
  'Sonstiges',
];

export function KontaktFormular() {
  const [thema, setThema] = useState(THEMEN[0]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [gesendet, setGesendet] = useState(false);

  const vollstaendig = name.trim().length > 1 && email.includes('@') && nachricht.trim().length > 9;

  if (gesendet) {
    return (
      <div className="bedv-card bedv-pop" style={{ padding: '26px 24px', textAlign: 'center' }}>
        <span
          aria-hidden="true"
          style={{
            width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: 'var(--bedv-green-soft)', color: 'var(--bedv-green)', margin: '0 auto 14px',
          }}
        >
          <Check size={26} />
        </span>
        <h3 style={{ fontSize: '1.15rem' }}>So sähe der Versand aus</h3>
        <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 9, fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '50ch', marginInline: 'auto' }}>
          In der echten Plattform ginge diese Anfrage jetzt an die zuständige Stelle
          (<strong style={{ color: 'var(--bedv-ink)' }}>{thema}</strong>) — mit
          Eingangsbestätigung an <strong style={{ color: 'var(--bedv-ink)' }}>{email}</strong>{' '}
          und einem Vorgang, der im Verbandsbereich sichtbar bleibt.
        </p>
        <div style={{ marginTop: 16, maxWidth: 480, marginInline: 'auto' }}>
          <DemoHinweis>
            In dieser Demo wurde nichts versendet und nichts gespeichert. Die Eingaben
            haben den Browser nicht verlassen.
          </DemoHinweis>
        </div>
        <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" style={{ marginTop: 16 }} onClick={() => setGesendet(false)}>
          Noch einmal ansehen
        </button>
      </div>
    );
  }

  return (
    <form
      className="bedv-card"
      style={{ padding: '18px 20px 20px' }}
      onSubmit={e => { e.preventDefault(); if (vollstaendig) setGesendet(true); }}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <label>
          <span className="bedv-label">Worum geht es?</span>
          <select className="bedv-select" value={thema} onChange={e => setThema(e.target.value)}>
            {THEMEN.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>

        <div className="bedv-grid bedv-grid--2" style={{ gap: 14 }}>
          <label>
            <span className="bedv-label">Name</span>
            <input className="bedv-input" value={name} onChange={e => setName(e.target.value)} placeholder="Vor- und Nachname" />
          </label>
          <label>
            <span className="bedv-label">E-Mail</span>
            <input className="bedv-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@beispiel.de" />
          </label>
        </div>

        <label>
          <span className="bedv-label">Nachricht</span>
          <textarea
            className="bedv-textarea"
            value={nachricht}
            onChange={e => setNachricht(e.target.value)}
            placeholder="Mindestens zehn Zeichen — worum geht es genau?"
          />
        </label>

        <DemoHinweis>
          Demo-Formular. Es wird nichts versendet und nichts gespeichert; die Eingaben
          bleiben im Browser.
        </DemoHinweis>

        <div>
          <button type="submit" className="bedv-btn bedv-btn--primary" disabled={!vollstaendig}>
            <Send size={15} aria-hidden="true" /> Absenden
          </button>
          {!vollstaendig && (
            <span style={{ marginLeft: 12, fontSize: '0.8rem', color: 'var(--bedv-ink-faint)' }}>
              Name, E-Mail und eine Nachricht ausfüllen.
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
