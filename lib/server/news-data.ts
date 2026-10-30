// ============================================================
// News lesen (serverseitig) — DB-first mit statischem Fallback
// ============================================================
//
// Öffentliche Seiten (Startseite, /news) rendern serverseitig. Diese Helper
// liest die veröffentlichten News aus Supabase (anon-Client → RLS gibt nur
// status='published' frei). Solange die Tabelle fehlt/nicht migriert ist oder
// die Abfrage fehlschlägt, bleibt der statische Bestand aus lib/data/news.ts
// sichtbar — die Seite sieht dann aus wie zuvor.
//
// Ist die Tabelle vorhanden, aber leer (Admin hat alles archiviert/gelöscht),
// wird bewusst NICHT auf den statischen Bestand zurückgefallen, sondern eine
// leere Liste geliefert (dann ist die DB die Quelle).
// ============================================================

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NEWS_ARTICLES, type NewsArticle } from '@/lib/data/news';

interface NewsRow {
  id: string;
  title: string;
  teaser: string;
  source: string | null;
  display_date: string;
  category: string;
  content: string[] | null;
}

function rowToArticle(r: NewsRow): NewsArticle {
  return {
    id: r.id,
    title: r.title,
    teaser: r.teaser,
    source: r.source ?? 'Münchner Dart Union',
    date: r.display_date,
    category: r.category,
    content: Array.isArray(r.content) ? r.content : [],
  };
}

/** Veröffentlichte News (neueste zuerst). Statischer Fallback bei fehlender/
 *  nicht migrierter Tabelle oder Konfigurations-/Abfragefehler. */
export async function getPublishedNews(): Promise<NewsArticle[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NEWS_ARTICLES;

  try {
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client
      .from('news')
      .select('id,title,teaser,source,display_date,category,content')
      .eq('status', 'published')
      .order('sort_ts', { ascending: false });

    // Fehler (z. B. Tabelle existiert noch nicht) → alter Zustand bleibt sichtbar.
    if (error) return NEWS_ARTICLES;
    // Erfolg (auch 0 Zeilen) → DB ist die Quelle.
    return (data ?? []).map(rowToArticle);
  } catch {
    return NEWS_ARTICLES;
  }
}

const ZWEI_WOCHEN_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Startseite (Betreiber, 30.10.2026): höchstens 4 Meldungen — die 4. nur, wenn
 * sie nicht älter als zwei Wochen ist, sonst die 3 neuesten.
 */
function startseitenAuswahl<T extends { sort_ts: string }>(rows: T[]): T[] {
  const vierte = rows[3] ? Date.parse(rows[3].sort_ts) : NaN;
  return rows.slice(0, !Number.isNaN(vierte) && vierte >= Date.now() - ZWEI_WOCHEN_MS ? 4 : 3);
}

/**
 * News für die Startseite: die 3 neuesten, die 4. nur, wenn sie höchstens zwei
 * Wochen alt ist. Statischer Fallback (die 3 neuesten) bei fehlender/nicht
 * migrierter Tabelle.
 */
export async function getHomepageNews(): Promise<NewsArticle[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NEWS_ARTICLES.slice(0, 3);

  try {
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client
      .from('news')
      .select('id,title,teaser,source,display_date,category,content,sort_ts')
      .eq('status', 'published')
      .order('sort_ts', { ascending: false });

    if (error) return NEWS_ARTICLES.slice(0, 3);
    const rows = (data ?? []) as (NewsRow & { sort_ts: string })[];
    return startseitenAuswahl(rows).map(rowToArticle);
  } catch {
    return NEWS_ARTICLES.slice(0, 3);
  }
}
