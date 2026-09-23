-- SahYog admin access setup
-- Safe: does not delete application data.
-- 1) Allows the existing profiles.role check (if present) to accept 'admin'.
-- 2) Does NOT create or promote an account automatically.
-- 3) After creating an administrator account through Supabase Auth, run:
--    update public.profiles set role = 'admin', updated_at = now()
--    where email = 'YOUR_ADMIN_EMAIL';

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
      and pg_get_constraintdef(oid) ilike '%citizen%'
      and pg_get_constraintdef(oid) ilike '%government%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', c.conname);
  end loop;
exception when undefined_table then
  null;
end $$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    if not exists (
      select 1 from pg_constraint
      where conname = 'profiles_role_allowed_check'
        and conrelid = 'public.profiles'::regclass
    ) then
      alter table public.profiles
        add constraint profiles_role_allowed_check
        check (role in ('citizen','government','university','industry','ngo','admin'));
    end if;
  end if;
end $$;
