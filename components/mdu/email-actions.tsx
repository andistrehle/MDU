'use client';

// E-Mail-Adresse in Admin-Listen (Betreiber, 02.11.2026): Adresse als
// markierbarer Text, daneben „Kopieren“ (zum Einfügen z. B. bei Strato) und
// „Schreiben“ (mailto: — öffnet das Mailprogramm des Geräts).

import { useState } from 'react';

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
    </span>
  );
}
