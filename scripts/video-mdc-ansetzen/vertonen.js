// ============================================================
// MDC – „Ranking ansetzen“: Bildschirm aufnehmen und vertonen
// ============================================================
// Kleine Schwester von `scripts/video-was-ist-neu/vertonen.js` — gleiche
// Mechanik, gleiche Stimme, nur ein anderes Video:
//
//   1. Jede Szene am Stück bei ElevenLabs sprechen lassen (Zwischenspeicher
//      `ton/`; gleicher Text + gleiche Stimme = kein zweiter Abruf)
//   2. Länge messen → die Szene läuft genau so lange, wie gesprochen wird
//   3. Die ECHTE Seite `/admin/ansetzen` mit Playwright bedienen und aufnehmen
//   4. Sprache exakt darunterlegen (ffmpeg) → MP4 in `ausgabe/`
//
// Der Unterschied zum MDU-Video: Dort werden gebaute HTML-Szenen abgefilmt,
// hier die laufende Seite selbst. Deshalb braucht es einen lokalen Server
// (siehe README) — und deshalb wird der Commit beim „Ansetzen“ ABGEFANGEN:
// Die Aufnahme soll die Bestätigung zeigen, aber nichts ins Repository
// schreiben.
//
// Aufruf (im Ordner scripts/video-mdc-ansetzen):
//   npm install --no-save --prefix . ffmpeg-static     (einmal je Session)
//   node vertonen.js --stimmen
//   node vertonen.js --probe <voiceId>
//   ELEVENLABS_VOICE_ID=<id> node vertonen.js
//   TROCKEN=1 ELEVENLABS_VOICE_ID=x node vertonen.js   (ohne Schlüssel, Pieptöne)
//
// Schlüssel NUR aus der Umgebung (ELEVENLABS_API_KEY), nie in eine Datei.
// ============================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright-core');

const DIR = __dirname;
const TON = path.join(DIR, process.env.TROCKEN === '1' ? 'ton-trocken' : 'ton');
const AUFNAHME = path.join(DIR, 'aufnahme');
const AUSGABE = path.join(DIR, 'ausgabe');
const KEY = process.env.ELEVENLABS_API_KEY;
const MODELL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
/** Luft am Ende jeder Szene, damit nichts auf Kante steht. */
const PAUSE = +(process.env.PAUSE || 0.5);
/** Wo die Seite läuft (siehe README) und das Passwort fürs Ansetzen. */
const URL = process.env.ANSETZ_URL || 'http://localhost:3115/mdc/admin/ansetzen';
const PASSWORT = process.env.ANSETZ_PASSWORT || 'wirt456';
const BROWSER = process.env.CHROMIUM
  || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
/** Mit eingeblendeten Schritten (Vorgabe) oder ohne — für eigene Texte im Schnitt. */
const MIT_TEXT = process.env.OHNE_TEXT !== '1';

const FFMPEG = (() => {
  try { return require(path.join(DIR, 'node_modules/ffmpeg-static')); } catch { return 'ffmpeg'; }
})();

// Aussprache: gilt NUR für den gesprochenen Text, die Einblendung bleibt.
// Ohne das liest die Stimme „mdc-ranking.de“ als ein Wort.
const AUSSPRACHE = [
  [/mdc-ranking\.de/gi, 'Em De Ce Ranking Punkt De'],
  [/\bMDC\b/g, 'Em De Ce'],
  // Auslassungspunkte: gesprochen verschluckt sich die Stimme daran. Am
  // Satzende wird ein Komma daraus — dann klingt es offen, wie gemeint.
  [/^\s*…\s*/, ''], [/\s*…\s*$/, ','], [/\s*…\s*/g, ', '],
];
const sprechtext = (t) => AUSSPRACHE.reduce((s, [re, ers]) => s.replace(re, ers), t);

// Klang wie beim MDU-Video, nur NICHT schneller: Das hier ist eine Anleitung,
// keine Ankündigung — wer sie am Tresen schaut, tippt beim Zuschauen mit.
const STIMME = {
  stability: +(process.env.STABILITY || 0.35),
  similarity_boost: 0.75,
  style: +(process.env.STYLE || 0.45),
  use_speaker_boost: true,
  speed: +(process.env.SPEED || 1.0),
};

