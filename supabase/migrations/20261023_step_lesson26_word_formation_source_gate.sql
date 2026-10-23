-- Lesson26 cannot publish teaching-only material without independently audited original questions.
-- Existing source book has Word Formation explanations; no mapped question category in the supplied audited bank.
-- Original question stems and answer keys remain private.
CREATE OR REPLACE FUNCTION public.step_guard_lesson26_word_formation_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; question_count integer; assigned integer; unique_ids integer;
        valid_items integer; complete_stages integer; repeated integer; overlap_count integer;
BEGIN
  IF NEW.slug!='word-formation' OR NEW.status!='published' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
  IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQWORDFORM' THEN
    RAISE EXCEPTION 'Lesson26 only accepts private source-reviewed Word Formation bank' USING ERRCODE='23514'; END IF;
  SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQWORDFORM';
  IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=5 OR jsonb_typeof(bank->'questions')!='object' THEN
    RAISE EXCEPTION 'Lesson26 requires five instructional stages and a private question bank' USING ERRCODE='23514'; END IF;
  SELECT count(*) INTO question_count FROM jsonb_each(bank->'questions');
  IF question_count<12 THEN
    RAISE EXCEPTION 'Lesson26 source bank lacks independently approved Word Formation MCQs: % of 12',question_count USING ERRCODE='23514'; END IF;
  SELECT count(*),count(DISTINCT e.value) INTO assigned,unique_ids FROM jsonb_array_elements(bank->'sections') s(section),
       LATERAL jsonb_array_elements_text(s.section->'questionIds') e;
  IF assigned!=question_count OR unique_ids!=question_count THEN
    RAISE EXCEPTION 'Lesson26 all reviewed questions must be assigned once' USING ERRCODE='23514'; END IF;
  SELECT count(*) INTO complete_stages FROM jsonb_array_elements(bank->'sections') s(section)
  WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
  AND jsonb_typeof(s.section->'visual'->'examples')='array'
  AND jsonb_array_length(s.section->'visual'->'examples')>=4;
  IF complete_stages!=5 THEN RAISE EXCEPTION 'Lesson26 requires two approved originals and four worked examples in every stage' USING ERRCODE='23514'; END IF;
  SELECT count(*) INTO valid_items FROM jsonb_each(bank->'questions') q(id,item)
  JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
  JOIN public.step_question_bank_classifications taxonomy ON taxonomy.code=r.original_category_code
  WHERE taxonomy.indicator_slug='word-formation'
  AND r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
  AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
  AND r.printed_key=q.item->>'correct'
  AND jsonb_typeof(q.item->'options')='object'
  AND q.item->'options' ?& ARRAY['A','B','C','D']
  AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
  AND jsonb_typeof(q.item->'wrongReasons')='object'
  AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
  AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'));
  IF valid_items!=question_count THEN
    RAISE EXCEPTION 'Lesson26 source has no audited category or source-exact independent MCQs' USING ERRCODE='23514'; END IF;
  SELECT count(*) INTO repeated FROM
    (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) x
     FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) duplicates;
  IF repeated>0 THEN RAISE EXCEPTION 'Lesson26 repeated original source stems' USING ERRCODE='23514';END IF;
  SELECT count(*) INTO overlap_count FROM jsonb_each(bank->'questions') q(id,item)
  WHERE EXISTS(SELECT 1 FROM public.step_private_course_banks other
    CROSS JOIN LATERAL jsonb_each(other.payload->'questions') o(id,item)
    WHERE other.course_code!='ASGQWORDFORM'
    AND lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))=
        lower(regexp_replace(o.item->>'text','[^a-z0-9]','','gi')));
  IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson26 cannot reuse scored items from other lessons' USING ERRCODE='23514';END IF;
  RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson26_word_formation_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson26_word_formation_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson26_word_formation_publish();
