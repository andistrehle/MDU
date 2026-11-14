// ============================================================
// Live-Ticker: Daten des Spieltags (Betreiber, 11.11.2026)
// ============================================================
// Liest per service_role, weil Entwürfe per RLS nur fürs eigene Team lesbar sind.
// Herausgegeben wird nur, was der Ticker zeigt: Stand, Spiele mit Namen und Legs —
// keine Passnummern, Notizen, Proteste, Unterschriften, Fotos.
// Spieltag = Begegnungen mit festem Termin an diesem Tag (inkl. Verlegungen) plus
// alles, dessen Spielbericht dieses Spieldatum trägt.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NEUE_SAISON, alleBegegnungen27, findLiga27, team27, venue27 } from '@/lib/data/saison-2027';
import { ergebnisAusBericht } from '@/lib/tabelle-2027';
import { bestOfFuerLiga, legsJeSpiel } from '@/lib/legs';
import { GAME_SCHEDULE } from '@/lib/supabase/match-reports';
import {
  highlightsZuordnen, sortiereTicker, spieltagDatum, tickerAktiv, tickerEintrag, wechselErmitteln, type AufstellungPlatz, type RohHighlight,
  type LiveAntwort, type TickerAnzeige, type TickerBericht, type TickerPlan,
} from '@/lib/live-ticker';

type Bericht = { id: string; home_team_id: string; guest_team_id: string; status: string; match_date: string | null; forfeit: string | null;
  spiele_home: number | null; spiele_guest: number | null; legs_home: number | null; legs_guest: number | null; highlights: RohHighlight[] | null };
type Spiel = { report_id: string; game_no: number; game_type: string; home_slot: number | null; guest_slot: number | null; home_slot2: number | null; guest_slot2: number | null; legs_home: number | null; legs_guest: number | null };
type Spieler = { report_id: string; side: 'home' | 'guest'; slot: number; name: string };

const nachname = (n: string) => n.trim().split(/\s+/).slice(-1)[0] ?? n;