// ------------------------------------------------------------
// Die Szenen: was gesprochen wird, was eingeblendet wird, was passiert.
// Der Text steht auch in docs/mdc-video-ansetzen.md — wer ihn hier ändert,
// ändert ihn bitte dort mit.
// ------------------------------------------------------------
const SZENEN = [
  {
    text: 'Servus! Ab sofort könnt ihr eure Wochenend-Spiele auch auf der Homepage einstellen …',
    einblendung: 'Ranking ansetzen · mdc-ranking.de/admin/ansetzen',
    async tun() { /* nur das Bild stehen lassen */ },
  },
  {
    text: 'Zuerst euer Lokal auswählen.',
    einblendung: '1 · Euer Lokal auswählen',
    async tun(p, h) {
      const f = p.locator('select').first();
      await h.zeigeAuf(f);
      await f.selectOption({ label: 'Ambasador' });
    },
  },
  {
    text: 'Dann den Tag — Freitag, Samstag oder Sonntag, ganz wie ihr es ausmacht.',
    einblendung: '2 · Den Tag wählen',
    async tun(p, h) {
      const f = p.locator('input[type=date]');
      await h.zeigeAuf(f);
      await f.fill(process.env.DEMO_DATUM || '2026-10-24');
    },
  },
  {
    text: 'Den Beginn eintragen. Lasst ihr das Feld leer, gilt eure übliche Zeit.',
    einblendung: '3 · Beginn',
    async tun(p, h) {
      const f = p.locator('input[type=time]');
      await h.zeigeAuf(f);
      await f.fill('18:00');
    },
  },
  {
    text: 'Ein kurzer Hinweis kann dazu — der steht dann beim Termin auf der Seite.',
    einblendung: '4 · Hinweis',
    async tun(p, h) {
      const f = p.locator('input[placeholder^="z. B."]');
      await h.zeigeAuf(f, { klick: true });
      await f.type('Zusatzturnier, Anmeldung bis 17:45', { delay: 50 });
    },
  },
  {
    text: 'Auf Ansetzen tippen, fertig. Ein, zwei Minuten später steht euer Turnier auf der Startseite, im Wochenplan und bei eurem Lokal.',
    einblendung: '5 · Ansetzen — fertig',
    async tun(p, h) {
      await h.zeigeAuf(p.locator('button:has-text("Ansetzen")'), { klick: true });
      await p.locator('.mdc-card-accent').first().waitFor({ timeout: 15000 }).catch(() => {});
    },
  },
  {
    text: 'Vertippt? Jeder Termin lässt sich wieder zurücknehmen.',
    einblendung: 'Zurücknehmen geht immer',
    async tun(p, h) {
      await h.zeigeAuf(p.locator('.mdc-card').filter({ hasText: 'Schon angesetzt' }));
    },
  },
  {
    text: 'Das Passwort bekommt ihr bei der Turnierleitung — meldet euch einfach bei Toni. Absagen und feste Spieltage bleiben bei ihr. Gut Pfeil!',
    einblendung: 'Passwort bei der Turnierleitung',
    async tun(p) {
      await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    },
  },
];

// ------------------------------------------------------------
// ElevenLabs
// ------------------------------------------------------------
function brauchtKey() {
  if (!KEY && process.env.TROCKEN !== '1') {
    console.error('ELEVENLABS_API_KEY fehlt in der Umgebung (Umgebungseinstellungen der Session).');
    process.exit(1);
  }
}

