// ============================================================
// System-Prompt-Loader (nur serverseitig)
// ============================================================
// Liest den System-Prompt zur Laufzeit aus system-prompt-ask-andreas-ai.md.
// Die Datei ist die einzige Quelle — sie wird "nur eingebunden", nicht dupliziert.
// (next.config.ts sorgt via outputFileTracingIncludes dafür, dass die Datei im
// Vercel-Serverless-Bundle landet.)

import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

/** HTML-Kommentare (<!-- … -->) entfernen — sie sind nur Redaktionshinweise. */
function stripComments(md: string): string {
  return md.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function getSystemPrompt(): string {
  if (cached) return cached;
  const raw = readFileSync(
    join(process.cwd(), "system-prompt-ask-andreas-ai.md"),
    "utf8",
  );
  cached = stripComments(raw);
  return cached;
}
