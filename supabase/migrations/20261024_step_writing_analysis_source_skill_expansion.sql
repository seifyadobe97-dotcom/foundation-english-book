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


-- Single-transaction owner-endpoint operation: update mapping and write its audit entry together.
-- SECURITY INVOKER and restricted EXECUTE: this is not a public user RPC.
CREATE OR REPLACE FUNCTION public.step_reassign_classification(
 p_code text,p_indicator_slug text,p_actor uuid,p_reason text
) RETURNS TABLE (code text,indicator_slug text,related_indicator_slug text,mapping_status text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE prior public.step_question_bank_classifications%ROWTYPE;
DECLARE secondary_slug text;
BEGIN
 IF p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 12 AND 1000 THEN
  RAISE EXCEPTION 'Classification change requires a source-based reason (12-1000 characters)' USING ERRCODE='22023';
 END IF;
 SELECT * INTO prior FROM public.step_question_bank_classifications c WHERE c.code=p_code FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown classification code' USING ERRCODE='22023'; END IF;
 IF p_indicator_slug IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.step_curriculum_indicators i WHERE i.slug=p_indicator_slug
 ) THEN RAISE EXCEPTION 'Unknown destination indicator' USING ERRCODE='22023'; END IF;
 IF EXISTS (SELECT 1 FROM public.step_curriculum_indicators i
            WHERE i.legacy_course_code=p_code AND i.status='published') THEN
  RAISE EXCEPTION 'Published course source mapping is immutable: use a separate reviewed release'
   USING ERRCODE='22023';
 END IF;
 IF prior.indicator_slug IS NOT DISTINCT FROM p_indicator_slug THEN
  RETURN QUERY SELECT c.code,c.indicator_slug,c.related_indicator_slug,c.mapping_status
   FROM public.step_question_bank_classifications c WHERE c.code=p_code;
  RETURN;
 END IF;
 -- Preserve a cross-axis reference only if the destination was already the secondary reference.
 secondary_slug:=CASE WHEN p_indicator_slug IS NOT NULL
   AND prior.related_indicator_slug=p_indicator_slug THEN prior.indicator_slug ELSE NULL END;
 UPDATE public.step_question_bank_classifications c
 SET indicator_slug=p_indicator_slug,related_indicator_slug=secondary_slug,
     mapping_status=CASE WHEN p_indicator_slug IS NULL THEN 'needs_review' ELSE 'mapped' END,
     updated_at=now()
 WHERE c.code=p_code;
 INSERT INTO public.step_curriculum_classification_changes
 (classification_code,old_indicator_slug,new_indicator_slug,old_related_indicator_slug,
  new_related_indicator_slug,changed_by,reason)
 VALUES(p_code,prior.indicator_slug,p_indicator_slug,prior.related_indicator_slug,
        secondary_slug,p_actor,btrim(p_reason));
 RETURN QUERY SELECT c.code,c.indicator_slug,c.related_indicator_slug,c.mapping_status
 FROM public.step_question_bank_classifications c WHERE c.code=p_code;
END;
$$;
REVOKE ALL ON FUNCTION public.step_reassign_classification(text,text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.step_reassign_classification(text,text,uuid,text) TO service_role;
