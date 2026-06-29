// ============================================================
// Route Handler: Kapitäns-Telefonnummern (nur für eingeloggte Kapitäne)
// ============================================================
//
// GET /api/captain-phones  (Authorization: Bearer <supabase access token>)
// Liefert je Team die freigegebene Telefonnummer des Teamkapitäns — aber NUR,
// wenn der/die Anfragende selbst eingeloggte:r Teamkapitän (oder Ligaleitung/
// Admin) ist. Sonst leeres Ergebnis. player_contacts ist nicht public-read;
// der Zugriff läuft ausschließlich hier über service_role.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Deutsche Rufnummer → wa.me-Link (international, nur Ziffern). */
function toWhatsApp(phone: string): string | null {
  let n = phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (n.startsWith('00')) n = n.slice(2);
  else if (n.startsWith('0')) n = '49' + n.slice(1);
  return /^\d{6,15}$/.test(n) ? `https://wa.me/${n}` : null;
}

export async function GET(request: Request) {
  const empty = NextResponse.json({ phones: {} });
  if (!supabaseAdmin) return empty;

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return empty;

  // Anfragenden authentifizieren + Rolle prüfen (nur Kapitäne/Admins).
  const authClient = createClient(url, anon, { auth: { persistSession: false } });
  const { data: ures } = await authClient.auth.getUser(token);
  if (!ures.user) return empty;
  const { data: me } = await supabaseAdmin.from('profiles').select('role').eq('id', ures.user.id).maybeSingle();
  const role = (me as { role?: string } | null)?.role;
  if (role !== 'team_captain' && role !== 'league_admin' && role !== 'super_admin') return empty;

  // Kapitäne je Team + freigegebene Nummern zusammenführen.
  const { data: caps } = await supabaseAdmin
    .from('profiles').select('team_id, player_id')
    .eq('role', 'team_captain').not('team_id', 'is', null).not('player_id', 'is', null);
  const { data: contacts } = await supabaseAdmin
    .from('player_contacts').select('player_id, phone')
    .eq('phone_public', true).not('phone', 'is', null);

  const phoneByPlayer = new Map<string, string>();
  for (const c of (contacts ?? []) as { player_id: string; phone: string }[]) phoneByPlayer.set(c.player_id, c.phone);

  const phones: Record<string, { phone: string; whatsapp: string | null }> = {};
  for (const cap of (caps ?? []) as { team_id: string; player_id: string }[]) {
    const phone = phoneByPlayer.get(cap.player_id);
    if (phone) phones[cap.team_id] = { phone, whatsapp: toWhatsApp(phone) };
  }
  return NextResponse.json({ phones });
}
