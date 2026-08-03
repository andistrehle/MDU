-- ============================================================
-- FoodPoints — Initiales Schema
-- UUIDs, created_at/updated_at, Fremdschlüssel, Indizes, RLS.
-- Jeder Nutzer sieht nur seine privaten Daten; globale Lebensmittel
-- sind lesbar, aber nur vom Ersteller/Service änderbar.
-- ============================================================

create extension if not exists "pgcrypto";

-- Gemeinsamer updated_at-Trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------
-- Formel-Versionierung
-- ------------------------------------------------------------
create table public.point_formula_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,               -- z. B. 'fp-v1'
  calorie_factor numeric(8,4) not null,
  saturated_fat_factor numeric(8,4) not null,
  sugar_factor numeric(8,4) not null,
  protein_factor numeric(8,4) not null,
  fiber_factor numeric(8,4) not null,
  protein_cap_grams numeric(8,2),
  fiber_cap_grams numeric(8,2),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.point_formula_versions
  (version, calorie_factor, saturated_fat_factor, sugar_factor, protein_factor, fiber_factor, is_active)
values ('fp-v1', 0.0300, 0.9000, 0.1200, 0.0800, 0.1500, true);

-- ------------------------------------------------------------
-- Profile & Einstellungen
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  birth_year int check (birth_year between 1900 and 2100),
  gender text check (gender in ('female','male','unspecified')),
  height_cm numeric(5,1) check (height_cm between 50 and 300),
  unit text not null default 'kg' check (unit in ('kg','lb')),
  allergies text,
  diet_style text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,1),
  target_weight_kg numeric(5,1),
  activity_level text check (activity_level in ('sedentary','light','moderate','active','very-active')),
  pace_kg_per_week numeric(4,2),
  target_calories int,
  daily_points int,
  weekly_reserve int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_goals_user_idx on public.user_goals(user_id, created_at desc);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  keep_photos_after_analysis boolean not null default false,
  rollover_enabled boolean not null default true,
  max_rollover_per_day int not null default 4,
  manual_daily_points int,
  water_goal_ml int not null default 2000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,1) not null check (weight_kg between 20 and 500),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index weight_entries_user_date_idx on public.weight_entries(user_id, date desc);

-- ------------------------------------------------------------
-- Lebensmittel
-- ------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade, -- null = global
  name text not null,
  brand text,
  barcode text,
  category text not null default 'other',
  is_liquid boolean not null default false,
  is_zero_point boolean not null default false,
  calories numeric(7,1) not null default 0,        -- pro 100 g/ml
  fat numeric(6,2) not null default 0,
  saturated_fat numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  sugar numeric(6,2) not null default 0,
  fiber numeric(6,2) not null default 0,
  protein numeric(6,2) not null default 0,
  salt numeric(6,2) not null default 0,
  default_portion_grams numeric(7,1) not null default 100,
  source text not null default 'user'
    check (source in ('seed','user','openfoodfacts','label-scan','photo-ai','mock')),
  confidence numeric(3,2) not null default 1 check (confidence between 0 and 1),
  warnings text[] not null default '{}',
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index foods_owner_idx on public.foods(owner_id);
create index foods_barcode_idx on public.foods(barcode) where barcode is not null;
create index foods_name_idx on public.foods using gin (to_tsvector('german', name || ' ' || coalesce(brand, '')));
create trigger foods_updated_at before update on public.foods
  for each row execute function public.set_updated_at();

-- Zusätzliche Datenquellen je Lebensmittel (Widerspruchs-Erkennung)
create table public.food_sources (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  source text not null,
  source_ref text,                 -- z. B. OFF-Produktcode
  payload jsonb not null,          -- Rohwerte der Quelle
  conflicts boolean not null default false,
  created_at timestamptz not null default now()
);
create index food_sources_food_idx on public.food_sources(food_id);

create table public.food_portions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  label text not null,
  grams numeric(7,1) not null check (grams > 0),
  created_at timestamptz not null default now()
);
create index food_portions_food_idx on public.food_portions(food_id);

create table public.barcode_mappings (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  food_id uuid not null references public.foods(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (barcode, food_id)
);
create index barcode_mappings_barcode_idx on public.barcode_mappings(barcode);

-- ------------------------------------------------------------
-- Tagebuch
-- ------------------------------------------------------------
create table public.diary_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  water_ml int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index diary_days_user_date_idx on public.diary_days(user_id, date desc);
create trigger diary_days_updated_at before update on public.diary_days
  for each row execute function public.set_updated_at();

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal text not null check (meal in ('breakfast','lunch','dinner','snacks')),
  food_id uuid references public.foods(id) on delete set null,
  recipe_id uuid,
  name text not null,
  brand text,
  grams numeric(7,1) not null check (grams > 0),
  -- Snapshot der Nährwerte für `grams`
  calories numeric(7,1) not null default 0,
  fat numeric(6,2) not null default 0,
  saturated_fat numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  sugar numeric(6,2) not null default 0,
  fiber numeric(6,2) not null default 0,
  protein numeric(6,2) not null default 0,
  salt numeric(6,2) not null default 0,
  points int not null default 0 check (points >= 0),
  zero_point_applied boolean not null default false,
  formula_version text not null references public.point_formula_versions(version),
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index diary_entries_user_date_idx on public.diary_entries(user_id, date desc);
create trigger diary_entries_updated_at before update on public.diary_entries
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Rezepte
-- ------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  servings int not null default 1 check (servings > 0),
  instructions text,
  photo_path text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recipes_user_idx on public.recipes(user_id);
create trigger recipes_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  name text not null,
  grams numeric(7,1) not null check (grams > 0),
  -- Snapshot pro 100 g
  calories numeric(7,1) not null default 0,
  fat numeric(6,2) not null default 0,
  saturated_fat numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  sugar numeric(6,2) not null default 0,
  fiber numeric(6,2) not null default 0,
  protein numeric(6,2) not null default 0,
  salt numeric(6,2) not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id);

