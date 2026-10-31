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
const { execFileSync, spawnSync, spawn } = require('child_process');
const { chromium } = require('playwright');

const DIR = __dirname;
const TON = path.join(DIR, process.env.TROCKEN === '1' ? 'ton-trocken' : 'ton');
const AUFNAHME = path.join(DIR, 'aufnahme');
const ZIEL = path.join(DIR, 'ausgabe', process.env.TROCKEN === '1' ? 'MDU-team-manager-ohne-ton.mp4' : 'MDU-team-manager.mp4');
const ZIEL_HOCH = path.join(DIR, 'ausgabe', 'MDU-team-manager-hoch.mp4'); // nur Handy, für reel.js
const KEY = process.env.ELEVENLABS_API_KEY;
// Seit 31.10.2026 das neue Modell v3: versteht Regieanweisungen im Text ([excited], [laughs], [whispers],
// [shouting], [shocked]) — Toby klingt damit deutlich lebendiger (Betreiber: „wie so ne Trantüte“).
const MODELL = process.env.ELEVENLABS_MODEL || 'eleven_v3';
const V3 = MODELL === 'eleven_v3';
// v3 spricht langsamer; die fertige Szene wird mit atempo schneller abgespielt (Tonhöhe bleibt).
const TEMPO = +(process.env.TEMPO || (V3 ? 1.12 : 1));
const PAUSE = +(process.env.PAUSE || 0.35); // Sekunden Luft am Ende jeder Szene
// Aussprache: gilt NUR für den gesprochenen Text, der Untertitel bleibt wie in erklaer.html.
// Ohne das liest die Stimme „mdudarts“ als ein Wort („Mdu-darts“).
const AUSSPRACHE = [
  [/mdudarts\.de/gi, 'Em-De-U-Darts Punkt De-E'], // so trennt die Stimme die Buchstaben (per Spracherkennung geprüft)
  [/\bMDU\b/g, 'Em De U'],
  [/\bTC\b/g, 'Teamcaptain'],
  [/BSDABBV/g, 'Be-Es-De-A-Be-Be-Vau'],
  [/8,99\s*€/g, 'acht neunundneunzig'],
  [/49\s*€/g, 'neunundvierzig Euro'],
  // Auslassungspunkte: am Stück gesprochen stünden sonst „… …“ hintereinander,
  // daran verschluckt sich die Stimme (Szene 6, 14.10.2026).
  [/^\s*…\s*/, ''], [/\s*…\s*$/, ','], [/\s*…\s*/g, ', '],
];
// {S***|Sack}: Untertitel zeigt S***, gesprochen wird „Sack“ (mit Piep darüber, siehe PIEP).
const sprechtext = (t) => AUSSPRACHE.reduce((s, [re, ers]) => s.replace(re, ers), t.replace(/\{[^|}]*\|([^}]*)\}/g, '$1'));
// Ohne Regieanweisungen ([excited] …) — für Länge und Abgleich mit der Spracherkennung.
const ohneRegie = (t) => t.replace(/\[[^\]]*\]\s*/g, '');
// Vorschau ohne Ton: Zeichen pro Sekunde (Toby/v3 „natürlich“ ≈ 12,5, gemessen 31.10.2026)
const ZPS = +(process.env.ZPS || 14); // 12,5 × 1,12 (Toby wird 12 % schneller abgespielt)
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
const STIMME = V3
  ? { stability: +(process.env.STABILITY || 0.5) } // v3: 0 = kreativ, 0.5 = natürlich (Betreiber-Wahl), 1 = robust
  : {
    stability: +(process.env.STABILITY || 0.2),
    similarity_boost: 0.75,
    style: +(process.env.STYLE || 0.9),
    use_speaker_boost: true,
    speed: +(process.env.SPEED || 1.15),
  };

