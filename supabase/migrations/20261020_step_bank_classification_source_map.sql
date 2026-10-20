-- Private mapping of the 91 audited STEP bank classification headings to curricular indicators.
-- Categories remain separate from publishable questions; mapping does not validate individual answers.
create table if not exists public.step_question_bank_classifications (
 code text primary key check (code ~ '^ASGQ[A-Z0-9]+$'),
 title_en text not null check (char_length(title_en) between 2 and 150),
 title_ar text not null default '',
 first_page smallint not null check (first_page between 1 and 234),
 indicator_slug text references public.step_curriculum_indicators(slug) on update cascade on delete set null,
 related_indicator_slug text references public.step_curriculum_indicators(slug) on update cascade on delete set null,
 mapping_status text not null default 'needs_review' check(mapping_status in ('mapped','needs_review')),
 source_document text not null default 'STEP_Grammar_Question_Bank_Classifications_Audited.pdf',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint step_bank_classification_mapping_check check ((mapping_status='mapped' and indicator_slug is not null) or mapping_status='needs_review')
);
create index if not exists step_bank_classification_indicator_idx
 on public.step_question_bank_classifications(indicator_slug);
alter table public.step_question_bank_classifications enable row level security;
revoke all on public.step_question_bank_classifications from public,anon,authenticated;