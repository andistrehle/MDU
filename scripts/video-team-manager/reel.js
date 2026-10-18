// ============================================================
// Instagram: Reel + Story aus der Hochformat-Aufnahme (nur Handy)
// ============================================================
// Voraussetzung: vertonen.js ist gelaufen (ausgabe/MDU-team-manager-hoch.mp4 und
// ausgabe/szenen.json). Kostet nichts.
//
//   node reel.js
//   → ausgabe/MDU-team-manager-reel.mp4  (ganzes Video hochkant, < 3 min = Reel-Grenze)
//   → ausgabe/MDU-team-manager-story.mp4 (Anreißer: Intro, Scheibe, Preis, Abspann)
// ============================================================
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const AUS = path.join(DIR, 'ausgabe');
const HOCH = path.join(AUS, 'MDU-team-manager-hoch.mp4');
const TMP = path.join(DIR, 'aufnahme', 'reel');
const FFMPEG = (() => { try { return require(path.join(DIR, 'node_modules/ffmpeg-static')); } catch { return 'ffmpeg'; } })();
const VORLAUF = 0.45; // Szenenwechsel vor dem ersten Satz (wie in vertonen.js)
const STORY = [0, 2, 14, 15]; // Szenen-Index in SZENEN: Intro, Team-Scheibe, Preis, Abspann

const info = JSON.parse(fs.readFileSync(path.join(AUS, 'szenen.json'), 'utf8'));
fs.mkdirSync(TMP, { recursive: true });

// Reel = das ganze Hochformat-Video
fs.copyFileSync(HOCH, path.join(AUS, 'MDU-team-manager-reel.mp4'));
console.log(`reel: ${info.dauer.toFixed(1)} s`);

// Story: Szenen einzeln ausschneiden (alles in einem Filter sprengt den Speicher), dann aneinander
const alle = info.szenen;
const teile = STORY.map((i, k) => {
  const a = Math.max(0, alle[i].s - VORLAUF);
  const b = i + 1 < alle.length ? alle[i + 1].s - VORLAUF : info.dauer + 0.8;
  const d = b - a, ziel = path.join(TMP, `story-${k}.mp4`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', a.toFixed(3), '-i', HOCH, '-t', d.toFixed(3),
    '-af', `afade=t=in:d=0.05,afade=t=out:st=${(d - 0.08).toFixed(3)}:d=0.08`, '-vf', 'fps=30',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', ziel]);
  return { ziel, d };
});
const liste = path.join(TMP, 'story-liste.txt');
fs.writeFileSync(liste, teile.map(t => `file '${t.ziel}'`).join('\n'));
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', '-movflags', '+faststart', path.join(AUS, 'MDU-team-manager-story.mp4')]);
console.log(`story: ${teile.reduce((x, t) => x + t.d, 0).toFixed(1)} s`);
