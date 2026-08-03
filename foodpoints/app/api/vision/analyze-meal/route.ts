import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVisionProvider } from '@/lib/vision';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';

/** Base64-Limit ≈ 6 MB Bilddaten (Client komprimiert vorher auf ≤ 1600 px). */
const MAX_BASE64_LENGTH = 8_000_000;

const BodySchema = z.object({
  imageBase64: z.string().min(100).max(MAX_BASE64_LENGTH),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  hint: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`meal:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen — bitte warte einen Moment.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  try {
    const provider = await getVisionProvider();
    const result = await provider.analyzeMealImage(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error('analyze-meal failed:', err);
    return NextResponse.json(
      { error: 'Die Bildanalyse ist fehlgeschlagen. Bitte versuche es erneut oder trage die Mahlzeit manuell ein.' },
      { status: 502 },
    );
  }
}