async function api(pfad, init = {}) {
  const r = await fetch('https://api.elevenlabs.io' + pfad, {
    ...init, headers: { 'xi-api-key': KEY, ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r;
}

function trockenTon(text, datei) {
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'lavfi',
    '-i', `sine=frequency=440:duration=${(text.length / 14).toFixed(2)}`, '-q:a', '6', datei]);
}

async function sprich(text, voice, datei) {
  if (process.env.TROCKEN === '1') return trockenTon(text, datei);
  const r = await api(`/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sprechtext(text), model_id: MODELL, language_code: 'de', voice_settings: STIMME }),
  });
  fs.writeFileSync(datei, Buffer.from(await r.arrayBuffer()));
}

function laenge(datei) {
  const r = spawnSync(FFMPEG, ['-i', datei], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
  if (!m) throw new Error('Länge nicht lesbar: ' + datei);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

/** Eine Szene sprechen (oder aus dem Zwischenspeicher holen). */
async function szeneSprechen(szene, voice) {
  const hash = crypto.createHash('sha1')
    .update(JSON.stringify([voice, MODELL, STIMME, sprechtext(szene.text)]))
    .digest('hex').slice(0, 16);
  const datei = path.join(TON, `szene-${hash}.mp3`);
  let neu = 0;
  if (!fs.existsSync(datei)) { await sprich(szene.text, voice, datei); neu = szene.text.length; }
  return { datei, dauer: laenge(datei), neu };
}

// ------------------------------------------------------------
// Aufnahme
// ------------------------------------------------------------
/**
 * Die Freigabe wird ABGEFANGEN.
 *
 * Für das Video soll die grüne Bestätigung zu sehen sein — geschrieben werden
 * darf dabei nichts. Die Server-Aktion geht als POST an dieselbe Adresse wie
 * die Seite; genau diese Anfrage wird hier mit der Antwort beantwortet, die
 * ein geglückter Commit zurückgäbe. Es gibt also weder einen echten Commit
 * noch einen GitHub-Doppelgänger, der dafür laufen müsste.
 */
async function freigabeAbfangen(page) {
  await page.route(URL, async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.continue();
    const antwort = {
      ok: true,
      url: 'https://github.com/andistrehle/MDU/commit/0000000',
      text: 'Ambasador am 2026-10-24 angesetzt.',
    };
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/x-component; charset=utf-8' },
      body: `0:{"a":"$@1","f":"","b":"aufnahme"}\n1:${JSON.stringify(antwort)}\n`,
    });
  });
}

async function hilfsmittel(page) {
  await page.evaluate((mitText) => {
    if (document.getElementById('vid-cursor')) return;
    const z = document.createElement('div');
    z.id = 'vid-cursor';
    z.style.cssText = `position:fixed;z-index:999999;width:26px;height:26px;border-radius:50%;
      background:rgba(214,26,26,.28);border:2px solid #D61A1A;pointer-events:none;
      transform:translate(-50%,-50%);left:50%;top:60%;
      transition:left .55s cubic-bezier(.4,0,.2,1),top .55s cubic-bezier(.4,0,.2,1);`;
    document.body.appendChild(z);
    if (!mitText) return;
    const t = document.createElement('div');
    t.id = 'vid-text';
    t.style.cssText = `position:fixed;z-index:999998;left:0;right:0;bottom:0;padding:16px 18px 22px;
      background:linear-gradient(to top,rgba(10,14,22,.94),rgba(10,14,22,.78) 70%,rgba(10,14,22,0));
      color:#fff;font:600 19px/1.35 system-ui,-apple-system,sans-serif;text-align:center;
      opacity:0;transition:opacity .3s;pointer-events:none;`;
    document.body.appendChild(t);
  }, MIT_TEXT);
}

function helfer(page) {
  return {
    async einblenden(s) {
      if (!MIT_TEXT) return;
      await page.evaluate((s) => {
        const t = document.getElementById('vid-text');
        if (!t) return;
        t.textContent = s; t.style.opacity = s ? '1' : '0';
      }, s);
    },
    async zeigeAuf(locator, { klick = false } = {}) {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(200);
      const box = await locator.boundingBox();
      if (box) {
        await page.evaluate(({ x, y }) => {
          const z = document.getElementById('vid-cursor');
          if (z) { z.style.left = x + 'px'; z.style.top = y + 'px'; }
        }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
        await page.waitForTimeout(600);
      }
      if (klick) {
        await page.evaluate(() => {
          const z = document.getElementById('vid-cursor');
          if (!z) return;
          z.style.transform = 'translate(-50%,-50%) scale(.6)';
          setTimeout(() => { z.style.transform = 'translate(-50%,-50%)'; }, 180);
        });
        await locator.click();
      }
    },
  };
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
    await sprich(process.argv[4] || SZENEN[0].text, voice, datei);
    console.log('Probe:', datei);
    return;
  }

  brauchtKey();
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!voice) { console.error('ELEVENLABS_VOICE_ID setzen (Liste: --stimmen).'); process.exit(1); }

  fs.mkdirSync(TON, { recursive: true });
  fs.mkdirSync(AUSGABE, { recursive: true });
  fs.rmSync(AUFNAHME, { recursive: true, force: true });
  fs.mkdirSync(AUFNAHME, { recursive: true });

  // 1–2: sprechen und messen
  const ton = [];
  let zeichen = 0;
  for (const sz of SZENEN) {
    const t = await szeneSprechen(sz, voice);
    zeichen += t.neu; if (t.neu) process.stdout.write('.');
    ton.push(t);
  }
  console.log(`\nTon fertig (${zeichen} Zeichen neu abgerufen, ${ton.length} Szenen).`);

  // 3: aufnehmen — jede Szene läuft so lange, wie gesprochen wird
  const b = await chromium.launch({
    executablePath: BROWSER,
    // Doppelt so fein aufnehmen; deutsche Sprache, sonst steht im Datumsfeld
    // 10/24/2026 statt 24.10.2026.
    args: ['--force-device-scale-factor=2', '--lang=de-DE'],
    env: { ...process.env, LANG: 'de_DE.UTF-8', LANGUAGE: 'de_DE:de', LC_ALL: 'de_DE.UTF-8' },
  });
  const ctx = await b.newContext({
    viewport: { width: 430, height: 932 },
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    httpCredentials: { username: 'mdc', password: PASSWORT },
    recordVideo: { dir: AUFNAHME, size: { width: 860, height: 1864 } },
  });
  const ctxStart = Date.now();
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e)));
  await freigabeAbfangen(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await hilfsmittel(page);
  const h = helfer(page);

  const start = Date.now();          // ab hier zählen die Szenen
  const marken = [];
  for (const [i, sz] of SZENEN.entries()) {
    marken.push(Date.now() - start);
    await h.einblenden(sz.einblendung);
    await sz.tun(page, h);
    const soll = ton[i].dauer + PAUSE;
    const offen = soll * 1000 - (Date.now() - start - marken[i]);
    if (offen > 0) await page.waitForTimeout(offen);
  }
  const dauer = (Date.now() - start) / 1000;
  await h.einblenden('');
  await page.waitForTimeout(600);
  await ctx.close();
  await b.close();
  console.log('JS-Fehler:', fehler.length ? fehler : 'keine');

  const webm = fs.readdirSync(AUFNAHME).find((f) => f.endsWith('.webm'));
  const versatz = (start - ctxStart) / 1000;
  console.log(`Aufnahme fertig: ${dauer.toFixed(1)} s (Vorlauf ${versatz.toFixed(2)} s).`);

  // 4: Ton exakt darunterlegen
  const ziel = path.join(AUSGABE, MIT_TEXT ? 'MDC-ansetzen.mp4' : 'MDC-ansetzen-ohne-text.mp4');
  const eingaben = ['-ss', versatz.toFixed(3), '-i', path.join(AUFNAHME, webm)];
  const filter = [];
  ton.forEach((t, n) => {
    eingaben.push('-i', t.datei);
    filter.push(`[${n + 1}:a]adelay=${marken[n]}|${marken[n]}[a${n}]`);
  });
  filter.push(`${ton.map((_, n) => `[a${n}]`).join('')}amix=inputs=${ton.length}:normalize=0,loudnorm=I=-16:TP=-1.5[ton]`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...eingaben,
    '-filter_complex', filter.join(';'),
    '-map', '0:v', '-map', '[ton]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-t', (dauer + 0.8).toFixed(2),
    '-movflags', '+faststart', ziel], { stdio: 'inherit' });

  fs.writeFileSync(path.join(AUSGABE, 'szenen.json'), JSON.stringify({
    dauer,
    szenen: SZENEN.map((sz, i) => ({ s: marken[i] / 1000, text: sz.text, einblendung: sz.einblendung })),
  }, null, 1));
  console.log('Fertig:', ziel);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
