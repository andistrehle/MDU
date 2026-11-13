// ============================================================
// Bazis-Bot: Live-Ticker zusätzlich an EINE Person per Signal (Betreiber, 13.11.2026)
// ============================================================
// INOFFIZIELL wie WhatsApp: signal-cli (https://github.com/AsamK/signal-cli) als
// „verknüpftes Gerät“ am Signal-Konto des Betreibers. Der Workflow installiert
// signal-cli nur, wenn er es braucht; ohne Geheimnis SIGNAL_EMPFAENGER oder ohne
// Anmeldung passiert hier NICHTS (WhatsApp läuft unverändert weiter).
//
// Anmeldung: Workflow-Modus „signal-anmelden“ → der Bot schickt den QR-Code als Bild
// in DEINEN WhatsApp-Chat („Du“) — das Protokoll ist öffentlich und erst nach dem
// Lauf lesbar, Signal wartet aber nur ~2 Min. je Code (bis zu 4 Codes). Mit Signal
// scannen (Einstellungen → Verknüpfte Geräte → +). Danach wird geprüft, dass das
// verknüpfte Konto WA_NUMMER ist; sonst wird die Anmeldung verworfen. Der Link
// selbst steht NICHT im Protokoll.
//
// Daten von signal-cli liegen NUR verschlüsselt (AES-256-GCM, WA_SCHLUESSEL) im
// Actions-Cache (signal/signal.enc). Das Protokoll nennt weder Nummer noch Empfänger.
// ============================================================

import { spawn, spawnSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const DATEI = join(HIER, 'signal', 'signal.enc');
const DATEN = join(HIER, '.signal-daten');
const SCHLUESSEL = process.env.WA_SCHLUESSEL || '';
const CLI = process.env.SIGNAL_CLI || 'signal-cli';
const sag = (t) => process.stdout.write(`[bazis-bot] Signal: ${t}\n`);
const nurZiffern = (n) => String(n || '').replace(/\D/g, '');

let konto = null; // +49… nach dem Laden

function verschluesseln(buf) {
  const salz = randomBytes(16), iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', scryptSync(SCHLUESSEL, salz, 32), iv);
  const d = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([salz, iv, c.getAuthTag(), d]);
}
function entschluesseln(roh) {
  const salz = roh.subarray(0, 16), iv = roh.subarray(16, 28), tag = roh.subarray(28, 44), daten = roh.subarray(44);
  const d = createDecipheriv('aes-256-gcm', scryptSync(SCHLUESSEL, salz, 32), iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(daten), d.final()]);
}

const cli = (args, opts = {}) => spawnSync(CLI, ['--config', DATEN, ...args], { encoding: 'utf8', timeout: 120_000, ...opts });

function kontoLesen() {
  const r = cli(['listAccounts']);
  const nr = (r.stdout || '').match(/\+\d{6,}/);
  return nr ? nr[0] : null;
}

/** Entschlüsselt die Anmeldung. true = Signal ist bereit (Empfänger gesetzt, angemeldet, signal-cli da). Mehrfach aufrufbar. */
export function signalLaden() {
  if (konto) return true;
  if (!process.env.SIGNAL_EMPFAENGER || !existsSync(DATEI) || !SCHLUESSEL) return false;
  if (spawnSync(CLI, ['--version'], { encoding: 'utf8' }).status !== 0) { sag('signal-cli fehlt – übersprungen.'); return false; }
  try {
    rmSync(DATEN, { recursive: true, force: true }); mkdirSync(DATEN, { recursive: true });
    const tar = join(HIER, '.signal.tar');
    writeFileSync(tar, entschluesseln(readFileSync(DATEI)));
    spawnSync('tar', ['-xf', tar, '-C', DATEN]); rmSync(tar, { force: true });
    konto = kontoLesen();
    if (!konto) { sag('nicht angemeldet – übersprungen.'); return false; }
    abholen(5); // Signal will, dass verknüpfte Geräte ab und zu abholen — Antworten dabei merken
    sag('bereit ✓');
    return true;
  } catch (e) { sag(`Anmeldung nicht lesbar (${e.message}) – übersprungen.`); return false; }
}

// ── Antworten des Empfängers (Spiegel, Betreiber 13.11.2026) ──
// Jedes Abholen (receive) verbraucht die Nachrichten — deshalb merken wir uns hier JEDE Antwort des
// Empfängers, die eine unserer Nachrichten ZITIERT, in eingang.json (liegt verschlüsselt mit der Anmeldung).
// Alles, was er dir sonst schreibt, wird nicht angefasst (dein Handy bekommt es ohnehin).
const EINGANG = () => join(DATEN, 'eingang.json');
function eingangLesen() { try { return JSON.parse(readFileSync(EINGANG(), 'utf8')); } catch { return []; } }
function abholen(sekunden) {
  if (!konto) return;
  const r = cli(['-o', 'json', '-a', konto, 'receive', '-t', String(sekunden)]);
  const von = nurZiffern(process.env.SIGNAL_EMPFAENGER);
  const neu = [];
  for (const zeile of (r.stdout || '').split('\n')) {
    let e; try { e = JSON.parse(zeile).envelope; } catch { continue; }
    const d = e?.dataMessage;
    if (!d?.quote?.id || nurZiffern(e.sourceNumber || e.source) !== von) continue;
    neu.push({ zitat: Number(d.quote.id), text: d.message || '', name: e.sourceName || '', ts: Number(d.timestamp || e.timestamp) });
  }
  if (neu.length) writeFileSync(EINGANG(), JSON.stringify([...eingangLesen(), ...neu].slice(-100)));
}
/** Zitierende Antworten des Empfängers seit dem letzten Mal (holt vorher kurz ab) — und vergisst sie. */
export function signalAntworten() {
  if (!konto) return [];
  abholen(3);
  const a = eingangLesen();
  if (a.length) writeFileSync(EINGANG(), '[]');
  return a;
}

