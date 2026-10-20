-- STEP lesson content drafts and published overrides; student progress remains untouched.
create table if not exists public.step_lesson_content_edits (
 course_code text not null check (course_code = 'ASGQPRSIM'),
 part_index smallint not null check (part_index between 0 and 5),
 draft jsonb,
 published jsonb,
 draft_updated_at timestamptz,
 published_at timestamptz,
 updated_by uuid references auth.users(id),
 primary key(course_code, part_index),
 constraint step_lesson_draft_object check (draft is null or jsonb_typeof(draft)='object'),
 constraint step_lesson_published_object check (published is null or jsonb_typeof(published)='object')
);
alter table public.step_lesson_content_edits enable row level security;
revoke all on public.step_lesson_content_edits from public, anon, authenticated;
-- Deliberately no student policies; only service-role API has access.
