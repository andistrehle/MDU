// ============================================================
// MDC — GitHub als Ablage
// ============================================================
//
// Die MDC hat keine Datenbank. Was die Seite selbst schreibt — freigegebene
// Turnierergebnisse und News-Beiträge — landet als Commit im Repository, wo
// auch der Code liegt: nachvollziehbar, versioniert, jederzeit von Hand
// korrigierbar. Der Push stößt den Neubau bei Vercel an; zwei Minuten später
// steht es online.
//
// Hier steckt alles, was beide Wege gemeinsam haben: der Token, das Lesen
// einer Datei, das Schreiben mehrerer Dateien in EINEM Commit und die
// Übersetzung der GitHub-Absagen in einen Rat, was zu tun ist.
//
// Warum ein einziger Commit und nicht mehrere Aufrufe der bequemeren
// Contents-API: Mehrere Commits wären mehrere Neubauten — und dazwischen läge
// ein Stand, in dem etwas auf etwas anderes zeigt, das es noch nicht gibt.
//
// Gelesen wird immer der Stand aus GitHub, nie der einkompilierte: Das
// laufende Deployment kann älter sein als `main`, und aus einem alten Stand
// heraus geschrieben würde jede Zwischenänderung verloren gehen.
// ============================================================

import 'server-only';
import { getUploadConfig } from './upload-config';

const API = 'https://api.github.com';

export class CommitFehler extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommitFehler';
  }
}

export interface GhKontext {
  repo: string;
  branch: string;
  token: string;
}

export function kontext(): GhKontext {
  const cfg = getUploadConfig();
  if (!cfg.githubToken) {
    throw new CommitFehler('Das Ablegen ist nicht eingerichtet (MDC_GITHUB_TOKEN fehlt).');
  }
  return { repo: cfg.githubRepo, branch: cfg.githubBranch, token: cfg.githubToken };
}

/**
 * Was bei einer Absage von GitHub konkret zu tun ist.
 *
 * Die Meldung von GitHub allein („Resource not accessible by personal access
 * token") sagt nicht, welche Einstellung gemeint ist. Weil es fast immer
 * dieselben drei Ursachen sind, steht der Rat gleich dabei — sonst sitzt man
 * abends im Lokal vor einer Fehlermeldung, die man nicht einordnen kann.
 */
function rat(status: number, methode?: string): string {
  const schreibend = !!methode && methode !== 'GET';
  if (status === 403 && schreibend) {
    return '\n\nLesen hat funktioniert, Schreiben nicht — dem Token fehlt das Schreibrecht. '
      + 'In GitHub unter Settings → Developer settings → Personal access tokens → '
      + 'Fine-grained tokens den Token öffnen und bei Repository permissions „Contents" '
      + 'auf „Read and write" stellen. Der Token-Wert bleibt derselbe; in Vercel muss '
      + 'nichts geändert werden.';
  }
  if (status === 401) {
    return '\n\nDer Token wird nicht anerkannt — er ist abgelaufen, widerrufen oder falsch '
      + 'eingetragen. In GitHub einen neuen erzeugen und in Vercel als MDC_GITHUB_TOKEN '
      + 'hinterlegen (danach Redeploy).';
  }
  if (status === 404) {
    return '\n\nDas Repository ist für diesen Token nicht sichtbar. Beim Token unter '
      + '„Repository access" muss „Only select repositories" mit diesem Repository stehen — '
      + 'nicht „Public Repositories".';
  }
  if (status === 409 || status === 422) {
    return '\n\nInzwischen hat jemand anderes auf denselben Branch geschrieben. '
      + 'Einfach noch einmal freigeben.';
  }
  return '';
}

export async function gh<T>(ctx: GhKontext, pfad: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${pfad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new CommitFehler(
      `GitHub hat abgelehnt (${res.status} bei ${pfad}). ${text.slice(0, 300)}`
      + rat(res.status, init?.method),
    );
  }
  return res.json() as Promise<T>;
}

/** Aktueller Inhalt einer Datei im Branch — als Text. */
export async function leseDatei(ctx: GhKontext, pfad: string): Promise<string> {
  const antwort = await gh<{ content: string; encoding: string }>(
    ctx, `/repos/${ctx.repo}/contents/${pfad}?ref=${encodeURIComponent(ctx.branch)}`,
  );
  if (antwort.encoding !== 'base64') {
    throw new CommitFehler(`Unerwartete Kodierung bei ${pfad}: ${antwort.encoding}`);
  }
  return Buffer.from(antwort.content, 'base64').toString('utf8');
}

/**
 * Schreibt mehrere Dateien in einem Commit.
 *
 * Läuft bewusst über Blob → Tree → Commit → Ref: Nur so bekommen beide Dateien
 * denselben Commit, und nur so scheitert der letzte Schritt sichtbar, wenn
 * inzwischen jemand anderes gepusht hat (statt fremde Änderungen zu
 * überschreiben).
 */
export async function committe(
  ctx: GhKontext,
  dateien: { pfad: string; inhalt: string }[],
  nachricht: string,
): Promise<{ sha: string; url: string }> {
  const ref = await gh<{ object: { sha: string } }>(
    ctx, `/repos/${ctx.repo}/git/ref/heads/${encodeURIComponent(ctx.branch)}`,
  );
  const head = ref.object.sha;
  const headCommit = await gh<{ tree: { sha: string } }>(
    ctx, `/repos/${ctx.repo}/git/commits/${head}`,
  );

  const blobs = await Promise.all(dateien.map(async datei => {
    const blob = await gh<{ sha: string }>(ctx, `/repos/${ctx.repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: Buffer.from(datei.inhalt, 'utf8').toString('base64'),
        encoding: 'base64',
      }),
    });
    return { path: datei.pfad, mode: '100644' as const, type: 'blob' as const, sha: blob.sha };
  }));

  const tree = await gh<{ sha: string }>(ctx, `/repos/${ctx.repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: blobs }),
  });

  const commit = await gh<{ sha: string; html_url: string }>(
    ctx, `/repos/${ctx.repo}/git/commits`,
    { method: 'POST', body: JSON.stringify({ message: nachricht, tree: tree.sha, parents: [head] }) },
  );

  await gh(ctx, `/repos/${ctx.repo}/git/refs/heads/${encodeURIComponent(ctx.branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return { sha: commit.sha, url: commit.html_url };
}

