-- Run this query in Supabase SQL Editor after a failed user creation attempt.
-- It only reads database metadata and does not modify any data.

select
  trigger_info.trigger_name,
  trigger_info.trigger_definition,
  function_namespace.nspname as function_schema,
  function_info.proname as function_name,
  function_owner.rolname as function_owner,
  function_info.prosecdef as security_definer,
  pg_get_functiondef(function_info.oid) as function_definition
from (
  select
    trigger_object.tgfoid,
    trigger_object.tgname as trigger_name,
    pg_get_triggerdef(trigger_object.oid, true) as trigger_definition
  from pg_trigger as trigger_object
  where trigger_object.tgrelid = 'auth.users'::regclass
    and not trigger_object.tgisinternal
) as trigger_info
join pg_proc as function_info
  on function_info.oid = trigger_info.tgfoid
join pg_namespace as function_namespace
  on function_namespace.oid = function_info.pronamespace
join pg_roles as function_owner
  on function_owner.oid = function_info.proowner
order by trigger_info.trigger_name;

select
  columns.column_name,
  columns.data_type,
  columns.udt_schema,
  columns.udt_name,
  columns.is_nullable,
  columns.column_default
from information_schema.columns
where columns.table_schema = 'public'
  and columns.table_name = 'profiles'
order by columns.ordinal_position;

select
  constraint_info.conname as constraint_name,
  constraint_info.contype as constraint_type,
  pg_get_constraintdef(constraint_info.oid, true) as constraint_definition
from pg_constraint as constraint_info
where constraint_info.conrelid = 'public.profiles'::regclass
order by constraint_info.conname;
