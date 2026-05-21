import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shade(hex: string, lum: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * (1 + lum))));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * (1 + lum))));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * (1 + lum))));
  return `rgb(${r}, ${g}, ${b})`;
}

export function statusColor(status: string | null): string {
  if (status === 'promo')   return '#22C55E';
  if (status === 'playoff') return '#3B82F6';
  if (status === 'releg')   return '#D40000';
  return 'transparent';
}

export function diffColor(diff: string): string {
  if (diff.startsWith('+')) return '#5BE08C';
  if (diff.startsWith('-')) return '#FF6B6B';
  return '#9AA4B2';
}
