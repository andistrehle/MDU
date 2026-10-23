// ============================================================
// Bazis-Bot: Ankunfts-Umfrage in die WhatsApp-Gruppe (Betreiber, 23.10.2026)
// ============================================================
// INOFFIZIELL: meldet sich wie WhatsApp Web als „verknüpftes Gerät“ an
// (Bibliothek baileys). WhatsApp erlaubt das nicht — die Nummer kann gesperrt
// werden. Vom Betreiber bewusst so gewählt.
//
// Läuft in GitHub Actions (.github/workflows/bazis-umfrage.yml), nie auf Vercel.
// Das Repo ist ÖFFENTLICH, Protokolle auch: Deshalb wird hier nichts über die
// Gruppe, ihre Mitglieder oder die Nummer ausgegeben, und die Anmeldung liegt
// nur VERSCHLÜSSELT (AES-256-GCM, Schlüssel WA_SCHLUESSEL) im Cache der Actions.
//
//   node bot.mjs anmelden   → Kopplungscode ausgeben, Gerät verknüpfen, Gruppe prüfen
//   node bot.mjs anmelden-qr → stattdessen QR-Code ins Protokoll (zweites Gerät zum Anzeigen nötig)
//   node bot.mjs umfrage    → heute Spieltag + ab 11 Uhr + noch nicht gepostet → posten
//   node bot.mjs test       → Umfrage fürs nächste Spiel an dich selbst („Du“-Chat)
// Umfrage-Inhalt: umfrage.json (erzeugt von umfrage.ts, im Workflow davor).
// ENV: WA_SCHLUESSEL, WA_GRUPPE (genauer Gruppenname), WA_NUMMER (nur fürs Anmelden)
// ============================================================

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState as authAusOrdner, delay } from 'baileys';
import pino from 'pino';
import QRCode from 'qrcode';

const HIER = dirname(fileURLToPath(import.meta.url));
const SITZUNG = join(HIER, 'sitzung', 'sitzung.enc');
const AUTH = join(HIER, '.auth');
const modus = process.argv[2] || 'umfrage';
const SCHLUESSEL = process.env.WA_SCHLUESSEL || '';

const sag = (t) => console.log(`[bazis-bot] ${t}`);
const heute = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const stundeBerlin = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));

// ── Sitzung ver-/entschlüsseln (Inhalt: alle Dateien des Auth-Ordners + Merker) ──
function schluessel(salz) { return scryptSync(SCHLUESSEL, salz, 32); }
function sitzungLaden() {
  rmSync(AUTH, { recursive: true, force: true }); mkdirSync(AUTH, { recursive: true });
  if (!existsSync(SITZUNG)) return { gepostet: [] };
  const roh = readFileSync(SITZUNG);
  const salz = roh.subarray(0, 16), iv = roh.subarray(16, 28), tag = roh.subarray(28, 44), daten = roh.subarray(44);
  const d = createDecipheriv('aes-256-gcm', schluessel(salz), iv); d.setAuthTag(tag);
  const inhalt = JSON.parse(Buffer.concat([d.update(daten), d.final()]).toString('utf8'));
  for (const [name, text] of Object.entries(inhalt.dateien)) writeFileSync(join(AUTH, name), text);
  return inhalt.merker ?? { gepostet: [] };
}
function sitzungSpeichern(merker) {
  const dateien = {};
  for (const name of readdirSync(AUTH)) dateien[name] = readFileSync(join(AUTH, name), 'utf8');
  const salz = randomBytes(16), iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', schluessel(salz), iv);
  const daten = Buffer.concat([c.update(JSON.stringify({ dateien, merker }), 'utf8'), c.final()]);
  mkdirSync(dirname(SITZUNG), { recursive: true });
  writeFileSync(SITZUNG, Buffer.concat([salz, iv, c.getAuthTag(), daten]));
}

