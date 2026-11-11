// ============================================================
// Dankes-Mail beim ERSTEN bezahlten Kauf eines Teams (Betreiber, 11.11.2026)
// ============================================================
// Aufgerufen von freischalten() nach einer gebuchten Zahlung. Erste Zahlung =
// genau eine Zeile in team_premium_payments für das Team (Verlängerungen und
// Monatsabbuchungen schicken nichts). Empfänger = wer gekauft hat (Konto des
// Käufers); hat die Ligaleitung freigeschaltet (Überweisung), der Kapitän.
// Antworten gehen an ANBIETER.email. Ehrlich protokolliert in email_logs.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendTextEmail } from '@/lib/server/email/send-email';
import { ANBIETER, PREISE, type PremiumModell } from '@/lib/premium';
import { kaeuferMailText } from '@/lib/kaeufer-mail';

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mdudarts.de').replace(/\/$/, '');

type Profil = { id: string; email: string | null; first_name: string | null; role: string | null; team_id: string | null };

export async function kaeuferMail(teamId: string, teamName: string, art: PremiumModell, durch: string | null, betreiber: string[]): Promise<void> {
  const db = supabaseAdmin;
  if (!db) return;
  const { count } = await db.from('team_premium_payments').select('id', { count: 'exact', head: true }).eq('team_id', teamId);
  if (count !== 1) return; // nicht der erste Kauf

  let p: Profil | null = null;
  if (durch && !betreiber.includes(durch)) {
    const { data } = await db.from('profiles').select('id, email, first_name, role, team_id').eq('id', durch).maybeSingle();
    p = data as Profil | null;
  }
  if (!p?.email) {
    const { data } = await db.from('profiles').select('id, email, first_name, role, team_id').eq('team_id', teamId).eq('role', 'team_captain').limit(1);
    p = ((data ?? []) as Profil[])[0] ?? null;
  }
  if (!p?.email) return;

  const { betreff, text } = kaeuferMailText({ vorname: p.first_name, team: teamName, paket: art === 'saison' ? `${PREISE.saison.name}, ${PREISE.saison.hinweis}` : 'Monatsabo', site: SITE() });
  await sendTextEmail({ type: 'premium_danke', to: p.email, subject: betreff, text, relatedEntityType: 'team_premium', replyTo: ANBIETER.email });
}
