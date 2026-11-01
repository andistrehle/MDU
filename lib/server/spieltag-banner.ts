// ============================================================
// Laufband „Spieltag“ ganz oben auf der Startseite (Betreiber, 01.11.2026)
// ============================================================
// Neuester VERÖFFENTLICHTER Spieltagsbericht, höchstens 3 Tage nach der
// Veröffentlichung (push_at, sonst sort_ts der News): Titel + Ergebnisse aus
// `spieltag_berichte.social`. Danach verschwindet er von selbst, bis der nächste
// kommt. Lesen per service_role (spieltag_berichte hat keine öffentliche Policy),
// nach außen geht nur, was ohnehin im öffentlichen Bericht steht.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const BANNER_TAGE = 3;

export interface BannerLiga { name: string; farbe: string; ergebnisse: { heim: string; gast: string; erg: string }[] }
export interface SpieltagBanner { id: string; titel: string; ligen: BannerLiga[] }

export async function ladeSpieltagBanner(): Promise<SpieltagBanner | null> {
  const db = supabaseAdmin;
  if (!db) return null;
  try {
    const { data: news } = await db.from('news')
      .select('id,title,sort_ts').eq('status', 'published').like('id', 'spieltag-%')
      .order('sort_ts', { ascending: false }).limit(1);
    const n = news?.[0] as { id: string; title: string; sort_ts: string } | undefined;
    if (!n) return null;
    const { data: b } = await db.from('spieltag_berichte').select('push_at,social').eq('news_id', n.id).maybeSingle();
    const zeile = b as { push_at: string | null; social: { ligen?: BannerLiga[] } | null } | null;
    const ab = Date.parse(zeile?.push_at ?? n.sort_ts);
    if (Number.isNaN(ab) || Date.now() - ab > BANNER_TAGE * 86_400_000) return null;
    const ligen = (zeile?.social?.ligen ?? [])
      .map(l => ({ name: l.name, farbe: l.farbe, ergebnisse: (l.ergebnisse ?? []).map(e => ({ heim: e.heim, gast: e.gast, erg: e.erg })) }))
      .filter(l => l.ergebnisse.length > 0);
    return { id: n.id, titel: n.title, ligen };
  } catch {
    return null;
  }
}
