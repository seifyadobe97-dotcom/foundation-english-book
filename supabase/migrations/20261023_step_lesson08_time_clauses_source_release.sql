-- Applied to production Supabase 2026-10-23. Original graded stems/keys absent.
-- Retains five-source-item minimum and exact source matching for Lesson 08.
CREATE OR REPLACE FUNCTION public.step_guard_lesson08_time_clauses_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; items int; assigned int; unique_assigned int; approved int; covered int;
BEGIN
 IF NEW.slug<>'time-clauses' OR NEW.status<>'published' OR
    (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQTIMCL'
 THEN RAISE EXCEPTION 'Lesson 08 release requires mapped audited private bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQTIMCL';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')<>'array' OR jsonb_array_length(bank->'sections')<5
    OR jsonb_typeof(bank->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson 08 release requires complete teaching sections' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO items FROM jsonb_each(bank->'questions');
 IF items<5 THEN RAISE EXCEPTION 'Lesson 08 release needs five independent audited questions' USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT item.id) INTO assigned,unique_assigned
 FROM jsonb_array_elements(bank->'sections') s(section),LATERAL jsonb_array_elements_text(s.section->'questionIds') item(id);
 SELECT count(*) INTO covered
 FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>0;
 IF assigned<>items OR unique_assigned<>items OR covered<>jsonb_array_length(bank->'sections')
 THEN RAISE EXCEPTION 'Lesson 08 source question IDs must be unique and cover every section' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO approved FROM jsonb_each(bank->'questions') q(id,stem)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key IN('STEP_AUDITED_BANK_2026','TAJMEAAT_2026')
 AND r.original_category_code IN('ASGQFUTTIME','SGTPRSI','SGTPRPER')
 AND r.original_stem=q.stem->>'text' AND r.original_options=q.stem->'options' AND r.printed_key=q.stem->>'correct'
 AND jsonb_typeof(q.stem->'options')='object' AND q.stem->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.stem->'options'))=4
 AND jsonb_typeof(q.stem->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.stem->'wrongReasons'))=3
 AND NOT (q.stem->'wrongReasons' ? (q.stem->>'correct'))
 AND length(coalesce(q.stem->>'explanation',''))>=12;
 IF approved<>items
 THEN RAISE EXCEPTION 'Lesson 08 source text/options/printed answer/explanations must match 100 percent' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson08_time_clauses_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson08_time_clauses_publish_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson08_time_clauses_publish_gate
BEFORE INSERT OR UPDATE OF status,legacy_course_code ON public.step_curriculum_indicators
FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson08_time_clauses_publish();
