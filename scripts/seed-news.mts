// ============================================================
// Seed: bestehende News (lib/data/news.ts) in die DB übernehmen
// ============================================================
//
// Idempotent/additiv: legt fehlende Meldungen als 'published' an, lässt
// bereits vorhandene (gleiche id) UNVERÄNDERT — spätere Admin-Änderungen
// werden also nicht überschrieben (kann gefahrlos erneut laufen).
//
// Start (aus Repo-Root):  npx tsx scripts/seed-news.mts
// Braucht .env.local mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { NEWS_ARTICLES } from '../lib/data/news';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('ENV fehlt (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'); process.exit(1); }

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Reihenfolge des statischen Bestands beibehalten (Index 0 = neueste, ganz oben).
// Anker knapp unter „heute", damit künftige Admin-Meldungen (sort_ts = now())
// automatisch darüber erscheinen.
const BASE = Date.UTC(2026, 6, 6, 12, 0, 0); // 2026-07-06 12:00 UTC
const DAY = 86_400_000;

const rows = NEWS_ARTICLES.map((a, i) => ({
  id: a.id,
  title: a.title,
  teaser: a.teaser,
  source: a.source,
  display_date: a.date,
  category: a.category,
  content: a.content,
  status: 'published',
  sort_ts: new Date(BASE - i * DAY).toISOString(),
}));

const { data, error } = await admin
  .from('news')
  .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  .select('id');

if (error) { console.error('FEHLER:', error.message); process.exit(1); }
console.log(`News-Seed ok: ${data?.length ?? 0} neu angelegt, ${rows.length - (data?.length ?? 0)} bereits vorhanden (übersprungen).`);
process.exit(0);
