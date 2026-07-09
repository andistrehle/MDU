// ============================================================
// News-Verwaltung (Browser) — Admin-CRUD über RLS
// ============================================================
//
// Nutzt den öffentlichen anon-Client mit der Admin-Session. Schreibrechte
// erzwingt die Datenbank per RLS (is_admin() = Ligaleitung/Super-Admin),
// nicht der Client — es liegt kein service_role-Key im Frontend.
// ============================================================

import { supabase } from './client';

export type NewsStatus = 'draft' | 'published' | 'archived';

export interface NewsRecord {
  id: string;
  title: string;
  teaser: string;
  source: string | null;
  display_date: string;
  category: string;
  content: string[];
  status: NewsStatus;
  sort_ts: string;
  updated_at: string;
}

export interface NewsInput {
  /** Vorhanden = Bearbeiten, sonst Neuanlage. */
  id?: string;
  title: string;
  teaser: string;
  source: string | null;
  display_date: string;
  category: string;
  content: string[];
  status: NewsStatus;
}

const NOT_CONFIGURED = 'Supabase ist nicht konfiguriert.';

/** Slug aus dem Titel + kurzer Suffix (Kollisionsschutz). */
function makeId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'news';
  return `${slug}-${Date.now().toString(36).slice(-5)}`;
}

/** Alle Meldungen (Admin sieht via RLS auch Entwürfe/Archiv). */
export async function listAllNews(): Promise<{ data: NewsRecord[]; error: string | null }> {
  if (!supabase) return { data: [], error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from('news')
    .select('id,title,teaser,source,display_date,category,content,status,sort_ts,updated_at')
    .order('sort_ts', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as NewsRecord[], error: null };
}

/** Anlegen (ohne id) oder Aktualisieren (mit id). */
export async function saveNews(input: NewsInput, actorId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };

  const base = {
    title: input.title.trim(),
    teaser: input.teaser.trim(),
    source: input.source?.trim() || null,
    display_date: input.display_date.trim(),
    category: input.category.trim() || 'MDU News',
    content: input.content,
    status: input.status,
    updated_by: actorId,
  };

  if (input.id) {
    const { error } = await supabase.from('news').update(base).eq('id', input.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from('news').insert({
    ...base,
    id: makeId(input.title),
    created_by: actorId,
    // sort_ts bleibt Default now() → neue Meldung erscheint oben.
  });
  return { error: error?.message ?? null };
}

/** Status setzen (Entwurf/veröffentlicht/archiviert) ohne Formular. */
export async function setNewsStatus(id: string, status: NewsStatus, actorId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('news').update({ status, updated_by: actorId }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteNews(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('news').delete().eq('id', id);
  return { error: error?.message ?? null };
}
