// ============================================================
// Datum, Zahlen, Adressen — Helfer der BeDV-Demo
// ============================================================

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/**
 * Datumsangaben der Demo sind reine Kalendertage ohne Uhrzeit
 * (`YYYY-MM-DD`). Sie werden bewusst NICHT über `new Date(...)` und die
 * Zeitzone des Servers geschickt: Vercel rechnet in UTC, ein Besucher in
 * München sähe sonst je nach Stunde einen Tag Unterschied.
 */
export type Tag = string;

/** Heute in München — als `YYYY-MM-DD`. */
export function heute(): Tag {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

/** `YYYY-MM-DD` → Zahlenpaare, ohne Zeitzonen-Umweg. */
function teile(tag: Tag): [number, number, number] {
  const [j, m, t] = tag.split('-').map(Number);
  return [j, m, t];
}

/** Tage seit dem 1.1.1970 — Grundlage für Abstände und Wochentage. */
export function tagesNummer(tag: Tag): number {
  const [j, m, t] = teile(tag);
  return Math.floor(Date.UTC(j, m - 1, t) / 86_400_000);
}

/** Tagesnummer → `YYYY-MM-DD`. */
export function ausTagesNummer(n: number): Tag {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

/** Tage addieren (auch negativ). */
export function plusTage(tag: Tag, tage: number): Tag {
  return ausTagesNummer(tagesNummer(tag) + tage);
}

/** Abstand in Tagen: positiv, wenn `b` nach `a` liegt. */
export function tageZwischen(a: Tag, b: Tag): number {
  return tagesNummer(b) - tagesNummer(a);
}

/** 0 = Sonntag … 6 = Samstag. */
export function wochentagNummer(tag: Tag): number {
  return (((tagesNummer(tag) + 4) % 7) + 7) % 7;
}

/** „Freitag" */
export function wochentag(tag: Tag): string {
  return WOCHENTAGE[wochentagNummer(tag)];
}

/** „Fr" */
export function wochentagKurz(tag: Tag): string {
  return WOCHENTAGE_KURZ[wochentagNummer(tag)];
}

/** „14.11.2026" */
export function datum(tag: Tag): string {
  const [j, m, t] = teile(tag);
  return `${String(t).padStart(2, '0')}.${String(m).padStart(2, '0')}.${j}`;
}

/** „14.11." — für enge Karten */
export function datumKurz(tag: Tag): string {
  const [, m, t] = teile(tag);
  return `${String(t).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
}

/** „14. November 2026" */
export function datumLang(tag: Tag): string {
  const [j, m, t] = teile(tag);
  return `${t}. ${MONATE[m - 1]} ${j}`;
}

/** „Fr · 14.11." */
export function tagUndDatum(tag: Tag): string {
  return `${wochentagKurz(tag)} · ${datumKurz(tag)}`;
}

/**
 * „heute", „morgen", „in 3 Tagen", „vor 5 Tagen" — sonst das Datum.
 * Nur für Angaben nahe am heutigen Tag; alles Weitere liest sich als Datum
 * besser.
 */
export function relativerTag(tag: Tag, bezug: Tag): string {
  const d = tageZwischen(bezug, tag);
  if (d === 0) return 'heute';
  if (d === 1) return 'morgen';
  if (d === -1) return 'gestern';
  if (d > 1 && d <= 14) return `in ${d} Tagen`;
  if (d < -1 && d >= -14) return `vor ${-d} Tagen`;
  return datum(tag);
}

/** Adresse als Text für Kartendienste. */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** „12 : 6" mit geschütztem Abstand, damit der Stand nie umbricht. */
export function stand(a: number, b: number): string {
  return `${a} : ${b}`;
}
