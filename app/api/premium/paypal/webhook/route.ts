// ============================================================
// Route Handler: PayPal-Webhook (Team Manager, Migration 0063)
// ============================================================
//
// PayPal meldet hierher jede Zahlung — auch wenn der Browser nach dem Bezahlen
// zu war. Jede Meldung wird bei PayPal gegengeprüft (verify-webhook-signature,
// PAYPAL_WEBHOOK_ID). Verbucht wird idempotent über die Zahlungskennung.
//   PAYMENT.CAPTURE.COMPLETED  → Saisonpass freischalten
//   PAYMENT.SALE.COMPLETED     → Monatsabo: gültig bis = Zahlungstag + 1 Monat
//   BILLING.SUBSCRIPTION.*     → Abo-Status merken (gekündigt läuft bis zum bezahlten Ende)
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PREISE } from '@/lib/premium';
import { freischalten, ladePremium, plusMonat } from '@/lib/server/premium';
import { webhookEcht, aboLesen, zuCent } from '@/lib/server/paypal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ereignis { event_type?: string; resource?: Record<string, unknown> }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Ereignis | null;
  if (!body || !(await webhookEcht(request.headers, body))) return NextResponse.json({ error: 'Nicht bestätigt.' }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB fehlt' }, { status: 500 });
  const r = body.resource ?? {};
  const typ = body.event_type ?? '';
  try {
    if (typ === 'PAYMENT.CAPTURE.COMPLETED') {
      const team = String(r.custom_id ?? '');
      const amount = r.amount as { value?: string; currency_code?: string } | undefined;
      if (team && zuCent(amount?.value) === PREISE.saison.cents && amount?.currency_code === 'EUR') {
        await freischalten(team, { art: 'saison', weg: 'paypal', durch: null, cents: zuCent(amount?.value), externalId: String(r.id) });
      }
    } else if (typ === 'PAYMENT.SALE.COMPLETED') {
      const aboId = String(r.billing_agreement_id ?? '');
      if (aboId) {
        const { data } = await supabaseAdmin.from('team_premium').select('team_id').eq('paypal_subscription_id', aboId).maybeSingle();
        let team = (data as { team_id: string } | null)?.team_id ?? null;
        if (!team) team = (await aboLesen(aboId)).custom_id ?? null;
        if (team) {
          const tag = String(r.create_time ?? new Date().toISOString()).slice(0, 10);
          const p = await ladePremium(team);
          const bis = [plusMonat(tag), p?.valid_until ?? ''].sort().pop()!;
          const total = (r.amount as { total?: string } | undefined)?.total;
          await freischalten(team, { art: 'monat', weg: 'paypal', durch: null, bis, cents: zuCent(total) || PREISE.monat.cents, externalId: String(r.id), aboId, aboStatus: 'ACTIVE' });
        }
      }
    } else if (typ.startsWith('BILLING.SUBSCRIPTION.')) {
      const aboId = String(r.id ?? '');
      const status = String(r.status ?? typ.split('.').pop());
      if (aboId) await supabaseAdmin.from('team_premium').update({ abo_status: status, updated_at: new Date().toISOString() }).eq('paypal_subscription_id', aboId);
    }
  } catch (e) {
    // 500 → PayPal versucht es später erneut.
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
