-- SahYog safe migration: location verification metadata
-- No existing rows are deleted or rewritten.

alter table public.problems
  add column if not exists district text,
  add column if not exists block text,
  add column if not exists location_status text,
  add column if not exists location_verified_at timestamptz,
  add column if not exists location_verification_note text;

alter table public.severity_assessments
  add column if not exists assessment_data jsonb default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'problems_location_status_check'
      and conrelid = 'public.problems'::regclass
  ) then
    alter table public.problems
      add constraint problems_location_status_check
      check (
        location_status is null
        or location_status in (
          'unverified',
          'valid_jharkhand',
          'outside_jharkhand',
          'manual_jharkhand',
          'unavailable'
        )
      );
  end if;
end $$;

create index if not exists idx_problems_district
  on public.problems(district);

create index if not exists idx_problems_location_status
  on public.problems(location_status);

comment on column public.problems.location_status is
  'Whether the reported coordinates/location have been verified as a Jharkhand reporting location.';

comment on column public.severity_assessments.assessment_data is
  'Flexible category-specific impact assessment data.';
