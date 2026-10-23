-- Applied to Supabase production (2026-10-23); store schema, not exam questions or credentials.
-- Lesson 10 source release requires seven stages and thirteen unique, exact-original MCQs.
CREATE OR REPLACE FUNCTION public.step_guard_lesson10_present_perfect_continuous_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total integer; assigned integer; unique_ids integer; covered integer; exact integer;
BEGIN
 IF NEW.slug<>'present-perfect-continuous' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQPRPERCONT'
 THEN RAISE EXCEPTION 'Lesson 10 publication requires mapped original bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQPRPERCONT';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')<>'array'
 OR jsonb_array_length(bank->'sections')<>7 OR jsonb_typeof(bank->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson 10 requires seven complete teaching sections' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<13 THEN RAISE EXCEPTION 'Lesson 10 requires thirteen independent source-approved original questions' USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT x.id) INTO assigned,unique_ids
 FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') x(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>0
 AND jsonb_typeof(s.section->'visual')='object';
 IF assigned<>total OR unique_ids<>total OR covered<>7
 THEN RAISE EXCEPTION 'Lesson 10 source IDs must uniquely cover all seven sections' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO exact FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code='ASGQPRPERCONT'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact<>total
 THEN RAISE EXCEPTION 'Lesson 10 source text/choices/printed key/explanations mismatch' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson10_present_perfect_continuous_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson10_present_perfect_continuous_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson10_present_perfect_continuous_gate BEFORE INSERT OR UPDATE OF status,legacy_course_code
ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson10_present_perfect_continuous_publish();
