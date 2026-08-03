import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lookupBarcode } from '@/lib/food/providers/openfoodfacts';
import { SEED_FOODS } from '@/lib/food/seed-foods';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';

/** EAN-8, EAN-13, UPC-A (12), UPC-E (6–8) — nur Ziffern. */
const CodeSchema = z.string().regex(/^\d{6,14}$/);

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!rateLimit(`barcode:${clientKey(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 });
  }

  const { code } = await ctx.params;
  const parsed = CodeSchema.safeParse(code);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger Barcode.' }, { status: 400 });
  }

  const seedMatch = SEED_FOODS.find((f) => f.barcode === parsed.data);
  if (seedMatch) return NextResponse.json({ food: seedMatch });

  if ((process.env.FOOD_DATA_PROVIDER ?? 'openfoodfacts') === 'mock') {
    return NextResponse.json({ food: null });
  }

  try {
    const food = await lookupBarcode(parsed.data);
    return NextResponse.json({ food });
  } catch (err) {
    console.error('barcode lookup failed:', err);
    return NextResponse.json(
      { error: 'Produktdatenbank nicht erreichbar — du kannst das Produkt manuell anlegen.' },
      { status: 502 },
    );
  }
}
