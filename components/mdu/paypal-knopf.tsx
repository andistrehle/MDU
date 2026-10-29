'use client';

// ============================================================
// PayPal-Knopf (inkl. „Debit- oder Kreditkarte“) für den Team Manager
// ============================================================
// Lädt das PayPal-JS-SDK und zeichnet die Knöpfe. Saisonpass = Bestellung
// (intent=capture, die Bestellung legt unser Server an), Monat = Abo
// (intent=subscription, Plan PAYPAL_PLAN_MONAT, custom_id = Team). Beide
// SDK-Varianten bekommen einen eigenen Namensraum, weil PayPal je Seite nur
// eine Absicht pro Skript erlaubt. Nach der Freigabe bestätigt IMMER unser
// Server bei PayPal (/api/premium/paypal) — der Browser schaltet nichts frei.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Art = 'saison' | 'monat';
interface PayPalButtons { render: (el: HTMLElement) => Promise<void>; close?: () => void }
type PayPalNS = { Buttons: (o: Record<string, unknown>) => PayPalButtons };

const geladen = new Map<string, Promise<PayPalNS>>();
function sdk(clientId: string, art: Art): Promise<PayPalNS> {
  const ns = `paypal_${art}`;
  const key = `${clientId}:${art}`;
  if (!geladen.has(key)) {
    geladen.set(key, new Promise((ok, nein) => {
      const s = document.createElement('script');
      const q = art === 'monat' ? 'vault=true&intent=subscription' : 'intent=capture';
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=EUR&locale=de_DE&components=buttons&${q}`;
      s.setAttribute('data-namespace', ns);
      s.onload = () => { const p = (window as unknown as Record<string, PayPalNS | undefined>)[ns]; if (p) ok(p); else nein(new Error('PayPal nicht geladen')); };
      s.onerror = () => { geladen.delete(key); nein(new Error('PayPal konnte nicht geladen werden.')); };
      document.head.appendChild(s);
    }));
  }
  return geladen.get(key)!;
}

async function server(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const r = await fetch('/api/premium/paypal', { method: 'POST', headers: { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({})) as Record<string, unknown>;
  if (!r.ok) throw new Error(String(j.error ?? 'Fehlgeschlagen.'));
  return j;
}

export function PayPalKnopf({ clientId, planMonat, team, art, onFertig, onFehler }: {
  clientId: string; planMonat: string | null; team: string; art: Art;
  onFertig: (bis: string | null) => void; onFehler: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [laedt, setLaedt] = useState(true);
  // Rückrufe aktuell halten, ohne die Knöpfe neu zu zeichnen.
  const cb = useRef({ onFertig, onFehler });
  useEffect(() => { cb.current = { onFertig, onFehler }; });

  useEffect(() => {
    let weg = false;
    let knoepfe: PayPalButtons | null = null;
    sdk(clientId, art).then(pp => {
      if (weg || !ref.current) return;
      ref.current.innerHTML = '';
      const gemeinsam = {
        style: { layout: 'vertical', shape: 'pill', label: art === 'monat' ? 'subscribe' : 'pay', tagline: false },
        onError: () => cb.current.onFehler('Bei PayPal ist etwas schiefgegangen. Es wurde nichts abgebucht – bitte noch einmal versuchen.'),
        onCancel: () => cb.current.onFehler('Abgebrochen – es wurde nichts abgebucht.'),
      };
      knoepfe = art === 'monat'
        ? pp.Buttons({
            ...gemeinsam,
            createSubscription: (_d: unknown, actions: { subscription: { create: (o: Record<string, unknown>) => Promise<string> } }) =>
              actions.subscription.create({ plan_id: planMonat, custom_id: team }),
            onApprove: async (d: { subscriptionID?: string }) => {
              try { const j = await server({ team, aktion: 'abo', subscriptionId: d.subscriptionID }); cb.current.onFertig((j.bis as string) ?? null); }
              catch (e) { cb.current.onFehler(e instanceof Error ? e.message : 'Fehlgeschlagen.'); }
            },
          })
        : pp.Buttons({
            ...gemeinsam,
            createOrder: async () => (await server({ team, aktion: 'bestellen' })).id as string,
            onApprove: async (d: { orderID?: string }) => {
              try { const j = await server({ team, aktion: 'abschliessen', orderId: d.orderID }); cb.current.onFertig((j.bis as string) ?? null); }
              catch (e) { cb.current.onFehler(e instanceof Error ? e.message : 'Fehlgeschlagen.'); }
            },
          });
      return knoepfe.render(ref.current).then(() => { if (!weg) setLaedt(false); });
    }).catch(e => { if (!weg) { setLaedt(false); cb.current.onFehler(e instanceof Error ? e.message : 'PayPal konnte nicht geladen werden.'); } });
    return () => { weg = true; knoepfe?.close?.(); };
  }, [clientId, planMonat, team, art]);

  return (
    <div>
      {laedt && <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', padding: '8px 0' }}>PayPal wird geladen …</div>}
      <div ref={ref} />
    </div>
  );
}
