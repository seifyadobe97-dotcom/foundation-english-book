-- STEP canonical assessment hierarchy. Existing Present Simple stays published.
create table if not exists public.step_curriculum_axes (
 code text primary key,
 title_ar text not null,
 title_en text not null,
 position smallint not null unique,
 content_model text not null check (content_model in ('materials','indicators')),
 created_at timestamptz not null default now(),
 constraint step_axis_code_check check (code in ('reading-comprehension','listening','grammar','writing-analysis'))
);
alter table public.step_curriculum_axes enable row level security;
revoke all on public.step_curriculum_axes from public,anon,authenticated;
insert into public.step_curriculum_axes (code,title_ar,title_en,position,content_model) values
 ('reading-comprehension','استيعاب المقروء','Reading Comprehension',1,'materials'),
 ('listening','الاستماع','Listening',2,'materials'),
 ('grammar','الجرامر','Grammar',3,'indicators'),
 ('writing-analysis','التحليل الكتابي','Writing Analysis',4,'indicators')
on conflict (code) do nothing;
create table if not exists public.step_curriculum_indicators (
 id uuid primary key default gen_random_uuid(),
 axis_code text not null references public.step_curriculum_axes(code),
 slug text not null unique check (slug ~ '^[a-z][a-z0-9-]{2,39}$'),
 title_ar text not null check (char_length(title_ar) between 3 and 140),
 title_en text not null check (char_length(title_en) between 3 and 140),
 description text not null default '' check (char_length(description) <= 1500),
 position integer not null default 100 check (position between 1 and 9999),
 status text not null default 'draft' check (status in ('draft','published','archived')),
 legacy_course_code text unique,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint step_indicator_axis_check check (axis_code in ('grammar','writing-analysis')),
 constraint step_indicator_release_check check (status <> 'published' or legacy_course_code = 'ASGQPRSIM')
);
create index if not exists step_indicators_axis_order_idx
 on public.step_curriculum_indicators(axis_code,position,created_at);
alter table public.step_curriculum_indicators enable row level security;
revoke all on public.step_curriculum_indicators from public,anon,authenticated;
insert into public.step_curriculum_indicators
 (axis_code,slug,title_ar,title_en,description,position,status,legacy_course_code)
values ('grammar','present-simple','المضارع البسيط','Present Simple',
 'قاعدة المضارع البسيط: الشرح والتدريبات والاختبار النهائي.',203,'published','ASGQPRSIM')
on conflict (slug) do nothing;