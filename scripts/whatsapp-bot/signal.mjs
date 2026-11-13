// ============================================================
// Bazis-Bot: Live-Ticker zusätzlich an EINE Person per Signal (Betreiber, 13.11.2026)
// ============================================================
// INOFFIZIELL wie WhatsApp: signal-cli (https://github.com/AsamK/signal-cli) als
// „verknüpftes Gerät“ am Signal-Konto des Betreibers. Der Workflow installiert
// signal-cli nur, wenn er es braucht; ohne Geheimnis SIGNAL_EMPFAENGER oder ohne
// Anmeldung passiert hier NICHTS (WhatsApp läuft unverändert weiter).
//
// Anmeldung: Workflow-Modus „signal-anmelden“ → Link im Protokoll → als QR-Code
// mit Signal scannen (Einstellungen → Verknüpfte Geräte). Weil das Protokoll
// öffentlich ist, prüfen wir danach, dass das verknüpfte Konto WA_NUMMER ist
// (sonst könnte ein Fremder den Link schneller scannen) — passt es nicht, wird
// die Anmeldung verworfen.
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
const sag = (t) => console.log(`[bazis-bot] Signal: ${t}`);
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

/** Entschlüsselt die Anmeldung. true = Signal ist bereit (Empfänger gesetzt, angemeldet, signal-cli da). */
export function signalLaden() {
  konto = null;
  if (!process.env.SIGNAL_EMPFAENGER || !existsSync(DATEI) || !SCHLUESSEL) return false;
  if (spawnSync(CLI, ['--version'], { encoding: 'utf8' }).status !== 0) { sag('signal-cli fehlt – übersprungen.'); return false; }
  try {
    rmSync(DATEN, { recursive: true, force: true }); mkdirSync(DATEN, { recursive: true });
    const tar = join(HIER, '.signal.tar');
    writeFileSync(tar, entschluesseln(readFileSync(DATEI)));
    spawnSync('tar', ['-xf', tar, '-C', DATEN]); rmSync(tar, { force: true });
    konto = kontoLesen();
    if (!konto) { sag('nicht angemeldet – übersprungen.'); return false; }
    cli(['-a', konto, 'receive', '-t', '5']); // Signal will, dass verknüpfte Geräte ab und zu abholen
    sag('bereit ✓');
    return true;
  } catch (e) { sag(`Anmeldung nicht lesbar (${e.message}) – übersprungen.`); return false; }
}

export function signalSpeichern() {
  if (!existsSync(DATEN) || !SCHLUESSEL) return;
  const tar = join(HIER, '.signal.tar');
  const r = spawnSync('tar', ['-cf', tar, '-C', DATEN, '.']);
  if (r.status === 0) { mkdirSync(dirname(DATEI), { recursive: true }); writeFileSync(DATEI, verschluesseln(readFileSync(tar))); }
  rmSync(tar, { force: true });
  rmSync(DATEN, { recursive: true, force: true });
}

/** Text an den Empfänger (live) bzw. an dich selbst (test). Fehler werden nur gemeldet, nie geworfen. */
export async function signalSenden(text, { anMich = false } = {}) {
  if (!konto) return;
  const an = anMich ? konto : (process.env.SIGNAL_EMPFAENGER || '').trim();
  if (!an) return;
  const r = cli(['-a', konto, 'send', '-m', text, an]);
  if (r.status !== 0) sag(`Senden fehlgeschlagen (Code ${r.status}).`);
}

/** Modus „signal-anmelden“: Link ausgeben, auf das Scannen warten, Konto prüfen, verschlüsselt sichern. */
export async function signalAnmelden() {
  if (!SCHLUESSEL || SCHLUESSEL.length < 16) throw new Error('WA_SCHLUESSEL fehlt.');
  rmSync(DATEN, { recursive: true, force: true }); mkdirSync(DATEN, { recursive: true });
  const ziel = nurZiffern(process.env.WA_NUMMER);
  if (!ziel) throw new Error('WA_NUMMER fehlt – damit wird geprüft, dass DEIN Konto verknüpft wurde.');
  await new Promise((fertig, fehler) => {
    const p = spawn(CLI, ['--config', DATEN, 'link', '-n', 'MDU Live-Bot'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const uhr = setTimeout(() => { p.kill(); fehler(new Error('Nicht innerhalb von 8 Minuten gescannt.')); }, 8 * 60_000);
    const lies = (b) => {
      const t = b.toString();
      const link = t.match(/sgnl:\/\/linkdevice\S+/);
      if (link) {
        sag('──────────────────────────────────────────');
        sag('LINK (als QR-Code mit Signal scannen: Einstellungen → Verknüpfte Geräte → +):');
        console.log(link[0]);
        sag('──────────────────────────────────────────');
      }
    };
    p.stdout.on('data', lies); p.stderr.on('data', lies);
    p.on('exit', (code) => { clearTimeout(uhr); code === 0 ? fertig() : fehler(new Error(`Verknüpfen abgebrochen (Code ${code}).`)); });
  });
  konto = kontoLesen();
  if (!konto || nurZiffern(konto) !== ziel) {
    rmSync(DATEN, { recursive: true, force: true });
    throw new Error('Verknüpft wurde ein ANDERES Konto als WA_NUMMER – verworfen. Bitte in Signal unter „Verknüpfte Geräte“ nachsehen und neu anmelden.');
  }
  cli(['-a', konto, 'receive', '-t', '20']);
  signalSpeichern();
  sag('angemeldet ✓ (Konto stimmt mit WA_NUMMER überein). Ab jetzt geht der Live-Ticker auch an SIGNAL_EMPFAENGER.');
}
