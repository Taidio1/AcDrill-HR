-- Enable Supabase Realtime for work_sessions so the admin dashboard
-- ("KTO TERAZ PRACUJE") refreshes as soon as a worker starts/stops a session.
-- The `employees` view derives work_status from this table; views do not emit
-- realtime events, so the client subscribes to work_sessions directly.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'work_sessions'
  ) then
    alter publication supabase_realtime add table public.work_sessions;
  end if;
end
$$;
