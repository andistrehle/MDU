// Start-Push „Der Live-Ticker läuft“ — einmal je Spieltag (Migration 0069).
// Gemeinsam für das Formular (/api/live/start) und das Tablet (/api/kiosk).
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { pushAlle } from '@/lib/server/push';
import { LIVE_TICKER_AN, spieltagDatum } from '@/lib/live-ticker';

export async function liveStartPush(reportId: string): Promise<boolean> {
  if (!LIVE_TICKER_AN || !supabaseAdmin) return false;
  const datum = spieltagDatum(new Date());
  // Nur ein echter Live-Stand des heutigen Spieltags löst aus: Entwurf, Spieldatum heute, mindestens ein Ergebnis.
  const { data: r } = await supabaseAdmin.from('match_reports').select('id, status, match_date').eq('id', reportId).maybeSingle();
  if (!r || (r as { status: string }).status !== 'draft' || (r as { match_date: string | null }).match_date !== datum) return false;
  const { count } = await supabaseAdmin.from('match_report_games').select('game_no', { count: 'exact', head: true })
    .eq('report_id', reportId).not('legs_home', 'is', null);
  if (!count) return false;
  const { error } = await supabaseAdmin.from('live_ticker_push').insert({ datum });
  if (error) return false; // schon gepusht oder Migration fehlt
  await pushAlle({ titel: '🔴 Der Live-Ticker läuft', text: 'Die ersten Ergebnisse des Abends sind da – jetzt live mitverfolgen.', url: '/live', tag: `live-${datum}` });
  return true;
}
