-- Web Push: triggery domenowe wyzwalające Edge Function `send-push` (Faza 6).
--
-- Wywołania idą PO STRONIE BAZY (pg_net), z kluczem service_role trzymanym
-- w Vault — dzięki temu sekret nigdy nie trafia do przeglądarki, a warstwa
-- kliencka pozostaje bez zmian. Powiadomienia działają niezależnie od tego,
-- który klient wykonał mutację.
--
-- WYMAGANIA WSTĘPNE (wykonać RĘCZNIE, NIE commitować klucza):
--   1. Włączyć rozszerzenie pg_net (Dashboard → Database → Extensions,
--      albo: create extension if not exists pg_net;).
--   2. Zapisać dwa sekrety w Vault (raz, poza migracją):
--        select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--        select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');

create extension if not exists pg_net;

-- Helper: wysyła pojedyncze powiadomienie do użytkownika przez send-push.
create or replace function private.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'service_role_key';

  -- Brak konfiguracji → nie wywołujemy (bez błędu, by nie blokować mutacji).
  if v_url is null or v_key is null then
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'userId', p_user_id,
      'title', p_title,
      'body', p_body,
      'url', p_url
    )
  );
end;
$$;

revoke execute on function private.notify_user(uuid, text, text, text)
  from public, anon, authenticated;

-- Wniosek urlopowy rozpatrzony → powiadom wnioskującego.
create or replace function private.on_leave_decided()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('approved', 'rejected') then
    perform private.notify_user(
      new.user_id,
      'Wniosek urlopowy',
      case
        when new.status = 'approved' then 'Twój wniosek urlopowy został zaakceptowany.'
        else 'Twój wniosek urlopowy został odrzucony.'
      end,
      '/worker/leaves'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leave_decided on public.leave_requests;
create trigger trg_leave_decided
  after update on public.leave_requests
  for each row
  execute function private.on_leave_decided();

-- Nowy pasek wypłaty → powiadom pracownika.
create or replace function private.on_payslip_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_user(
    new.user_id,
    'Nowy pasek wypłaty',
    'Twój pasek wypłaty jest już dostępny.',
    '/worker/payslips'
  );
  return new;
end;
$$;

drop trigger if exists trg_payslip_created on public.payslips;
create trigger trg_payslip_created
  after insert on public.payslips
  for each row
  execute function private.on_payslip_created();

-- Zmiana statusu zgłoszenia → powiadom zgłaszającego.
create or replace function private.on_issue_status_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    perform private.notify_user(
      new.user_id,
      'Aktualizacja zgłoszenia',
      'Status Twojego zgłoszenia został zmieniony.',
      '/worker/issues'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_issue_status_changed on public.issue_reports;
create trigger trg_issue_status_changed
  after update on public.issue_reports
  for each row
  execute function private.on_issue_status_changed();

-- Nowe zgłoszenie → powiadom wszystkich aktywnych adminów (fan-out).
create or replace function private.on_issue_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
begin
  for v_admin_id in
    select id from public.profiles
    where role::text = 'admin' and is_active = true
  loop
    perform private.notify_user(
      v_admin_id,
      'Nowe zgłoszenie',
      new.description,
      '/admin/issues'
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_issue_created on public.issue_reports;
create trigger trg_issue_created
  after insert on public.issue_reports
  for each row
  execute function private.on_issue_created();
