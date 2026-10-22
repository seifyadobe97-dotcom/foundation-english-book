-- Instructor-only source registry for Foundation English STEP practice.
-- The original source metadata is inserted securely into the live database,
-- never compiled into the learner-facing site or committed in this seed.
create table if not exists public.step_foundation_source_ledger (
  bank_item_id text primary key,
  stage_id text not null,
  source_locator jsonb not null,
  verified_at timestamptz not null default now()
);
alter table public.step_foundation_source_ledger enable row level security;
revoke all on public.step_foundation_source_ledger from anon, authenticated;
-- Intentionally no student-facing SELECT / INSERT / UPDATE policies.
