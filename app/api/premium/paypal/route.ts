// ============================================================
// Route Handler: PayPal-Zahlung für den Team Manager (Migration 0063)
// ============================================================
//
// POST { team, aktion: 'bestellen' }                 → { id } (Saisonpass, PayPal-Bestellung)
// POST { team, aktion: 'abschliessen', orderId }     → bucht ab, schaltet SOFORT frei
// POST { team, aktion: 'abo', subscriptionId }       → prüft das Monatsabo bei PayPal, schaltet frei
//
// Der Browser meldet nur Kennungen — Betrag, Team und Status kommen immer von
// PayPal selbst. Dieselbe Zahlung meldet zusätzlich der Webhook; doppelt
// verbucht wird nichts (external_id).
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, hatTcRechtServer } from '@/lib/server/auth';
import { PREMIUM_OEFFENTLICH, PREISE, verwendungszweck } from '@/lib/premium';
import { freischalten, heute, plusMonat } from '@/lib/server/premium';
import { bestellungAnlegen, bestellungAbschliessen, aboLesen, paypalEingerichtet, planMonat, zuCent } from '@/lib/server/paypal';
import { team27, NEUE_SAISON } from '@/lib/data/saison-2027';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  const b = await request.json().catch(() => ({})) as { team?: string; aktion?: string; orderId?: string; subscriptionId?: string };
  const team = b.team ?? '';
  if (!team || !hatTcRechtServer(u, team, 'team_manager') || !(PREMIUM_OEFFENTLICH || u.role === 'super_admin')) return fehler('Kein Zugriff.', 403);
  if (!paypalEingerichtet()) return fehler('PayPal ist noch nicht eingerichtet.', 503);
  try {
    if (b.aktion === 'bestellen') {
      const o = await bestellungAnlegen(team, PREISE.saison.cents, verwendungszweck(team27(team)?.name ?? team, 'saison', NEUE_SAISON.name));
      return NextResponse.json({ id: o.id });
    }
    if (b.aktion === 'abschliessen') {
      const o = await bestellungAbschliessen(b.orderId ?? '');
      const pu = o.purchase_units?.[0];
      const cap = pu?.payments?.captures?.[0];
      if (o.status !== 'COMPLETED' || !cap || cap.status !== 'COMPLETED') return fehler('PayPal hat die Zahlung nicht abgeschlossen.');
      if ((cap.custom_id ?? pu?.custom_id) !== team) return fehler('Die Zahlung gehört zu einem anderen Team.');
      if (zuCent(cap.amount.value) !== PREISE.saison.cents || cap.amount.currency_code !== 'EUR') return fehler('Der bezahlte Betrag passt nicht – bitte melde dich bei uns.');
      const r = await freischalten(team, { art: 'saison', weg: 'paypal', durch: u.id, cents: zuCent(cap.amount.value), externalId: cap.id });
      return NextResponse.json({ ok: true, bis: r.bis });
    }
    if (b.aktion === 'abo') {
      const a = await aboLesen(b.subscriptionId ?? '');
      if (a.custom_id !== team) return fehler('Das Abo gehört zu einem anderen Team.');
      if (!a.plan_id || a.plan_id !== (await planMonat())) return fehler('Unbekannter PayPal-Plan.');
      if (a.status !== 'ACTIVE') return fehler(`Das Abo ist bei PayPal noch nicht aktiv (${a.status}). Bitte in ein paar Minuten neu laden.`);
      const r = await freischalten(team, { art: 'monat', weg: 'paypal', durch: u.id, bis: plusMonat(heute()), ohneZahlung: true, aboId: a.id, aboStatus: a.status });
      return NextResponse.json({ ok: true, bis: r.bis });
    }
    return fehler('Unbekannte Aktion.');
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}
