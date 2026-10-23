-- Applied live on 2026-10-23; public repository contains no source exam texts, keys or private credentials.
CREATE OR REPLACE FUNCTION public.step_guard_lesson16_deduction_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb;total int;assigned int;uniq int;covered int;matches int;present_n int;past_n int;
BEGIN
 IF NEW.slug<>'modals-of-deduction' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQMODDEDUCT'
 THEN RAISE EXCEPTION 'Lesson16 requires its original-source private bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQMODDEDUCT';
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>6
 OR jsonb_typeof(b->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson16 requires six illustrated teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<6 THEN RAISE EXCEPTION 'Lesson16 publication blocked: at least six independent original source questions required; current %',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT x.id) INTO assigned,uniq
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') x(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>0
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_array_length(s.section->'visual'->'examples')=4;
 IF assigned<>total OR uniq<>total OR covered<>6
 THEN RAISE EXCEPTION 'Lesson16 needs unique source assignments across all six complete stages' USING ERRCODE='23514';END IF;
 SELECT count(*),
 count(*) FILTER (WHERE r.original_category_code IN ('ASGQMODPROB','ASGQMODCONT','ASGQMODABIL')),
 count(*) FILTER (WHERE r.original_category_code='ASGQMODPER')
 INTO matches,present_n,past_n
 FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved'
 AND r.document_key IN ('STEP_AUDITED_BANK_2026','TAJMEAAT_2026')
 AND r.original_category_code IN ('ASGQMODPROB','ASGQMODCONT','ASGQMODABIL','ASGQMODPER')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matches<>total OR present_n<3 OR past_n<3
 THEN RAISE EXCEPTION 'Lesson16 requires source-exact unique MCQs: at least three present and three past deduction/possibility items' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson16_deduction_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson16_deduction_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson16_deduction_gate BEFORE INSERT OR UPDATE OF status,legacy_course_code
ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson16_deduction_publish();
