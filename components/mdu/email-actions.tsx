'use client';

// E-Mail-Adresse in Admin-Listen (Betreiber, 02.11.2026): Adresse als
// markierbarer Text, daneben „Kopieren“ (zum Einfügen z. B. bei Strato) und
// „Schreiben“ (mailto: — öffnet das Mailprogramm des Geräts) und „Strato“:
// das Webmail des Betreibers ist OX App Suite, deren mailto-Anbindung
// `#app=io.ox/mail/compose:compose&mailto=…` öffnet ein neues Mail an die
// Adresse (Anmeldung im Browser vorausgesetzt; vom Betreiber am 02.11.2026 geprüft).

import { useState } from 'react';

const STRATO = 'https://webmail.strato.de/appsuite/';

const knopf: React.CSSProperties = {
  padding: '3px 9px', borderRadius: 999, cursor: 'pointer', background: 'transparent',
  border: '1px solid var(--th-line-10)', color: 'var(--th-text-body)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11.5, textDecoration: 'none', whiteSpace: 'nowrap',
};

async function kopiere(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* weiter */ }
  try {
    const t = document.createElement('textarea');
    t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch { return false; }
}

export function EmailActions({ email }: { email: string }) {
  const [status, setStatus] = useState<'' | 'ok' | 'fehler'>('');
  const kopieren = async () => {
    setStatus((await kopiere(email)) ? 'ok' : 'fehler');
    setTimeout(() => setStatus(''), 2000);
  };
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--th-text-strong)', userSelect: 'all', WebkitUserSelect: 'all', wordBreak: 'break-all' }}>✉ {email}</span>
      <button type="button" onClick={kopieren} style={{ ...knopf, color: status === 'ok' ? 'var(--th-accent)' : knopf.color, borderColor: status === 'ok' ? 'var(--th-accent)' : 'var(--th-line-10)' }}>
        {status === 'ok' ? 'Kopiert ✓' : status === 'fehler' ? 'Bitte markieren' : 'Kopieren'}
      </button>
      <a href={`mailto:${email}`} style={knopf}>Schreiben</a>
      <a href={`${STRATO}#app=io.ox/mail/compose:compose&mailto=${encodeURIComponent(`mailto:${email}`)}`}
        target="_blank" rel="noopener noreferrer" style={knopf}>Strato</a>
    </span>
  );
}

/** Hinweis direkt am Feld: Wert stammt nicht aus der Anmeldung, sondern vom Konto des Kapitäns
 *  (`contact_*_quelle` aus listSeasonTeams). */
export function AusKonto() {
  return <span title="In der Anmeldung leer – ergänzt aus dem Konto bzw. den Kontaktdaten des Kapitäns"
    style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, color: 'var(--th-text-faint)', border: '1px solid var(--th-line-10)', borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap' }}>aus Konto</span>;
}
