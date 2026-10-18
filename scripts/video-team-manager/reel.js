// ============================================================
// Hochformat (1080×1920) für Instagram: Reel + Story aus dem fertigen Video
// ============================================================
// Voraussetzung: vertonen.js ist gelaufen (ausgabe/MDU-was-ist-neu.mp4 und
// ausgabe/szenen.json mit Szenen- und Satzanfängen). Kostet nichts.
//
//   NODE_PATH=/opt/node22/lib/node_modules node reel.js
//   → ausgabe/MDU-reel.mp4  (ausgewählte Szenen, ~75 s)
//   → ausgabe/MDU-story.mp4 (Begrüßung + Schlusskarte für den Link-Sticker)
//
// Das Querformat wird oben (ohne seinen kleinen Untertitel) eingesetzt, der
// Satz steht groß darunter — am Handy wäre der Original-Untertitel zu klein.
// ============================================================
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const DIR = __dirname;
const AUS = path.join(DIR, 'ausgabe');
const QUELLE = path.join(AUS, 'MDU-was-ist-neu.mp4');
const TMP = path.join(DIR, 'aufnahme', 'reel');
const FFMPEG = (() => { try { return require(path.join(DIR, 'node_modules/ffmpeg-static')); } catch { return 'ffmpeg'; } })();
const VORLAUF = 0.45; // Szenenwechsel vor dem ersten Satz (wie in vertonen.js)

// Welche Szenen (Index in SZENEN) in welches Format kommen.
const FORMATE = {
  reel: { szenen: [0, 5, 6, 10, 12], schluss: 0 },
  story: { szenen: [0], schluss: 5 }, // + 5 s Schlusskarte mit Platz für den Link-Sticker
};

// Bildaufbau (px im 1080×1920-Bild)
const VID = { x: 40, y: 560, w: 1000 };           // Querformat-Ausschnitt
const CROP_H = 890;                                // vom 1920×1080 nur oben bis über den Untertitel
VID.h = Math.round(VID.w * CROP_H / 1920 / 2) * 2;
const SUB = { y: VID.y + VID.h + 50, h: 420 };     // großer Untertitel darunter

const css = `
  <link href="file://${path.join(DIR, 'fonts.css')}" rel="stylesheet">
  <style>
    * { box-sizing:border-box; margin:0; }
    html, body { width:1080px; height:1920px; font-family:Manrope, sans-serif; }
    .tc { font-family:'Saira Condensed'; font-weight:900; text-transform:uppercase; letter-spacing:.02em; line-height:1; }
  </style>`;
const LOGO = 'file://' + path.join(DIR, '../../public/mdu-logo.webp');

const rahmen = `<html><head>${css}</head><body style="background:#F2F4F7">
  <div style="position:absolute;inset:0;background:radial-gradient(70% 50% at 80% 85%, rgba(78,125,189,.14), transparent 70%)"></div>
  <div style="position:absolute;left:0;right:0;top:0;height:${VID.y - 60}px;background:linear-gradient(135deg,#6B95CE,#4E7DBD);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;color:#fff;padding-top:60px">
    <img src="${LOGO}" style="width:250px">
    <div class="tc" style="font-size:118px">Was ist neu?</div>
    <div style="font-size:36px;font-weight:700;opacity:.95">Die MDU-Homepage zur Saison 2026/27</div>
  </div>
  <div style="position:absolute;left:${VID.x - 8}px;top:${VID.y - 8}px;width:${VID.w + 16}px;height:${VID.h + 16}px;border-radius:22px;background:#fff;box-shadow:0 24px 60px rgba(15,23,42,.25)"></div>
  <div style="position:absolute;left:0;right:0;top:1500px;text-align:center">
    <div style="font-size:38px;font-weight:800;color:#1A1D24">Ganzes Video auf <span style="color:#3E9C33">mdudarts.de</span></div>
    <div style="font-size:30px;font-weight:700;color:#5C6470;margin-top:12px">@muenchnerdartunion</div>
  </div>
</body></html>`;

const untertitel = (u) => `<html><head>${css}</head><body style="background:transparent">
  <div style="position:absolute;left:50px;right:50px;top:0;height:${SUB.h}px;display:flex;align-items:flex-start;justify-content:center">
    <div style="padding:26px 34px;border-radius:22px;background:rgba(26,29,36,.92);color:#fff;font-size:50px;font-weight:800;line-height:1.28;text-align:center;box-shadow:0 14px 34px rgba(15,23,42,.25)">${u}</div>
  </div></body></html>`;

const schlusskarte = `<html><head>${css}</head><body style="background:linear-gradient(160deg,#6B95CE,#4E7DBD);color:#fff">
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center;padding:0 80px">
    <img src="${LOGO}" style="width:320px">
    <div class="tc" style="font-size:120px">Das ganze Video</div>
    <div style="font-size:48px;font-weight:800;line-height:1.3">3 Minuten – alles Neue<br>auf der Homepage</div>
    <div style="margin-top:40px;width:640px;height:150px;border:5px dashed rgba(255,255,255,.7);border-radius:30px;display:grid;place-items:center;font-size:40px;font-weight:800">👆 Link antippen</div>
    <div style="font-size:38px;font-weight:700;opacity:.95">mdudarts.de</div>
  </div></body></html>`;

