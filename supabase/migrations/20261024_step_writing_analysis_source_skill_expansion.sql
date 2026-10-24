-- STEP WITH SEIFY — source-verified Writing Analysis skill taxonomy expansion.
-- Idempotent, non-destructive: no question, course, grading, exam or attempt IDs change.
-- Do not publish indicators by merely attaching bank classification codes.
CREATE TABLE IF NOT EXISTS public.step_curriculum_classification_changes (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 classification_code text NOT NULL REFERENCES public.step_question_bank_classifications(code),
 old_indicator_slug text,
 new_indicator_slug text,
 old_related_indicator_slug text,
 new_related_indicator_slug text,
 changed_by uuid REFERENCES auth.users(id),
 reason text NOT NULL CHECK (char_length(reason) BETWEEN 12 AND 1000),
 changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS step_curriculum_classification_changes_code_idx
 ON public.step_curriculum_classification_changes(classification_code,changed_at DESC);
ALTER TABLE public.step_curriculum_classification_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.step_curriculum_classification_changes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.step_curriculum_classification_changes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.step_curriculum_classification_changes_id_seq TO service_role;

INSERT INTO public.step_curriculum_indicators
 (axis_code,slug,title_ar,title_en,description,position,status,legacy_course_code)
VALUES
 ('writing-analysis','sentence-combining','دمج الجمل','Sentence Combining',
  'مهارة صياغة جملة موحدة دون تكرار أو تغيير المعنى. مصدر التصنيف الداخلي: ASGQCOMBINE، ص187 من البنك المدقق. يحتاج تدقيق مستوى السؤال قبل النشر.',1006,'draft',null),
 ('writing-analysis','logical-sentence-completion','الإكمال المنطقي للجمل','Logical Sentence Completion',
  'تحديد تتمة متسقة مع الفكرة والسياق؛ ليس اختبار أدوات الربط النحوية وحدها. مصدر داخلي: ASGQLOGCOMP، ص197.',1007,'draft',null),
 ('writing-analysis','spelling-word-recognition','التهجئة والتعرف على الكلمات','Spelling and Word Recognition',
  'دقة التهجئة والتمييز البصري للكلمات؛ مهارة كتابة تحريرية مستقلة، وليست قاعدة صرفية. مصدر داخلي: ASGQSPELL، ص198.',1008,'draft',null)
ON CONFLICT (slug) DO NOTHING;

-- Paragraph placement is a Sequencing skill, not syntactic word order.
UPDATE public.step_question_bank_classifications
 SET indicator_slug='sequencing',related_indicator_slug=NULL,mapping_status='mapped',updated_at=now()
 WHERE code='ASGQINSERT' AND indicator_slug IS NULL AND mapping_status='needs_review';
UPDATE public.step_question_bank_classifications
 SET indicator_slug='sentence-combining',related_indicator_slug=NULL,mapping_status='mapped',updated_at=now()
 WHERE code='ASGQCOMBINE' AND indicator_slug IS NULL AND mapping_status='needs_review';
UPDATE public.step_question_bank_classifications
 SET indicator_slug='logical-sentence-completion',related_indicator_slug=NULL,mapping_status='mapped',updated_at=now()
 WHERE code='ASGQLOGCOMP' AND indicator_slug IS NULL AND mapping_status='needs_review';
UPDATE public.step_question_bank_classifications
 SET indicator_slug='spelling-word-recognition',related_indicator_slug=NULL,mapping_status='mapped',updated_at=now()
 WHERE code='ASGQSPELL' AND indicator_slug IS NULL AND mapping_status='needs_review';
-- ASGQSENT combines possessive forms, auxiliaries and sentence correctness:
-- do not give a blanket axis assignment without item-level review.
-- ASGQWOR remains Grammar; ASGQPARORDER remains Writing Analysis.
