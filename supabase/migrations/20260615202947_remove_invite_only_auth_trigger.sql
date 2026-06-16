-- Remove only auth.users triggers that enforce the legacy invite-only rule.
-- Keep the underlying invitation tables/functions in place in case they are
-- still used elsewhere in the application.

do $$
declare
  blocking_trigger record;
begin
  for blocking_trigger in
    select trigger_object.tgname as trigger_name
    from pg_trigger as trigger_object
    join pg_proc as function_object
      on function_object.oid = trigger_object.tgfoid
    where trigger_object.tgrelid = 'auth.users'::regclass
      and not trigger_object.tgisinternal
      and pg_get_functiondef(function_object.oid)
        ilike '%Brak aktywnego zaproszenia%'
  loop
    execute format(
      'drop trigger if exists %I on auth.users',
      blocking_trigger.trigger_name
    );
  end loop;
end
$$;

-- Fail the migration if the blocking rule is still attached to auth.users.
do $$
begin
  if exists (
    select 1
    from pg_trigger as trigger_object
    join pg_proc as function_object
      on function_object.oid = trigger_object.tgfoid
    where trigger_object.tgrelid = 'auth.users'::regclass
      and not trigger_object.tgisinternal
      and pg_get_functiondef(function_object.oid)
        ilike '%Brak aktywnego zaproszenia%'
  ) then
    raise exception
      'Nie udalo sie usunac triggera wymagajacego zaproszenia.';
  end if;
end
$$;
