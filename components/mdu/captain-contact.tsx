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
  const [open, setOpen] = useState(false);

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
      {entry && (() => {
        const tel = entry.phone.replace(/\s+/g, '');
        const wa = entry.whatsapp ?? `https://wa.me/${tel.replace(/[^\d]/g, '')}`;
        return (
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
              aria-haspopup="menu"
              aria-expanded={open}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                background: 'none', border: 'none', padding: 0,
                color: 'var(--th-win)', fontWeight: 700, fontFamily: 'inherit', fontSize: 'inherit',
              }}
            >
              · <Icon name="phone" size={12} stroke={2} /> {entry.phone}
            </button>
            {open && (
              <>
                <span
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); }}
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                />
                <span role="menu" style={{
                  position: 'absolute', zIndex: 41, top: '100%', left: 0, marginTop: 5,
                  display: 'flex', flexDirection: 'column', minWidth: 170,
                  background: 'var(--th-bg-card)', border: '1px solid var(--th-line-10)',
                  borderRadius: 10, padding: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                }}>
                  {[
                    { label: 'Anrufen', href: `tel:${tel}`, blank: false },
                    { label: 'WhatsApp-Nachricht', href: wa, blank: true },
                    { label: 'SMS', href: `sms:${tel}`, blank: false },
                  ].map(o => (
                    <a key={o.label} href={o.href}
                      target={o.blank ? '_blank' : undefined} rel="noopener noreferrer"
                      onClick={e => { e.stopPropagation(); setOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7,
                        fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 600,
                        color: 'var(--th-text-strong)', textDecoration: 'none', whiteSpace: 'nowrap',
                      }}>
                      <Icon name="phone" size={13} stroke={2} style={{ color: 'var(--th-text-faint)' }} /> {o.label}
                    </a>
                  ))}
                </span>
              </>
            )}
          </span>
        );
      })()}
      {loggedIn === false && captainName && (
        <span title="Nur eingeloggte Teamkapitäne sehen die Telefonnummer" style={{ color: 'var(--th-text-faint)', fontSize: 11 }}>
          · einloggen für Tel.
        </span>
      )}
    </div>
  );
}
