alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_initials text;
  profile_email text;
begin
  profile_email := lower(btrim(coalesce(new.email, '')));

  if profile_email = '' then
    raise exception 'Nowe konto nie zawiera adresu e-mail.';
  end if;

  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(profile_email, '@', 1), ''),
    'Uzytkownik'
  );

  profile_name := left(profile_name, 160);

  if char_length(profile_name) < 2 then
    profile_name := left('Uzytkownik ' || upper(profile_name), 160);
  end if;

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
    email,
    full_name,
    initials,
    role,
    job_title,
    is_active
  )
  values (
    new.id,
    profile_email,
    profile_name,
    profile_initials,
    'worker',
    'Pracownik',
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

revoke execute on function private.handle_new_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

update public.profiles as profiles
set
  email = lower(btrim(users.email)),
  updated_at = now()
from auth.users as users
where profiles.id = users.id
  and users.email is not null
  and profiles.email is distinct from lower(btrim(users.email));
