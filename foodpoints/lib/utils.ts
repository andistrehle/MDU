import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Zahl kompakt formatieren (de-DE, max. 1 Nachkommastelle). */
export function fmt(value: number, digits = 1): string {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: digits,
  }).format(value);
}

/** Gramm/Milliliter-Angabe formatieren. */
export function fmtAmount(grams: number, isLiquid: boolean): string {
  return `${fmt(grams, 0)} ${isLiquid ? 'ml' : 'g'}`;
}

/** Datum menschenlesbar (z. B. „Montag, 3. August“). */
export function fmtDate(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(d);
}

export function fmtDateShort(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(d);
}
