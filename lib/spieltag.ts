// ============================================================
// Spieltag-Ansicht (Zu-/Absagen) — gemeinsame Helfer
// ============================================================
// Adresse eines Spiels: /spieltag/<team-id>/<heim>--<gast> (teilbar, z. B. in
// eine WhatsApp-Gruppe). Ende = Beginn + 3,5 Std.; Treffen = Vorgabe des Teams
// (Minuten vor Beginn) oder die je Spiel eingetragene Uhrzeit.

export const DAUER_MIN = 210;
export const TREFFEN_VORGABE_MIN = 30;

export const spielSlug = (key: string) => key.replace('|', '--');
// Kein Zurückrechnen aus dem Slug: Team-IDs können selbst „--“ enthalten
// (team-illuminati--28d702). Aufgelöst wird per Vergleich mit spielSlug().
export const passtSlug = (key: string, slug: string) => spielSlug(key) === decodeURIComponent(slug);
export const spieltagPfad = (teamId: string, key: string) => `/spieltag/${teamId}/${spielSlug(key)}`;

const zuMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const ausMin = (min: number) => { const x = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

export const endeZeit = (beginn: string | undefined) => (beginn ? ausMin(zuMin(beginn) + DAUER_MIN) : null);

/** Treffzeit: eigene Uhrzeit des Spiels, sonst Vorgabe (Minuten vor Beginn); 0 Minuten = kein Treffen. */
export function treffZeit(beginn: string | undefined, vorgabeMin: number, eigene?: string | null): string | null {
  if (eigene) return eigene;
  if (!beginn || vorgabeMin <= 0) return null;
  return ausMin(zuMin(beginn) - vorgabeMin);
}

const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const d = (iso: string) => new Date(iso + 'T12:00:00Z');
export const wochentag = (iso: string) => WT[d(iso).getUTCDay()];
export const wochentagLang = (iso: string) => WT_LANG[d(iso).getUTCDay()];
/** „23.10.“ */
export const tagMonat = (iso: string) => `${d(iso).getUTCDate()}.${d(iso).getUTCMonth() + 1}.`;
