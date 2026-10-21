// ============================================================
// „MDU – Was ist neu“: Szenen aufnehmen und mit ElevenLabs vertonen
// ============================================================
// Ablauf (alles automatisch):
//   1. Sätze aus erklaer.html lesen (SZENEN[].schritte[].u)
//   2. Jeden Satz bei ElevenLabs sprechen lassen (Zwischenspeicher ton/,
//      gleicher Text + gleiche Stimme = kein zweiter Abruf, kostet nichts)
//   3. Satzlänge messen → Szene läuft so lange, wie gesprochen wird
//   4. Szenen mit Playwright aufnehmen, Startzeit jedes Satzes protokollieren
//   5. Sprache exakt darunterlegen (ffmpeg) → MP4 in ausgabe/
//
// Aufruf (im Ordner scripts/video-was-ist-neu):
//   npm install --no-save --prefix . ffmpeg-static     (einmal je Session)
//   NODE_PATH=/opt/node22/lib/node_modules node vertonen.js --stimmen
//   NODE_PATH=/opt/node22/lib/node_modules node vertonen.js --probe <voiceId>
//   NODE_PATH=/opt/node22/lib/node_modules ELEVENLABS_VOICE_ID=<id> node vertonen.js
//   TROCKEN=1 ELEVENLABS_VOICE_ID=x … node vertonen.js   (Test ohne Schlüssel, Pieptöne)
//
// Schlüssel NUR aus der Umgebung (ELEVENLABS_API_KEY), nie in Dateien.
// ============================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright');

const DIR = __dirname;
const TON = path.join(DIR, process.env.TROCKEN === '1' ? 'ton-trocken' : 'ton');
const AUFNAHME = path.join(DIR, 'aufnahme');
const ZIEL = path.join(DIR, 'ausgabe', process.env.TROCKEN === '1' ? 'MDU-team-manager-ohne-ton.mp4' : 'MDU-team-manager.mp4');
const ZIEL_HOCH = path.join(DIR, 'ausgabe', 'MDU-team-manager-hoch.mp4'); // nur Handy, für reel.js
const KEY = process.env.ELEVENLABS_API_KEY;
const MODELL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const PAUSE = +(process.env.PAUSE || 0.35); // Sekunden Luft am Ende jeder Szene
// Aussprache: gilt NUR für den gesprochenen Text, der Untertitel bleibt wie in erklaer.html.
// Ohne das liest die Stimme „mdudarts“ als ein Wort („Mdu-darts“).
const AUSSPRACHE = [
  [/mdudarts\.de/gi, 'Em-De-U-Darts Punkt De-E'], // so trennt die Stimme die Buchstaben (per Spracherkennung geprüft)
  [/\bMDU\b/g, 'Em De U'],
  [/\bTC\b/g, 'Teamcaptain'],
  [/BSDABBV/g, 'Be-Es-De-A-Be-Be-Vau'],
  [/7,99\s*€/g, 'sieben neunundneunzig'],
  [/49\s*€/g, 'neunundvierzig Euro'],
  // Auslassungspunkte: am Stück gesprochen stünden sonst „… …“ hintereinander,
  // daran verschluckt sich die Stimme (Szene 6, 14.10.2026).
  [/^\s*…\s*/, ''], [/\s*…\s*$/, ','], [/\s*…\s*/g, ', '],
];
const sprechtext = (t) => AUSSPRACHE.reduce((s, [re, ers]) => s.replace(re, ers), t);
const FFMPEG = (() => { try { return require(path.join(DIR, 'node_modules/ffmpeg-static')); } catch { return 'ffmpeg'; } })();

function brauchtKey() {
  if (!KEY && process.env.TROCKEN !== '1') { console.error('ELEVENLABS_API_KEY fehlt in der Umgebung (Umgebungseinstellungen der Session).'); process.exit(1); }
}

