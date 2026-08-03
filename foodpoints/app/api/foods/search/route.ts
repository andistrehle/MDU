import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchSeedFoods } from '@/lib/food/seed-foods';
import { searchProducts } from '@/lib/food/providers/openfoodfacts';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';

const QuerySchema = z.object({
  q: z.string().min(1).max(100),
  external: z.enum(['0', '1']).default('1'),
});

export async function GET(req: Request) {
  if (!rateLimit(`search:${clientKey(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get('q') ?? '',
    external: url.searchParams.get('external') ?? '1',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Suchanfrage.' }, { status: 400 });
  }

  const { q, external } = parsed.data;
  const local = searchSeedFoods(q, 10);

  // Externe Suche ist optional und darf die lokale nie blockieren.
  let externalResults: Awaited<ReturnType<typeof searchProducts>> = [];
  let externalError = false;
  if (external === '1' && (process.env.FOOD_DATA_PROVIDER ?? 'openfoodfacts') === 'openfoodfacts') {
    try {
      externalResults = await searchProducts(q, 10);
    } catch (err) {
      console.error('openfoodfacts search failed:', err);
      externalError = true;
    }
  }

  return NextResponse.json({ local, external: externalResults, externalError });
}
