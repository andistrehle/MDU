// ============================================================
// /api/admin/spieler — Spieler umbenennen: Name und auf Wunsch die Profil-Adresse
// ============================================================
// Betreiber, 18.11.2026 (Migration 0071). Nur Ligaleitung. Die Arbeit macht die
// Datenbank-Funktion spieler_umbenennen() in EINER Transaktion; hier werden nur
// Rechte geprüft, die neue Kennung gebildet und danach die Seiten neu gebaut.
// `pruefen: true` ändert nichts und liefert, was sich ändern würde.
// Spieler aus dem festen Stamm (Archiv 2025/26, lib/data/players.ts) behalten
// ihre Adresse — sie steht dort im Code.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { findPlayer } from '@/lib/data';
import { nameTeilen, neueKennung } from '@/lib/spieler-kennung';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as { playerId?: string; name?: string; adresse?: boolean; pruefen?: boolean };
  const alt = String(body.playerId ?? '').trim();
  const { vorname, nachname } = nameTeilen(String(body.name ?? ''));
  if (!alt) return NextResponse.json({ error: 'Spieler fehlt.' }, { status: 400 });
  if (!vorname) return NextResponse.json({ error: 'Bitte einen Namen angeben.' }, { status: 400 });

  const fest = !!findPlayer(alt);
  if (body.adresse && fest) {
    return NextResponse.json({ error: 'Dieser Spieler steht im festen Stamm aus 2025/26 – seine Adresse lässt sich hier nicht ändern. Der Name schon.' }, { status: 400 });
  }
  const neu = body.adresse ? neueKennung(alt, vorname, nachname) : alt;

  const { data, error } = await supabaseAdmin.rpc('spieler_umbenennen', {
    p_alt: alt, p_neu: neu, p_vorname: vorname, p_nachname: nachname, p_von: auth.user.id, p_pruefen: !!body.pruefen,
  });
  if (error) {
    const fehlt = /spieler_umbenennen|player_id_aliases/.test(error.message) && /not exist|schema cache|find the function/i.test(error.message);
    return NextResponse.json({ error: fehlt ? 'Migration 0071 fehlt noch.' : error.message }, { status: fehlt ? 500 : 400 });
  }
  const r = data as { neu: string; wechsel: boolean; alter_name: string; zahlen: Record<string, number> };

  if (!body.pruefen) {
    // Name/Adresse stehen auf vielen gebauten Seiten (Profil, Team, Liga, Spielberichte) — alles als veraltet markieren.
    revalidatePath('/', 'layout');
  }
  return NextResponse.json({ ok: true, alt, neu: r.neu, wechsel: r.wechsel, alterName: r.alter_name, zahlen: r.zahlen, fest });
}
