// ============================================================
// Tennis Kail — Formatierung und Datumsrechnung
// ============================================================
//
// Alles rechnet in Europe/Berlin und in „Minuten seit Mitternacht".
// Wichtig für die Demo: Kein Aufruf berechnet das heutige Datum selbst.
// Der Referenztag kommt immer vom Server in die Seite hinein (`todayIso`),
// damit Server und Browser dasselbe rendern — sonst gäbe es
// Hydration-Unterschiede, sobald jemand um Mitternacht die Seite lädt.
// ============================================================

export const TZ = 'Europe/Berlin';

/** YYYY-MM-DD in Europe/Berlin für einen Zeitpunkt. */
export function isoDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Aktueller Referenztag — nur auf dem Server aufrufen. */
export function today(): string {
  return isoDate(new Date());
}

/** Minuten seit Mitternacht in Europe/Berlin — nur auf dem Server aufrufen. */
export function nowMinutes(): number {
  const parts = new Intl.DateTimeFormat('de-DE', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')!.value);
  const m = Number(parts.find((p) => p.type === 'minute')!.value);
  return h * 60 + m;
}

/** Datum plus n Tage, wieder als ISO-Datum. Rein kalendarisch, ohne Zeitzonen-Drift. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Differenz in Tagen (b − a). */
export function diffDays(a: string, b: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** Wochentag 0–6 (0 = Sonntag) eines ISO-Datums. */
export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const WD_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** „Mo, 10.08." */
export function formatDayShort(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${WD_SHORT[weekdayOf(iso)]}, ${d}.${m}.`;
}

/** „Montag, 10. August 2026" */
export function formatDayLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WD_LONG[weekdayOf(iso)]}, ${d}. ${MONTHS[m - 1]} ${y}`;
}

/** „10. August" */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}. ${MONTHS[m - 1]}`;
}

/** Zeitraum als „2.–5. November" oder „29. März – 2. April". */
export function formatRange(startIso: string, endIso?: string): string {
  if (!endIso || endIso === startIso) return formatDayMonth(startIso);
  const [, sm, sd] = startIso.split('-').map(Number);
  const [, em, ed] = endIso.split('-').map(Number);
  if (sm === em) return `${sd}.–${ed}. ${MONTHS[sm - 1]}`;
  return `${sd}. ${MONTHS[sm - 1]} – ${ed}. ${MONTHS[em - 1]}`;
}

/** Relative Angabe für Buchungslisten: „heute", „morgen", „in 3 Tagen". */
export function relativeDay(todayIso: string, iso: string): string {
  const d = diffDays(todayIso, iso);
  if (d === 0) return 'heute';
  if (d === 1) return 'morgen';
  if (d === -1) return 'gestern';
  if (d > 1 && d < 7) return `in ${d} Tagen`;
  if (d < -1 && d > -7) return `vor ${-d} Tagen`;
  return formatDayShort(iso);
}

/** Minuten seit Mitternacht → „18:30". */
export function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** „18:00–19:30" */
export function formatSpan(from: number, to: number): string {
  return `${formatTime(from)}–${formatTime(to)}`;
}

/** Dauer als „90 min" oder „1 Std". */
export function formatDuration(min: number): string {
  if (min % 60 === 0) return min === 60 ? '1 Std' : `${min / 60} Std`;
  return `${min} min`;
}

const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/** Cent → „21,00 €". */
export function formatPrice(cents: number): string {
  return EUR.format(cents / 100);
}

/** Cent → „21 €" wenn glatt, sonst mit Nachkommastellen. */
export function formatPriceShort(cents: number): string {
  return cents % 100 === 0 ? `${cents / 100} €` : EUR.format(cents / 100);
}

/** Relative Zeitangabe für Benachrichtigungen: „vor 2 Std". */
export function formatAgo(hoursAgo: number): string {
  if (hoursAgo < 1) return 'gerade eben';
  if (hoursAgo < 24) return `vor ${Math.round(hoursAgo)} Std`;
  const days = Math.round(hoursAgo / 24);
  return days === 1 ? 'gestern' : `vor ${days} Tagen`;
}
