// ============================================================
// Leichtgewichtiges In-Memory-Rate-Limit für Route Handler
// ============================================================
//
// Best-effort-Schutz gegen Missbrauch öffentlicher/mailauslösender Routen
// (Enumeration, Mail-Flut). Bewusst simpel: gleitendes Zeitfenster je Schlüssel,
// im Prozessspeicher. Auf serverless (Vercel) gilt das PRO Function-Instanz —
// es ist kein verteiltes Limit, aber bremst Schleifen-Missbrauch spürbar.
// Für harte Garantien später auf ein geteiltes Backend (z. B. Upstash) heben.
// ============================================================

import 'server-only';

const hits = new Map<string, number[]>();

/**
 * Prüft und verbucht einen Zugriff. Gibt `true` zurück, wenn erlaubt (unter dem
 * Limit), `false`, wenn das Limit im Fenster überschritten ist.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  // Gelegentliche Aufräumaktion, damit die Map nicht unbegrenzt wächst.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      const fresh = v.filter(t => now - t < windowMs);
      if (fresh.length === 0) hits.delete(k); else hits.set(k, fresh);
    }
  }
  return true;
}

/** Beste verfügbare Client-IP aus den Proxy-Headern (Vercel setzt x-forwarded-for). */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for') ?? '';
  const first = xff.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}
