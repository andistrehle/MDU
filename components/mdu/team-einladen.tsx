'use client';

// ============================================================
// „Team einladen“ im Team Manager (Betreiber, 05.11.2026): jedes Teammitglied
// kann Mitspieler per WhatsApp, Link oder E-Mail zur Registrierung einladen.
// Dezent: eine Zeile „7 von 12 haben ein Konto“ + drei Knöpfe; wer noch fehlt,
// steht eingeklappt darunter (je Name ein persönlicher WhatsApp-Text).
// Link → /registrieren?team=<id> (Hinweis „eingeladen ins Team …“).
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Icon } from './icon';

interface Stand { gesamt: number; mitKonto: number; ohneKonto: { name: string }[] }

const knopf: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
  border: '1px solid var(--th-line-10)', background: 'transparent', color: 'var(--th-text-body)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, textDecoration: 'none',
};

export function TeamEinladen({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [stand, setStand] = useState<Stand | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const link = `https://www.mdudarts.de/registrieren?team=${encodeURIComponent(teamId)}&name=${encodeURIComponent(teamName)}`;
  const text = (vorname?: string) => `${vorname ? `Hi ${vorname}, ` : 'Hi, '}wir organisieren ${teamName} jetzt über den Team Manager auf mdudarts.de – Zu- und Absagen, Aufstellung, Termine. Registrier dich kurz als Spieler, dann bist du dabei: ${link}`;

  useEffect(() => {
    let weg = false;
    (async () => {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) return;
      const r = await fetch(`/api/team/einladen?team=${encodeURIComponent(teamId)}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
      const j = r?.ok ? await r.json().catch(() => null) as Stand | null : null;
      if (!weg && j) setStand(j);
    })();
    return () => { weg = true; };
  }, [teamId]);

  async function kopieren() {
    try { await navigator.clipboard.writeText(text()); setKopiert(true); setTimeout(() => setKopiert(false), 2000); }
    catch { window.prompt('Zum Kopieren:', text()); }
  }

  if (stand && stand.gesamt > 0 && stand.ohneKonto.length === 0) return null; // alle dabei → Karte verschwindet
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '12px 14px', fontFamily: 'var(--font-manrope)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Icon name="user" size={16} />
        <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)' }}>Team einladen</span>
        {stand && stand.gesamt > 0 && <span style={{ fontSize: 12, color: 'var(--th-text-muted)' }}>· {stand.mitKonto} von {stand.gesamt} haben ein Konto</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <a href={`https://wa.me/?text=${encodeURIComponent(text())}`} target="_blank" rel="noopener noreferrer" style={knopf}>WhatsApp</a>
        <button type="button" onClick={() => void kopieren()} style={{ ...knopf, color: kopiert ? 'var(--th-accent)' : knopf.color }}>{kopiert ? 'Kopiert ✓' : 'Link kopieren'}</button>
        <a href={`mailto:?subject=${encodeURIComponent(`Einladung: ${teamName} im Team Manager`)}&body=${encodeURIComponent(text())}`} style={knopf}>E-Mail</a>
      </div>
      {stand && stand.ohneKonto.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--th-text-muted)' }}>Noch ohne Konto ({stand.ohneKonto.length})</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {stand.ohneKonto.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--th-text-body)' }}>
                <span style={{ flex: 1 }}>{p.name}</span>
                <a href={`https://wa.me/?text=${encodeURIComponent(text(p.name.split(' ')[0]))}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>per WhatsApp einladen</a>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
