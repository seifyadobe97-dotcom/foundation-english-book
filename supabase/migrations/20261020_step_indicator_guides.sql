-- Privately draft and publish structured explanations for each STEP indicator.
create table if not exists public.step_indicator_guides (
 indicator_slug text primary key references public.step_curriculum_indicators(slug) on update cascade on delete restrict,
 draft jsonb,
 published jsonb,
 draft_updated_at timestamptz,
 published_at timestamptz,
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 constraint guide_draft_json_check check(draft is null or jsonb_typeof(draft)='object'),
 constraint guide_published_json_check check(published is null or jsonb_typeof(published)='object')
);
alter table public.step_indicator_guides enable row level security;
revoke all on public.step_indicator_guides from public,anon,authenticated;
create index if not exists step_indicator_guides_published_idx on public.step_indicator_guides (published_at)
 where published is not null;
