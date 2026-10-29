// ============================================================
// PayPal-Anbindung (REST v1/v2) für den Team Manager (Migration 0063)
// ============================================================
//
// Ohne Stripe (Betreiber, 29.10.2026): Saisonpass = einmalige Bestellung
// (Orders v2, capture), Monat = PayPal-Abo (Subscriptions v1, Plan in
// PAYPAL_PLAN_MONAT). Kreditkarte läuft über denselben PayPal-Knopf.
// ENV (Werte nur in Vercel): NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET,
// PAYPAL_ENV ('live' | 'sandbox'); optional PAYPAL_WEBHOOK_ID, PAYPAL_PLAN_MONAT —
// sonst schlägt findeEinrichtung() sie bei PayPal nach.
// Fehlt etwas, ist PayPal „nicht eingerichtet“ und die Seite zeigt nur die
// Überweisung — nichts wird vorgetäuscht.
// ============================================================

import 'server-only';

const live = () => (process.env.PAYPAL_ENV ?? 'live') === 'live';
const BASIS = () => (live() ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

export const paypalEingerichtet = () => !!(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

// ── Einrichtung (Produkt, Monatsplan, Webhook) ───────────────
// Angelegt per Knopf unter Admin → Premium (einrichten()). Die IDs müssen
// NICHT in Vercel stehen: Fehlen PAYPAL_PLAN_MONAT / PAYPAL_WEBHOOK_ID, werden
// sie bei PayPal nachgeschlagen (Produktname, Planname, Webhook-Adresse).
export const PRODUKT_NAME = 'MDU Team Manager';
export const PLAN_NAME = 'Team Manager monatlich';
export const WEBHOOK_PFAD = '/api/premium/paypal/webhook';
const WEBHOOK_EREIGNISSE = [
  'PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.SALE.COMPLETED', 'BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
];
const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mdudarts.de').replace(/\/$/, '');

export interface Einrichtung { produktId: string | null; planId: string | null; webhookId: string | null; webhookUrl: string; live: boolean }
let gefunden: { wert: Einrichtung; bis: number } | null = null;

export async function findeEinrichtung(neu = false): Promise<Einrichtung> {
  if (!neu && gefunden && gefunden.bis > Date.now()) return gefunden.wert;
  const webhookUrl = `${SITE()}${WEBHOOK_PFAD}`;
  const e: Einrichtung = { produktId: null, planId: process.env.PAYPAL_PLAN_MONAT || null, webhookId: process.env.PAYPAL_WEBHOOK_ID || null, webhookUrl, live: live() };
  if (!paypalEingerichtet()) return e;
  const pr = await api<{ products?: { id: string; name: string }[] }>('/v1/catalogs/products?page_size=20');
  e.produktId = pr.products?.find(p => p.name === PRODUKT_NAME)?.id ?? null;
  if (!e.planId && e.produktId) {
    const pl = await api<{ plans?: { id: string; name: string; status: string }[] }>(`/v1/billing/plans?product_id=${e.produktId}&page_size=20`);
    e.planId = pl.plans?.find(p => p.name === PLAN_NAME && p.status === 'ACTIVE')?.id ?? null;
  }
  if (!e.webhookId) {
    const wh = await api<{ webhooks?: { id: string; url: string }[] }>('/v1/notifications/webhooks');
    e.webhookId = wh.webhooks?.find(w => w.url === webhookUrl)?.id ?? null;
  }
  gefunden = { wert: e, bis: Date.now() + 10 * 60_000 };
  return e;
}

/** Legt an, was fehlt (Produkt, Plan 8,99 €/Monat, Webhook). Mehrfach aufrufbar. */
export async function einrichten(monatCents: number): Promise<Einrichtung & { angelegt: string[] }> {
  const e = await findeEinrichtung(true);
  const angelegt: string[] = [];
  if (!e.produktId) {
    const p = await api<{ id: string }>('/v1/catalogs/products', { method: 'POST', idem: `prod-${Date.now()}`, body: { name: PRODUKT_NAME, description: 'Team Manager für Mannschaften der Münchner Dart Union', type: 'SERVICE', category: 'SOFTWARE' } });
    e.produktId = p.id; angelegt.push('Produkt');
  }
  if (!e.planId) {
    const p = await api<{ id: string }>('/v1/billing/plans', {
      method: 'POST', idem: `plan-${Date.now()}`,
      body: {
        product_id: e.produktId, name: PLAN_NAME, status: 'ACTIVE', description: 'Team Manager, monatlich kündbar',
        billing_cycles: [{ frequency: { interval_unit: 'MONTH', interval_count: 1 }, tenure_type: 'REGULAR', sequence: 1, total_cycles: 0,
          pricing_scheme: { fixed_price: { value: (monatCents / 100).toFixed(2), currency_code: 'EUR' } } }],
        payment_preferences: { auto_bill_outstanding: true, setup_fee_failure_action: 'CANCEL', payment_failure_threshold: 1 },
      },
    });
    e.planId = p.id; angelegt.push('Monatsplan');
  }
  if (!e.webhookId) {
    const w = await api<{ id: string }>('/v1/notifications/webhooks', { method: 'POST', body: { url: e.webhookUrl, event_types: WEBHOOK_EREIGNISSE.map(name => ({ name })) } });
    e.webhookId = w.id; angelegt.push('Webhook');
  }
  gefunden = { wert: e, bis: Date.now() + 10 * 60_000 };
  return { ...e, angelegt };
}

/** Plan-ID fürs Monatsabo (ENV oder bei PayPal nachgeschlagen), null = noch nicht eingerichtet. */
export const planMonat = async () => (paypalEingerichtet() ? (await findeEinrichtung().catch(() => null))?.planId ?? null : null);

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
  if (!paypalEingerichtet()) return false;
  const webhookId = (await findeEinrichtung().catch(() => null))?.webhookId;
  if (!webhookId) return false;
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
