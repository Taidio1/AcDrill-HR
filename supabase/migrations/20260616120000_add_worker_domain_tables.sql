create extension if not exists pgcrypto with schema extensions;

grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role::text = 'admin'
        and is_active = true
    ),
    false
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

grant update on table public.profiles to authenticated;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (private.is_admin());

create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  start_location jsonb,
  end_location jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_sessions_status_check
    check (status in ('active', 'completed')),
  constraint work_sessions_completed_has_end_check
    check (status <> 'completed' or ended_at is not null)
);

alter table public.work_sessions
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists start_location jsonb,
  add column if not exists end_location jsonb,
  add column if not exists status text default 'active',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists work_sessions_one_active_per_user_idx
  on public.work_sessions(user_id)
  where status = 'active';

create index if not exists work_sessions_user_started_idx
  on public.work_sessions(user_id, started_at desc);

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,
  gross numeric(12,2) not null default 0,
  net numeric(12,2) not null default 0,
  pdf_uri text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payslips
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists month text,
  add column if not exists gross numeric(12,2) default 0,
  add column if not exists net numeric(12,2) default 0,
  add column if not exists pdf_uri text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists payslips_user_created_idx
  on public.payslips(user_id, created_at desc);

create table if not exists public.payslip_items (
  id uuid primary key default gen_random_uuid(),
  payslip_id uuid not null references public.payslips(id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null,
  position integer not null default 0
);

alter table public.payslip_items
  add column if not exists payslip_id uuid references public.payslips(id) on delete cascade,
  add column if not exists label text,
  add column if not exists amount numeric(12,2),
  add column if not exists position integer default 0;

create index if not exists payslip_items_payslip_position_idx
  on public.payslip_items(payslip_id, position);

create table if not exists public.payslip_advances (
  id uuid primary key default gen_random_uuid(),
  payslip_id uuid not null references public.payslips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

alter table public.payslip_advances
  add column if not exists payslip_id uuid references public.payslips(id) on delete cascade,
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists date date,
  add column if not exists amount numeric(12,2),
  add column if not exists created_at timestamptz default now();

create index if not exists payslip_advances_payslip_date_idx
  on public.payslip_advances(payslip_id, date desc);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  date date not null,
  size text not null,
  uri text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists name text,
  add column if not exists category text,
  add column if not exists date date,
  add column if not exists size text,
  add column if not exists uri text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists documents_user_date_idx
  on public.documents(user_id, date desc);

create table if not exists public.document_reads (
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (document_id, user_id)
);

alter table public.document_reads
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists read_at timestamptz default now();

create index if not exists document_reads_user_idx
  on public.document_reads(user_id);

do $$
declare
  existing_leave_balances_kind "char";
begin
  select relation.relkind
  into existing_leave_balances_kind
  from pg_class as relation
  join pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname = 'leave_balances';

  if existing_leave_balances_kind = 'v' then
    drop view public.leave_balances;
  elsif existing_leave_balances_kind = 'm' then
    drop materialized view public.leave_balances;
  end if;
end
$$;

create table if not exists public.leave_balances (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  annual integer not null default 26,
  updated_at timestamptz not null default now(),
  constraint leave_balances_annual_check check (annual >= 0)
);

alter table public.leave_balances
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists annual integer default 26,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  date_from date not null,
  date_to date not null,
  comment text not null default '',
  days integer generated always as ((date_to - date_from) + 1) stored,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_type_check
    check (type in ('vacation', 'on_demand', 'unpaid', 'care')),
  constraint leave_requests_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint leave_requests_date_check check (date_to >= date_from)
);

alter table public.leave_requests
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists type text,
  add column if not exists date_from date,
  add column if not exists date_to date,
  add column if not exists comment text default '',
  add column if not exists days integer generated always as ((date_to - date_from) + 1) stored,
  add column if not exists status text default 'pending',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists leave_requests_user_date_idx
  on public.leave_requests(user_id, date_from desc);

create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  description text not null,
  priority text not null default 'medium',
  status text not null default 'new',
  image_uri text,
  location jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint issue_reports_type_check
    check (type in ('breakdown', 'materials')),
  constraint issue_reports_priority_check
    check (priority in ('low', 'medium', 'high')),
  constraint issue_reports_status_check
    check (status in ('new', 'in_progress', 'closed'))
);

