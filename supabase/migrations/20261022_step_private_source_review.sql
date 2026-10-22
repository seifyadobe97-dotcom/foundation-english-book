-- Private editorial intake and review staging for instructor-provided STEP references.
-- Actual PDF contents and question text are NEVER committed to public GitHub.
-- This migration has already been applied to Supabase project funltjxavowlnnfibhpl.
create table if not exists public.step_source_documents (
  document_key text primary key,
  private_source_name text not null,
  source_kind text not null check(source_kind in ('course_book','audited_bank','compilation')),
  source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
  pdf_pages integer not null check(pdf_pages>0),
  extracted_question_occurrences integer check(extracted_question_occurrences>=0),
  source_category_headings integer check(source_category_headings>=0),
  extraction_version text not null default 'first-pass-v1',
  review_status text not null default 'needs_review'
    check(review_status in ('needs_review','in_review','reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.step_source_item_reviews (
  candidate_id text primary key,
  document_key text not null references public.step_source_documents(document_key),
  printed_number integer,
  pdf_page integer not null check(pdf_page>0),
  original_category_code text,
  original_stem text,
  original_options jsonb,
  printed_key text check(printed_key is null or printed_key in ('A','B','C','D')),
  stem_fingerprint text,
  review_status text not null default 'unreviewed'
    check(review_status in ('unreviewed','in_review','approved','ambiguous_hold','incorrect_key_hold','duplicate','rejected')),
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviewed_options_are_object check (original_options is null or jsonb_typeof(original_options)='object')
);
create index if not exists idx_step_source_item_reviews_doc_status
 on public.step_source_item_reviews(document_key,review_status);
create index if not exists idx_step_source_item_reviews_category
 on public.step_source_item_reviews(original_category_code);
alter table public.step_source_documents enable row level security;
alter table public.step_source_item_reviews enable row level security;
revoke all on public.step_source_documents,public.step_source_item_reviews from PUBLIC, anon, authenticated;
-- Intentionally no anonymous or student policies. Expose only through owner-authorized server routes.
