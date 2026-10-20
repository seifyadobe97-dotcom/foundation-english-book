-- Admin-managed STEP pilot question additions and overrides.
-- Existing approved pilot questions remain in the original lesson-data.json until an owner publishes an override.
create table if not exists public.step_question_edits (
 id text primary key,
 course_code text not null default 'ASGQPRSIM' check (course_code = 'ASGQPRSIM'),
 part_index smallint not null check (part_index between 0 and 5),
 question_text text not null check (char_length(question_text) between 8 and 2000),
 options jsonb not null,
 correct text not null check (correct in ('A','B','C','D')),
 explanation text not null default '',
 status text not null default 'draft' check (status in ('draft','published','archived')),
 created_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 constraint step_question_options_check check (
  jsonb_typeof(options) = 'object'
  and options ?& array['A','B','C','D']
  and jsonb_typeof(options->'A')='string'
  and jsonb_typeof(options->'B')='string'
  and jsonb_typeof(options->'C')='string'
  and jsonb_typeof(options->'D')='string'
 )
);
create index if not exists step_question_edits_part_status_idx
 on public.step_question_edits(course_code,part_index,status);
alter table public.step_question_edits enable row level security;
revoke all on public.step_question_edits from public,anon,authenticated;
