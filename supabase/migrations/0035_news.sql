-- ============================================================
-- MDU Platform — Migration 0035: News (Aktuelles) DB-gestützt
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0034).
--
-- News werden bisher aus dem Code (lib/data/news.ts) geladen. Diese Migration
-- legt die Tabelle an, damit die Ligaleitung News im Admin-Bereich selbst
-- verwalten kann (Anlegen/Bearbeiten/Veröffentlichen/Archivieren/Löschen).
--
-- Übernahme der bestehenden Meldungen per Seed-Script (idempotent, additiv):
--   npx tsx scripts/seed-news.mts
--
-- Lese-Logik (lib/server/news-data.ts): solange die Tabelle FEHLT/nicht migriert
-- ist bzw. die Abfrage fehlschlägt, bleibt der statische Bestand sichtbar
-- („sieht aus wie vorher"). Ist die Tabelle vorhanden, aber LEER (alles
-- archiviert/gelöscht ODER Migration ohne Seed), zeigt „Aktuelles"/„/news"
-- bewusst nichts an — dann ist die DB die Quelle. Daher NACH dem Einspielen
-- unbedingt das Seed ausführen: npx tsx scripts/seed-news.mts
--
-- Sicherheit (RLS):
--   • Lesen: öffentlich nur status='published'; Ligaleitung/Admin sieht alle.
--   • Schreiben: nur Ligaleitung/Super-Admin (is_admin()).
-- ============================================================

create table if not exists public.news (
  id            text primary key,                    -- Slug
  title         text not null,
  teaser        text not null default '',
  source        text,
  display_date  text not null default '',            -- Anzeige-Datum (Freitext, z. B. "06.07.2026" oder "2026")
  category      text not null default 'MDU News',
  content       text[] not null default '{}',        -- Absätze (Markdown-Fett **…** wird gerendert)
  status        text not null default 'draft'
                check (status in ('draft', 'published', 'archived')),
  sort_ts       timestamptz not null default now(),  -- Sortierung (neueste zuerst); neue Meldungen landen oben
  created_by    uuid references auth.users (id),
  updated_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.news is
  'Redaktionelle News/Aktuelles. Öffentlich nur veröffentlichte; Pflege durch die Ligaleitung.';

create index if not exists news_status_sort_idx on public.news (status, sort_ts desc);

drop trigger if exists news_updated_at on public.news;
create trigger news_updated_at before update on public.news
  for each row execute function public.handle_updated_at();

alter table public.news enable row level security;

-- Lesen: öffentlich nur veröffentlichte Meldungen; Admin/Ligaleitung sieht alle.
drop policy if exists "news_read_published" on public.news;
create policy "news_read_published" on public.news for select
  using (status = 'published' or public.is_admin());

-- Schreiben (insert/update/delete): nur Ligaleitung/Super-Admin.
drop policy if exists "news_write_admin" on public.news;
create policy "news_write_admin" on public.news for all
  using (public.is_admin()) with check (public.is_admin());
