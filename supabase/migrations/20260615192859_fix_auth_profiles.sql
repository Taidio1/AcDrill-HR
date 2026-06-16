create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  initials text not null,
  role text not null default 'worker',
  job_title text not null default 'Pracownik',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('worker', 'admin'))
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists initials text,
  add column if not exists role text default 'worker',
  add column if not exists job_title text default 'Pracownik',
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.profiles
set
  full_name = coalesce(nullif(btrim(full_name), ''), 'Uzytkownik'),
  initials = coalesce(nullif(btrim(initials), ''), 'U'),
  role = case when role::text in ('worker', 'admin') then role else 'worker' end,
  job_title = coalesce(nullif(btrim(job_title), ''), 'Pracownik'),
  is_active = coalesce(is_active, true),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  full_name is null
  or initials is null
  or role is null
  or role::text not in ('worker', 'admin')
  or job_title is null
  or is_active is null
  or created_at is null
  or updated_at is null;

alter table public.profiles
  alter column full_name set not null,
  alter column initials set not null,
  alter column role set default 'worker',
  alter column role set not null,
  alter column job_title set default 'Pracownik',
  alter column job_title set not null,
  alter column is_active set default true,
  alter column is_active set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role::text in ('worker', 'admin'));
  end if;
end
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_initials text;
begin
  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Uzytkownik'
  );

  select coalesce(
    string_agg(upper(left(word, 1)), '' order by position),
    'U'
  )
  into profile_initials
  from (
    select word, position
    from unnest(regexp_split_to_array(profile_name, '\s+'))
      with ordinality as parts(word, position)
    where word <> ''
    order by position
    limit 2
  ) initials;

  insert into public.profiles (
    id,
    full_name,
    initials,
    role,
    job_title,
    is_active
  )
  values (
    new.id,
    profile_name,
    profile_initials,
    'worker',
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'job_title'), ''),
      'Pracownik'
    ),
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

insert into public.profiles (
  id,
  full_name,
  initials,
  role,
  job_title,
  is_active
)
select
  users.id,
  profile_data.full_name,
  profile_data.initials,
  'worker',
  'Pracownik',
  true
from auth.users as users
cross join lateral (
  select coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    'Uzytkownik'
  ) as full_name
) names
cross join lateral (
  select
    names.full_name,
    coalesce(
      (
        select string_agg(upper(left(word, 1)), '' order by position)
        from (
          select word, position
          from unnest(regexp_split_to_array(names.full_name, '\s+'))
            with ordinality as parts(word, position)
          where word <> ''
          order by position
          limit 2
        ) initials
      ),
      'U'
    ) as initials
) profile_data
on conflict (id) do nothing;

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
grant select on table public.profiles to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);
