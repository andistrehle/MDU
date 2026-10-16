// ============================================================
// MDU — eine Datendatei im Repository per Commit ändern
// ============================================================
//
// Für Daten, die im Code stehen und die die Seite selbst fortschreibt
// (zuerst: Spielverlegungen → lib/data/verlegungen-2027.json). Der Push stößt
// den Neubau bei Vercel an; danach sind ALLE statischen Seiten, das
// Kalender-Abo und der Spielbericht einheitlich.
//
// Bewusst getrennt von der MDC (lib/mdc/github.ts, eigener Token): MDU und
// MDC teilen sich nur das Repository, keine Zugänge.
//
// Gelesen wird immer der Stand aus GitHub (nicht der einkompilierte) —
// das laufende Deployment kann älter sein als main.
//
// ENV (nur im MDU-Projekt bei Vercel): MDU_GITHUB_TOKEN (Fine-grained Token,
// Repository andistrehle/MDU, „Contents: Read and write“); optional
// MDU_GITHUB_REPO (Standard andistrehle/MDU) und MDU_GITHUB_BRANCH (main).
// ============================================================

import 'server-only';

const API = 'https://api.github.com';

export const githubBereit = () => !!process.env.MDU_GITHUB_TOKEN;

function kontext() {
  const token = process.env.MDU_GITHUB_TOKEN;
  if (!token) throw new Error('Das automatische Übernehmen ist nicht eingerichtet (MDU_GITHUB_TOKEN fehlt).');
  return { token, repo: process.env.MDU_GITHUB_REPO || 'andistrehle/MDU', branch: process.env.MDU_GITHUB_BRANCH || 'main' };
}

async function gh(pfad: string, init: RequestInit & { token: string }) {
  const { token, ...rest } = init;
  return fetch(API + pfad, {
    ...rest,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(rest.headers ?? {}) },
  });
}

/**
 * JSON-Datei lesen, mit `aendern` umbauen und als EIN Commit zurückschreiben.
 * Kollidiert der Stand (jemand anders hat zwischendurch geschrieben), wird
 * einmal neu gelesen und erneut versucht. Gibt die Commit-SHA zurück.
 */
export async function aendereJsonDatei<T>(pfad: string, aendern: (alt: T) => T, nachricht: string): Promise<string> {
  const { token, repo, branch } = kontext();
  for (let versuch = 0; versuch < 2; versuch++) {
    const r = await gh(`/repos/${repo}/contents/${pfad}?ref=${encodeURIComponent(branch)}`, { token });
    if (!r.ok) throw new Error(`GitHub: Datei nicht lesbar (${r.status}).`);
    const j = await r.json() as { sha: string; content: string };
    const alt = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')) as T;
    const neu = aendern(alt);
    const inhalt = JSON.stringify(neu, null, 2) + '\n';
    const w = await gh(`/repos/${repo}/contents/${pfad}`, {
      token, method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: nachricht, content: Buffer.from(inhalt, 'utf8').toString('base64'), sha: j.sha, branch }),
    });
    if (w.ok) return ((await w.json()) as { commit: { sha: string } }).commit.sha;
    if (w.status === 409 && versuch === 0) continue;
    throw new Error(w.status === 403 || w.status === 401
      ? 'GitHub lehnt ab — der Token (MDU_GITHUB_TOKEN) braucht „Contents: Read and write“ für das Repository.'
      : `GitHub: Schreiben fehlgeschlagen (${w.status}).`);
  }
  throw new Error('GitHub: Der Stand hat sich zweimal geändert — bitte gleich noch einmal versuchen.');
}
