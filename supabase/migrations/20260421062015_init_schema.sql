-- =============================================================================
-- Initial schema: profiles, RBAC, CMS tables, audit log.
-- Every table has RLS enabled; policies grant explicit read/write access
-- based on role membership. Service-role bypasses RLS by design — the API
-- proxy must still write audit entries even when a user cannot.
-- =============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('admin', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscriber_status as enum ('pending', 'confirmed', 'unsubscribed');
exception when duplicate_object then null; end $$;

-- updated_at trigger shared across tables with the column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Tables ---------------------------------------------------------------------
-- Create tables first so SECURITY DEFINER helper functions below can
-- reference them at definition time.

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- user_roles
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now()
);

-- RBAC helpers ---------------------------------------------------------------
-- Returns true if the authenticated user owns `target_role`. Used by RLS
-- policies. SECURITY DEFINER so it can read user_roles even when RLS
-- would otherwise block the caller.
create or replace function public.has_role(target_role app_role)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists(
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = target_role
  );
$$;

-- Convenience: is the caller any kind of staff member (editor or admin).
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists(
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'editor')
  );
$$;

-- media
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  alt text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content_markdown text not null default '',
  status content_status not null default 'draft',
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  cover_media_id uuid references public.media(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_status_published_at_idx on public.posts (status, published_at);
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- pages
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- page_blocks
create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  block_type text not null,
  position integer not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, position)
);
create trigger page_blocks_set_updated_at
  before update on public.page_blocks
  for each row execute function public.set_updated_at();

-- newsletters
create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger newsletters_set_updated_at
  before update on public.newsletters
  for each row execute function public.set_updated_at();

-- subscribers
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  status subscriber_status not null default 'pending',
  confirmation_token text,
  subscribed_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  unique (newsletter_id, email)
);

-- navigation
create table if not exists public.navigation (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  position integer not null default 0,
  parent_id uuid references public.navigation(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger navigation_set_updated_at
  before update on public.navigation
  for each row execute function public.set_updated_at();

-- seo_overrides
create table if not exists public.seo_overrides (
  id uuid primary key default gen_random_uuid(),
  route_pattern text not null unique,
  title text,
  description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger seo_overrides_set_updated_at
  before update on public.seo_overrides
  for each row execute function public.set_updated_at();

-- audit_log (immutable)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index audit_log_user_id_idx on public.audit_log (user_id, created_at desc);
create index audit_log_resource_idx on public.audit_log (resource_type, resource_id);

-- Row Level Security ---------------------------------------------------------
-- Every table in the public schema opts in. A missing policy means no access
-- for the anon or authenticated roles (service_role still bypasses).

alter table public.profiles       enable row level security;
alter table public.user_roles     enable row level security;
alter table public.media          enable row level security;
alter table public.posts          enable row level security;
alter table public.pages          enable row level security;
alter table public.page_blocks    enable row level security;
alter table public.newsletters    enable row level security;
alter table public.subscribers    enable row level security;
alter table public.navigation     enable row level security;
alter table public.seo_overrides  enable row level security;
alter table public.audit_log      enable row level security;

-- profiles: read all (display names are public), update own only
create policy "profiles: anyone reads"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "profiles: own update"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles: own insert"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- user_roles: user reads own role; admins read/write all
create policy "user_roles: own read"
  on public.user_roles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_roles: admin reads all"
  on public.user_roles for select
  to authenticated
  using (public.has_role('admin'));

create policy "user_roles: admin manages all"
  on public.user_roles for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- media: public read for already-published references; any authenticated
-- user may upload; uploader or staff may update; staff may delete.
create policy "media: public read"
  on public.media for select
  to anon, authenticated
  using (true);

create policy "media: authenticated insert"
  on public.media for insert
  to authenticated
  with check ((select auth.uid()) = uploaded_by);

create policy "media: owner or staff update"
  on public.media for update
  to authenticated
  using ((select auth.uid()) = uploaded_by or public.is_staff())
  with check ((select auth.uid()) = uploaded_by or public.is_staff());

create policy "media: staff delete"
  on public.media for delete
  to authenticated
  using (public.is_staff());

-- posts: public read published; staff read all; author reads own drafts; staff write.
create policy "posts: public read published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published'
         and (published_at is null or published_at <= now()));

create policy "posts: staff reads all"
  on public.posts for select
  to authenticated
  using (public.is_staff());

create policy "posts: author reads own"
  on public.posts for select
  to authenticated
  using ((select auth.uid()) = author_id);

create policy "posts: staff writes"
  on public.posts for insert
  to authenticated
  with check (public.is_staff());

create policy "posts: staff updates"
  on public.posts for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "posts: admin deletes"
  on public.posts for delete
  to authenticated
  using (public.has_role('admin'));

-- pages: public read published; staff write
create policy "pages: public read published"
  on public.pages for select
  to anon, authenticated
  using (status = 'published'
         and (published_at is null or published_at <= now()));

create policy "pages: staff reads all"
  on public.pages for select
  to authenticated
  using (public.is_staff());

create policy "pages: staff writes"
  on public.pages for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- page_blocks: inherit parent page's visibility (public read when page published)
create policy "page_blocks: public read when page published"
  on public.page_blocks for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_id
        and p.status = 'published'
        and (p.published_at is null or p.published_at <= now())
    )
  );

