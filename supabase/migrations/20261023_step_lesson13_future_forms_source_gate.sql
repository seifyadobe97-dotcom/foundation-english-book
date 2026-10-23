-- Lesson 13 exact source publishing guard applied 2026-10-23. No original questions or secrets.
CREATE OR REPLACE FUNCTION public.step_guard_lesson13_future_forms_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb;total integer;covered integer;assigned integer;unique_ids integer;verified integer;continuous_n integer;perfect_n integer;
BEGIN
 IF NEW.slug<>'future-continuous-future-perfect' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQFUCOMBO'
 THEN RAISE EXCEPTION 'Lesson13 requires its private audited Future Forms source bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQFUCOMBO';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')<>'array' OR jsonb_array_length(bank->'sections')<>6
 OR jsonb_typeof(bank->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson13 requires six complete teaching stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<6
 THEN RAISE EXCEPTION 'Lesson13 publication blocked: at least six independently audited original questions required, currently %',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT i.id) INTO assigned,unique_ids FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') i(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>0
 AND jsonb_typeof(s.section->'visual')='object' AND jsonb_array_length(s.section->'visual'->'examples')=4;
 IF assigned<>total OR unique_ids<>total OR covered<>6
 THEN RAISE EXCEPTION 'Lesson13 requires six uniquely source-assigned illustrated sections' USING ERRCODE='23514'; END IF;
 SELECT count(*),
 count(*) FILTER(WHERE r.original_category_code='ASGQFUCONT'),
 count(*) FILTER(WHERE r.original_category_code='ASGQFUPER')
 INTO verified,continuous_n,perfect_n
 FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQFUCONT','ASGQFUPER')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF verified<>total OR continuous_n<3 OR perfect_n<3
 THEN RAISE EXCEPTION 'Lesson13 requires source-exact originals, at least three Future Continuous and three Future Perfect questions' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson13_future_forms_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson13_future_forms_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson13_future_forms_gate BEFORE INSERT OR UPDATE OF status,legacy_course_code
ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson13_future_forms_publish();
