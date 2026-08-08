// ============================================================
// MDC — Formatierung (deutsch, ohne Intl-Abhängigkeit)
// ============================================================
//
// Bewusst von Hand statt über `Intl`: Die Ausgabe ist damit auf Server und
// Client garantiert identisch (keine Hydration-Unterschiede durch abweichende
// ICU-Daten) und unabhängig von der Systemsprache.
// ============================================================

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function parts(isoDate: string): { d: number; m: number; y: number; weekday: number } {
  const [y, m, d] = isoDate.split('-').map(Number);
  // UTC, damit die Zeitzone des Servers das Datum nicht verschiebt.
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { d, m, y, weekday };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** „03.08.2026" */
export function formatDate(isoDate: string): string {
  const { d, m, y } = parts(isoDate);
  return `${pad(d)}.${pad(m)}.${y}`;
}

/** „Mo, 03.08." */
export function formatDateShort(isoDate: string): string {
  const { d, m, weekday } = parts(isoDate);
  return `${WEEKDAYS_SHORT[weekday]}, ${pad(d)}.${pad(m)}.`;
}

/** „Montag, 3. August 2026" */
export function formatDateLong(isoDate: string): string {
  const { d, m, y, weekday } = parts(isoDate);
  return `${WEEKDAYS[weekday]}, ${d}. ${MONTHS[m - 1]} ${y}`;
}

/** Wochentagsname zu einem ISO-Datum. */
export function weekdayName(isoDate: string): string {
  return WEEKDAYS[parts(isoDate).weekday];
}

/** Tausenderpunkte: 1085 → „1.085" */
export function formatNumber(value: number): string {
  const [whole, fraction] = String(value).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return fraction ? `${grouped},${fraction}` : grouped;
}

/** Zwei Nachkommastellen mit Komma: 217 → „217,00" */
export function formatAverage(value: number): string {
  const [whole, fraction = ''] = value.toFixed(2).split('.');
  return `${formatNumber(Number(whole))},${fraction}`;
}

/** „1." – für Platzierungen. */
export function formatRank(rank: number): string {
  return `${rank}.`;
}

/** „20:00 Uhr" */
export function formatTime(time: string): string {
  return `${time} Uhr`;
}
