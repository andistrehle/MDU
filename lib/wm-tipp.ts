// ============================================================
// WM-Tipp (Darts-WM im Ally Pally, Start 11.12.2026) — reine Rechnung
// ============================================================
// Betreiber, 25.11.2026, per Klick-Umfrage:
//  · Jedes Spiel tippen: Sieger richtig 3 Punkte, genaues Ergebnis 5. (Bei „first to n Sätze“ ist das genaue
//    Ergebnis dasselbe wie die richtige Satzdifferenz — eine eigene Stufe dafür gibt es deshalb nicht.)
//  · Vorab bis zum ersten Spiel: je richtiger Viertelfinalist 3, Halbfinalist 5, Finalist 8, Weltmeister 15.
//  · Bonusfragen: Anzahl 180er im Turnier (nächster dran 10, Platz 2 und 3 je 5), Neun-Darter ja/nein 5,
//    bester Deutscher 5.
//  · Wertungen: Gesamt-MDU, je Liga, je Mannschaft — nur mit MDU-Konto. KEIN Geld: Sachpreise.
// Diese Datei rechnet nur; Laden/Speichern in lib/server/wm-tipp.ts bzw. im Browser (RLS).
// ============================================================

/** Not-Aus / Freischalter: solange false, sieht nur die Ligaleitung die Seite (Betreiber: „erst sauber vorbereiten“). */
export const WM_TIPP_LIVE = false;

export const WM_START = '2026-12-11T19:30:00+01:00';
export const WM_NAME = 'Darts-WM 2027';

export type Runde = 'r1' | 'r2' | 'r3' | 'r4' | 'vf' | 'hf' | 'f';
export const RUNDEN: { key: Runde; name: string; kurz: string }[] = [
  { key: 'r1', name: '1. Runde', kurz: 'R1' },
  { key: 'r2', name: '2. Runde', kurz: 'R2' },
  { key: 'r3', name: '3. Runde', kurz: 'R3' },
  { key: 'r4', name: 'Achtelfinale', kurz: 'AF' },
  { key: 'vf', name: 'Viertelfinale', kurz: 'VF' },
  { key: 'hf', name: 'Halbfinale', kurz: 'HF' },
  { key: 'f', name: 'Finale', kurz: 'F' },
];
export const rundenName = (r: string) => RUNDEN.find(x => x.key === r)?.name ?? r;

export const PUNKTE = { sieger: 3, genau: 5, vf: 3, hf: 5, finale: 8, weltmeister: 15, n180: [10, 5, 5], neunDarter: 5, besterDeutscher: 5 } as const;

export interface WmSpiel {
  id: string; runde: Runde; nr: number; beginn: string | null;
  spieler_a: string; spieler_b: string;
  /** Sätze zum Sieg (best of 5 → 3) */
  ziel: number;
  sets_a: number | null; sets_b: number | null;
}
export interface WmTipp { user_id: string; spiel_id: string; sets_a: number; sets_b: number }
export interface WmVorab {
  user_id: string;
  vf: string[]; hf: string[]; finale: string[]; weltmeister: string | null;
  n180: number | null; neun_darter: boolean | null; bester_deutscher: string | null;
}
export interface WmAuswertung { n180: number | null; neun_darter: boolean | null; bester_deutscher: string | null }

export const fertig = (s: Pick<WmSpiel, 'sets_a' | 'sets_b' | 'ziel'>) =>
  s.sets_a != null && s.sets_b != null && (s.sets_a === s.ziel || s.sets_b === s.ziel) && s.sets_a !== s.sets_b;

/** Gültiger Tipp: genau eine Seite hat das Ziel erreicht, die andere weniger. */
export const tippGueltig = (a: number, b: number, ziel: number) =>
  Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && ((a === ziel && b < ziel) || (b === ziel && a < ziel));

/** Alle möglichen Ergebnisse eines Spiels, Heimsieg zuerst (für die Knöpfe). */
export function moeglicheErgebnisse(ziel: number): [number, number][] {
  const out: [number, number][] = [];
  for (let b = 0; b < ziel; b++) out.push([ziel, b]);
  for (let a = ziel - 1; a >= 0; a--) out.push([a, ziel]);
  return out;
}

export function punkteSpiel(t: Pick<WmTipp, 'sets_a' | 'sets_b'>, s: Pick<WmSpiel, 'sets_a' | 'sets_b' | 'ziel'>): number {
  if (!fertig(s)) return 0;
  if (t.sets_a === s.sets_a && t.sets_b === s.sets_b) return PUNKTE.genau;
  return (t.sets_a > t.sets_b) === (s.sets_a! > s.sets_b!) ? PUNKTE.sieger : 0;
}