async function bilder(seiten) {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [html, datei, hoehe] of seiten) {
    const f = path.join(TMP, 'seite.html'); fs.writeFileSync(f, html);
    await p.goto('file://' + f); await p.waitForTimeout(300);
    await p.screenshot({ path: datei, omitBackground: true, clip: { x: 0, y: 0, width: 1080, height: hoehe || 1920 } });
  }
  await b.close();
}

async function baue(name, { szenen, schluss }, info) {
  // Abschnitte im Original und die Untertitel auf der neuen Zeitachse
  const alle = info.szenen;
  const abschnitte = []; const subs = []; let t = 0;
  for (const i of szenen) {
    const a = Math.max(0, alle[i].s - VORLAUF);
    const b = i + 1 < alle.length ? alle[i + 1].s - VORLAUF : info.dauer + 0.8;
    alle[i].saetze.forEach((x, j) => {
      const ende = j + 1 < alle[i].saetze.length ? alle[i].saetze[j + 1].s : b - 0.15;
      subs.push({ u: x.u, von: +(t + x.s - a).toFixed(3), bis: +(t + ende - a).toFixed(3) });
    });
    abschnitte.push({ a, b }); t += b - a;
  }
  const gesamt = t + schluss;

  const seiten = [[rahmen, path.join(TMP, `${name}-rahmen.png`)]];
  subs.forEach((s, n) => seiten.push([untertitel(s.u), path.join(TMP, `${name}-sub${n}.png`), SUB.h]));
  if (schluss) seiten.push([schlusskarte, path.join(TMP, `${name}-schluss.png`)]);
  await bilder(seiten);

  // Schritt 1: jede Szene einzeln ausschneiden (alles in einem Filter puffert
  // ffmpeg das ganze Video → Speicher voll), dann aneinanderhängen.
  const teile = abschnitte.map(({ a, b }, k) => {
    const d = b - a, ziel = path.join(TMP, `${name}-teil${k}.mp4`);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', a.toFixed(3), '-i', QUELLE, '-t', d.toFixed(3),
      '-vf', `crop=1920:${CROP_H}:0:0,scale=${VID.w}:${VID.h},fps=30`,
      '-af', `afade=t=in:d=0.05,afade=t=out:st=${(d - 0.08).toFixed(3)}:d=0.08`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', ziel]);
    return ziel;
  });
  const liste = path.join(TMP, `${name}-liste.txt`);
  fs.writeFileSync(liste, teile.map(x => `file '${x}'`).join('\n'));
  const kurz = path.join(TMP, `${name}-kurz.mp4`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', kurz]);

  // Schritt 2: in den Hochformat-Rahmen setzen, Untertitel darüber
  const ein = ['-loop', '1', '-t', gesamt.toFixed(2), '-i', seiten[0][1], '-i', kurz];
  const f = [];
  f.push(`[1:v]setpts=PTS-STARTPTS[qv]`); f.push(`[1:a]asetpts=PTS-STARTPTS[qa]`);
  f.push(`[0:v]scale=1080:1920,setsar=1,fps=30[bg]`);
  f.push(`[bg][qv]overlay=${VID.x}:${VID.y}:eof_action=pass[l0]`);
  let letzte = 'l0', nr = 2;
  subs.forEach((s, n) => {
    ein.push('-loop', '1', '-t', gesamt.toFixed(2), '-i', seiten[n + 1][1]);
    f.push(`[${letzte}][${nr}:v]overlay=0:${SUB.y}:enable='between(t,${s.von},${s.bis})'[l${n + 1}]`);
    letzte = `l${n + 1}`; nr++;
  });
  if (schluss) {
    ein.push('-loop', '1', '-t', gesamt.toFixed(2), '-i', seiten.at(-1)[1]);
    f.push(`[${letzte}][${nr}:v]overlay=0:0:enable='gte(t,${t.toFixed(3)})'[lend]`);
    letzte = 'lend';
  }
  f.push(`[qa]apad[ton]`);
  const ziel = path.join(AUS, `MDU-${name}.mp4`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...ein, '-filter_complex', f.join(';'),
    '-map', `[${letzte}]`, '-map', '[ton]', '-t', gesamt.toFixed(2), '-r', '30',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', ziel], { stdio: 'inherit' });
  console.log(`${name}: ${gesamt.toFixed(1)} s → ${ziel}`);
}

(async () => {
  const info = JSON.parse(fs.readFileSync(path.join(AUS, 'szenen.json'), 'utf8'));
  fs.mkdirSync(TMP, { recursive: true });
  for (const [name, cfg] of Object.entries(FORMATE)) await baue(name, cfg, info);
})().catch(e => { console.error(e.message); process.exit(1); });
