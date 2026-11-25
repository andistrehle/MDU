// WM-Tipp: Server-Lader (service_role). Rechnet die Rangliste aus allen Tipps — die Tipps selbst sind per RLS
// gesperrt (jeder sieht nur seine eigenen), nach außen geht nur das Gerechnete und die Tipps vergangener Spiele.
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { team27 } from '@/lib/data/saison-2027';
import { rangliste, type WmSpiel, type WmTipp, type WmVorab, type WmAuswertung, type WmZeile } from '@/lib/wm-tipp';

export interface WmStand { spiele: WmSpiel[]; auswertung: WmAuswertung; zeilen: WmZeile[]; teilnehmer: number }

export async function ladeWmStand(): Promise<WmStand | null> {
  const db = supabaseAdmin;
  if (!db) return null;
  const [sp, ti, vo, au] = await Promise.all([
    db.from('wm_spiele').select('id, runde, nr, beginn, spieler_a, spieler_b, ziel, sets_a, sets_b').order('beginn', { ascending: true, nullsFirst: false }).order('nr'),
    db.from('wm_tipps').select('user_id, spiel_id, sets_a, sets_b'),
    db.from('wm_vorab').select('user_id, vf, hf, finale, weltmeister, n180, neun_darter, bester_deutscher'),
    db.from('wm_auswertung').select('n180, neun_darter, bester_deutscher').eq('id', 1).maybeSingle(),
  ]);
  if (sp.error) throw new Error(sp.error.message);
  const spiele = (sp.data ?? []) as WmSpiel[];
  const tipps = (ti.data ?? []) as WmTipp[];
  const vorab = (vo.data ?? []) as WmVorab[];
  const auswertung = (au.data ?? { n180: null, neun_darter: null, bester_deutscher: null }) as WmAuswertung;

  const ids = [...new Set([...tipps.map(t => t.user_id), ...vorab.map(v => v.user_id)])];
  const profile = new Map<string, { display_name: string | null; team_id: string | null }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db.from('profiles').select('id, display_name, team_id').in('id', ids.slice(i, i + 200));
    for (const p of (data ?? []) as { id: string; display_name: string | null; team_id: string | null }[]) profile.set(p.id, p);
  }
  const teilnehmer = ids.map(id => {
    const p = profile.get(id);
    const teamId = p?.team_id ?? null;
    return { user_id: id, name: p?.display_name?.trim() || 'Ohne Namen', teamId, liga: teamId ? team27(teamId)?.league ?? null : null };
  });
  return { spiele, auswertung, zeilen: rangliste(teilnehmer, spiele, tipps, vorab, auswertung), teilnehmer: teilnehmer.length };
}
