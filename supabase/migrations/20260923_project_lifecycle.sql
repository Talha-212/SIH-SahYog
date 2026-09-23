-- SahYog SIH26043: project lifecycle extension
-- Safe additive migration: no existing rows are deleted.

alter table if exists public.solutions
  add column if not exists problem_understanding text,
  add column if not exists proposed_approach text,
  add column if not exists faculty_mentor text,
  add column if not exists student_team text,
  add column if not exists prototype_plan text,
  add column if not exists testing_plan text,
  add column if not exists pilot_plan text,
  add column if not exists social_impact text,
  add column if not exists support_needed text,
  add column if not exists lifecycle_data jsonb default '{}'::jsonb;

create index if not exists idx_solutions_lifecycle_data
  on public.solutions using gin (lifecycle_data);

comment on column public.solutions.lifecycle_data is
  'Prototype lifecycle payload: milestones, industry support, impact metrics and project tracking metadata.';
