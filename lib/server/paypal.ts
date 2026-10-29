// ============================================================
// PayPal-Anbindung (REST v1/v2) für den Team Manager (Migration 0063)
// ============================================================
//
// Ohne Stripe (Betreiber, 29.10.2026): Saisonpass = einmalige Bestellung
// (Orders v2, capture), Monat = PayPal-Abo (Subscriptions v1, Plan in
// PAYPAL_PLAN_MONAT). Kreditkarte läuft über denselben PayPal-Knopf.
// ENV (Werte nur in Vercel): NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET,
// PAYPAL_WEBHOOK_ID, PAYPAL_PLAN_MONAT, PAYPAL_ENV ('live' | 'sandbox').
// Fehlt etwas, ist PayPal „nicht eingerichtet“ und die Seite zeigt nur die
// Überweisung — nichts wird vorgetäuscht.
// ============================================================

import 'server-only';

const live = () => (process.env.PAYPAL_ENV ?? 'live') === 'live';
const BASIS = () => (live() ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

export const paypalEingerichtet = () => !!(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
export const paypalAboEingerichtet = () => paypalEingerichtet() && !!process.env.PAYPAL_PLAN_MONAT;

let token: { wert: string; bis: number } | null = null;
async function zugang(): Promise<string> {
  if (token && token.bis > Date.now() + 60_000) return token.wert;
  const id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, geheim = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !geheim) throw new Error('PayPal ist nicht eingerichtet.');
  const r = await fetch(`${BASIS()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${geheim}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!r.ok || !j.access_token) throw new Error(`PayPal-Anmeldung fehlgeschlagen: ${j.error_description ?? r.status}`);
  token = { wert: j.access_token, bis: Date.now() + (j.expires_in ?? 300) * 1000 };
  return token.wert;
}

async function api<T>(pfad: string, init: { method?: string; body?: unknown; idem?: string } = {}): Promise<T> {
  const r = await fetch(`${BASIS()}${pfad}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${await zugang()}`, 'Content-Type': 'application/json',
      ...(init.idem ? { 'PayPal-Request-Id': init.idem } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const j = await r.json().catch(() => ({})) as T & { message?: string; details?: { description?: string }[] };
  if (!r.ok) throw new Error(`PayPal: ${j.details?.[0]?.description ?? j.message ?? r.status}`);
  return j;
}

// ── Saisonpass: Bestellung ──────────────────────────────────

export interface Bestellung { id: string; status: string; purchase_units?: { custom_id?: string; amount?: { value: string; currency_code: string }; payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string }; custom_id?: string }[] } }[] }

export function bestellungAnlegen(teamId: string, cents: number, beschreibung: string) {
  return api<Bestellung>('/v2/checkout/orders', {
    method: 'POST', idem: `tm-${teamId}-${Date.now()}`,
    body: {
      intent: 'CAPTURE',
      purchase_units: [{ custom_id: teamId, description: beschreibung.slice(0, 127), amount: { currency_code: 'EUR', value: (cents / 100).toFixed(2) } }],
      application_context: { brand_name: 'MDU Team Manager', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW', locale: 'de-DE' },
    },
  });
}
export const bestellungAbschliessen = (orderId: string) =>
  api<Bestellung>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: 'POST', idem: `cap-${orderId}` });
export const bestellungLesen = (orderId: string) => api<Bestellung>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);

// ── Monat: Abo ──────────────────────────────────────────────

export interface Abo { id: string; status: string; plan_id: string; custom_id?: string; billing_info?: { next_billing_time?: string; last_payment?: { amount?: { value: string } } } }
export const aboLesen = (id: string) => api<Abo>(`/v1/billing/subscriptions/${encodeURIComponent(id)}`);
export const aboKuendigen = (id: string, grund: string) =>
  api<Record<string, never>>(`/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { reason: grund.slice(0, 128) } });

// ── Webhook prüfen ──────────────────────────────────────────

export async function webhookEcht(headers: Headers, body: unknown): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !paypalEingerichtet()) return false;
  const h = (n: string) => headers.get(n) ?? '';
  const r = await api<{ verification_status?: string }>('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: {
      auth_algo: h('paypal-auth-algo'), cert_url: h('paypal-cert-url'), transmission_id: h('paypal-transmission-id'),
      transmission_sig: h('paypal-transmission-sig'), transmission_time: h('paypal-transmission-time'),
      webhook_id: webhookId, webhook_event: body,
    },
  }).catch(() => ({ verification_status: 'FAILURE' }));
  return r.verification_status === 'SUCCESS';
}

/** Betrag „49.00“ → 4900 Cent. */
export const zuCent = (v: string | undefined) => Math.round(Number(v ?? 0) * 100);
