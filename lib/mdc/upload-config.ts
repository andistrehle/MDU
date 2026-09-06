// ============================================================
// MDC — Konfiguration für den Ergebnis-Upload
// ============================================================
//
// Die MDC-Seite kommt sonst ohne Geheimnisse aus: keine Datenbank, kein Konto,
// keine Schlüssel. Für den Ergebnis-Upload braucht sie drei — und zwar nur
// serverseitig, kein `NEXT_PUBLIC_`:
//
//   MDC_ADMIN_PASSWORD   Zugang zu `/admin` (Passwortabfrage des Browsers,
//                        siehe `proxy.ts`). Ohne dieses Passwort ist der
//                        Verwaltungsbereich für alle gesperrt.
//   MDC_OCR_API_KEY      Anthropic-Schlüssel, um den Zettel zu lesen.
//                        (`ANTHROPIC_API_KEY` wird ersatzweise akzeptiert.)
//   MDC_GITHUB_TOKEN     Token mit Schreibrecht auf das Repository, um das
//                        freigegebene Ergebnis abzulegen.
//
// Warum GitHub und keine Datenbank: Die Ergebnisse sind Teil der Seite, nicht
// Verkehrsdaten. Sie liegen im Repository wie alles andere — nachvollziehbar,
// versioniert, jederzeit von Hand korrigierbar. Ein Commit stößt den Neubau an,
// zwei Minuten später steht das Turnier online. Eine Datenbank bräuchte einen
// Betreiber, eine Sicherung und einen Vertrag zur Auftragsverarbeitung; hier
// reicht das, was ohnehin da ist.
//
// Fehlt etwas, wird nichts vorgetäuscht: Die Seite sagt, welcher Teil nicht
// eingerichtet ist, und lässt den Upload gar nicht erst zu.
// ============================================================

import 'server-only';

export interface UploadConfig {
  apiKey: string | null;
  model: string;
  githubToken: string | null;
  githubRepo: string;
  githubBranch: string;
  /** Größtes akzeptiertes Bild nach der Verkleinerung im Browser. */
  maxBytes: number;
}

function env(name: string): string | null {
  return (process.env[name] ?? '').trim() || null;
}

export function getUploadConfig(): UploadConfig {
  return {
    apiKey: env('MDC_OCR_API_KEY') ?? env('ANTHROPIC_API_KEY'),
    model: env('MDC_OCR_MODEL') ?? 'claude-sonnet-5',
    githubToken: env('MDC_GITHUB_TOKEN'),
    githubRepo: env('MDC_GITHUB_REPO') ?? 'andistrehle/MDU',
    githubBranch: env('MDC_GITHUB_BRANCH') ?? 'main',
    maxBytes: 6 * 1024 * 1024,
  };
}

export interface UploadStatus {
  /** Kann ein Foto gelesen werden? */
  canRead: boolean;
  /** Kann ein freigegebenes Ergebnis abgelegt werden? */
  canPublish: boolean;
  /** Was fehlt — im Klartext, für die Seite selbst. */
  missing: string[];
}

/**
 * Was ist eingerichtet? Wird auf der Upload-Seite angezeigt, damit man nicht
 * erst nach dem Hochladen erfährt, dass der halbe Weg fehlt.
 */
export function getUploadStatus(cfg: UploadConfig = getUploadConfig()): UploadStatus {
  const missing: string[] = [];
  if (!cfg.apiKey) missing.push('MDC_OCR_API_KEY (Erkennung des Zettels)');
  if (!cfg.githubToken) missing.push('MDC_GITHUB_TOKEN (Ablegen des Ergebnisses)');
  return { canRead: !!cfg.apiKey, canPublish: !!cfg.githubToken, missing };
}
