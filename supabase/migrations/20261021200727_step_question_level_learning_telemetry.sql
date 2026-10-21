-- Additive analytics schema: questions and durations from new attempts only.
-- Browser-reported timing is indicative; it never controls scores.
create table if not exists public.step_question_attempt_details (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_code text not null,
  attempt_kind text not null check (attempt_kind in ('practice','exam')),
  attempt_id bigint not null,
  part_index smallint,
  question_id text not null,
  selected text not null check (selected in ('A','B','C','D')),
  is_correct boolean not null,
  elapsed_ms integer check (elapsed_ms between 0 and 3600000),
  choice_changes smallint check (choice_changes between 0 and 100),
  recorded_at timestamptz not null default now(),
  constraint step_question_attempt_details_part_check
    check ((attempt_kind='practice' and part_index between 0 and 99) or
           (attempt_kind='exam' and part_index is null)),
  constraint step_question_attempt_details_unique unique(attempt_kind,attempt_id,question_id)
);
create index if not exists step_item_events_student_idx
  on public.step_question_attempt_details (user_id,course_code,recorded_at desc);
create index if not exists step_item_events_course_idx
  on public.step_question_attempt_details (course_code,question_id);
alter table public.step_question_attempt_details enable row level security;
revoke all on public.step_question_attempt_details from anon, authenticated;
