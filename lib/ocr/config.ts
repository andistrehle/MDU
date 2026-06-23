// ============================================================
// OCR — serverseitige Konfiguration (Feature-Flag, Rollen, Limits)
// ============================================================
//
// Liest ausschließlich server-only ENV (kein NEXT_PUBLIC). Ohne Konfiguration
// ist das Feature aus; die manuelle Erfassung bleibt davon unberührt.
// ============================================================

import 'server-only';
import type { UserRole } from '@/lib/auth/roles';

const DEFAULT_ROLES: UserRole[] = ['team_captain', 'league_admin', 'super_admin'];

export interface OcrConfig {
  enabled: boolean;
  allowedRoles: UserRole[];
  provider: 'claude' | 'stub' | null;
  apiKey: string | null;
  model: string;
  maxFileBytes: number;
}

function parseRoles(raw: string | undefined): UserRole[] {
  if (!raw) return DEFAULT_ROLES;
  const valid: UserRole[] = ['guest', 'player', 'team_captain', 'league_admin', 'super_admin'];
  const picked = raw.split(',').map(s => s.trim()).filter((r): r is UserRole => (valid as string[]).includes(r));
  return picked.length ? picked : DEFAULT_ROLES;
}

/** Aktuelle OCR-Konfiguration aus den Server-Env-Variablen. */
export function getOcrConfig(): OcrConfig {
  const providerRaw = (process.env.OCR_PROVIDER ?? 'claude').trim().toLowerCase();
  const provider = providerRaw === 'claude' ? 'claude' : providerRaw === 'stub' ? 'stub' : null;
  const apiKey = (process.env.OCR_API_KEY || process.env.ANTHROPIC_API_KEY || '').trim() || null;
  const mb = Number(process.env.OCR_MAX_FILE_SIZE_MB);
  return {
    enabled: (process.env.OCR_FEATURE_ENABLED ?? '').trim().toLowerCase() === 'true',
    allowedRoles: parseRoles(process.env.OCR_ALLOWED_ROLES),
    provider,
    apiKey,
    model: (process.env.OCR_MODEL || 'claude-sonnet-4-6').trim(),
    maxFileBytes: Math.round((Number.isFinite(mb) && mb > 0 ? mb : 12) * 1024 * 1024),
  };
}

/** Ist der Provider tatsächlich einsatzbereit (Key vorhanden, wo nötig)? */
export function isProviderConfigured(cfg: OcrConfig = getOcrConfig()): boolean {
  if (cfg.provider === 'stub') return true;       // Testpfad ohne Key
  if (cfg.provider === 'claude') return !!cfg.apiKey;
  return false;
}

/** Feature aktiv UND Provider konfiguriert? */
export function isOcrAvailable(cfg: OcrConfig = getOcrConfig()): boolean {
  return cfg.enabled && isProviderConfigured(cfg);
}

/** Darf diese Rolle OCR-Uploads erstellen/prüfen? */
export function isRoleAllowed(role: UserRole | undefined, cfg: OcrConfig = getOcrConfig()): boolean {
  return !!role && cfg.allowedRoles.includes(role);
}
