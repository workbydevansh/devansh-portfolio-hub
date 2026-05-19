-- Supabase setup notes:
-- 1. Create one Supabase Auth user manually.
-- 2. Insert that user's id/email into the profiles table with role admin.
-- 3. Keep Supabase Auth signups disabled/invite-only if you want only one owner.
-- 4. This script creates public-read storage buckets and admin-only write policies.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  email text unique not null,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null,
  long_description text,
  tech_stack text[] default '{}',
  github_url text,
  live_url text,
  demo_url text,
  case_study_url text,
  image_url text,
  category text default 'Project',
  featured boolean default false,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issue_date date,
  expiry_date date,
  certificate_url text,
  credential_url text,
  file_path text,
  category text default 'Certificate',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  achievement_date date,
  category text default 'General',
  proof_url text,
  rank_or_result text,
  organization text,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.achievement_links (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid references public.achievements(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz default now()
);

create table if not exists public.achievement_certificates (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid references public.achievements(id) on delete cascade,
  certificate_id uuid references public.certificates(id) on delete cascade,
  created_at timestamptz default now(),
  unique (achievement_id, certificate_id)
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  display_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.coding_stats (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique,
  username text not null,
  rating int,
  max_rating int,
  rank text,
  max_rank text,
  solved_count int default 0,
  easy_solved int default 0,
  medium_solved int default 0,
  hard_solved int default 0,
  contest_count int default 0,
  global_ranking int,
  last_updated timestamptz,
  raw_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.portfolio_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz default now()
);

create index if not exists projects_featured_idx on public.projects (featured);
create index if not exists projects_category_idx on public.projects (category);
create index if not exists achievements_category_idx on public.achievements (category);
create index if not exists certificates_category_idx on public.certificates (category);
create index if not exists coding_stats_platform_idx on public.coding_stats (platform);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_certificates_updated_at on public.certificates;
create trigger set_certificates_updated_at
before update on public.certificates
for each row
execute function public.set_updated_at();

drop trigger if exists set_achievements_updated_at on public.achievements;
create trigger set_achievements_updated_at
before update on public.achievements
for each row
execute function public.set_updated_at();

drop trigger if exists set_coding_stats_updated_at on public.coding_stats;
create trigger set_coding_stats_updated_at
before update on public.coding_stats
for each row
execute function public.set_updated_at();

drop trigger if exists set_portfolio_settings_updated_at on public.portfolio_settings;
create trigger set_portfolio_settings_updated_at
before update on public.portfolio_settings
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.certificates enable row level security;
alter table public.achievements enable row level security;
alter table public.achievement_links enable row level security;
alter table public.achievement_certificates enable row level security;
alter table public.social_links enable row level security;
alter table public.coding_stats enable row level security;
alter table public.portfolio_settings enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
drop policy if exists "Public can read projects" on public.projects;
drop policy if exists "Admins can insert projects" on public.projects;
drop policy if exists "Admins can update projects" on public.projects;
drop policy if exists "Admins can delete projects" on public.projects;
drop policy if exists "Public can read certificates" on public.certificates;
drop policy if exists "Admins can insert certificates" on public.certificates;
drop policy if exists "Admins can update certificates" on public.certificates;
drop policy if exists "Admins can delete certificates" on public.certificates;
drop policy if exists "Public can read achievements" on public.achievements;
drop policy if exists "Admins can insert achievements" on public.achievements;
drop policy if exists "Admins can update achievements" on public.achievements;
drop policy if exists "Admins can delete achievements" on public.achievements;
drop policy if exists "Public can read achievement links" on public.achievement_links;
drop policy if exists "Admins can insert achievement links" on public.achievement_links;
drop policy if exists "Admins can update achievement links" on public.achievement_links;
drop policy if exists "Admins can delete achievement links" on public.achievement_links;
drop policy if exists "Public can read achievement certificates" on public.achievement_certificates;
drop policy if exists "Admins can insert achievement certificates" on public.achievement_certificates;
drop policy if exists "Admins can update achievement certificates" on public.achievement_certificates;
drop policy if exists "Admins can delete achievement certificates" on public.achievement_certificates;
drop policy if exists "Public can read social links" on public.social_links;
drop policy if exists "Admins can insert social links" on public.social_links;
drop policy if exists "Admins can update social links" on public.social_links;
drop policy if exists "Admins can delete social links" on public.social_links;
drop policy if exists "Public can read coding stats" on public.coding_stats;
drop policy if exists "Admins can insert coding stats" on public.coding_stats;
drop policy if exists "Admins can update coding stats" on public.coding_stats;
drop policy if exists "Admins can delete coding stats" on public.coding_stats;
drop policy if exists "Public can read portfolio settings" on public.portfolio_settings;
drop policy if exists "Admins can insert portfolio settings" on public.portfolio_settings;
drop policy if exists "Admins can update portfolio settings" on public.portfolio_settings;
drop policy if exists "Admins can delete portfolio settings" on public.portfolio_settings;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Admins can insert profiles"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete profiles"
on public.profiles
for delete
to authenticated
using (public.is_admin());

create policy "Public can read projects"
on public.projects
for select
to anon, authenticated
using (true);

create policy "Admins can insert projects"
on public.projects
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update projects"
on public.projects
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete projects"
on public.projects
for delete
to authenticated
using (public.is_admin());

create policy "Public can read certificates"
on public.certificates
for select
to anon, authenticated
using (true);

create policy "Admins can insert certificates"
on public.certificates
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update certificates"
on public.certificates
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete certificates"
on public.certificates
for delete
to authenticated
using (public.is_admin());

create policy "Public can read achievements"
on public.achievements
for select
to anon, authenticated
using (true);

create policy "Admins can insert achievements"
on public.achievements
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update achievements"
on public.achievements
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete achievements"
on public.achievements
for delete
to authenticated
using (public.is_admin());

create policy "Public can read achievement links"
on public.achievement_links
for select
to anon, authenticated
using (true);

create policy "Admins can insert achievement links"
on public.achievement_links
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update achievement links"
on public.achievement_links
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete achievement links"
on public.achievement_links
for delete
to authenticated
using (public.is_admin());

create policy "Public can read achievement certificates"
on public.achievement_certificates
for select
to anon, authenticated
using (true);

create policy "Admins can insert achievement certificates"
on public.achievement_certificates
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update achievement certificates"
on public.achievement_certificates
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete achievement certificates"
on public.achievement_certificates
for delete
to authenticated
using (public.is_admin());

create policy "Public can read social links"
on public.social_links
for select
to anon, authenticated
using (true);

create policy "Admins can insert social links"
on public.social_links
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update social links"
on public.social_links
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete social links"
on public.social_links
for delete
to authenticated
using (public.is_admin());

create policy "Public can read coding stats"
on public.coding_stats
for select
to anon, authenticated
using (true);

create policy "Admins can insert coding stats"
on public.coding_stats
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update coding stats"
on public.coding_stats
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete coding stats"
on public.coding_stats
for delete
to authenticated
using (public.is_admin());

create policy "Public can read portfolio settings"
on public.portfolio_settings
for select
to anon, authenticated
using (true);

create policy "Admins can insert portfolio settings"
on public.portfolio_settings
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update portfolio settings"
on public.portfolio_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete portfolio settings"
on public.portfolio_settings
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'certificates',
    'certificates',
    true,
    10485760,
    array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']::text[]
  ),
  (
    'project-images',
    'project-images',
    true,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp']::text[]
  ),
  (
    'resume',
    'resume',
    true,
    10485760,
    array['application/pdf']::text[]
  ),
  (
    'site-assets',
    'site-assets',
    true,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp']::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read portfolio storage objects" on storage.objects;
drop policy if exists "Admins can upload portfolio storage objects" on storage.objects;
drop policy if exists "Admins can update portfolio storage objects" on storage.objects;
drop policy if exists "Admins can delete portfolio storage objects" on storage.objects;

create policy "Public can read portfolio storage objects"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id in ('certificates', 'project-images', 'resume', 'site-assets')
);

create policy "Admins can upload portfolio storage objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('certificates', 'project-images', 'resume', 'site-assets')
  and public.is_admin()
);

create policy "Admins can update portfolio storage objects"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('certificates', 'project-images', 'resume', 'site-assets')
  and public.is_admin()
)
with check (
  bucket_id in ('certificates', 'project-images', 'resume', 'site-assets')
  and public.is_admin()
);

create policy "Admins can delete portfolio storage objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('certificates', 'project-images', 'resume', 'site-assets')
  and public.is_admin()
);
