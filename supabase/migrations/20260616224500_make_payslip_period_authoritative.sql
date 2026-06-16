alter table public.payslips
  add column if not exists period_text text;

do $$
declare
  has_period boolean;
  has_month boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payslips'
      and column_name = 'period'
  )
  into has_period;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payslips'
      and column_name = 'month'
  )
  into has_month;

  if has_period and has_month then
    execute 'update public.payslips set period_text = coalesce(period_text, period::text, month::text, '''')';
  elsif has_period then
    execute 'update public.payslips set period_text = coalesce(period_text, period::text, '''')';
  elsif has_month then
    execute 'update public.payslips set period_text = coalesce(period_text, month::text, '''')';
  else
    update public.payslips set period_text = coalesce(period_text, '');
  end if;
end $$;

alter table public.payslips
  drop column if exists period;

alter table public.payslips
  rename column period_text to period;

alter table public.payslips
  alter column period set default '',
  alter column period set not null;

alter table public.payslips
  alter column month drop not null;