async function api(pfad, init = {}) {
  const r = await fetch('https://api.elevenlabs.io' + pfad, { ...init, headers: { 'xi-api-key': KEY, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r;
}

// Klang: noch euphorischer als „Was ist neu“ (Betreiber, 18.10.2026). Über ENV anpassbar.
const STIMME = {
  stability: +(process.env.STABILITY || 0.2),
  similarity_boost: 0.75,
  style: +(process.env.STYLE || 0.9),
  use_speaker_boost: true,
  speed: +(process.env.SPEED || 1.15),
};

function trockenTon(text, datei) {
  // Stille in der ungefähren Sprechlänge (14 Zeichen/s) — Vorschau ohne Ton, kostet nichts
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', (text.length / 14).toFixed(2), '-q:a', '6', datei]);
}

async function sprich(text, voice, datei) {
  if (process.env.TROCKEN === '1') return trockenTon(text, datei);
  const r = await api(`/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sprechtext(text), model_id: MODELL, language_code: 'de', voice_settings: STIMME }),
  });
  fs.writeFileSync(datei, Buffer.from(await r.arrayBuffer()));
}

// Eine ganze Szene AM STÜCK sprechen (sonst klingt es abgehackt) und aus den
// Zeitmarken je Zeichen ablesen, wann welcher Satz beginnt.
// Ergebnis: { datei, starts: [s je Satz], ende: s }
async function sprichSzene(saetze, voice, basis) {
  const teile = saetze.map(sprechtext);
  const text = teile.join(' ');
  const datei = basis + '.mp3', meta = basis + '.json';
  if (fs.existsSync(datei) && fs.existsSync(meta)) return { datei, ...JSON.parse(fs.readFileSync(meta, 'utf8')), neu: 0 };
  let starts, ende;
  if (process.env.TROCKEN === '1') {
    trockenTon(text, datei);
    let pos = 0; starts = teile.map(t => { const s = pos / 14; pos += t.length + 1; return s; }); ende = text.length / 14;
  } else {
    const r = await api(`/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: MODELL, language_code: 'de', voice_settings: STIMME }),
    });
    const j = await r.json();
    fs.writeFileSync(datei, Buffer.from(j.audio_base64, 'base64'));
    const a = j.alignment, t0 = a.character_start_times_seconds;
    let pos = 0; starts = teile.map(t => { const s = t0[Math.min(pos, t0.length - 1)]; pos += t.length + 1; return s; });
    ende = a.character_end_times_seconds[a.character_end_times_seconds.length - 1];
  }
  fs.writeFileSync(meta, JSON.stringify({ starts, ende }));
  return { datei, starts, ende, neu: text.length };
}

function laenge(datei) {
  const r = spawnSync(FFMPEG, ['-i', datei], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
  if (!m) throw new Error('Länge nicht lesbar: ' + datei);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

async function szenenLesen() {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.goto('file://' + path.join(DIR, 'erklaer.html')); await p.waitForTimeout(500);
  const sz = await p.evaluate(() => SZENEN.map(s => ({ titel: s.titel || '(ohne Titel)', saetze: s.schritte.filter(x => !x.weiter).map(x => x.u) })));
  await b.close();
  return sz;
}

// Eine Aufnahme der Szenen (erklaer.html, Format per #hash) mit dem Ton an den protokollierten Stellen.
async function aufnehmenUndVertonen(zeiten, clips, hash, vp, ziel) {
  const ordner = path.join(AUFNAHME, hash ? 'hoch' : 'quer');
  fs.mkdirSync(ordner, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: ordner, size: vp } });
  const aufnahmeStart = Date.now();
  const p = await ctx.newPage();
  await p.goto('file://' + path.join(DIR, 'erklaer.html') + hash); await p.waitForTimeout(2500);
  await p.evaluate(z => { window.ZEITEN = z; window.VORLAUF = 0.45; window.SPIEL(); }, zeiten);
  await p.waitForFunction(() => window.FERTIG === true, null, { timeout: 900000, polling: 500 });
  await p.waitForTimeout(1500);
  const { marken, start, dauer } = await p.evaluate(() => ({ marken: window.MARKEN, start: window.START_EPOCH, dauer: window.DAUER }));
  await ctx.close(); await b.close();
  const webm = fs.readdirSync(ordner).find(f => f.endsWith('.webm'));
  const versatz = (start - aufnahmeStart) / 1000;
  console.log(`Aufnahme ${hash || 'quer'}: ${dauer.toFixed(1)} s, Vorlauf ${versatz.toFixed(2)} s`);
  const eingaben = ['-ss', versatz.toFixed(3), '-i', path.join(ordner, webm)];
  const filter = [];
  clips.forEach((c, n) => {
    const m = marken.find(x => x.i === c.i && x.j === c.j);
    eingaben.push('-i', c.datei);
    filter.push(`[${n + 1}:a]adelay=${m.ms}|${m.ms}[a${n}]`);
  });
  filter.push(`${clips.map((_, n) => `[a${n}]`).join('')}amix=inputs=${clips.length}:normalize=0,loudnorm=I=-16:TP=-1.5[ton]`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...eingaben, '-filter_complex', filter.join(';'),
    '-map', '0:v', '-map', '[ton]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-t', (dauer + 1).toFixed(2), '-movflags', '+faststart', ziel], { stdio: 'inherit' });
  console.log('Fertig:', ziel);
  return { marken, dauer };
}

