-- Installed source-only publication guard for Lesson12. Safe to version publicly: no source MCQs or secret keys.
CREATE OR REPLACE FUNCTION public.step_guard_lesson12_past_perfect_continuous_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb;total integer;matches integer;assignment_count integer;distinct_ids integer;covered integer;
BEGIN
 IF NEW.slug<>'past-perfect-continuous' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQPAPERCONT'
 THEN RAISE EXCEPTION 'Lesson12 requires its mapped private audited source bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code=NEW.legacy_course_code;
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>5
 OR jsonb_typeof(b->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson12 requires five illustrated teaching stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<5 THEN
 RAISE EXCEPTION 'Lesson12 publication blocked: need five independent original source-approved questions; currently %',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT i.id) INTO assignment_count,distinct_ids
 FROM jsonb_array_elements(b->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') i(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>0
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_array_length(s.section->'visual'->'examples')=4;
 IF assignment_count<>total OR distinct_ids<>total OR covered<>5
 THEN RAISE EXCEPTION 'Lesson12 requires five fully source-assigned unique stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO matches FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved'
 AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code='ASGQPAPERCONT'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matches<>total
 THEN RAISE EXCEPTION 'Lesson12 questions must exactly match independently reviewed originals' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson12_past_perfect_continuous_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson12_past_perfect_continuous_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson12_past_perfect_continuous_gate
BEFORE INSERT OR UPDATE OF status,legacy_course_code ON public.step_curriculum_indicators
FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson12_past_perfect_continuous_publish();
