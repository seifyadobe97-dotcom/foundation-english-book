-- Applied to funltjxavowlnnfibhpl on 2026-10-22; schema definition only.
-- The canonical bank payloads live ONLY in private Supabase rows, not migrations.
create table if not exists public.step_private_course_banks (
 course_code text primary key check (course_code in ('ASGQPRSIM','ASGQAGREE')),
 payload jsonb not null check (jsonb_typeof(payload)='object'),
 updated_at timestamptz not null default now()
);
alter table public.step_private_course_banks enable row level security;
revoke all on table public.step_private_course_banks from public, anon, authenticated;
grant select, insert, update, delete on table public.step_private_course_banks to service_role;
comment on table public.step_private_course_banks is 'Private canonical STEP course banks and grading keys; only server-side service_role may read them.';