-- ------------------------------------------------------------
-- Fotos & Scans
-- ------------------------------------------------------------
create table public.meal_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  diary_entry_id uuid references public.diary_entries(id) on delete set null,
  consent_to_store boolean not null default false,
  delete_after_analysis boolean not null default true,
  created_at timestamptz not null default now()
);
create index meal_photos_user_idx on public.meal_photos(user_id);

create table public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('meal-photo','nutrition-label','barcode')),
  status text not null default 'pending'
    check (status in ('pending','processing','done','failed','confirmed','discarded')),
  provider text,
  result jsonb,
  error text,
  user_feedback text,          -- Nutzerfeedback zur Scan-Qualität (Admin-Auswertung)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scan_jobs_user_idx on public.scan_jobs(user_id, created_at desc);
create index scan_jobs_status_idx on public.scan_jobs(status);
create trigger scan_jobs_updated_at before update on public.scan_jobs
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Favoriten
-- ------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(food_id, recipe_id) = 1),
  unique (user_id, food_id),
  unique (user_id, recipe_id)
);
create index favorites_user_idx on public.favorites(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.point_formula_versions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_settings enable row level security;
alter table public.weight_entries enable row level security;
alter table public.foods enable row level security;
alter table public.food_sources enable row level security;
alter table public.food_portions enable row level security;
alter table public.barcode_mappings enable row level security;
alter table public.diary_days enable row level security;
alter table public.diary_entries enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_photos enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.favorites enable row level security;

-- Formelversionen: für alle lesbar, Änderungen nur via Service-Role
create policy "formula versions readable" on public.point_formula_versions
  for select using (true);

-- Eigene Daten: voller Zugriff nur auf die eigenen Zeilen
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own goals" on public.user_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own weights" on public.weight_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own diary days" on public.diary_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own diary entries" on public.diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recipes" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recipe ingredients" on public.recipe_ingredients
  for all using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "own meal photos" on public.meal_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own scan jobs" on public.scan_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Lebensmittel: global (owner_id null, nicht privat) lesbar für alle
-- angemeldeten Nutzer; eigene Lebensmittel voll editierbar.
create policy "foods readable" on public.foods
  for select using (
    owner_id = auth.uid() or (owner_id is null and is_private = false)
  );
create policy "foods insert own" on public.foods
  for insert with check (owner_id = auth.uid());
create policy "foods update own" on public.foods
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "foods delete own" on public.foods
  for delete using (owner_id = auth.uid());

create policy "food sources readable" on public.food_sources
  for select using (
    exists (
      select 1 from public.foods f
      where f.id = food_id
        and (f.owner_id = auth.uid() or (f.owner_id is null and f.is_private = false))
    )
  );
create policy "food sources own insert" on public.food_sources
  for insert with check (
    exists (select 1 from public.foods f where f.id = food_id and f.owner_id = auth.uid())
  );

create policy "food portions readable" on public.food_portions
  for select using (
    exists (
      select 1 from public.foods f
      where f.id = food_id
        and (f.owner_id = auth.uid() or (f.owner_id is null and f.is_private = false))
    )
  );
create policy "food portions own write" on public.food_portions
  for all using (
    exists (select 1 from public.foods f where f.id = food_id and f.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.foods f where f.id = food_id and f.owner_id = auth.uid())
  );

-- Barcode-Zuordnungen: lesbar für alle angemeldeten Nutzer,
-- anlegen nur für eigene Lebensmittel.
create policy "barcode mappings readable" on public.barcode_mappings
  for select using (auth.uid() is not null);
create policy "barcode mappings insert" on public.barcode_mappings
  for insert with check (
    created_by = auth.uid()
    and exists (select 1 from public.foods f where f.id = food_id and f.owner_id = auth.uid())
  );

-- ------------------------------------------------------------
-- Storage-Bucket für Essensfotos (privat; Zugriff nur Eigentümer)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "meal photos owner read" on storage.objects
  for select using (bucket_id = 'meal-photos' and owner = auth.uid());
create policy "meal photos owner write" on storage.objects
  for insert with check (bucket_id = 'meal-photos' and owner = auth.uid());
create policy "meal photos owner delete" on storage.objects
  for delete using (bucket_id = 'meal-photos' and owner = auth.uid());