function trockenTon(text, datei) {
  // Stille in der ungefähren Sprechlänge (14 Zeichen/s) — Vorschau ohne Ton, kostet nichts
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', (ohneRegie(text).length / ZPS).toFixed(2), '-q:a', '6', datei]);
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
  if (fs.existsSync(datei) && fs.existsSync(meta)) return { datei, piep: [], ...JSON.parse(fs.readFileSync(meta, 'utf8')), neu: 0 };
  let starts, ende, piep = [];
  if (process.env.TROCKEN === '1') {
    trockenTon(text, datei);
    let pos = 0; starts = teile.map(t => { const s = pos / ZPS; pos += ohneRegie(t).length + 1; return s; }); ende = ohneRegie(text).length / ZPS;
  } else if (V3) {
    const r = await api(`/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: MODELL, language_code: 'de', voice_settings: STIMME }),
    });
    const roh = basis + '.roh.mp3';
    fs.writeFileSync(roh, Buffer.from(await r.arrayBuffer()));
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', roh, '-af', `atempo=${TEMPO}`, '-b:a', '160k', datei]);
    fs.rmSync(roh, { force: true });
    ({ starts, ende, piep } = await zeitmarkenAusSprache(datei, teile));
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
  fs.writeFileSync(meta, JSON.stringify({ starts, ende, piep }));
  return { datei, starts, ende, piep, neu: text.length };
}

// Wörter mit Zeit aus der Spracherkennung (scribe_v1). Satzanfang = erstes Wort des Satzes, der Reihe
// nach gesucht; Piep = jedes Wort aus PIEP_WOERTER (gesprochen ganz, im Video überpiept).
const PIEP_WOERTER = ['sack'];
const norm = (w) => w.toLowerCase().replace(/[^a-zäöüß0-9]/g, '');
async function zeitmarkenAusSprache(datei, teile) {
  const fd = new FormData();
  fd.append('model_id', 'scribe_v1'); fd.append('language_code', 'de'); fd.append('timestamps_granularity', 'word');
  fd.append('file', new Blob([fs.readFileSync(datei)], { type: 'audio/mpeg' }), path.basename(datei));
  const j = await (await api('/v1/speech-to-text', { method: 'POST', body: fd })).json();
  const w = (j.words || []).filter(x => x.type === 'word');
  const ende = w.length ? w[w.length - 1].end : laenge(datei);
  const gesamt = teile.reduce((a, t) => a + ohneRegie(t).length + 1, 0);
  let zeiger = 0, pos = 0;
  const starts = teile.map((t, n) => {
    const erstes = norm(ohneRegie(t).split(/\s+/).find(x => norm(x)) || '');
    const schaetz = pos / gesamt * ende; pos += ohneRegie(t).length + 1;
    if (n === 0) { const k = w.findIndex(x => norm(x.text) === erstes); if (k >= 0) zeiger = k + 1; return w[0]?.start ?? 0; }
    for (let k = zeiger; k < w.length; k++) if (norm(w[k].text) === erstes && Math.abs(w[k].start - schaetz) < 6) { zeiger = k + 1; return w[k].start; }
    console.warn(`  Satzanfang „${erstes}“ nicht erkannt – geschätzt`);
    return schaetz;
  });
  const piep = w.filter(x => PIEP_WOERTER.includes(norm(x.text))).map(x => ({ s: Math.max(0, x.start - 0.04), e: x.end + 0.06 }));
  return { starts, ende, piep };
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

// Soundeffekte (ElevenLabs Sound Effects, einmal erzeugt, dann aus ton/fx-<art>.mp3). erklaer.html meldet,
// wann was neu ins Bild kommt (window.EFFEKTE); OHNE_FX=1 lässt sie weg, TROCKEN=1 auch.
const FX = {
  whoosh: ['quick soft whoosh swoosh transition', 0.8],
  plopp: ['short soft cartoon pop, bubble pop', 0.5],
  ding: ['smartphone push notification chime, short bright ding', 1],
  kratz: ['fast marker pen scribble, crossing out on paper', 0.8],
  trommel: ['snare drum roll building up, ending with cymbal crash', 3],
  klirr: ['two shot glasses clinking, cheers', 1],
  kasse: ['cash register ka-ching', 1.2],
  tada: ['short cheerful fanfare, ta-da', 1.5],
};
const FX_LAUT = { whoosh: 0.35, plopp: 0.4, ding: 0.5, kratz: 0.45, trommel: 0.4, klirr: 0.5, kasse: 0.5, tada: 0.45 };
async function effektDatei(typ) {
  const datei = path.join(DIR, 'ton', `fx-${typ}.mp3`);
  if (fs.existsSync(datei)) return datei;
  const [text, dauer] = FX[typ];
  const r = await api('/v1/sound-generation', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, duration_seconds: dauer, prompt_influence: 0.5 }) });
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  fs.writeFileSync(datei, Buffer.from(await r.arrayBuffer()));
  console.log(`Effekt „${typ}“ erzeugt`);
  return datei;
}

// Wann schaltet der Taktstreifen um? (Sekunden im Video). Er liegt in den 12 px unter dem Bild.
function taktImVideo(webm, hoehe) {
  const roh = execFileSync(FFMPEG, ['-loglevel', 'error', '-i', webm, '-vf', `crop=iw:8:0:${hoehe + 2},scale=1:1,format=gray,fps=100`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 26 });
  // Erst ab der schwarzen Wartephase vor dem Start (≥ 1 s) zählen — davor lädt die Seite hell.
  let n = 0, lauf = 0;
  for (; n < roh.length && lauf < 100; n++) lauf = roh[n] < 128 ? lauf + 1 : 0;
  // Entprellt: ein Wechsel zählt erst, wenn der neue Zustand 0,15 s hält (einzelne Bilder flackern beim Umschalten).
  const t = []; let weiss = false;
  for (; n < roh.length; n++) {
    const w = roh[n] > 128;
    if (w === weiss) continue;
    let haelt = true;
    for (let m = n; m < Math.min(roh.length, n + 15); m++) if ((roh[m] > 128) !== w) { haelt = false; break; }
    if (haelt) { t.push(n / 100); weiss = w; }
  }
  return t;
}

// Eine Aufnahme der Szenen (erklaer.html, Format per #hash) mit dem Ton an den Stellen, an denen
// die Sätze IM VIDEO beginnen. Die Browseraufnahme läuft langsamer als die Uhr (27.10.2026: 8 s
// auf 4 Minuten, der Ton lief am Ende voraus) — deshalb zählt der Taktstreifen, nicht die Uhr.
// Bild für Bild mit angehaltener Uhr (seit 31.10.2026): Die Echtzeit-Aufnahme des Browsers ließ
// Bilder aus — es ruckelte an jedem Übergang, und der Ton musste Satz für Satz nachgeschoben werden
// (klang abgehackt). Jetzt läuft die Seite auf einer Spieluhr (page.clock), jede CSS-Animation wird pro
// Bild auf ihre Zeit gestellt (document.getAnimations), und jedes Bild wird einzeln fotografiert.
// Damit stimmen Bild und Zeitplan exakt, und der Ton jeder Szene läuft am Stück.
const FPS = +(process.env.FPS || 25);
async function aufnehmenUndVertonen(zeiten, clips, hash, vp, ziel) {
  const ordner = path.join(AUFNAHME, hash ? 'hoch' : 'quer');
  fs.mkdirSync(ordner, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: vp });
  await p.clock.install({ time: new Date('2026-10-20T18:00:00+02:00') });
  await p.goto('file://' + path.join(DIR, 'erklaer.html') + hash);
  await p.waitForTimeout(2500); // Bilder und Schriften laden (echte Zeit)
  await p.evaluate(() => document.fonts.ready);
  const stelle = () => p.evaluate(() => {
    const jetzt = Date.now();
    for (const a of document.getAnimations()) { if (a.__start === undefined) a.__start = jetzt; a.pause(); a.currentTime = jetzt - a.__start; }
  });
  await p.evaluate(z => { window.ZEITEN = z; window.VORLAUF = 0.45; window.SPIEL(); }, zeiten);
  const roh = path.join(ordner, 'bild.mp4');
  const enc = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', roh], { stdio: ['pipe', 'inherit', 'inherit'] });
  const schreib = (buf) => new Promise(r => (enc.stdin.write(buf) ? r() : enc.stdin.once('drain', r)));
  let bild = 0, nachlauf = null;
  for (;;) {
    await stelle();
    await schreib(await p.screenshot({ type: 'jpeg', quality: 92 }));
    bild++;
    if (bild % (FPS * 10) === 0) process.stdout.write(`\r  ${(bild / FPS).toFixed(0)} s aufgenommen`);
    if (nachlauf === null && await p.evaluate(() => window.FERTIG === true)) nachlauf = FPS; // 1 s Nachlauf
    if (nachlauf !== null && --nachlauf <= 0) break;
    await p.clock.runFor(1000 / FPS);
  }
  enc.stdin.end(); await new Promise(r => enc.on('close', r));
  const { marken, effekte, dauer } = await p.evaluate(() => ({ marken: window.MARKEN, effekte: window.EFFEKTE, dauer: window.DAUER }));
  await b.close();
  const ende = bild / FPS;
  console.log(`\rAufnahme ${hash || 'quer'}: ${ende.toFixed(1)} s, ${bild} Bilder`);
  const imVideo = (ms) => ms / 1000, t0 = 0;
  void dauer;

  // Effektspur einzeln mischen (eine Datei je Art, per asplit vervielfacht)
  let fxSpur = null;
  if (process.env.TROCKEN !== '1' && process.env.OHNE_FX !== '1' && effekte.length) {
    const arten = [...new Set(effekte.map(e => e.typ))];
    const ein = [], filter = [], teile = [];
    for (const [n, typ] of arten.entries()) {
      ein.push('-i', await effektDatei(typ));
      const liste = effekte.filter(e => e.typ === typ);
      filter.push(`[${n}:a]aformat=sample_rates=44100:channel_layouts=mono,volume=${FX_LAUT[typ]},asplit=${liste.length}${liste.map((_, m) => `[s${n}_${m}]`).join('')}`);
      liste.forEach((e, m) => { const d = Math.max(0, Math.round((imVideo(e.ms) - t0) * 1000)); filter.push(`[s${n}_${m}]adelay=${d}|${d}[f${n}_${m}]`); teile.push(`[f${n}_${m}]`); });
    }
    filter.push(`${teile.join('')}amix=inputs=${teile.length}:normalize=0:duration=longest[fx]`);
    fxSpur = path.join(ordner, 'fx.wav');
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...ein, '-filter_complex', filter.join(';'), '-map', '[fx]', fxSpur], { stdio: 'inherit' });
    console.log(`Effekte: ${effekte.length} (${arten.join(', ')})`);
  }

  const eingaben = ['-i', roh];
  const filter = ['[0:v]null[bild]'];
  const pieps = []; // { d: ms im Video, dauer: s }
  clips.forEach((c, n) => {
    const m = marken.find(x => x.i === c.i && x.j === c.j);
    const d = Math.max(0, Math.round((imVideo(m.ms) - t0) * 1000));
    eingaben.push('-ss', c.von.toFixed(3), ...(c.bis != null ? ['-t', (c.bis - c.von).toFixed(3)] : []), '-i', c.datei);
    // Piep: Stimme an der Stelle stumm, darüber ein Sinuston (Betreiber, 31.10.2026: „Geh mir nicht auf den S***“)
    const hier = c.piep.filter(p => p.s >= c.von && (c.bis == null || p.s < c.bis));
    const stumm = hier.map(p => `volume=enable='between(t,${(p.s - c.von).toFixed(3)},${(p.e - c.von).toFixed(3)})':volume=0`).join(',');
    for (const p of hier) pieps.push({ d: d + Math.round((p.s - c.von) * 1000), dauer: p.e - p.s });
    filter.push(`[${n + 1}:a]${stumm ? stumm + ',' : ''}adelay=${d}|${d}[a${n}]`);
  });
  pieps.forEach((p, k) => {
    const n = clips.length + 1 + k;
    eingaben.push('-f', 'lavfi', '-t', p.dauer.toFixed(3), '-i', 'sine=frequency=1000:sample_rate=44100');
    filter.push(`[${n}:a]volume=0.3,adelay=${p.d}|${p.d}[p${k}]`);
  });
  const stimmen = clips.map((_, n) => `[a${n}]`).join('') + pieps.map((_, k) => `[p${k}]`).join('');
  const anzahl = clips.length + pieps.length;
  if (fxSpur) {
    eingaben.push('-i', fxSpur);
    filter.push(`${stimmen}amix=inputs=${anzahl}:normalize=0[stimme]`);
    filter.push(`[stimme][${anzahl + 1}:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5[ton]`);
  } else filter.push(`${stimmen}amix=inputs=${anzahl}:normalize=0,loudnorm=I=-16:TP=-1.5[ton]`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...eingaben, '-filter_complex', filter.join(';'),
    '-map', '[bild]', '-map', '[ton]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-t', (ende + 1).toFixed(2), '-movflags', '+faststart', ziel], { stdio: 'inherit' });
  console.log('Fertig:', ziel);
  // Marken in Videozeit (für szenen.json und die Gleichlauf-Prüfung)
  return { marken: marken.map(m => ({ ...m, ms: Math.round((imVideo(m.ms) - t0) * 1000) })), dauer: ende };
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
      const hash = crypto.createHash('sha1').update(JSON.stringify([voice, MODELL, STIMME, TEMPO, sz.saetze.map(sprechtext)])).digest('hex').slice(0, 16);
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
    const hash = crypto.createHash('sha1').update(JSON.stringify([voice, MODELL, STIMME, TEMPO, sz.saetze.map(sprechtext)])).digest('hex').slice(0, 16);
    // NEU=2,4 → diese Szenen (Nummer ab 1) neu sprechen lassen, z. B. nach einem Versprecher
    if ((process.env.NEU || '').split(',').map(Number).includes(i + 1)) for (const e of ['.mp3', '.json']) fs.rmSync(path.join(TON, 'szene-' + hash + e), { force: true });
    const t = await sprichSzene(sz.saetze, voice, path.join(TON, 'szene-' + hash));
    zeichen += t.neu; if (t.neu) process.stdout.write('.');
    // Satz j läuft bis zum Anfang von Satz j+1; der letzte bis Sprechende + Luft.
    zeiten[i] = t.starts.map((s, j) => +(j + 1 < t.starts.length ? t.starts[j + 1] - s : t.ende - s + PAUSE).toFixed(3));
    zeiten[i][0] = +(zeiten[i][0] + t.starts[0]).toFixed(3);
    // Jeder Satz einzeln (ab seinem Anfang in der Szenen-Tonspur), damit er genau an seiner Stelle im Bild liegt —
    // als ein Stück je Szene liefe der Ton in langen Szenen dem Bild davon (Bildaufnahme langsamer als die Uhr).
    // Ton je Szene AM STÜCK (Bild läuft seit der Einzelbild-Aufnahme exakt im Takt, kein Nachschieben nötig)
    clips.push({ i, j: 0, datei: t.datei, von: 0, bis: null, piep: t.piep || [] });
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
