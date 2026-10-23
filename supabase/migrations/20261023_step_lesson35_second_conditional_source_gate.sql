-- Lesson35 private source exact publication check. This public migration contains no original exams or keys.
-- The exact function and trigger are active on Supabase production.
CREATE OR REPLACE FUNCTION public.step_guard_lesson35_second_conditional_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; unique_ids int; complete_stages int; exact_items int; repeated int; overlap_count int;
BEGIN
 IF NEW.slug!='second-conditional' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQSECONDCORE' THEN RAISE EXCEPTION 'Lesson35 requires audited private bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQSECONDCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=3 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson35 needs all 3 sections' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<12 THEN RAISE EXCEPTION 'Lesson35 source shortage: % independent Second Conditional originals; require at least 12',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT v.id) INTO assigned,unique_ids FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') v(id);
 IF assigned!=total OR unique_ids!=total THEN RAISE EXCEPTION 'Lesson35 originals must be assigned exactly once' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO complete_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=3
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF complete_stages!=3 THEN RAISE EXCEPTION 'Lesson35 needs >=3 independently graded items and 4 examples per stage' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQCON2'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct')) AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson35 exact source options/key and distractor explanations required' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO repeated FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF repeated>0 THEN RAISE EXCEPTION 'Lesson35 duplicated stems' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQSECONDCORE'
 AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson35 duplicates scored originals in another course' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson35_second_conditional_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson35_second_conditional_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson35_second_conditional_publish();
