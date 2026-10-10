// ============================================================
// Einzelrangliste 2026/27 aus den Spielberichten — reine Rechnung
// ============================================================
//
// Regeln (Spielbedingungen Ziffer 10): Nur Einzel zählen, 2:0 = 3 · 2:1 = 2 ·
// 1:2 = 1 · 0:2 = 0 Punkte. Doppel zählen nicht für die Einzelrangliste.
// Reihenfolge wie in der Auswertung des Spielberichts: Punkte → Legdifferenz,
// danach mehr Siege; ist auch das gleich, teilen sich die Spieler den Platz.
// Gezählt werden dieselben Berichte wie in der Tabelle (ab dem Einreichen;
// Wertungen ohne gespielte Partien liefern keine Einzel).
// Highlights (180er, 171er, High Finish, Short Leg) aus dem Bericht.
// ============================================================

export interface EinzelBericht {
  id: string;
  homeTeam: string;
  guestTeam: string;
  bestaetigt: boolean;
  datum: string | null;
  players: { side: 'home' | 'guest'; slot: number; name: string; player_id: string | null }[];
  games: { game_type: string; home_slot: number | null; guest_slot: number | null; legs_home: number | null; legs_guest: number | null }[];
  highlights: { side: 'home' | 'guest'; slot: number; type: string; value: number | null }[];
}

export interface EinzelZeile {
  /** players.id, sonst „name:<Team>:<Name>" (Spieler ohne Profil) */
  key: string;
  playerId: string | null;
  name: string;
  /** Team des letzten Einsatzes */
  teamId: string;
  singles: number; wins: number; losses: number;
  legsWon: number; legsLost: number;
  points: number;
  /** Begegnungen mit mindestens einem Einzel */
  einsaetze: number;
  b180: number; b171: number;
  /** höchstes Finish (100–170) */
  highFinish: number | null;
  /** kürzestes Leg (Darts) */
  shortLeg: number | null;
  /** Davon aus noch nicht bestätigten Berichten */
  offen: number;
  pos: number;
}

export const pointsForLegs = (f: number, a: number) => (f === 2 && a === 0 ? 3 : f === 2 && a === 1 ? 2 : f === 1 && a === 2 ? 1 : 0);

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function berechneEinzel(berichte: EinzelBericht[]): Map<string, EinzelZeile> {
  const out = new Map<string, EinzelZeile>();
  // ältere Berichte zuerst, damit „Team des letzten Einsatzes" stimmt
  const sorted = [...berichte].sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''));
  for (const r of sorted) {
    const keyOf = (side: 'home' | 'guest', slot: number | null) => {
      if (slot == null) return null;
      const p = r.players.find(x => x.side === side && x.slot === slot);
      if (!p || !p.name.trim()) return null;
      const team = side === 'home' ? r.homeTeam : r.guestTeam;
      return { key: p.player_id ?? `name:${team}:${norm(p.name)}`, p, team };
    };
    const ensure = (k: NonNullable<ReturnType<typeof keyOf>>) => {
      let z = out.get(k.key);
      if (!z) {
        z = { key: k.key, playerId: k.p.player_id, name: k.p.name.trim(), teamId: k.team, singles: 0, wins: 0, losses: 0, legsWon: 0, legsLost: 0, points: 0, einsaetze: 0, b180: 0, b171: 0, highFinish: null, shortLeg: null, offen: 0, pos: 0 };
        out.set(k.key, z);
      }
      z.teamId = k.team; z.name = k.p.name.trim();
      return z;
    };
    const imBericht = new Set<string>();
    for (const g of r.games) {
      if (g.game_type !== 'single' || g.legs_home == null || g.legs_guest == null) continue;
      for (const [side, slot, f, a] of [['home', g.home_slot, g.legs_home, g.legs_guest], ['guest', g.guest_slot, g.legs_guest, g.legs_home]] as const) {
        const k = keyOf(side, slot);
        if (!k) continue;
        const z = ensure(k);
        z.singles += 1; z.legsWon += f; z.legsLost += a;
        if (f > a) z.wins += 1; else z.losses += 1;
        z.points += pointsForLegs(f, a);
        if (!r.bestaetigt) z.offen += 1;
        imBericht.add(z.key);
      }
    }
    for (const key of imBericht) out.get(key)!.einsaetze += 1;
    for (const h of r.highlights ?? []) {
      const k = keyOf(h.side, h.slot);
      if (!k || h.value == null) continue;
      const z = ensure(k);
      if (h.type === '180') z.b180 += h.value;
      else if (h.type === '171') z.b171 += h.value;
      else if (h.type === 'high_finish') z.highFinish = Math.max(z.highFinish ?? 0, h.value);
      else if (h.type === 'short_leg') z.shortLeg = z.shortLeg == null ? h.value : Math.min(z.shortLeg, h.value);
    }
  }
  return out;
}

const vgl = (a: EinzelZeile, b: EinzelZeile) =>
  (b.points - a.points) || ((b.legsWon - b.legsLost) - (a.legsWon - a.legsLost)) || (b.wins - a.wins);

/** Rangliste einer Gruppe (z. B. einer Liga); nur Spieler mit mindestens einem Einzel. */
export function rangliste(zeilen: EinzelZeile[]): EinzelZeile[] {
  const s = zeilen.filter(z => z.singles > 0).sort((a, b) => vgl(a, b) || a.name.localeCompare(b.name, 'de'));
  return s.map((z, i) => ({ ...z, pos: i > 0 && vgl(s[i - 1], z) === 0 ? 0 : i + 1 }))
    .map((z, i, arr) => ({ ...z, pos: z.pos || arr.slice(0, i).reverse().find(x => x.pos)!.pos }));
}
