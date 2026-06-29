'use client';

// ============================================================
// CaptainContact — TC-Zeile mit (für eingeloggte Kapitäne) Telefon/WhatsApp
// ============================================================
//
// Zeigt „TC: <Name>" und — wenn der/die Betrachter:in eingeloggte:r Teamkapitän
// (oder Admin) ist und der Kapitän seine Nummer freigegeben hat — einen
// klickbaren WhatsApp-Link. Logout: dezenter Hinweis zum Einloggen.
// Die Nummern kommen ausschließlich aus der gated Route /api/captain-phones.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Icon } from './icon';

type PhoneMap = Record<string, { phone: string; whatsapp: string | null }>;

let cache: Promise<PhoneMap> | null = null;
async function fetchPhones(token: string): Promise<PhoneMap> {
  if (cache) return cache;
  cache = (async () => {
    try {
      const res = await fetch('/api/captain-phones', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return {};
      const d = await res.json();
      return (d.phones ?? {}) as PhoneMap;
    } catch { return {}; }
  })();
  return cache;
}

export function CaptainContact({ teamId, captainName }: { teamId: string; captainName: string | null }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [entry, setEntry] = useState<{ phone: string; whatsapp: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) { if (!cancelled) setLoggedIn(false); return; }
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) { if (!cancelled) setLoggedIn(false); return; }
      const phones = await fetchPhones(token);
      if (!cancelled) { setLoggedIn(true); setEntry(phones[teamId] ?? null); }
    })();
    return () => { cancelled = true; };
  }, [teamId]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', flexWrap: 'wrap' }}>
      <Icon name="user" size={12} stroke={2} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {captainName ? `TC: ${captainName}` : 'Noch nicht verfügbar'}
      </span>
      {entry && (
        <a
          href={entry.whatsapp ?? `tel:${entry.phone}`}
          target={entry.whatsapp ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--th-win)', fontWeight: 700, textDecoration: 'none' }}
        >
          · <Icon name="phone" size={12} stroke={2} /> {entry.phone}
        </a>
      )}
      {loggedIn === false && captainName && (
        <span title="Nur eingeloggte Teamkapitäne sehen die Telefonnummer" style={{ color: 'var(--th-text-faint)', fontSize: 11 }}>
          · einloggen für Tel.
        </span>
      )}
    </div>
  );
}
