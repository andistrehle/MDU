// ============================================================
// Team Manager (Premium) — Freischalten, Sperren, Abgleich (Migration 0063)
// ============================================================
//
// EINE Stelle für alles, was ein Team frei- oder zuschaltet:
//   • freischalten(): team_premium + Zahlungsnachweis + availability_enabled_teams
//     (= die DB-Freischaltung aus 0043, an der alle RLS-Regeln hängen), Glocke
//     an die Kapitäne, Seiten neu bauen.
//   • sperren(): wieder heraus (nie die festen ZUSAGEN_TEAMS aus lib/features.ts).
//   • abgleich(): täglich im Cron — Abgelaufenes sperren, 3 Tage vorher erinnern
//     (nur ohne laufendes PayPal-Abo, das bucht selbst ab).
// Ob ein Team freigeschaltet ist, steht in availability_enabled_teams (plus die
// festen Teams) — teamManagerAktiv() liest das je Anfrage.
// ============================================================

import 'server-only';
import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ZUSAGEN_TEAMS } from '@/lib/features';
import { team27 } from '@/lib/data/saison-2027';
import { PREISE, TESTTAGE, SAISONPASS_BIS, euroText, type PremiumModell } from '@/lib/premium';
import { tcEmpfaenger } from './tc-empfaenger';

export type Zahlweg = 'paypal' | 'ueberweisung' | 'bar' | 'kostenlos';
export type Art = PremiumModell | 'test' | 'dauerhaft';

export interface PremiumZeile {
  team_id: string; modell: Art | null; status: 'angefragt' | 'test' | 'aktiv' | 'abgelaufen' | 'beendet';
  valid_until: string | null; trial_used: boolean; requested_model: PremiumModell | null; requested_at: string | null;
  payment_method: Zahlweg | null; note: string | null; paypal_subscription_id: string | null; abo_status: string | null;
  activated_at: string | null; erinnert_am: string | null;
}
export const PREMIUM_SPALTEN = 'team_id, modell, status, valid_until, trial_used, requested_model, requested_at, payment_method, note, paypal_subscription_id, abo_status, activated_at, erinnert_am';

function db() {
  if (!supabaseAdmin) throw new Error('Server-Datenbank ist nicht konfiguriert.');
  return supabaseAdmin;
}
export const heute = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
export function plusTage(iso: string, n: number) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function plusMonat(iso: string) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 10); }
const datumDe = (iso: string) => iso.split('-').reverse().join('.');
const teamName = (id: string) => team27(id)?.name ?? id;

/** Alle freigeschalteten Teams (je Anfrage einmal gelesen). */
export const aktiveTeams = cache(async (): Promise<Set<string>> => {
  const s = new Set<string>(ZUSAGEN_TEAMS);
  if (!supabaseAdmin) return s;
  const { data } = await supabaseAdmin.from('availability_enabled_teams').select('team_id');
  for (const r of (data ?? []) as { team_id: string }[]) s.add(r.team_id);
  return s;
});
export const teamManagerAktiv = async (teamId: string | null | undefined) => !!teamId && (await aktiveTeams()).has(teamId);

export async function ladePremium(teamId: string): Promise<PremiumZeile | null> {
  const { data, error } = await db().from('team_premium').select(PREMIUM_SPALTEN).eq('team_id', teamId).maybeSingle();
  if (error) throw new Error(/team_premium/.test(error.message) ? 'Die Datenbank kennt den Team Manager noch nicht — Migration 0063 fehlt.' : error.message);
  return data as PremiumZeile | null;
}

function seitenNeuBauen(teamId: string) {
  revalidatePath('/spieltag/[team]/[spiel]', 'page');
  revalidatePath(`/kalender/${teamId}.ics`);
}

async function glocke(an: string[], titel: string, text: string, url: string) {
  const ids = [...new Set(an)];
  if (!ids.length) return;
  await db().from('notifications').insert(ids.map(id => ({
    recipient_user_id: id, type: 'team_premium', title: titel, message: text, short_text: text, related_entity_type: 'team', action_url: url,
  })));
}
export async function betreiber(): Promise<string[]> {
  const { data } = await db().from('profiles').select('id').eq('role', 'super_admin');
  return ((data ?? []) as { id: string }[]).map(p => p.id);
}

/** Bis wann gilt es nach dieser Freischaltung? Monat verlängert ab dem späteren von heute/bisherigem Ende. */
export function neuesEnde(art: Art, bisher: string | null): string | null {
  const h = heute();
  if (art === 'dauerhaft') return null;
  if (art === 'saison') return SAISONPASS_BIS;
  if (art === 'test') return plusTage(h, TESTTAGE);
  return plusMonat(bisher && bisher > h ? bisher : h);
}

/**
 * Team freischalten. Mit `externalId` (PayPal) idempotent: Ist die Zahlung
 * schon verbucht, passiert nichts weiter (doppelte Webhooks).
 */