async function main() {
  const arg = process.argv[2];
  if (arg === '--stimmen') {
    brauchtKey();
    const { voices } = await (await api('/v1/voices')).json();
    for (const v of voices) console.log(`${v.voice_id}  ${v.name.padEnd(22)} ${Object.values(v.labels || {}).join(', ')}`);
    return;
  }
  if (arg === '--probe') {
    brauchtKey();
    const voice = process.argv[3];
    const datei = path.join(DIR, `probe-${voice}.mp3`);
    await sprich(process.argv[4] || 'Servus! Ich möcht euch ganz kurz erklären, was es Neues auf der Homepage gibt! Passts bitte kurz auf. Good Darts – und bis bald!', voice, datei);
    console.log('Probe:', datei);
    return;
  }

  if (arg === '--probe-szenen') {
    // Hörprobe ganzer Szenen (Nummern ab 1, z. B. 1,15) — landet zugleich im Zwischenspeicher
    brauchtKey();
    const voice = process.env.ELEVENLABS_VOICE_ID;
    fs.mkdirSync(TON, { recursive: true });
    const szenen = await szenenLesen();
    for (const nr of process.argv[3].split(',').map(Number)) {
      const sz = szenen[nr - 1];
      const hash = crypto.createHash('sha1').update(JSON.stringify([voice, MODELL, STIMME, sz.saetze.map(sprechtext)])).digest('hex').slice(0, 16);
      // NEU=2,4 → diese Szenen (Nummer ab 1) neu sprechen lassen, z. B. nach einem Versprecher
    if ((process.env.NEU || '').split(',').map(Number).includes(i + 1)) for (const e of ['.mp3', '.json']) fs.rmSync(path.join(TON, 'szene-' + hash + e), { force: true });
    const t = await sprichSzene(sz.saetze, voice, path.join(TON, 'szene-' + hash));
      fs.copyFileSync(t.datei, path.join(DIR, `probe-szene-${nr}.mp3`));
      console.log(`Szene ${nr}: ${t.ende.toFixed(1)} s, ${t.neu} Zeichen neu → probe-szene-${nr}.mp3`);
    }
    return;
  }

  brauchtKey();
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!voice) { console.error('ELEVENLABS_VOICE_ID setzen (Liste: --stimmen).'); process.exit(1); }
  fs.mkdirSync(TON, { recursive: true }); fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
  fs.rmSync(AUFNAHME, { recursive: true, force: true }); fs.mkdirSync(AUFNAHME, { recursive: true });

  // 1–3: je Szene am Stück sprechen, Satzanfänge aus den Zeitmarken
  const szenen = await szenenLesen();
  const clips = []; const zeiten = [];
  let zeichen = 0;
  for (const [i, sz] of szenen.entries()) {
    const hash = crypto.createHash('sha1').update(JSON.stringify([voice, MODELL, STIMME, sz.saetze.map(sprechtext)])).digest('hex').slice(0, 16);
    // NEU=2,4 → diese Szenen (Nummer ab 1) neu sprechen lassen, z. B. nach einem Versprecher
    if ((process.env.NEU || '').split(',').map(Number).includes(i + 1)) for (const e of ['.mp3', '.json']) fs.rmSync(path.join(TON, 'szene-' + hash + e), { force: true });
    const t = await sprichSzene(sz.saetze, voice, path.join(TON, 'szene-' + hash));
    zeichen += t.neu; if (t.neu) process.stdout.write('.');
    // Satz j läuft bis zum Anfang von Satz j+1; der letzte bis Sprechende + Luft.
    zeiten[i] = t.starts.map((s, j) => +(j + 1 < t.starts.length ? t.starts[j + 1] - s : t.ende - s + PAUSE).toFixed(3));
    zeiten[i][0] = +(zeiten[i][0] + t.starts[0]).toFixed(3);
    clips.push({ i, j: 0, datei: t.datei });
  }
  console.log(`\nTon fertig (${zeichen} Zeichen neu abgerufen).`);

  // 4–5: aufnehmen und Ton darunterlegen — quer (Web + Handy) und hochkant (nur Handy)
  const quer = await aufnehmenUndVertonen(zeiten, clips, '', { width: 1920, height: 1080 }, ZIEL);
  if (process.env.OHNE_HOCH !== '1') await aufnehmenUndVertonen(zeiten, clips, '#hoch', { width: 1080, height: 1920 }, ZIEL_HOCH);
  const { marken, dauer } = quer;
  // Szenengrenzen fürs Hochformat (reel.js): Start jeder Szene im fertigen Video.
  const szenenStart = szenen.map((sz, i) => ({ i, titel: sz.titel, s: (marken.find(m => m.i === i && m.j === 0).ms / 1000),
    saetze: sz.saetze.map((u, j) => ({ u, s: marken.find(m => m.i === i && m.j === j).ms / 1000 })) }));
  fs.writeFileSync(path.join(path.dirname(ZIEL), 'szenen.json'), JSON.stringify({ dauer, szenen: szenenStart }, null, 1));
}

main().catch(e => { console.error(e.message); process.exit(1); });
