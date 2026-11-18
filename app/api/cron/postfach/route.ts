// ============================================================
// /api/cron/postfach — stündlich von der Datenbank angestoßen (Migration 0070,
// pg_cron + pg_net; Vercel-Crons laufen nur täglich). Holt neue Mails an
// kontakt@mdudarts.de bei Strato ab. Zugang nur mit dem gemeinsamen Geheimnis
// aus private.push_config (PUSH_WEBHOOK_SECRET) — dasselbe wie /api/push/senden.
// ============================================================

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { abholen } from '@/lib/server/postfach';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const sauber = (s: string | null | undefined) => (s ?? '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();

function geheimStimmt(roh: string | null): boolean {
  const soll = sauber(process.env.PUSH_WEBHOOK_SECRET), wert = sauber(roh);
  if (!soll || !wert) return false;
  const a = Buffer.from(wert), b = Buffer.from(soll);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!geheimStimmt(request.headers.get('x-push-secret'))) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 401 });
  const r = await abholen();
  // Nur Zahlen und Zustand zurück — nie Inhalte.
  return NextResponse.json({ status: r.status, neu: r.neu }, { status: r.status === 'fehler' ? 500 : 200 });
}
