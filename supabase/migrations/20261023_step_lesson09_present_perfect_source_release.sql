-- Live DB applied 2026-10-23. Store schema only, never original source questions or keys.
-- Seven stages; at least 13 exact-source, distinct independently reviewed MCQs.
CREATE OR REPLACE FUNCTION public.step_guard_lesson09_present_perfect_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total integer; assigned integer; unique_ids integer; approved integer; covered integer;
BEGIN
 IF NEW.slug <> 'present-perfect' OR NEW.status <> 'published'
   OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQPRPER'
 THEN RAISE EXCEPTION 'Lesson 09 requires its verified private source bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code=NEW.legacy_course_code;
 IF bank IS NULL OR jsonb_typeof(bank->'sections')<>'array'
 OR jsonb_array_length(bank->'sections')<>7 OR jsonb_typeof(bank->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson 09 requires seven complete teaching stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<13 THEN RAISE EXCEPTION 'Lesson 09 needs at least thirteen source-verified independent questions' USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT k.id) INTO assigned,unique_ids
 FROM jsonb_array_elements(bank->'sections') s(section),LATERAL jsonb_array_elements_text(s.section->'questionIds') k(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>0;
 IF assigned<>total OR unique_ids<>total OR covered<>7
 THEN RAISE EXCEPTION 'Lesson 09 must have unique approved source IDs across seven taught stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO approved FROM jsonb_each(bank->'questions') q(id,question)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key IN ('STEP_AUDITED_BANK_2026','TAJMEAAT_2026')
 AND r.original_category_code IN ('ASGQPRPER','SGTPRPER')
 AND r.original_stem=q.question->>'text' AND r.original_options=q.question->'options'
 AND r.printed_key=q.question->>'correct'
 AND jsonb_typeof(q.question->'options')='object'
 AND q.question->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.question->'options'))=4
 AND jsonb_typeof(q.question->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.question->'wrongReasons'))=3
 AND NOT (q.question->'wrongReasons' ? (q.question->>'correct'))
 AND length(coalesce(q.question->>'explanation',''))>=12;
 IF approved<>total
 THEN RAISE EXCEPTION 'Lesson 09 source stem, options, printed key and wrong-answer rationales mismatch' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson09_present_perfect_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson09_present_perfect_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson09_present_perfect_gate BEFORE INSERT OR UPDATE OF status,legacy_course_code
ON public.step_curriculum_indicators FOR EACH ROW
EXECUTE FUNCTION public.step_guard_lesson09_present_perfect_publish();
