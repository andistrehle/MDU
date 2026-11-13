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
//   node bot.mjs anmelden-lokal → AUF DEM EIGENEN RECHNER: QR-Code im Terminal scannen, danach
//      steht die verschlüsselte Anmeldung in WA_SITZUNG.txt → als GitHub-Geheimnis WA_SITZUNG
//      eintragen. Nötig, weil WhatsApp das Koppeln von GitHub-Rechnern (Rechenzentrum) ablehnte.
//   node bot.mjs umfrage    → heute Spieltag + ab 11 Uhr + noch nicht gepostet → posten
//   node bot.mjs test       → Umfrage fürs nächste Spiel an dich selbst („Du“-Chat)
//   node bot.mjs live       → LIVE-TICKER (Betreiber, 12.11.2026): läuft während des Bazis-Spiels, fragt
//      jede Minute /api/live ab und schreibt nach JEDEM neuen Spielergebnis eine Nachricht in die
//      Gruppe WA_GRUPPE_LIVE (eigene Gruppe, NICHT die Umfrage-Gruppe), zum Schluss den Endstand.
//      Ohne Bazis-Spiel heute oder ohne WA_GRUPPE_LIVE: meldet sich gar nicht erst an.
//   node bot.mjs live-test  → dasselbe, aber an dich selbst („Du“-Chat)
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
  // Noch nichts im Cache, aber lokal angemeldet (Geheimnis WA_SITZUNG) → das ist der Anfang.
  if (!existsSync(SITZUNG) && process.env.WA_SITZUNG) {
    mkdirSync(dirname(SITZUNG), { recursive: true });
    writeFileSync(SITZUNG, Buffer.from(process.env.WA_SITZUNG.trim(), 'base64'));
  }
  if (!existsSync(SITZUNG)) return { gepostet: [] };
  const roh = readFileSync(SITZUNG);
  const salz = roh.subarray(0, 16), iv = roh.subarray(16, 28), tag = roh.subarray(28, 44), daten = roh.subarray(44);
  const d = createDecipheriv('aes-256-gcm', schluessel(salz), iv); d.setAuthTag(tag);
  const inhalt = JSON.parse(Buffer.concat([d.update(daten), d.final()]).toString('utf8'));
  for (const [name, text] of Object.entries(inhalt.dateien)) writeFileSync(join(AUTH, name), text);
  return inhalt.merker ?? { gepostet: [] };
}
function sitzungSpeichern(merker, nur = null) {
  const dateien = {};
  for (const name of readdirSync(AUTH)) if (!nur || nur.includes(name)) dateien[name] = readFileSync(join(AUTH, name), 'utf8');
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

async function gruppeNachName(sock, name) {
  const gruppen = Object.values(await sock.groupFetchAllParticipating());
  const treffer = gruppen.filter(g => (g.subject || '').trim() === name);
  if (treffer.length !== 1) throw new Error(treffer.length ? 'Mehrere Gruppen mit diesem Namen (Live).' : 'Live-Gruppe nicht gefunden – Name in WA_GRUPPE_LIVE genau so wie in WhatsApp?');
  return treffer[0].id;
}

// ── Live-Ticker ──────────────────────────────────────────────
const TEAM = 'freibad-bazis';
const SITE = 'https://www.mdudarts.de';
const tickerHolen = async () => {
  const r = await fetch(`${SITE}/api/live`, { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`Ticker antwortet ${r.status}`);
  const d = await r.json();
  return (d.spiele || []).find(s => s.home === TEAM || s.away === TEAM) || null;
};
const namen = (l) => (l && l.length ? l.join(' / ') : '?');
const spielText = (s, g, heim, gast) =>
  `🎯 Spiel ${g.nr}${g.doppel ? ' · Doppel' : ''}\n${namen(g.heim)} ${g.legsHeim}:${g.legsGast} ${namen(g.gast)}\n➡️ ${s.homeName} ${heim}:${gast} ${s.awayName}`;

// Startnachricht (Betreiber, 13.11.2026): Lokal, Gegner, Anwurf + alle Zusagen aus dem Team Manager
// (egal, wer am Ende spielt). Die Namen holt der Bot über /api/live/aufgebot, das nur diesem
// Workflow antwortet (GitHub-OIDC-Ausweis, `permissions: id-token: write`).
async function oidcToken() {
  const url = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, tok = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!url || !tok) return null;
  const r = await fetch(`${url}&audience=mdudarts`, { headers: { authorization: `Bearer ${tok}` } });
  return r.ok ? (await r.json()).value : null;
}
async function mitAusweis(pfad, key, was) {
  try {
    const t = await oidcToken();
    if (!t) { sag(`Kein GitHub-Ausweis – ${was} entfällt.`); return null; }
    const r = await fetch(`${SITE}/api/live/${pfad}?team=${TEAM}&spiel=${encodeURIComponent(key)}`, { headers: { authorization: `Bearer ${t}` } });
    if (!r.ok) { sag(`${pfad} antwortet ${r.status} – ${was} entfällt.`); return null; }
    return await r.json();
  } catch { sag(`${pfad} nicht erreichbar – ${was} entfällt.`); return null; }
}
const aufgebotHolen = (key) => mitAusweis('aufgebot', key, 'Liste der Zusagen');
/** Minuten bis „uhrzeit“ (Berliner Zeit, heute); null ohne Uhrzeit. */
function minutenBis(uhrzeit) {
  if (!uhrzeit) return null;
  const [h, m] = uhrzeit.split(':').map(Number);
  const teile = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return h * 60 + m - (Number(teile.hour) * 60 + Number(teile.minute));
}
function startText(s, a) {
  const team = a?.team || (s.home === TEAM ? s.homeName : s.awayName);
  const gegner = a?.gegner || (s.home === TEAM ? s.awayName : s.homeName);
  const lokal = a?.lokal ? ` aus dem ${a.lokal}` : '';
  const uhr = a?.uhrzeit || s.uhrzeit;
  const zeilen = [`🔴 Heute live${lokal} 🍻`, '', `⚔️ ${team} gg. ${gegner}`, ''];
  if (uhr) zeilen.push(`⏰ Anwurf ist um ${uhr} Uhr`);
  if (a) zeilen.push('', '🎯 Heute an der Scheibe:', ...(a.zugesagt?.length ? a.zugesagt.map(n => `▪️ ${n}`) : ['(noch keine Zusagen)']));
  zeilen.push('', 'Gute Unterhaltung und good Darts 🎯🔥');
  return zeilen.join('\n');
}
/** Frühestens 30 Minuten vor Anwurf starten (Berliner Zeit); ohne Uhrzeit sofort. */
async function wartenBisStart(uhrzeit) {
  const bis = minutenBis(uhrzeit);
  if (bis === null) return;
  const warte = bis - 30;
  if (warte > 0 && warte < 6 * 60) { sag(`Warte ${warte} Min. bis 30 Min. vor Anwurf.`); await delay(warte * 60_000); }
}

async function liveLauf(ziel) {
  const ende = Date.now() + 5 * 3600_000;
  let s = await tickerHolen().catch(() => null);
  if (!s) { sag('Heute kein Spiel der Bazis im Ticker – nichts zu tun.'); return null; }
  const merkerKey = `live:${s.key}`;
  return { s, merkerKey, ende, ziel };
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
  let live = null;
  if (modus === 'live' || modus === 'live-test') {
    const gruppeName = (process.env.WA_GRUPPE_LIVE || '').trim();
    if (modus === 'live' && !gruppeName) { sag('WA_GRUPPE_LIVE fehlt – Live-Ticker nicht eingerichtet, nichts zu tun.'); return; }
    live = await liveLauf(gruppeName);
    if (!live) return;
    if (modus === 'live' && (merker.liveFertig || []).includes(live.merkerKey)) { sag('Live-Ticker für dieses Spiel ist schon abgeschlossen.'); return; }
  }
  if (!modus.startsWith('anmelden') && !existsSync(join(AUTH, 'creds.json'))) {
    throw new Error('Noch nicht angemeldet – Workflow zuerst einmal mit Modus „anmelden“ starten (Standard ist „test“).');
  }

  const sock = await verbinden({ koppeln: modus === 'anmelden', qr: modus === 'anmelden-qr' || modus === 'anmelden-lokal' });
  try {
    if (modus.startsWith('anmelden')) {
      await gruppeFinden(sock);
      sag('Angemeldet ✓ – Gruppe gefunden ✓. Ab jetzt postet der Bot an jedem Spieltag um 11 Uhr.');
    } else if (live) {
      const an = modus === 'live' ? await gruppeNachName(sock, live.ziel) : sock.user.id.replace(/:\d+@/, '@');
      const vor = modus === 'live-test' ? '[TEST] ' : '';
      const gepostet = new Set((merker.liveSpiele || {})[live.merkerKey] || []);
      const link = `${SITE}/live?spiel=${encodeURIComponent(live.s.key)}`;
      const senden = async (text) => { await sock.sendMessage(an, { text: vor + text }); await delay(1500); };
      if (!gepostet.size && !(merker.liveStart || []).includes(live.merkerKey)) {
        if (modus === 'live') await wartenBisStart(live.s.uhrzeit);
        await senden(startText(live.s, await aufgebotHolen(live.s.key)));
        if (modus === 'live') merker.liveStart = [...(merker.liveStart || []), live.merkerKey].slice(-60);
      }
      // Vorbericht (Betreiber, 13.11.2026): genau zwischen Startnachricht und Anwurf, spätestens vor dem ersten Spiel.
      const bisAnwurf = minutenBis(live.s.uhrzeit);
      const vorberichtAb = Date.now() + Math.max(0, Math.floor((bisAnwurf ?? 0) / 2)) * 60_000;
      let vorberichtDa = modus === 'live-test' ? false : (merker.liveVorbericht || []).includes(live.merkerKey);
      const vorberichtSenden = async () => {
        vorberichtDa = true;
        const v = await mitAusweis('vorbericht', live.s.key, 'Vorbericht');
        if (v?.text) { await senden(v.text); sag(`Vorbericht gepostet ✓ (${v.quelle})`); }
        if (modus === 'live') merker.liveVorbericht = [...(merker.liveVorbericht || []), live.merkerKey].slice(-60);
      };
      let s = live.s;
      while (Date.now() < live.ende) {
        // Neue Spiele in Reihenfolge melden, mit dem Stand NACH diesem Spiel (aus allen bis dahin gemeldeten).
        const bekannt = [...s.spiele].sort((a, b) => a.nr - b.nr);
        if (!vorberichtDa && !gepostet.size && (Date.now() >= vorberichtAb || bekannt.some(g => !gepostet.has(g.nr)))) await vorberichtSenden();
        for (const g of bekannt) {
          if (gepostet.has(g.nr)) continue;
          gepostet.add(g.nr);
          const bis = bekannt.filter(x => gepostet.has(x.nr));
          const heim = bis.filter(x => x.legsHeim > x.legsGast).length, gast = bis.filter(x => x.legsGast > x.legsHeim).length;
          await senden(spielText(s, g, heim, gast));
        }
        merker.liveSpiele = { ...(merker.liveSpiele || {}), [live.merkerKey]: [...gepostet] };
        if (s.status === 'beendet') {
          await senden(`🏁 Endstand: ${s.homeName} ${s.standHeim}:${s.standGast} ${s.awayName}\n${link}`);
          if (modus === 'live') merker.liveFertig = [...(merker.liveFertig || []), live.merkerKey].slice(-60);
          sag('Endstand gemeldet ✓');
          break;
        }
        if (modus === 'live-test' && gepostet.size) { sag('Test: bisherige Ergebnisse geschickt ✓'); break; }
        await delay(60_000);
        s = (await tickerHolen().catch(() => null)) || s;
      }
      sag(`Live-Ticker: ${gepostet.size} Spiele gemeldet.`);
    } else if (modus === 'test') {
      const u = umfrageLesen();
      if (!u) throw new Error('Kein kommendes Spiel mit fester Uhrzeit gefunden.');
      await gruppeFinden(sock);
      const ich = sock.user.id.replace(/:\d+@/, '@');
      await sock.sendMessage(ich, { poll: { name: `[TEST] ${u.name}`, values: u.optionen, selectableCount: 0 } });
      sag('Test-Umfrage an dich selbst geschickt ✓ (Chat „Du“/„Ich“ in WhatsApp). Gruppe gefunden ✓.');
    } else {
      const u = umfrageLesen();
      const gruppe = await gruppeFinden(sock);
      await sock.sendMessage(gruppe, { poll: { name: u.name, values: u.optionen, selectableCount: 0 } });
      merker.gepostet = [...merker.gepostet, u.datum].slice(-60);
      sag(`Umfrage für ${u.datum} (${u.uhrzeit} Uhr) gepostet ✓`);
    }
    await delay(5000); // Nachricht rausschicken, Schlüssel speichern lassen
  } finally {
    sock.end(undefined);
    await delay(1000);
    sitzungSpeichern(merker);
    if (modus === 'anmelden-lokal' && existsSync(join(AUTH, 'creds.json'))) {
      // Für das GitHub-Geheimnis (max. 48 KB) nur die Zugangsdaten — der Rest entsteht neu.
      sitzungSpeichern(merker, ['creds.json']);
      writeFileSync(join(HIER, 'WA_SITZUNG.txt'), readFileSync(SITZUNG).toString('base64'));
      rmSync(dirname(SITZUNG), { recursive: true, force: true });
      sag('Fertig ✓  Die Datei WA_SITZUNG.txt (in diesem Ordner) mit dem Editor öffnen, den');
      sag('ganzen Inhalt kopieren und in GitHub als Geheimnis „WA_SITZUNG“ eintragen. Danach die Datei löschen.');
    }
    rmSync(AUTH, { recursive: true, force: true });
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(`[bazis-bot] FEHLER: ${e.message}`); process.exit(1); });
