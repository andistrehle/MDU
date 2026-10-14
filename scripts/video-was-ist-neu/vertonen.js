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
const ZIEL = path.join(DIR, 'ausgabe', 'MDU-was-ist-neu.mp4');
const KEY = process.env.ELEVENLABS_API_KEY;
const MODELL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const PAUSE = +(process.env.PAUSE || 0.35); // Sekunden Luft am Ende jeder Szene
// Aussprache: gilt NUR für den gesprochenen Text, der Untertitel bleibt wie in erklaer.html.
// Ohne das liest die Stimme „mdudarts“ als ein Wort („Mdu-darts“).
const AUSSPRACHE = [
  [/mdudarts\.de/gi, 'Em De U Darts Punkt De'],
  [/\bMDU\b/g, 'Em De U'],
  [/\bTC\b/g, 'Te-Zeh'],
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

// Klang: euphorisch und etwas schneller (Betreiber, 14.10.2026). Über ENV anpassbar.
const STIMME = {
  stability: +(process.env.STABILITY || 0.3),
  similarity_boost: 0.75,
  style: +(process.env.STYLE || 0.65),
  use_speaker_boost: true,
  speed: +(process.env.SPEED || 1.1),
};

function trockenTon(text, datei) {
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `sine=frequency=440:duration=${(text.length / 14).toFixed(2)}`, '-q:a', '6', datei]);
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
  const sz = await p.evaluate(() => SZENEN.map(s => ({ titel: s.titel, saetze: s.schritte.map(x => x.u) })));
  await b.close();
  return sz;
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
    const t = await sprichSzene(sz.saetze, voice, path.join(TON, 'szene-' + hash));
    zeichen += t.neu; if (t.neu) process.stdout.write('.');
    // Satz j läuft bis zum Anfang von Satz j+1; der letzte bis Sprechende + Luft.
    zeiten[i] = t.starts.map((s, j) => +(j + 1 < t.starts.length ? t.starts[j + 1] - s : t.ende - s + PAUSE).toFixed(3));
    zeiten[i][0] = +(zeiten[i][0] + t.starts[0]).toFixed(3);
    clips.push({ i, j: 0, datei: t.datei });
  }
  console.log(`\nTon fertig (${zeichen} Zeichen neu abgerufen).`);

  // 4: aufnehmen
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: AUFNAHME, size: { width: 1920, height: 1080 } } });
  const aufnahmeStart = Date.now();
  const p = await ctx.newPage();
  await p.goto('file://' + path.join(DIR, 'erklaer.html')); await p.waitForTimeout(2500);
  await p.evaluate(z => { window.ZEITEN = z; window.VORLAUF = 0.45; window.SPIEL(); }, zeiten);
  await p.waitForFunction(() => window.FERTIG === true, null, { timeout: 900000, polling: 500 });
  await p.waitForTimeout(1500);
  const { marken, start, dauer } = await p.evaluate(() => ({ marken: window.MARKEN, start: window.START_EPOCH, dauer: window.DAUER }));
  await ctx.close(); await b.close();
  const webm = fs.readdirSync(AUFNAHME).find(f => f.endsWith('.webm'));
  const versatz = (start - aufnahmeStart) / 1000;
  console.log(`Aufnahme fertig: ${dauer.toFixed(1)} s, Vorlauf ${versatz.toFixed(2)} s`);

  // 5: zusammenbauen — jeder Satz an seiner protokollierten Stelle
  const eingaben = ['-ss', versatz.toFixed(3), '-i', path.join(AUFNAHME, webm)];
  const filter = [];
  clips.forEach((c, n) => {
    const m = marken.find(x => x.i === c.i && x.j === c.j);
    eingaben.push('-i', c.datei);
    filter.push(`[${n + 1}:a]adelay=${m.ms}|${m.ms}[a${n}]`);
  });
  filter.push(`${clips.map((_, n) => `[a${n}]`).join('')}amix=inputs=${clips.length}:normalize=0,loudnorm=I=-16:TP=-1.5[ton]`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...eingaben, '-filter_complex', filter.join(';'),
    '-map', '0:v', '-map', '[ton]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-t', (dauer + 1).toFixed(2), '-movflags', '+faststart', ZIEL], { stdio: 'inherit' });
  console.log('Fertig:', ZIEL);
}

main().catch(e => { console.error(e.message); process.exit(1); });
