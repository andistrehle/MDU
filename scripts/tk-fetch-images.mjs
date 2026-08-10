#!/usr/bin/env node
// ============================================================
// Bilder von tennis-kail.de holen und einbinden
// ============================================================
//
// Das Skript crawlt www.tennis-kail.de (nur diese Domain, nur HTML-Seiten),
// sammelt alle <img>-Quellen und CSS-Hintergrundbilder, lädt sie nach
// public/tk/original/ und schreibt data/tk/original-images.json.
//
// Danach zeigt die Demo überall dort echte Fotos, wo ein Bild inhaltlich
// zum Bildplatz passt (Zuordnung über Schlüsselwörter in data/tk/images.ts).
// Ohne Manifest zeichnet die Anwendung eigene Grafiken — es werden nie
// Stockfotos eingesetzt.
//
// Aufruf:   node scripts/tk-fetch-images.mjs
// Optionen: --limit=40   maximale Anzahl Bilder
//           --pages=25   maximale Anzahl Seiten
//
// Hinweis zur Rechtelage: Die Bilder gehören dem Betreiber. Das Manifest
// hält für jedes Bild die Ursprungs-URL fest, damit die Herkunft belegbar
// bleibt. Vor einer Veröffentlichung ist die Freigabe einzuholen.
// ============================================================

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'tk', 'original');
const MANIFEST = path.join(ROOT, 'data', 'tk', 'original-images.json');

const ORIGIN = 'https://www.tennis-kail.de';
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
};
const MAX_IMAGES = arg('limit', 40);
const MAX_PAGES = arg('pages', 25);

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)(\?|$)/i;

/** Nur Seiten der Zieldomain, keine Downloads, keine Mail-Links. */
function sameSite(url) {
  try {
    const u = new URL(url, ORIGIN);
    return u.hostname.endsWith('tennis-kail.de') && (u.protocol === 'https:' || u.protocol === 'http:');
  } catch {
    return false;
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'tennis-kail-demo-imagefetch/1.0 (Abstimmung mit dem Betreiber)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('text/html')) return null;
  return res.text();
}

function collect(html, pageUrl) {
  const links = new Set();
  const images = new Map(); // url -> keywords

  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;
    if (sameSite(href)) links.add(new URL(href, pageUrl).toString().split('#')[0]);
  }

  for (const m of html.matchAll(/<img[^>]*>/gi)) {
    const tag = m[0];
    const src = /src=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!src) continue;
    const alt = /alt=["']([^"']*)["']/i.exec(tag)?.[1] ?? '';
    const abs = new URL(src, pageUrl).toString();
    if (!IMAGE_EXT.test(abs)) continue;
    images.set(abs, `${alt} ${src}`.toLowerCase());
  }

  for (const m of html.matchAll(/url\((['"]?)([^)'"]+)\1\)/gi)) {
    const src = m[2];
    if (!IMAGE_EXT.test(src)) continue;
    const abs = new URL(src, pageUrl).toString();
    if (!images.has(abs)) images.set(abs, src.toLowerCase());
  }

  return { links, images };
}

/** Maße aus den ersten Bytes lesen — ohne zusätzliche Abhängigkeit. */
function dimensions(buf) {
  // PNG
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf.length > 10 && buf[0] === 0x47 && buf[1] === 0x49) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // JPEG: SOF-Marker suchen
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return { width: 1600, height: 1067 };
}

async function main() {
  const seen = new Set([ORIGIN + '/']);
  const queue = [ORIGIN + '/'];
  const found = new Map();
  let pages = 0;

  while (queue.length && pages < MAX_PAGES) {
    const url = queue.shift();
    pages++;
    let html;
    try {
      html = await fetchText(url);
    } catch (err) {
      console.warn(`  Seite übersprungen: ${url} — ${err.message}`);
      continue;
    }
    if (!html) continue;
    console.log(`Gelesen: ${url}`);
    const { links, images } = collect(html, url);
    for (const [src, keywords] of images) if (!found.has(src)) found.set(src, keywords);
    for (const l of links) {
      if (!seen.has(l) && seen.size < MAX_PAGES * 3) {
        seen.add(l);
        queue.push(l);
      }
    }
  }

  console.log(`\n${found.size} Bilder gefunden, lade bis zu ${MAX_IMAGES}.`);
  await mkdir(OUT_DIR, { recursive: true });

  const images = [];
  let i = 0;
  for (const [src, keywords] of found) {
    if (images.length >= MAX_IMAGES) break;
    i++;
    try {
      const res = await fetch(src, { redirect: 'follow' });
      if (!res.ok) throw new Error(`${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 4000) continue; // Logos, Spacer, Icons überspringen
      const ext = (IMAGE_EXT.exec(src)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
      const base = path.basename(new URL(src).pathname).replace(/\.[^.]+$/, '');
      const file = `${String(i).padStart(2, '0')}-${base.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.${ext}`;
      await writeFile(path.join(OUT_DIR, file), buf);
      const { width, height } = dimensions(buf);
      images.push({
        src: `/tk/original/${file}`,
        width,
        height,
        sourceUrl: src,
        keywords: [...new Set(`${keywords} ${base}`.toLowerCase().split(/[^a-z0-9äöüß]+/).filter((w) => w.length > 2))],
      });
      console.log(`  ✓ ${file} (${width}×${height})`);
    } catch (err) {
      console.warn(`  ✗ ${src} — ${err.message}`);
    }
  }

  await writeFile(
    MANIFEST,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        note:
          images.length > 0
            ? `${images.length} Originalbilder von tennis-kail.de. Rechte liegen beim Betreiber; Herkunft je Bild in sourceUrl.`
            : 'Kein Bild geladen — Netzzugang prüfen.',
        images,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`\nManifest geschrieben: ${path.relative(ROOT, MANIFEST)} (${images.length} Bilder)`);
  if (images.length === 0) {
    console.log('Hinweis: Ohne Originale zeichnet die Demo eigene Grafiken. Das ist beabsichtigt.');
  }
}

main().catch((err) => {
  console.error('Abbruch:', err.message);
  process.exit(1);
});
