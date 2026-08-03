import 'server-only';

/**
 * Einfaches In-Memory-Rate-Limiting (best effort, pro Serverless-Instanz).
 * Für produktiven Betrieb mit mehreren Instanzen: zentraler Store
 * (z. B. Upstash) — siehe BACKLOG P1.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const nowMs = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || nowMs > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: nowMs + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() ?? 'unknown';
}
