-- Global profile + app access tables for Supabase Auth users.
-- auth.users.id is the stable identity key across apps.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id text not null default 'agent-workspace',
  role text not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, app_id, role)
);

create table if not exists public.app_access (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id text not null,
  granted_at timestamptz not null default now(),
  unique (user_id, app_id)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.app_access enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "user_roles_select_own"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "app_access_select_own"
  on public.app_access for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.app_access (user_id, app_id)
  values (new.id, 'agent-workspace')
  on conflict (user_id, app_id) do nothing;

  insert into public.user_roles (user_id, app_id, role)
  values (new.id, 'agent-workspace', 'user')
  on conflict (user_id, app_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
