// ============================================================
// Bazis-Bot: Welche Umfrage gehört heute in die WhatsApp-Gruppe?
// ============================================================
// Liest den Spielplan 2026/27 (inkl. Verlegungen und Heimrechttausch, also
// genau das, was auch auf der Seite steht) und baut für das Spiel des Teams
// HEUTE die Ankunfts-Umfrage: ab 1,5 Stunden vor Beginn alle 15 Minuten bis zum
// Anpfiff, jede Zeit mit einem Spruch, dazu „Mitfahrt“ und „Bin raus“.
// Die Sprüche wechseln je Spieltag (fest aus dem Datum gewürfelt, damit ein
// zweiter Lauf am selben Tag dieselbe Umfrage ergäbe).
//
//   npx tsx scripts/whatsapp-bot/umfrage.ts                → heute, JSON oder null
//   npx tsx scripts/whatsapp-bot/umfrage.ts --naechstes    → nächstes Spiel (Test)
// ENV: BOT_TEAM (Vorgabe freibad-bazis), BOT_SPITZNAME (Vorgabe „Bazis“)
// ============================================================

import { alleBegegnungen27, team27, venue27 } from '../../lib/data/saison-2027';

const TEAM = process.env.BOT_TEAM || 'freibad-bazis';
const SPITZ = process.env.BOT_SPITZNAME || 'Bazis';

const heuteBerlin = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

/** Sprüche je „Minuten vor Anpfiff“ — {zeit} wird ersetzt. */
const SPRUECHE: Record<number, string[]> = {
  120: ['⏰ {zeit} – ich wärm schon mal den Hocker vor', '⏰ {zeit} – ich bin quasi Inventar', '⏰ {zeit} – Wirt, mach schon mal auf'],
  105: ['⏰ {zeit} – Einspielen ist Pflicht, Bier auch', '⏰ {zeit} – ich will das Board noch kennenlernen', '⏰ {zeit} – Doppel-16 üben bis sie sitzt'],
  90: ['⏰ {zeit} – early bird 🐦', '⏰ {zeit} – früher Vogel trifft die Triple 20', '⏰ {zeit} – ich kenn mich dort schon aus 🗺️'],
  75: ['⏰ {zeit} – entspannt ankommen, Gegner beobachten', '⏰ {zeit} – Scouting-Abteilung meldet sich', '⏰ {zeit} – erst Schnitzel, dann Darts'],
  60: ['⏰ {zeit} – Feierabend, Abfahrt, Pfeile raus', '⏰ {zeit} – eine Stunde Puffer, Profi halt', '⏰ {zeit} – ich bring die gute Laune mit'],
  45: ['⏰ {zeit} – noch locker im grünen Bereich', '⏰ {zeit} – rechtzeitig für die erste Runde', '⏰ {zeit} – Tisch reservieren, ich komm'],
  30: ['⏰ {zeit} – solide', '⏰ {zeit} – solide wie ein 60er-Schnitt', '⏰ {zeit} – Kapitän ist zufrieden'],
  15: ['⏰ {zeit} – pünktlich-ish', '⏰ {zeit} – Jacke aus, Pfeile raus', '⏰ {zeit} – ich renn vom Parkplatz'],
  0: ['⏰ {zeit} – last second Larry 😅', '⏰ {zeit} – Pfeile schon in der Hand', '⏰ {zeit} – Anpfiff? Bin da! (irgendwie)'],
};
const EXTRAS = [
  ['✈️ Ich fliege mit – brauche Mitfahrt', '🚕 Brauch eine Mitfahrgelegenheit', '🙋 Wer nimmt mich mit?'],
  ['🚗 Ich kann einsammeln', '🚗 Taxi Bazis – ich sammel ein', '🚗 Hab noch Plätze frei – ich sammel ein'],
  ['❌ Bin leider raus – Good Darts!! 🎯'],
];
const TITEL_HEIM = ['🎯 Spieltag! {spitz} vs. {gegner} im {lokal} – Dein Status?', '🎯 Heimspiel! {spitz} gegen {gegner} – wann bist du da?', '🎯 Heute zuhause: {spitz} vs. {gegner} – wann rollst du ein?'];
const TITEL_AUSWAERTS = ['🎯 Spieltag! {spitz} @ {lokal} – Dein Status?', '🎯 Auswärts bei {gegner} ({lokal}) – wann bist du da?', '🎯 {spitz} on tour: {gegner} im {lokal} – wann rollst du ein?'];

function wuerfel(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return <T,>(l: T[], salz: number) => l[Math.abs((h + salz * 7919) | 0) % l.length];
}

const fuell = (s: string, w: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => w[k] ?? '');

export interface Umfrage { datum: string; uhrzeit: string; name: string; optionen: string[] }

export function umfrageFuer(datum: string | null): Umfrage | null {
  const eigene = alleBegegnungen27()
    .filter(b => (b.home === TEAM || b.away === TEAM) && b.termin?.datum && b.termin.uhrzeit)
    .sort((a, b) => (a.termin!.datum + a.termin!.uhrzeit).localeCompare(b.termin!.datum + b.termin!.uhrzeit));
  const b = datum ? eigene.find(x => x.termin!.datum === datum) : eigene.find(x => x.termin!.datum >= heuteBerlin());
  if (!b) return null;
  const { datum: tag, uhrzeit } = b.termin as { datum: string; uhrzeit: string };
  const heim = b.home === TEAM;
  const gegner = team27(heim ? b.away : b.home)?.name ?? (heim ? b.away : b.home);
  const lokal = venue27(team27(b.home)?.venueId)?.name ?? 'Lokal';
  const w = wuerfel(tag + TEAM);
  const [hh, mm] = uhrzeit.split(':').map(Number);
  const optionen = [90, 75, 60, 45, 30, 15, 0].map((vor, i) => {
    const min = hh * 60 + mm - vor;
    const zeit = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')} Uhr`;
    return fuell(w(SPRUECHE[vor], i), { zeit });
  });
  optionen.push(w(EXTRAS[0], 20), w(EXTRAS[1], 22), w(EXTRAS[2], 21));
  let name = fuell(w(heim ? TITEL_HEIM : TITEL_AUSWAERTS, 30), { spitz: SPITZ, gegner, lokal });
  // Besondere Abende vorne dran: Derby und/oder erstes Spiel der Saison.
  const auftakt = b === eigene[0];
  const vorsatz = b.derby && auftakt ? '🔥 Derby-Time zum Saisonauftakt!' : b.derby ? '🔥 Derby-Time!' : auftakt ? '🚀 Saisonauftakt!' : '';
  if (vorsatz) name = `${vorsatz} ${name.replace(/^🎯 (Spieltag!|Heimspiel!|Heute zuhause:|Auswärts)\s*/, '')}`;
  return { datum: tag, uhrzeit, name, optionen };
}

if (process.argv[1]?.endsWith('umfrage.ts')) {
  const naechstes = process.argv.includes('--naechstes');
  process.stdout.write(JSON.stringify(umfrageFuer(naechstes ? null : heuteBerlin())) + '\n');
}
