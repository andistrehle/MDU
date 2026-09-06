// ============================================================
// MDC — freigegebenes Ergebnis ins Repository schreiben
// ============================================================
//
// Ein freigegebenes Turnier wird nicht in eine Datenbank geschrieben, sondern
// als Zeile in `data/results-uploaded.ts` — und, falls jemand Neues dabei war,
// zusätzlich in `data/players-uploaded.ts`. Beides in EINEM Commit über die
// Git-Data-API von GitHub. Der Push stößt den Neubau bei Vercel an; zwei
// Minuten später steht das Turnier online.
//
// Warum ein einziger Commit und nicht zwei Aufrufe der bequemeren Contents-API:
// Zwei Commits wären zwei Neubauten — und dazwischen läge ein Stand, in dem das
// Ergebnis auf einen Spieler zeigt, den es noch nicht gibt.
//
// Gelesen wird immer der Stand aus GitHub, nie der einkompilierte: Das
// laufende Deployment kann älter sein als `main`, und aus einem alten Stand
// heraus geschrieben würde jede Zeile verlieren, die seither dazukam.
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

interface GhKontext {
  repo: string;
  branch: string;
  token: string;
}

function kontext(): GhKontext {
  const cfg = getUploadConfig();
  if (!cfg.githubToken) {
    throw new CommitFehler('Das Ablegen ist nicht eingerichtet (MDC_GITHUB_TOKEN fehlt).');
  }
  return { repo: cfg.githubRepo, branch: cfg.githubBranch, token: cfg.githubToken };
}

async function gh<T>(ctx: GhKontext, pfad: string, init?: RequestInit): Promise<T> {
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
      `GitHub hat abgelehnt (${res.status} bei ${pfad}). ${text.slice(0, 300)}`,
    );
  }
  return res.json() as Promise<T>;
}

/** Aktueller Inhalt einer Datei im Branch — als Text. */
async function leseDatei(ctx: GhKontext, pfad: string): Promise<string> {
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
async function committe(
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

/**
 * Ersetzt den Inhalt eines `string[]`-Literals in einer TypeScript-Datei.
 *
 * Bewusst schlicht: Die beiden Zieldateien enthalten je genau ein solches
 * Literal mit nichts als einfachen Zeichenketten darin. Ein Parser wäre hier
 * mehr Angriffsfläche als Nutzen. Passt die Form nicht, wird abgebrochen statt
 * geraten — lieber gar nicht schreiben als eine Datei zerlegen.
 */
function ersetzeListe(quelle: string, konstante: string, eintraege: string[]): string {
  const anfang = new RegExp(`(export const ${konstante}[^=]*=\\s*\\[)`);
  const treffer = quelle.match(anfang);
  if (!treffer || treffer.index === undefined) {
    throw new CommitFehler(`In der Datei fehlt die Liste ${konstante}.`);
  }
  const von = treffer.index + treffer[0].length;
  const bis = quelle.indexOf('];', von);
  if (bis === -1) throw new CommitFehler(`Die Liste ${konstante} ist nicht abgeschlossen.`);

  const rumpf = eintraege.length
    ? `\n${eintraege.map(e => `  '${e.replace(/'/g, "\\'")}',`).join('\n')}\n`
    : '';
  return quelle.slice(0, von) + rumpf + quelle.slice(bis);
}

/** Die Zeichenketten aus einem `string[]`-Literal. */
function leseListe(quelle: string, konstante: string): string[] {
  const treffer = quelle.match(new RegExp(`export const ${konstante}[^=]*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!treffer) throw new CommitFehler(`In der Datei fehlt die Liste ${konstante}.`);
  return [...treffer[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
}

export interface NeuerSpieler {
  passNr: number;
  /** Nachname in Großbuchstaben, wie in der Auswertung. */
  lastName: string;
  /** Vorname, ggf. mit Spitzname in Klammern: „CHRISS (BONSAI)". */
  firstName: string;
  division: 'men' | 'women';
}

export interface Veroeffentlichung {
  /** Fertige Ergebniszeile: `Datum|Spielort|Passnr:Punkte,…` */
  zeile: string;
  /** Spieler, die es im Stamm noch nicht gibt. */
  neueSpieler: NeuerSpieler[];
  /** Für die Commit-Nachricht. */
  beschreibung: string;
}

const RESULTS_PFAD = 'data/results-uploaded.ts';
const PLAYERS_PFAD = 'data/players-uploaded.ts';

/**
 * Legt ein freigegebenes Turnier ab. Gibt die Adresse des Commits zurück —
 * damit ist nachprüfbar, was genau geschrieben wurde.
 */
export async function veroeffentlicheTurnier(
  eingabe: Veroeffentlichung,
): Promise<{ sha: string; url: string; schonVorhanden: boolean }> {
  const ctx = kontext();
  const [datum, spielort] = eingabe.zeile.split('|');
  const kennung = `${datum}-${spielort}`;

  const resultsQuelle = await leseDatei(ctx, RESULTS_PFAD);
  const vorhanden = leseListe(resultsQuelle, 'RESULTS_UPLOADED_RAW');

  // Dasselbe Turnier zweimal wäre die Punkte doppelt: Die alte Zeile wird
  // ersetzt, nicht ergänzt. Das ist zugleich der Weg, ein Ergebnis zu
  // berichtigen — einfach noch einmal freigeben.
  const ohneAlte = vorhanden.filter(z => !z.startsWith(`${kennung}|`) && !z.startsWith(`${datum}|${spielort}|`));
  const schonVorhanden = ohneAlte.length !== vorhanden.length;
  const neueListe = [...ohneAlte, eingabe.zeile].sort();

  const dateien = [{
    pfad: RESULTS_PFAD,
    inhalt: ersetzeListe(resultsQuelle, 'RESULTS_UPLOADED_RAW', neueListe),
  }];

  if (eingabe.neueSpieler.length) {
    const playersQuelle = await leseDatei(ctx, PLAYERS_PFAD);
    let inhalt = playersQuelle;
    for (const division of ['men', 'women'] as const) {
      const dazu = eingabe.neueSpieler.filter(s => s.division === division);
      if (!dazu.length) continue;
      const konstante = division === 'men'
        ? 'PLAYERS_UPLOADED_MEN_RAW'
        : 'PLAYERS_UPLOADED_WOMEN_RAW';
      const bisher = leseListe(inhalt, konstante);
      const bekannt = new Set(bisher.map(z => z.split('|')[1]));
      const zeilen = dazu
        .filter(s => !bekannt.has(String(s.passNr)))
        .map(s => `0|${s.passNr}|${s.lastName}|${s.firstName}|0|0||`);
      if (!zeilen.length) continue;
      inhalt = ersetzeListe(inhalt, konstante, [...bisher, ...zeilen]);
    }
    if (inhalt !== playersQuelle) dateien.push({ pfad: PLAYERS_PFAD, inhalt });
  }

  const nachricht = [
    `MDC: Ergebnis ${eingabe.beschreibung}`,
    '',
    schonVorhanden
      ? 'Ersetzt die zuvor hochgeladene Fassung desselben Turniers.'
      : 'Vom Ergebniszettel hochgeladen und vor der Freigabe geprüft.',
    eingabe.neueSpieler.length
      ? `Neu im Stamm: ${eingabe.neueSpieler.map(s => `${s.firstName} ${s.lastName} (${s.passNr})`).join(', ')}.`
      : '',
  ].filter(Boolean).join('\n');

  const commit = await committe(ctx, dateien, nachricht);
  return { ...commit, schonVorhanden };
}