create policy "page_blocks: staff manages"
  on public.page_blocks for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- newsletters: everyone reads; admins write
create policy "newsletters: public read"
  on public.newsletters for select
  to anon, authenticated
  using (true);

create policy "newsletters: admin writes"
  on public.newsletters for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- subscribers: users may INSERT their own pending subscription (double-opt-in);
-- confirmations and unsubscribes flow through the API proxy with service_role.
-- Only admins may read.
create policy "subscribers: admin reads"
  on public.subscribers for select
  to authenticated
  using (public.has_role('admin'));

create policy "subscribers: anyone inserts pending"
  on public.subscribers for insert
  to anon, authenticated
  with check (status = 'pending');

-- navigation: everyone reads; admins write
create policy "navigation: public read"
  on public.navigation for select
  to anon, authenticated
  using (true);

create policy "navigation: admin writes"
  on public.navigation for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- seo_overrides: everyone reads; admins write
create policy "seo_overrides: public read"
  on public.seo_overrides for select
  to anon, authenticated
  using (true);

create policy "seo_overrides: admin writes"
  on public.seo_overrides for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- audit_log: admins read; nobody mutates. Inserts go via service_role from
-- the API proxy (which bypasses RLS by design). Crucially: no UPDATE/DELETE
-- policies exist, so even service_role WHEN USED BY NON-ADMINS cannot mutate.
-- Service role does bypass RLS entirely though, so operationally we rely on
-- the proxy being the only writer. An immutability trigger below hardens
-- this against accidental mutations.
create policy "audit_log: admin reads"
  on public.audit_log for select
  to authenticated
  using (public.has_role('admin'));

-- Defense-in-depth: forbid UPDATE/DELETE on audit_log for all roles via a
-- trigger. Service role bypasses RLS but not triggers.
create or replace function public.audit_log_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only (% not allowed)', tg_op;
end;
$$;

create trigger audit_log_forbid_update
  before update on public.audit_log
  for each row execute function public.audit_log_immutable();

create trigger audit_log_forbid_delete
  before delete on public.audit_log
  for each row execute function public.audit_log_immutable();

-- Grant usage on sequences so authenticated role can INSERT via server actions.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on public.profiles, public.media, public.posts,
  public.pages, public.page_blocks, public.newsletters, public.subscribers,
  public.navigation, public.seo_overrides, public.audit_log, public.user_roles
  to authenticated;
-- Subscribers: anon may INSERT pending rows (double-opt-in flow).
-- The RLS policy further constrains this to status='pending'.
grant insert on public.subscribers to anon;

-- Default privileges for future tables (new migrations will still need to
-- enable RLS and add policies explicitly).
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
