// ============================================================
// Route Handler: Admin → Premium (nur Super-Admin = Betreiber, Migration 0063)
// ============================================================
//
// GET  → { zeilen, zahlungen }   alle Teams mit Premium-Zeile + letzte Zahlungen
// POST { aktion: 'freischalten', team, art, bis?, weg, notiz? }  — z. B. nach Überweisung/bar
// POST { aktion: 'ablehnen', team }    — gemeldete Überweisung kam nicht an
// POST { aktion: 'beenden', team }     — sofort sperren (PayPal-Abo wird mit gekündigt)
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PREISE } from '@/lib/premium';
import { freischalten, sperren, ladePremium, PREMIUM_SPALTEN, type Art, type Zahlweg } from '@/lib/server/premium';
import { aboKuendigen } from '@/lib/server/paypal';
import { team27 } from '@/lib/data/saison-2027';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const ARTEN: Art[] = ['saison', 'monat', 'test', 'dauerhaft'];
const WEGE: Zahlweg[] = ['paypal', 'ueberweisung', 'bar', 'kostenlos'];

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  if (auth.user.role !== 'super_admin') return fehler('Nur für den Betreiber.', 403);
  if (!supabaseAdmin) return fehler('Server-Datenbank ist nicht konfiguriert.', 500);
  const [z, p] = await Promise.all([
    supabaseAdmin.from('team_premium').select(PREMIUM_SPALTEN).order('updated_at', { ascending: false }),
    supabaseAdmin.from('team_premium_payments').select('id, team_id, modell, amount_cents, method, valid_from, valid_until, external_id, created_at').order('created_at', { ascending: false }).limit(100),
  ]);
  if (z.error) return fehler(/team_premium/.test(z.error.message) ? 'Migration 0063 fehlt noch.' : z.error.message, 500);
  return NextResponse.json({ zeilen: z.data ?? [], zahlungen: p.data ?? [] });
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  if (u.role !== 'super_admin') return fehler('Nur für den Betreiber.', 403);
  if (!supabaseAdmin) return fehler('Server-Datenbank ist nicht konfiguriert.', 500);
  const b = await request.json().catch(() => ({})) as { aktion?: string; team?: string; art?: Art; bis?: string | null; weg?: Zahlweg; notiz?: string };
  const team = b.team ?? '';
  if (!team27(team)) return fehler('Unbekanntes Team.');
  try {
    if (b.aktion === 'freischalten') {
      const art = ARTEN.includes(b.art as Art) ? b.art as Art : null;
      if (!art) return fehler('Bitte die Art wählen.');
      const weg: Zahlweg = art === 'test' || art === 'dauerhaft' ? 'kostenlos' : WEGE.includes(b.weg as Zahlweg) && b.weg !== 'kostenlos' ? b.weg as Zahlweg : 'ueberweisung';
      const bis = art === 'dauerhaft' ? null : b.bis && /^\d{4}-\d{2}-\d{2}$/.test(b.bis) ? b.bis : undefined;
      const r = await freischalten(team, { art, weg, durch: u.id, bis, notiz: (b.notiz ?? '').trim().slice(0, 300) || null,
        cents: art === 'saison' || art === 'monat' ? PREISE[art].cents : undefined });
      return NextResponse.json({ ok: true, bis: r.bis });
    }
    if (b.aktion === 'ablehnen') {
      const p = await ladePremium(team);
      const laeuft = p && (p.status === 'aktiv' || p.status === 'test');
      await supabaseAdmin.from('team_premium').update({ requested_model: null, requested_at: null, ...(laeuft ? {} : { status: 'beendet' }), updated_at: new Date().toISOString() }).eq('team_id', team);
      return NextResponse.json({ ok: true });
    }
    if (b.aktion === 'beenden') {
      const p = await ladePremium(team);
      if (p?.paypal_subscription_id && p.abo_status === 'ACTIVE') {
        await aboKuendigen(p.paypal_subscription_id, 'Von der Ligaleitung beendet').catch(() => null);
        await supabaseAdmin.from('team_premium').update({ abo_status: 'CANCELLED' }).eq('team_id', team);
      }
      await sperren(team, 'beendet');
      return NextResponse.json({ ok: true });
    }
    return fehler('Unbekannte Aktion.');
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}