export async function freischalten(teamId: string, o: {
  art: Art; weg: Zahlweg; durch: string | null; bis?: string | null; cents?: number; externalId?: string;
  notiz?: string | null; aboId?: string | null; aboStatus?: string | null;
  /** Kein Zahlungsnachweis (PayPal-Abo beim Abschluss — die Zahlung meldet der Webhook). */
  ohneZahlung?: boolean;
  /** Keine Glocke ans Team (Testkauf des Betreibers für ein fremdes Team). */
  ohneGlocke?: boolean;
}): Promise<{ bis: string | null; neu: boolean }> {
  const alt = await ladePremium(teamId);
  const bis = o.bis !== undefined ? o.bis : neuesEnde(o.art, alt?.valid_until ?? null);
  const h = heute();

  if ((o.art === 'saison' || o.art === 'monat') && o.weg !== 'kostenlos' && !o.ohneZahlung) {
    const { error } = await db().from('team_premium_payments').insert({
      team_id: teamId, modell: o.art, amount_cents: o.cents ?? PREISE[o.art].cents, method: o.weg,
      valid_from: h, valid_until: bis ?? SAISONPASS_BIS, external_id: o.externalId ?? null, booked_by: o.durch, note: o.notiz ?? null,
    });
    if (error) {
      if (/duplicate key|external_id/.test(error.message)) return { bis: alt?.valid_until ?? bis, neu: false };
      throw new Error(error.message);
    }
  }
  const { error: e2 } = await db().from('team_premium').upsert({
    team_id: teamId, modell: o.art, status: o.art === 'test' ? 'test' : 'aktiv', valid_until: bis,
    trial_used: (alt?.trial_used ?? false) || o.art === 'test',
    requested_model: null, requested_at: null, payment_method: o.weg,
    note: o.notiz ?? alt?.note ?? null, activated_by: o.durch, activated_at: new Date().toISOString(),
    ...(o.aboId !== undefined ? { paypal_subscription_id: o.aboId, abo_status: o.aboStatus ?? null } : {}),
    erinnert_am: null, updated_at: new Date().toISOString(),
  });
  if (e2) throw new Error(e2.message);
  await db().from('availability_enabled_teams').upsert({ team_id: teamId }, { onConflict: 'team_id', ignoreDuplicates: true });

  const war = !!alt && (alt.status === 'aktiv' || alt.status === 'test') && (!alt.valid_until || alt.valid_until >= h);
  const art = o.art === 'test' ? `${TESTTAGE} Tage Test` : o.art === 'dauerhaft' ? 'dauerhaft' : PREISE[o.art].name;
  // Ändert sich nichts (z. B. erste Abo-Zahlung direkt nach dem Abschluss), keine zweite Glocke.
  if (!o.ohneGlocke && (!war || bis !== alt?.valid_until)) await glocke(await tcEmpfaenger(teamId, 'team_manager', false), war ? 'Team Manager verlängert' : 'Team Manager ist freigeschaltet',
    `${teamName(teamId)}: ${art}${bis ? `, gültig bis ${datumDe(bis)}` : ''}. Viel Spaß!`, '/mein-team/zusagen');
  seitenNeuBauen(teamId);
  return { bis, neu: !war };
}

/** Wieder sperren (feste Teams aus lib/features.ts bleiben immer frei). */
export async function sperren(teamId: string, status: 'abgelaufen' | 'beendet', grund?: string) {
  await db().from('team_premium').update({ status, updated_at: new Date().toISOString(), ...(grund ? { note: grund.slice(0, 300) } : {}) }).eq('team_id', teamId);
  if (!ZUSAGEN_TEAMS.includes(teamId)) await db().from('availability_enabled_teams').delete().eq('team_id', teamId);
  seitenNeuBauen(teamId);
}

/** Täglich (Cron zusagen-mails): Abgelaufenes sperren, 3 Tage vorher erinnern. */
export async function abgleich(): Promise<{ gesperrt: string[]; erinnert: string[] }> {
  const h = heute();
  const { data, error } = await db().from('team_premium').select(PREMIUM_SPALTEN).in('status', ['aktiv', 'test']).not('valid_until', 'is', null);
  if (error) return { gesperrt: [], erinnert: [] };
  const gesperrt: string[] = [], erinnert: string[] = [];
  for (const p of (data ?? []) as PremiumZeile[]) {
    const bis = p.valid_until!;
    // Laufendes PayPal-Abo: einen Tag Puffer, die nächste Abbuchung kommt per Webhook.
    const grenze = p.paypal_subscription_id && p.abo_status === 'ACTIVE' ? plusTage(bis, 2) : bis;
    if (grenze < h) {
      await sperren(p.team_id, 'abgelaufen');
      await glocke(await tcEmpfaenger(p.team_id, 'team_manager', false), 'Team Manager abgelaufen',
        `${teamName(p.team_id)}: Der ${p.status === 'test' ? 'Test' : 'Team Manager'} ist abgelaufen. Deine Daten bleiben erhalten – unter „Team Manager holen“ kannst du verlängern.`, '/mein-team/premium');
      gesperrt.push(p.team_id);
    } else if (!(p.paypal_subscription_id && p.abo_status === 'ACTIVE') && bis <= plusTage(h, 3) && p.erinnert_am !== bis) {
      await glocke(await tcEmpfaenger(p.team_id, 'team_manager', false), 'Team Manager läuft bald ab',
        `${teamName(p.team_id)}: gültig bis ${datumDe(bis)}. Jetzt verlängern${p.modell === 'monat' ? ` (${euroText(PREISE.monat.cents)})` : ''}, damit nichts unterbricht.`, '/mein-team/premium');
      await db().from('team_premium').update({ erinnert_am: bis }).eq('team_id', p.team_id);
      erinnert.push(p.team_id);
    }
  }
  return { gesperrt, erinnert };
}
