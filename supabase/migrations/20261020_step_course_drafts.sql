-- New STEP courses can be planned in admin without publishing incomplete material.
-- These records are not part of the student-facing curriculum until a future release
-- connects each course to complete, reviewed lessons and server-side assessments.
create table if not exists public.step_course_drafts (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z][a-z0-9-]{2,39}$'),
 title_en text not null check (char_length(title_en) between 3 and 140),
 title_ar text not null check (char_length(title_ar) between 3 and 140),
 description text not null default '' check (char_length(description) <= 1500),
 position integer not null default 100 check (position between 1 and 9999),
 status text not null default 'draft' check (status in ('draft','archived')),
 created_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists step_course_drafts_position_idx on public.step_course_drafts(position,created_at);
alter table public.step_course_drafts enable row level security;
revoke all on public.step_course_drafts from public,anon,authenticated;