export async function ladeLiveTicker(jetzt = new Date()): Promise<LiveAntwort> {
  const datum = spieltagDatum(jetzt);
  const db = supabaseAdmin;
  if (!db) return { datum, aktiv: false, spiele: [] };

  const alle = alleBegegnungen27();
  const plan = new Map<string, TickerPlan>();
  for (const b of alle) if (b.termin?.datum === datum) plan.set(b.key, { key: b.key, liga: b.liga, home: b.home, away: b.away, uhrzeit: b.termin.uhrzeit ?? null });

  const { data: rohe } = await db.from('match_reports')
    .select('id, home_team_id, guest_team_id, status, match_date, forfeit, spiele_home, spiele_guest, legs_home, legs_guest, highlights')
    .eq('season_id', NEUE_SAISON.id).eq('match_date', datum);
  const { data: geplant } = plan.size
    ? await db.from('match_reports').select('id, home_team_id, guest_team_id, status, match_date, forfeit, spiele_home, spiele_guest, legs_home, legs_guest, highlights')
      .eq('season_id', NEUE_SAISON.id).in('home_team_id', [...new Set([...plan.values()].map(p => p.home))])
    : { data: [] };
  const berichte = new Map<string, Bericht>();
  for (const r of [...(geplant ?? []), ...(rohe ?? [])] as Bericht[]) {
    const key = `${r.home_team_id}|${r.guest_team_id}`;
    if (!plan.has(key) && r.match_date !== datum) continue;
    if (!plan.has(key)) {
      const b = alle.find(x => x.key === key);
      if (!b) continue;
      plan.set(key, { key, liga: b.liga, home: b.home, away: b.away, uhrzeit: b.termin?.uhrzeit ?? null });
    }
    berichte.set(key, r);
  }

  const ids = [...berichte.values()].map(r => r.id);
  const [{ data: spiele }, { data: spieler }] = ids.length
    ? await Promise.all([
      db.from('match_report_games').select('report_id, game_no, game_type, home_slot, guest_slot, home_slot2, guest_slot2, legs_home, legs_guest').in('report_id', ids),
      db.from('match_report_players').select('report_id, side, slot, name').in('report_id', ids),
    ])
    : [{ data: [] }, { data: [] }];
  const name = (rid: string, side: 'home' | 'guest', slot: number | null) =>
    slot == null ? '' : ((spieler ?? []) as Spieler[]).find(p => p.report_id === rid && p.side === side && p.slot === slot)?.name ?? '';

  const eintraege: TickerAnzeige[] = [...plan.values()].map(p => {
    const r = berichte.get(p.key);
    let b: TickerBericht | null = null;
    if (r) {
      b = {
        status: r.status === 'draft' && !r.forfeit ? 'draft' : r.status === 'draft' ? 'submitted' : r.status,
        spiele: ((spiele ?? []) as Spiel[]).filter(g => g.report_id === r.id).map(g => {
          const doppel = g.game_type === 'double';
          // Doppel mit Nachnamen — außer beide heißen gleich (dann voller Name).
          const n = (side: 'home' | 'guest', a: number | null, c: number | null) => {
            const voll = (doppel ? [name(r.id, side, a), name(r.id, side, c)] : [name(r.id, side, a)]).filter(Boolean);
            const kurz = voll.map(nachname);
            return doppel && new Set(kurz).size === kurz.length ? kurz : voll;
          };
          return { nr: g.game_no, doppel, heim: n('home', g.home_slot, g.home_slot2), gast: n('guest', g.guest_slot, g.guest_slot2), legsHeim: g.legs_home, legsGast: g.legs_guest };
        }),
      };
    }
    const e = tickerEintrag(p, b);
    if (r && !r.forfeit) {
      e.highlights = highlightsZuordnen(r.highlights ?? [], ((spiele ?? []) as Spiel[]).filter(g => g.report_id === r.id), (side, slot) => name(r.id, side, slot));
    }
    // Wertung (Nichtantritt/kein Bericht): Stand aus der Wertung, keine Partien.
    if (r?.forfeit) {
      const w = ergebnisAusBericht({ ...r, forfeit: r.forfeit }, legsJeSpiel(bestOfFuerLiga(p.liga)));
      Object.assign(e, { standHeim: w.spieleHome, standGast: w.spieleAway, gespielt: 0, spiele: [] });
    }
    // Aufstellung + Wechsel (nur bei gespielten Abenden, nicht bei Wertungen).
    let aufstellung: { heim: AufstellungPlatz[]; gast: AufstellungPlatz[] } | undefined;
    let wechsel: ReturnType<typeof wechselErmitteln> | undefined;
    if (r && !r.forfeit) {
      const ps = ((spieler ?? []) as Spieler[]).filter(x => x.report_id === r.id && x.name?.trim());
      const liste = (side: 'home' | 'guest') => ps.filter(x => x.side === side).sort((a, b) => a.slot - b.slot).map(x => ({ slot: x.slot, name: x.name.trim() }));
      aufstellung = { heim: liste('home'), gast: liste('guest') };
      const plan = new Map(GAME_SCHEDULE.filter(g => g.type === 'single').map(g => [g.no, g]));
      const einzel = ((spiele ?? []) as Spiel[])
        .filter(g => g.report_id === r.id && g.game_type === 'single' && plan.has(g.game_no) && g.legs_home != null && g.legs_guest != null)
        .map(g => ({ nr: g.game_no, heimPos: plan.get(g.game_no)!.homeSlot!, gastPos: plan.get(g.game_no)!.guestSlot!, heimSlot: g.home_slot, gastSlot: g.guest_slot }));
      wechsel = wechselErmitteln(einzel, {
        heim: new Map(aufstellung.heim.map(x => [x.slot, x.name])), gast: new Map(aufstellung.gast.map(x => [x.slot, x.name])),
      });
    }
    const H = team27(p.home), A = team27(p.away);
    return { ...e, homeName: H?.name ?? p.home, awayName: A?.name ?? p.away, ligaName: findLiga27(p.liga)?.name ?? p.liga, ligaFarbe: findLiga27(p.liga)?.color ?? '#888',
      ort: venue27(H?.venueId)?.name ?? null, wertung: !!r?.forfeit, aufstellung, wechsel };
  });
  const sortiert = sortiereTicker(eintraege) as TickerAnzeige[];
  return { datum, aktiv: tickerAktiv(sortiert), spiele: sortiert };
}