alter table public.issue_reports
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists type text,
  add column if not exists description text,
  add column if not exists priority text default 'medium',
  add column if not exists status text default 'new',
  add column if not exists image_uri text,
  add column if not exists location jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists issue_reports_user_created_idx
  on public.issue_reports(user_id, created_at desc);

alter table public.work_sessions enable row level security;
alter table public.payslips enable row level security;
alter table public.payslip_items enable row level security;
alter table public.payslip_advances enable row level security;
alter table public.documents enable row level security;
alter table public.document_reads enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.issue_reports enable row level security;

grant select, insert, update, delete on table public.work_sessions to authenticated;
grant select, insert, update, delete on table public.payslips to authenticated;
grant select, insert, update, delete on table public.payslip_items to authenticated;
grant select, insert, update, delete on table public.payslip_advances to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.document_reads to authenticated;
grant select, insert, update, delete on table public.leave_balances to authenticated;
grant select, insert, update, delete on table public.leave_requests to authenticated;
grant select, insert, update, delete on table public.issue_reports to authenticated;

drop policy if exists "Workers and admins can read work sessions" on public.work_sessions;
drop policy if exists "Workers can start own work sessions" on public.work_sessions;
drop policy if exists "Workers can update own work sessions" on public.work_sessions;
drop policy if exists "Admins can delete work sessions" on public.work_sessions;

create policy "Workers and admins can read work sessions"
  on public.work_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_admin());

create policy "Workers can start own work sessions"
  on public.work_sessions
  for insert
  to authenticated
  with check (
    ((select auth.uid()) = user_id and status = 'active')
    or private.is_admin()
  );

create policy "Workers can update own work sessions"
  on public.work_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id or private.is_admin())
  with check ((select auth.uid()) = user_id or private.is_admin());

create policy "Admins can delete work sessions"
  on public.work_sessions
  for delete
  to authenticated
  using (private.is_admin());

drop policy if exists "Workers and admins can read payslips" on public.payslips;
drop policy if exists "Admins can manage payslips" on public.payslips;
drop policy if exists "Workers and admins can read payslip items" on public.payslip_items;
drop policy if exists "Admins can manage payslip items" on public.payslip_items;
drop policy if exists "Workers and admins can read payslip advances" on public.payslip_advances;
drop policy if exists "Admins can manage payslip advances" on public.payslip_advances;

create policy "Workers and admins can read payslips"
  on public.payslips
  for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_admin());

create policy "Admins can manage payslips"
  on public.payslips
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Workers and admins can read payslip items"
  on public.payslip_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.payslips
      where payslips.id = payslip_items.payslip_id
        and (payslips.user_id = (select auth.uid()) or private.is_admin())
    )
  );

create policy "Admins can manage payslip items"
  on public.payslip_items
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Workers and admins can read payslip advances"
  on public.payslip_advances
  for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_admin());

create policy "Admins can manage payslip advances"
  on public.payslip_advances
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Workers and admins can read documents" on public.documents;
drop policy if exists "Admins can manage documents" on public.documents;
drop policy if exists "Users can read own document reads" on public.document_reads;
drop policy if exists "Users can mark accessible documents read" on public.document_reads;
drop policy if exists "Users can refresh own document reads" on public.document_reads;
drop policy if exists "Admins can delete document reads" on public.document_reads;

create policy "Workers and admins can read documents"
  on public.documents
  for select
  to authenticated
  using (
    user_id is null
    or user_id = (select auth.uid())
    or private.is_admin()
  );

create policy "Admins can manage documents"
  on public.documents
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Users can read own document reads"
  on public.document_reads
  for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

create policy "Users can mark accessible documents read"
  on public.document_reads
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.documents
      where documents.id = document_reads.document_id
        and (
          documents.user_id is null
          or documents.user_id = (select auth.uid())
          or private.is_admin()
        )
    )
  );

