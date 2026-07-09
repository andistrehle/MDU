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
