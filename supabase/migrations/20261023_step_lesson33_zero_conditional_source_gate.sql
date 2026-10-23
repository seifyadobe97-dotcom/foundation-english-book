-- Lesson33 source-exact Zero Conditional publication protection.
-- Private questions and answers deliberately not included in public GitHub.
CREATE OR REPLACE FUNCTION public.step_guard_lesson33_zero_conditional_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total integer; assigned integer; unique_ids integer; complete_stages integer; exact_items integer; duplicates integer; reused integer;
BEGIN
 IF NEW.slug!='zero-conditional' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQZEROCORE'
 THEN RAISE EXCEPTION 'Lesson33 must use private verified Zero Conditional originals' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQZEROCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=3 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson33 requires three instructional areas' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<10 THEN RAISE EXCEPTION 'Lesson33 remains draft: % reviewed originals, need 10 independently scored items',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT v.id) INTO assigned,unique_ids FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') v(id);
 IF assigned!=total OR unique_ids!=total THEN RAISE EXCEPTION 'Lesson33 source assignments repeated or incomplete' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO complete_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF complete_stages!=3 THEN RAISE EXCEPTION 'Lesson33 must grade habits, truths and zero/first distinction independently' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQCON0' AND r.review_status='approved'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'));
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson33 only source-exact original MCQs with all distractor explanations can grade' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO duplicates FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) k FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF duplicates>0 THEN RAISE EXCEPTION 'Lesson33 duplicate original stems' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO reused FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') orig(id,item)
 WHERE other.course_code!='ASGQZEROCORE'
 AND lower(regexp_replace(orig.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF reused>0 THEN RAISE EXCEPTION 'Lesson33 overlaps another graded source-bank question' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson33_zero_conditional_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson33_zero_conditional_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson33_zero_conditional_publish();
