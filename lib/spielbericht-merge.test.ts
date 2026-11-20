import { describe, expect, it } from 'vitest';
import { gleicherStand, zusammenfuehren, type MergeStand } from './spielbericht-merge';
import { legsSetzen, leereSpiele, slotSetzen } from './kiosk';
import type { HighlightEntry } from '@/lib/supabase/match-reports';

const namen = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ slot: i + 1, name: `${prefix}${i + 1}` }));
const basis = (): MergeStand => ({ heim: namen('H', 4), gast: namen('G', 4), games: leereSpiele(), highlights: [] });

describe('Spielbericht zusammenführen', () => {
  it('Ergebnisse aus beiden Geräten kommen zusammen', () => {
    const b = basis();
    const meins = { ...b, games: legsSetzen(b.games, 1, '2:0') };   // Tablet: Spiel 1
    const deins = { ...b, games: legsSetzen(b.games, 2, '1:2') };   // Handy: Spiel 2
    const r = zusammenfuehren(b, meins, deins);
    expect(r.games[0]).toMatchObject({ legs_home: 2, legs_guest: 0 });
    expect(r.games[1]).toMatchObject({ legs_home: 1, legs_guest: 2 });
    expect(r.games[2]).toMatchObject({ legs_home: null, legs_guest: null });
  });

  it('nur fremde Änderung: deren Stand gilt, auch ein Zurücksetzen', () => {
    const b = { ...basis(), games: legsSetzen(leereSpiele(), 3, '2:1') };
    const deins = { ...b, games: legsSetzen(b.games, 3, '') };      // anderes Gerät löscht das Ergebnis
    expect(zusammenfuehren(b, b, deins).games[2]).toMatchObject({ legs_home: null, legs_guest: null });
  });

  it('dasselbe Spiel auf beiden Geräten verschieden: das zusammenführende Gerät gewinnt', () => {
    const b = basis();
    const r = zusammenfuehren(b, { ...b, games: legsSetzen(b.games, 4, '2:0') }, { ...b, games: legsSetzen(b.games, 4, '0:2') });
    expect(r.games[3]).toMatchObject({ legs_home: 2, legs_guest: 0 });
  });

  it('Aufstellung je Platz: neuer Ersatzspieler hier, geänderter Gast dort', () => {
    const b = basis();
    const meins = { ...b, heim: [...b.heim, { slot: 5, name: 'Ersatz' }] };
    const deins = { ...b, gast: b.gast.map(p => (p.slot === 2 ? { ...p, name: 'Neu G2' } : p)) };
    const r = zusammenfuehren(b, meins, deins);
    expect(r.heim.map(p => p.name)).toEqual(['H1', 'H2', 'H3', 'H4', 'Ersatz']);
    expect(r.gast.find(p => p.slot === 2)?.name).toBe('Neu G2');
  });

  it('Wechsel im Spiel (Spielerfeld) und Ergebnis an verschiedenen Geräten', () => {
    const b = basis();
    const meins = { ...b, games: slotSetzen(b.games, 5, 'home_slot', 6) };   // Tablet: H6 kommt in Spiel 5
    const deins = { ...b, games: legsSetzen(b.games, 5, '2:1') };            // Handy: Ergebnis von Spiel 5
    const r = zusammenfuehren(b, meins, deins);
    expect(r.games[4]).toMatchObject({ home_slot: 6, legs_home: 2, legs_guest: 1 });
  });

  it('180er zählen von beiden Geräten zusammen, High Finishes bleiben einzeln', () => {
    const hl = (type: HighlightEntry['type'], value: number, slot = 1): HighlightEntry => ({ side: 'home', slot, type, value, game_no: 1 });
    const b = { ...basis(), highlights: [hl('180', 1)] };
    const meins = { ...b, highlights: [hl('180', 2), hl('high_finish', 120)] };   // +1 180er, + HF 120
    const deins = { ...b, highlights: [hl('180', 2), hl('high_finish', 104)] };   // +1 180er, + HF 104
    const r = zusammenfuehren(b, meins, deins);
    expect(r.highlights.find(h => h.type === '180')?.value).toBe(3);
    expect(r.highlights.filter(h => h.type === 'high_finish').map(h => h.value).sort()).toEqual([104, 120]);
  });

  it('gelöschtes Highlight bleibt gelöscht, auch wenn das andere Gerät es noch hat', () => {
    const hf: HighlightEntry = { side: 'guest', slot: 2, type: 'high_finish', value: 140, game_no: 3 };
    const b = { ...basis(), highlights: [hf] };
    expect(zusammenfuehren(b, { ...b, highlights: [] }, b).highlights).toEqual([]);
  });

  it('nichts geändert → Ergebnis gleich dem neuen Server-Stand', () => {
    const b = basis();
    const deins = { ...b, games: legsSetzen(b.games, 7, '2:0') };
    const r = zusammenfuehren(b, b, deins);
    expect(gleicherStand(r, deins)).toBe(true);
    expect(gleicherStand(r, b)).toBe(false);
  });
});
