-- Web Push: subskrypcje urządzeń użytkowników (Faza 1 planu web-push-pwa).
--
-- Każdy wiersz to jeden kanał push (endpoint) jednego urządzenia/przeglądarki.
-- Tokeny push są danymi wrażliwymi: polityki RLS są ściśle per-użytkownik
-- (BEZ wglądu admina). Edge Function `send-push` czyta i kasuje subskrypcje
-- przez klucz `service_role`, który omija RLS — admin nie potrzebuje dostępu.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  auth_key text not null,
  p256dh_key text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists endpoint text,
  add column if not exists auth_key text,
  add column if not exists p256dh_key text,
  add column if not exists user_agent text,
  add column if not exists created_at timestamptz default now();

-- Jeden wiersz na kanał push. Pozwala na upsert po endpoint przy ponownej
-- subskrypcji tego samego urządzenia (onConflict: 'endpoint').
create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions(endpoint);

-- Szybkie pobranie wszystkich subskrypcji odbiorcy w `send-push`.
create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can create own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;

create policy "Users can read own push subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own push subscriptions"
  on public.push_subscriptions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own push subscriptions"
  on public.push_subscriptions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
