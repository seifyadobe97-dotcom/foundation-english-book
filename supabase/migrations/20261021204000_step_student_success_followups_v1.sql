-- STEP Student Success Center v1: owner-assigned learning follow-ups.
-- No direct browser access: student & admin operations are JWT checked by Edge Functions.
create table if not exists public.step_student_followups (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 course_code text not null,
 part_index smallint not null check(part_index between 0 and 99),
 kind text not null check(kind in ('review','practice','video')),
 note text not null default '' check(char_length(note)<=350),
 due_at timestamptz,
 assigned_by uuid not null references auth.users(id),
 assigned_at timestamptz not null default now(),
 reviewed_at timestamptz,
 cancelled_at timestamptz,
 cancelled_by uuid references auth.users(id)
);
create index if not exists step_followup_student_idx on public.step_student_followups (user_id,course_code,assigned_at desc);
create index if not exists step_followup_due_idx on public.step_student_followups (due_at) where cancelled_at is null;
alter table public.step_student_followups enable row level security;
revoke all on public.step_student_followups from anon, authenticated;
