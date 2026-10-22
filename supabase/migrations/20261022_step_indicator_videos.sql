-- STEP with Seify: optional video teaching slots per curriculum indicator.
-- Unpublished drafts are private; only admin Edge Function and authenticated student
-- Edge Function may access approved video metadata. No video is required to learn.
create table if not exists public.step_indicator_videos (
 indicator_slug text not null references public.step_curriculum_indicators(slug) on update cascade on delete cascade,
 part_index smallint not null check (part_index between 0 and 99),
 title text not null default '' check (char_length(title)<=120),
 description text not null default '' check (char_length(description)<=300),
 video_url text not null default '' check (char_length(video_url)<=600),
 published boolean not null default false,
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 primary key (indicator_slug,part_index),
 constraint step_video_publication_check check (not published or video_url <> '')
);
create index if not exists step_videos_published_idx
 on public.step_indicator_videos(indicator_slug,part_index) where published;
alter table public.step_indicator_videos enable row level security;
revoke all on public.step_indicator_videos from anon,authenticated;