// ── Verbinden (mit Neustart nach dem Koppeln, Code 515) ──
async function verbinden({ koppeln = false, qr = false } = {}) {
  const { state, saveCreds } = await authAusOrdner(AUTH);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
  let codeAngefordert = false;
  for (let versuch = 0; versuch < 4; versuch++) {
    const sock = makeWASocket({
      version, auth: state, browser: Browsers.macOS('Chrome'), logger: pino({ level: 'silent' }),
      markOnlineOnConnect: false, syncFullHistory: false,
    });
    sock.ev.on('creds.update', saveCreds);
    // QR-Weg (Modus „anmelden-qr“): QR-Code ins Protokoll, mit dem Handy abscannen.
    if (qr) sock.ev.on('connection.update', async (u) => {
      if (!u.qr) return;
      sag('Neuer QR-Code (gilt ca. 20 Sekunden) – WhatsApp → Verknüpfte Geräte → Gerät hinzufügen → scannen:');
      console.log(await QRCode.toString(u.qr, { type: 'terminal', small: true }));
    });
    // Kopplungscode nur EINMAL anfordern: Ein neuer Code macht den alten ungültig.
    // Angefordert wird erst, wenn der Server bereit ist (erstes „qr“-Ereignis).
    if (koppeln && !state.creds.registered && !codeAngefordert) {
      codeAngefordert = true;
      let nummer = (process.env.WA_NUMMER || '').replace(/\D/g, '');
      if (nummer.startsWith('00')) nummer = nummer.slice(2);
      if (nummer.startsWith('0')) nummer = '49' + nummer.slice(1);
      if (nummer.length < 10) throw new Error('WA_NUMMER fehlt oder ist zu kurz (Geheimnis in GitHub, z. B. 4917612345678).');
      await new Promise((bereit) => {
        const uhr = setTimeout(bereit, 10_000);
        sock.ev.on('connection.update', (u) => { if (u.qr) { clearTimeout(uhr); bereit(); } });
      });
      const code = await sock.requestPairingCode(nummer);
      sag('──────────────────────────────────────────');
      sag(`KOPPLUNGSCODE:  ${code.slice(0, 4)}-${code.slice(4)}`);
      sag('WhatsApp → Einstellungen → Verknüpfte Geräte → Gerät hinzufügen →');
      sag('„Stattdessen mit Telefonnummer verknüpfen“ → Code eingeben. Du hast ca. 3 Minuten.');
      sag('──────────────────────────────────────────');
    }
    const ergebnis = await new Promise((fertig) => {
      const uhr = setTimeout(() => fertig('zeit'), koppeln || qr ? 4 * 60_000 : 60_000);
      sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'open') { clearTimeout(uhr); fertig('offen'); }
        if (connection === 'close') {
          clearTimeout(uhr);
          const code = lastDisconnect?.error?.output?.statusCode;
          fertig(code === DisconnectReason.loggedOut ? 'abgemeldet' : 'neu');
        }
      });
    });
    if (ergebnis === 'offen') return sock;
    if (ergebnis === 'abgemeldet') throw new Error('WhatsApp hat das Gerät abgemeldet – bitte neu anmelden (Modus „anmelden“).');
    if (ergebnis === 'zeit') throw new Error(koppeln ? 'Kein Kopplungscode eingegeben (Zeit abgelaufen).' : 'Verbindung kam nicht zustande.');
    sock.end(undefined);
    await delay(2000);
  }
  throw new Error('Verbindung nach mehreren Versuchen nicht möglich.');
}

async function gruppeFinden(sock) {
  const name = (process.env.WA_GRUPPE || '').trim();
  if (!name) throw new Error('WA_GRUPPE fehlt (genauer Name der WhatsApp-Gruppe als GitHub-Geheimnis).');
  const gruppen = Object.values(await sock.groupFetchAllParticipating());
  const treffer = gruppen.filter(g => (g.subject || '').trim() === name);
  if (treffer.length !== 1) throw new Error(treffer.length ? 'Mehrere Gruppen mit diesem Namen.' : 'Gruppe nicht gefunden – Name in WA_GRUPPE genau so wie in WhatsApp?');
  return treffer[0].id;
}

function umfrageLesen() {
  const pfad = join(HIER, 'umfrage.json');
  if (!existsSync(pfad)) return null;
  return JSON.parse(readFileSync(pfad, 'utf8') || 'null');
}

async function main() {
  if (!SCHLUESSEL || SCHLUESSEL.length < 16) {
    sag('Nicht eingerichtet (Geheimnis WA_SCHLUESSEL fehlt oder ist kürzer als 16 Zeichen) – nichts zu tun.');
    return;
  }
  const merker = sitzungLaden();

  if (modus === 'umfrage') {
    const u = umfrageLesen();
    if (!u || u.datum !== heute()) { sag('Heute kein Spiel mit fester Uhrzeit – nichts zu tun.'); return; }
    if (stundeBerlin() < 11) { sag('Noch vor 11 Uhr – der nächste Lauf postet.'); return; }
    if (merker.gepostet.includes(u.datum)) { sag('Umfrage für heute ist schon in der Gruppe.'); return; }
  }
  if (!modus.startsWith('anmelden') && !existsSync(join(AUTH, 'creds.json'))) {
    throw new Error('Noch nicht angemeldet – Workflow zuerst einmal mit Modus „anmelden“ starten (Standard ist „test“).');
  }

  const sock = await verbinden({ koppeln: modus === 'anmelden', qr: modus === 'anmelden-qr' });
  try {
    if (modus.startsWith('anmelden')) {
      await gruppeFinden(sock);
      sag('Angemeldet ✓ – Gruppe gefunden ✓. Ab jetzt postet der Bot an jedem Spieltag um 11 Uhr.');
    } else if (modus === 'test') {
      const u = umfrageLesen();
      if (!u) throw new Error('Kein kommendes Spiel mit fester Uhrzeit gefunden.');
      await gruppeFinden(sock);
      const ich = sock.user.id.replace(/:\d+@/, '@');
      await sock.sendMessage(ich, { poll: { name: `[TEST] ${u.name}`, values: u.optionen, selectableCount: 1 } });
      sag('Test-Umfrage an dich selbst geschickt ✓ (Chat „Du“/„Ich“ in WhatsApp). Gruppe gefunden ✓.');
    } else {
      const u = umfrageLesen();
      const gruppe = await gruppeFinden(sock);
      await sock.sendMessage(gruppe, { poll: { name: u.name, values: u.optionen, selectableCount: 1 } });
      merker.gepostet = [...merker.gepostet, u.datum].slice(-60);
      sag(`Umfrage für ${u.datum} (${u.uhrzeit} Uhr) gepostet ✓`);
    }
    await delay(5000); // Nachricht rausschicken, Schlüssel speichern lassen
  } finally {
    sock.end(undefined);
    await delay(1000);
    sitzungSpeichern(merker);
    rmSync(AUTH, { recursive: true, force: true });
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(`[bazis-bot] FEHLER: ${e.message}`); process.exit(1); });