create policy "Users can refresh own document reads"
  on public.document_reads
  for update
  to authenticated
  using (user_id = (select auth.uid()) or private.is_admin())
  with check (user_id = (select auth.uid()) or private.is_admin());

create policy "Admins can delete document reads"
  on public.document_reads
  for delete
  to authenticated
  using (private.is_admin());

drop policy if exists "Workers and admins can read leave balances" on public.leave_balances;
drop policy if exists "Admins can manage leave balances" on public.leave_balances;
drop policy if exists "Workers and admins can read leave requests" on public.leave_requests;
drop policy if exists "Workers can create own leave requests" on public.leave_requests;
drop policy if exists "Admins can update leave requests" on public.leave_requests;
drop policy if exists "Admins can delete leave requests" on public.leave_requests;

create policy "Workers and admins can read leave balances"
  on public.leave_balances
  for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

create policy "Admins can manage leave balances"
  on public.leave_balances
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Workers and admins can read leave requests"
  on public.leave_requests
  for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

create policy "Workers can create own leave requests"
  on public.leave_requests
  for insert
  to authenticated
  with check (
    (user_id = (select auth.uid()) and status = 'pending')
    or private.is_admin()
  );

create policy "Admins can update leave requests"
  on public.leave_requests
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete leave requests"
  on public.leave_requests
  for delete
  to authenticated
  using (private.is_admin());

drop policy if exists "Workers and admins can read issue reports" on public.issue_reports;
drop policy if exists "Workers can create own issue reports" on public.issue_reports;
drop policy if exists "Admins can update issue reports" on public.issue_reports;
drop policy if exists "Admins can delete issue reports" on public.issue_reports;

create policy "Workers and admins can read issue reports"
  on public.issue_reports
  for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

create policy "Workers can create own issue reports"
  on public.issue_reports
  for insert
  to authenticated
  with check (
    (user_id = (select auth.uid()) and status = 'new')
    or private.is_admin()
  );

create policy "Admins can update issue reports"
  on public.issue_reports
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete issue reports"
  on public.issue_reports
  for delete
  to authenticated
  using (private.is_admin());

create or replace view public.employees
with (security_invoker = true)
as
select
  profiles.id,
  profiles.full_name,
  profiles.initials,
  profiles.role,
  profiles.job_title,
  (
    array[
      '#FF6A1A',
      '#2563A8',
      '#157F4E',
      '#7C3AED',
      '#0E7490',
      '#B7791F',
      '#BE185D'
    ]
  )[1 + (abs(('x' || substr(md5(profiles.id::text), 1, 8))::bit(32)::int) % 7)] as tone,
  case
    when active_sessions.id is not null then 'working'
    when active_leaves.id is not null then 'leave'
    else 'off'
  end as work_status,
  case
    when active_sessions.id is not null then
      trim(
        both ' '
        from concat(
          floor(extract(epoch from (now() - active_sessions.started_at)) / 3600)::int,
          ':',
          lpad(
            floor(
              mod(extract(epoch from (now() - active_sessions.started_at)), 3600)
              / 60
            )::int::text,
            2,
            '0'
          )
        )
      )
    when active_leaves.id is not null then 'Urlop'
    else 'Wolne'
  end as today,
  case
    when active_sessions.id is not null then
      to_char(active_sessions.started_at at time zone 'Europe/Warsaw', 'HH24:MI')
    else null
  end as since
from public.profiles as profiles
left join lateral (
  select work_sessions.id, work_sessions.started_at
  from public.work_sessions
  where work_sessions.user_id = profiles.id
    and work_sessions.status = 'active'
  order by work_sessions.started_at desc
  limit 1
) as active_sessions on true
left join lateral (
  select leave_requests.id
  from public.leave_requests
  where leave_requests.user_id = profiles.id
    and leave_requests.status = 'approved'
    and current_date between leave_requests.date_from and leave_requests.date_to
  order by leave_requests.date_from desc
  limit 1
) as active_leaves on true
where profiles.role::text = 'worker'
  and profiles.is_active = true;

grant select on table public.employees to authenticated;