export function signalSpeichern() {
  if (!existsSync(DATEN) || !SCHLUESSEL) return;
  const tar = join(HIER, '.signal.tar');
  const r = spawnSync('tar', ['-cf', tar, '-C', DATEN, '.']);
  if (r.status === 0) { mkdirSync(dirname(DATEI), { recursive: true }); writeFileSync(DATEI, verschluesseln(readFileSync(tar))); }
  rmSync(tar, { force: true });
  rmSync(DATEN, { recursive: true, force: true });
}

const zeitstempel = (out) => { const m = String(out || '').match(/\b\d{13}\b/); return m ? Number(m[0]) : null; };

/** Text (optional mit Dateien) an den Empfänger bzw. an dich selbst. Liefert den Signal-Zeitstempel
 *  (= Kennung der Nachricht, darauf zitiert der Empfänger) oder null. Wirft nie. */
export async function signalSenden(text, { anMich = false, dateien = [] } = {}) {
  if (!konto) return null;
  const an = anMich ? konto : (process.env.SIGNAL_EMPFAENGER || '').trim();
  if (!an) return null;
  // Empfänger VOR den Optionen: -a (Dateien) nimmt sonst alles Folgende als weitere Datei.
  const args = ['-a', konto, 'send', an, '-m', text];
  if (dateien.length) args.push('-a', ...dateien);
  const r = cli(args);
  if (r.status !== 0) { sag(`Senden fehlgeschlagen (Code ${r.status}).`); return null; }
  return zeitstempel(r.stdout);
}

/** Ankunfts-Umfrage per Signal an den Empfänger (Mehrfachauswahl wie in WhatsApp). Zeitstempel/true = verschickt. */
export async function signalUmfrage(frage, optionen) {
  if (!konto) return false;
  const an = (process.env.SIGNAL_EMPFAENGER || '').trim();
  if (!an) return false;
  const r = cli(['-a', konto, 'sendPollCreate', an, '-q', frage, '-o', ...optionen.slice(0, 10)]);
  if (r.status !== 0) { sag(`Umfrage fehlgeschlagen (Code ${r.status}).`); return false; }
  return zeitstempel(r.stdout) ?? true;
}

/** Ein Verknüpfungsversuch: `zeige(link)` bekommt den sgnl://-Link (Signal wartet ~2 Min.). */
function einmalVerknuepfen(zeige) {
  return new Promise((fertig) => {
    const p = spawn(CLI, ['--config', DATEN, 'link', '-n', 'MDU Live-Bot'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let gezeigt = false;
    const uhr = setTimeout(() => p.kill(), 4 * 60_000);
    const lies = (b) => {
      const link = b.toString().match(/sgnl:\/\/linkdevice\S+/);
      if (link && !gezeigt) { gezeigt = true; Promise.resolve(zeige(link[0])).catch((e) => sag(`Link konnte nicht zugestellt werden (${e.message}).`)); }
    };
    p.stdout.on('data', lies); p.stderr.on('data', lies);
    p.on('exit', (code) => { clearTimeout(uhr); fertig(code === 0); });
  });
}

/** Modus „signal-anmelden“: Link über `zeige` zustellen (QR in deinen WhatsApp-Chat), bis zu 4 Versuche,
 *  danach prüfen, dass es DEIN Konto (WA_NUMMER) ist, und verschlüsselt sichern. */
export async function signalAnmelden(zeige) {
  if (!SCHLUESSEL || SCHLUESSEL.length < 16) throw new Error('WA_SCHLUESSEL fehlt.');
  const ziel = nurZiffern(process.env.WA_NUMMER);
  if (!ziel) throw new Error('WA_NUMMER fehlt – damit wird geprüft, dass DEIN Konto verknüpft wurde.');
  let ok = false;
  for (let versuch = 1; versuch <= 4 && !ok; versuch++) {
    rmSync(DATEN, { recursive: true, force: true }); mkdirSync(DATEN, { recursive: true });
    sag(`Verknüpfen, Versuch ${versuch} von 4 – QR-Code geht in deinen WhatsApp-Chat.`);
    ok = await einmalVerknuepfen((link) => zeige(link, versuch));
  }
  if (!ok) throw new Error('Nicht gescannt (4 Versuche à ca. 2 Minuten).');
  konto = kontoLesen();
  if (!konto || nurZiffern(konto) !== ziel) {
    rmSync(DATEN, { recursive: true, force: true });
    throw new Error('Verknüpft wurde ein ANDERES Konto als WA_NUMMER – verworfen. Bitte in Signal unter „Verknüpfte Geräte“ nachsehen und neu anmelden.');
  }
  cli(['-a', konto, 'receive', '-t', '20']);
  signalSpeichern();
  sag('angemeldet ✓ (Konto stimmt mit WA_NUMMER überein). Ab jetzt geht der Live-Ticker auch an SIGNAL_EMPFAENGER.');
}
