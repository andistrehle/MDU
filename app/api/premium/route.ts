// ============================================================
// Route Handler: Team Manager holen — Stand, Test, „überwiesen“ (Migration 0063)
// ============================================================
//
// GET  /api/premium?team=…   → { premium, aktiv, paypal: { clientId, abo, planMonat }, darf }
// POST /api/premium { team, aktion: 'test' }                       — 14 Tage, je Team einmal
// POST /api/premium { team, aktion: 'ueberwiesen', modell }        — Glocke an den Betreiber
// POST /api/premium { team, aktion: 'abo_kuendigen' }              — PayPal-Abo beenden
//
// Kaufen/Testen dürfen Kapitän und Co-Captain (Team Manager) — und solange
// PREMIUM_OEFFENTLICH = false nur der Super-Admin (Vorschau).
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, hatTcRechtServer, type ServerUser } from '@/lib/server/auth';
import { PREMIUM_OEFFENTLICH, PREISE, euroText, type PremiumModell } from '@/lib/premium';
import { ladePremium, teamManagerAktiv, freischalten, betreiber, heute } from '@/lib/server/premium';
import { paypalEingerichtet, planMonat, aboKuendigen } from '@/lib/server/paypal';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { team27 } from '@/lib/data/saison-2027';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const darf = (u: ServerUser, team: string) => hatTcRechtServer(u, team, 'team_manager') && (PREMIUM_OEFFENTLICH || u.role === 'super_admin');

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const team = new URL(request.url).searchParams.get('team') ?? '';
  if (!team || (auth.user.teamId !== team && !hatTcRechtServer(auth.user, team, 'team_manager'))) return fehler('Kein Zugriff.', 403);
  try {
    return NextResponse.json({
      premium: await ladePremium(team), aktiv: await teamManagerAktiv(team), darf: darf(auth.user, team),
      paypal: await (async () => { const plan = await planMonat(); return { clientId: paypalEingerichtet() ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID : null, abo: !!plan, planMonat: plan }; })(),
    });
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  const b = await request.json().catch(() => ({})) as { team?: string; aktion?: string; modell?: PremiumModell };
  const team = b.team ?? '';
  if (!team || !darf(u, team)) return fehler('Den Team Manager holt der Kapitän (oder der Co-Captain mit Recht „Team Manager“).', 403);
  if (!supabaseAdmin) return fehler('Server-Datenbank ist nicht konfiguriert.', 500);
  try {
    const p = await ladePremium(team);
    const name = team27(team)?.name ?? team;

    if (b.aktion === 'test') {
      if (p?.trial_used) return fehler('Den Test hat dein Team schon genutzt.');
      if (await teamManagerAktiv(team)) return fehler('Dein Team hat den Team Manager schon.');
      const r = await freischalten(team, { art: 'test', weg: 'kostenlos', durch: u.id });
      return NextResponse.json({ ok: true, bis: r.bis });
    }

    if (b.aktion === 'ueberwiesen') {
      const modell = b.modell === 'monat' ? 'monat' : 'saison';
      const { error } = await supabaseAdmin.from('team_premium').upsert({
        team_id: team, status: p && (p.status === 'aktiv' || p.status === 'test') && (!p.valid_until || p.valid_until >= heute()) ? p.status : 'angefragt',
        requested_model: modell, requested_by: u.id, requested_at: new Date().toISOString(), payment_method: 'ueberweisung', updated_at: new Date().toISOString(),
        trial_used: p?.trial_used ?? false,
      });
      if (error) return fehler(error.message, 500);
      const text = `${name} hat ${PREISE[modell].name} (${euroText(PREISE[modell].cents)}) per Überweisung bezahlt – bitte Zahlungseingang prüfen und freischalten.`;
      const an = (await betreiber()).filter(id => id !== u.id);
      if (an.length) await supabaseAdmin.from('notifications').insert(an.map(id => ({
        recipient_user_id: id, type: 'team_premium', title: 'Team Manager: Überweisung gemeldet', message: text, short_text: text, related_entity_type: 'team', action_url: '/admin/premium',
      })));
      return NextResponse.json({ ok: true });
    }

    if (b.aktion === 'abo_kuendigen') {
      if (!p?.paypal_subscription_id) return fehler('Es läuft kein PayPal-Abo.');
      await aboKuendigen(p.paypal_subscription_id, `Gekündigt über mdudarts.de (${name})`);
      await supabaseAdmin.from('team_premium').update({ abo_status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('team_id', team);
      return NextResponse.json({ ok: true, bis: p.valid_until });
    }

    return fehler('Unbekannte Aktion.');
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}
