// ============================================================
// Einfaches In-Memory-Rate-Limit pro IP (Abuse-Schutz)
// ============================================================
// Bewusst pragmatisch: ein Modul-lokaler Sliding-Window-Zähler. Auf Vercel-
// Serverless lebt der Zustand nur pro Instanz — als Schutz gegen simplen
// Missbrauch reicht das (kein Redis nötig, wie im Konzept vorgesehen). Das
// eigentliche UX-Limit (20 Nachrichten/Session) erzwingt zusätzlich der Client.

import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from "./config";

const hits = new Map<string, number[]>();

/**
 * Prüft und verbucht einen Request. Gibt true zurück, wenn erlaubt.
 * Räumt dabei alte Einträge des Fensters weg.
 */
export function checkRateLimit(ip: string, now: number): boolean {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (hits.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    hits.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  hits.set(ip, timestamps);

  // Gelegentliches Aufräumen, damit die Map nicht unbegrenzt wächst.
  if (hits.size > 5000) {
    for (const [key, ts] of hits) {
      const alive = ts.filter((t) => t > windowStart);
      if (alive.length === 0) hits.delete(key);
      else hits.set(key, alive);
    }
  }

  return true;
}

/** Client-IP aus den (von Vercel gesetzten) Forwarding-Headern lesen. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
