-- STEP WITH SEIFY: isolated, deny-by-default Listening Phase 2 foundation.
-- Does not publish courses, modify existing student records or insert synthetic content.
-- Private recordings are not uploaded by this migration.
create table if not exists public.step_listening_clips (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(btrim(title)) between 3 and 200),
 storage_path text unique,
 sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
 duration_seconds numeric(9,2) check (duration_seconds is null or duration_seconds > 0),
 transcript text,
 rights_notes text,
 review_state text not null default 'draft' check (review_state in ('draft','reviewed','approved','rejected')),
 reviewer_id uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 constraint step_listening_clip_approval_guard check (
   review_state <> 'approved' or (
     storage_path is not null and sha256 is not null and duration_seconds is not null
     and nullif(btrim(coalesce(transcript,'')),'') is not null
     and nullif(btrim(coalesce(rights_notes,'')),'') is not null
     and reviewer_id is not null and reviewed_at is not null
   )
 )
);
create table if not exists public.step_listening_groups (
 id uuid primary key default gen_random_uuid(),
 clip_id uuid not null references public.step_listening_clips(id) on delete restrict,
 title_ar text not null check (length(btrim(title_ar)) > 0),
 title_en text not null check (length(btrim(title_en)) > 0),
 seconds_per_question integer not null default 15 check (seconds_per_question between 1 and 120),
 review_state text not null default 'draft' check (review_state in ('draft','reviewed','approved','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.step_listening_items (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.step_listening_groups(id) on delete restrict,
 position smallint not null check (position between 1 and 10),
 question_text text not null check (length(btrim(question_text)) > 0),
 options jsonb not null check (
   jsonb_typeof(options) = 'object' and options ?& array['A','B','C','D'] and
   jsonb_typeof(options->'A')='string' and length(btrim(options->>'A')) > 0 and
   jsonb_typeof(options->'B')='string' and length(btrim(options->>'B')) > 0 and
   jsonb_typeof(options->'C')='string' and length(btrim(options->>'C')) > 0 and
   jsonb_typeof(options->'D')='string' and length(btrim(options->>'D')) > 0
 ),
 correct_choice text not null check (correct_choice in ('A','B','C','D')),
 explanation_ar text not null check (length(btrim(explanation_ar)) > 0),
 wrong_reasons_ar jsonb not null default '{}'::jsonb check (jsonb_typeof(wrong_reasons_ar) = 'object'),
 review_state text not null default 'draft' check (review_state in ('draft','reviewed','approved','rejected')),
 unique(group_id, position)
);
create table if not exists public.step_listening_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 group_id uuid not null references public.step_listening_groups(id) on delete restrict,
 mode text not null check (mode in ('practice','exam')),
 state text not null default 'created' check (state in ('created','reading','playing','answering','submitted','interrupted')),
 reading_started_at timestamptz,
 reading_ends_at timestamptz,
 audio_started_at timestamptz,
 audio_ended_at timestamptz,
 submitted_at timestamptz,
 created_at timestamptz not null default now(),
 constraint step_listening_reading_order check (
  reading_started_at is null or reading_ends_at is null or reading_ends_at >= reading_started_at
 )
);
create table if not exists public.step_listening_responses (
 id uuid primary key default gen_random_uuid(),
 attempt_id uuid not null references public.step_listening_attempts(id) on delete restrict,
 item_id uuid not null references public.step_listening_items(id) on delete restrict,
 selected_choice text not null check (selected_choice in ('A','B','C','D')),
 is_correct boolean,
 responded_at timestamptz not null default now(),
 unique(attempt_id,item_id)
);
create table if not exists public.step_listening_events (
 id bigint generated always as identity primary key,
 attempt_id uuid not null references public.step_listening_attempts(id) on delete restrict,
 event_type text not null check (event_type in ('reading_started','play_requested','audio_started','audio_ended','autoplay_blocked','media_stalled','media_interrupted','submitted')),
 recorded_at timestamptz not null default now()
);
create index if not exists step_listening_groups_clip_idx on public.step_listening_groups(clip_id);
create index if not exists step_listening_items_group_idx on public.step_listening_items(group_id, position);
create index if not exists step_listening_attempts_user_idx on public.step_listening_attempts(user_id, created_at desc);
create index if not exists step_listening_events_attempt_idx on public.step_listening_events(attempt_id, recorded_at);
-- Deny all browser-origin Data API access, even on Supabase installations that auto-grant public tables.
alter table public.step_listening_clips enable row level security;
alter table public.step_listening_groups enable row level security;
alter table public.step_listening_items enable row level security;
alter table public.step_listening_attempts enable row level security;
alter table public.step_listening_responses enable row level security;
alter table public.step_listening_events enable row level security;
revoke all on public.step_listening_clips, public.step_listening_groups, public.step_listening_items,
 public.step_listening_attempts, public.step_listening_responses, public.step_listening_events
 from public, anon, authenticated;
grant select, insert, update, delete on public.step_listening_clips, public.step_listening_groups,
 public.step_listening_items, public.step_listening_attempts, public.step_listening_responses,
 public.step_listening_events to service_role;
revoke all on sequence public.step_listening_events_id_seq from public, anon, authenticated;
grant usage, select on sequence public.step_listening_events_id_seq to service_role;
-- A private, empty bucket. Uploads need server-side permission + audio licensing checks.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('step-listening-private','step-listening-private',false,31457280,
 array['audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm'])
on conflict (id) do nothing;
comment on table public.step_listening_clips is 'Private Listening Phase 2 staging; NEVER include transcript/keys in the public student bundle.';
comment on table public.step_listening_attempts is 'Listening attempts are separate from existing STEP lesson/exam progress; server adapter not yet deployed.';