const norm = (n: string) => n.trim().toLowerCase();
const sieger = (s: WmSpiel) => (fertig(s) ? (s.sets_a! > s.sets_b! ? s.spieler_a : s.spieler_b) : null);

/** Wer hat welche Runde erreicht? Aus dem Plan: Viertelfinalisten = Spieler der VF-Spiele usw. Weltmeister = Sieger des Finales. */
export function erreicht(spiele: WmSpiel[]) {
  const namen = (r: Runde) => spiele.filter(s => s.runde === r).flatMap(s => [s.spieler_a, s.spieler_b]).filter(n => n && !/^(tbd|n\.? ?n\.?|\?)$/i.test(n.trim()));
  const fin = spiele.find(s => s.runde === 'f');
  return { vf: namen('vf'), hf: namen('hf'), finale: namen('f'), weltmeister: fin ? sieger(fin) : null };
}

export function punkteVorab(v: WmVorab, spiele: WmSpiel[]) {
  const e = erreicht(spiele);
  const trifft = (tipps: string[], echt: string[]) => {
    const set = new Set(echt.map(norm));
    return new Set(tipps.map(norm).filter(n => n && set.has(n))).size;
  };
  const vf = trifft(v.vf, e.vf) * PUNKTE.vf;
  const hf = trifft(v.hf, e.hf) * PUNKTE.hf;
  const finale = trifft(v.finale, e.finale) * PUNKTE.finale;
  const wm = v.weltmeister && e.weltmeister && norm(v.weltmeister) === norm(e.weltmeister) ? PUNKTE.weltmeister : 0;
  return { vf, hf, finale, weltmeister: wm, summe: vf + hf + finale + wm };
}

/** Bonusfragen. 180er: nach Abstand gerankt, gleicher Abstand = gleicher Platz (alle bekommen die Punkte dieses Platzes). */
export function punkteBonus(alle: WmVorab[], a: WmAuswertung): Map<string, { n180: number; neunDarter: number; besterDeutscher: number }> {
  const out = new Map<string, { n180: number; neunDarter: number; besterDeutscher: number }>();
  for (const v of alle) out.set(v.user_id, { n180: 0, neunDarter: 0, besterDeutscher: 0 });
  if (a.n180 != null) {
    const mit = alle.filter(v => v.n180 != null).map(v => ({ id: v.user_id, d: Math.abs(v.n180! - a.n180!) })).sort((x, y) => x.d - y.d);
    let platz = 0;
    mit.forEach((x, i) => {
      if (i === 0 || x.d !== mit[i - 1].d) platz = i;
      const p = PUNKTE.n180[platz] ?? 0;
      out.get(x.id)!.n180 = p;
    });
  }
  for (const v of alle) {
    const z = out.get(v.user_id)!;
    if (a.neun_darter != null && v.neun_darter === a.neun_darter) z.neunDarter = PUNKTE.neunDarter;
    if (a.bester_deutscher && v.bester_deutscher && norm(v.bester_deutscher) === norm(a.bester_deutscher)) z.besterDeutscher = PUNKTE.besterDeutscher;
  }
  return out;
}

export interface WmZeile {
  user_id: string; name: string; teamId: string | null; liga: string | null;
  spiele: number; genau: number; sieger: number; vorab: number; bonus: number; punkte: number; platz: number;
}

/** Gesamtrechnung je Konto. Gleichstand: mehr genaue Ergebnisse, dann mehr richtige Sieger, sonst geteilter Platz. */
export function rangliste(
  teilnehmer: { user_id: string; name: string; teamId: string | null; liga: string | null }[],
  spiele: WmSpiel[], tipps: WmTipp[], vorab: WmVorab[], auswertung: WmAuswertung,
): WmZeile[] {
  const spielById = new Map(spiele.map(s => [s.id, s]));
  const bonus = punkteBonus(vorab, auswertung);
  const vorabBy = new Map(vorab.map(v => [v.user_id, v]));
  const zeilen = teilnehmer.map(t => {
    let spielPunkte = 0, genau = 0, sieg = 0;
    for (const x of tipps) {
      if (x.user_id !== t.user_id) continue;
      const s = spielById.get(x.spiel_id);
      if (!s) continue;
      const p = punkteSpiel(x, s);
      spielPunkte += p;
      if (p === PUNKTE.genau) genau++;
      if (p > 0) sieg++;
    }
    const v = vorabBy.get(t.user_id);
    const vp = v ? punkteVorab(v, spiele).summe : 0;
    const b = bonus.get(t.user_id);
    const bp = b ? b.n180 + b.neunDarter + b.besterDeutscher : 0;
    return { ...t, spiele: spielPunkte, genau, sieger: sieg, vorab: vp, bonus: bp, punkte: spielPunkte + vp + bp, platz: 0 };
  });
  zeilen.sort((a, b) => b.punkte - a.punkte || b.genau - a.genau || b.sieger - a.sieger || a.name.localeCompare(b.name, 'de'));
  zeilen.forEach((z, i) => {
    const v = zeilen[i - 1];
    z.platz = i > 0 && v.punkte === z.punkte && v.genau === z.genau && v.sieger === z.sieger ? v.platz : i + 1;
  });
  return zeilen;
}

/** Gibt die Rangliste einer Gruppe mit neu vergebenen Plätzen zurück (Liga/Team = Ausschnitt der Gesamtwertung). */
export function ausschnitt(alle: WmZeile[], passt: (z: WmZeile) => boolean): WmZeile[] {
  const z = alle.filter(passt).map(x => ({ ...x }));
  z.forEach((x, i) => {
    const v = z[i - 1];
    x.platz = i > 0 && v.punkte === x.punkte && v.genau === x.genau && v.sieger === x.sieger ? v.platz : i + 1;
  });
  return z;
}

/**
 * Spielplan aus eingefügtem Text (Admin → WM-Tipp, solange es keine automatische Quelle gibt).
 * Je Zeile: Runde; Datum Uhrzeit; Spieler A; Spieler B; Sätze zum Sieg (optional, sonst nach Runde)
 * Beispiel: „r1; 11.12.2026 20:00; Luke Littler; Darius Labanauskas; 3“. Trenner ; oder Tab.
 */
export const ZIEL_JE_RUNDE: Record<Runde, number> = { r1: 3, r2: 3, r3: 4, r4: 4, vf: 5, hf: 6, f: 7 };

export function spielplanLesen(text: string): { spiele: Omit<WmSpiel, 'id' | 'sets_a' | 'sets_b'>[]; fehler: string[] } {
  const spiele: Omit<WmSpiel, 'id' | 'sets_a' | 'sets_b'>[] = [], fehler: string[] = [];
  const nrJeRunde = new Map<Runde, number>();
  text.split(/\r?\n/).forEach((zeile, i) => {
    if (!zeile.trim() || zeile.trim().startsWith('#')) return;
    const t = zeile.split(/\t|;/).map(x => x.trim());
    const r = (t[0] ?? '').toLowerCase() as Runde;
    if (!RUNDEN.some(x => x.key === r)) { fehler.push(`Zeile ${i + 1}: Runde „${t[0]}“ unbekannt (r1, r2, r3, r4, vf, hf, f)`); return; }
    const m = (t[1] ?? '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (t[1] && !m) { fehler.push(`Zeile ${i + 1}: Datum „${t[1]}“ nicht lesbar (TT.MM.JJJJ HH:MM)`); return; }
    const beginn = m ? berlinIso(+m[3], +m[2], +m[1], m[4] ? +m[4] : 12, m[5] ? +m[5] : 0) : null;
    if (!t[2] || !t[3]) { fehler.push(`Zeile ${i + 1}: zwei Spieler nötig`); return; }
    const ziel = t[4] ? parseInt(t[4], 10) : ZIEL_JE_RUNDE[r];
    if (!(ziel >= 1 && ziel <= 9)) { fehler.push(`Zeile ${i + 1}: Sätze zum Sieg „${t[4]}“ ungültig`); return; }
    const nr = (nrJeRunde.get(r) ?? 0) + 1; nrJeRunde.set(r, nr);
    spiele.push({ runde: r, nr, beginn, spieler_a: t[2], spieler_b: t[3], ziel });
  });
  return { spiele, fehler };
}

/** Berliner Ortszeit → ISO mit Versatz (Dezember/Januar = Winterzeit +01:00). */
function berlinIso(j: number, mo: number, t: number, h: number, mi: number): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${j}-${p(mo)}-${p(t)}T${p(h)}:${p(mi)}:00+01:00`;
}

/** Tipp noch änderbar? Bis zum Beginn des Spiels (ohne Beginn: offen). */
export const tippOffen = (s: Pick<WmSpiel, 'beginn'>, jetzt: Date) => !s.beginn || new Date(s.beginn).getTime() > jetzt.getTime();
export const vorabOffen = (jetzt: Date) => new Date(WM_START).getTime() > jetzt.getTime();
