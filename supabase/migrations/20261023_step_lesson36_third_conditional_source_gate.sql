-- Lesson36 private source exact publication check. This public migration contains no original exams or keys.
-- The exact function and trigger are active on Supabase production.
CREATE OR REPLACE FUNCTION public.step_guard_lesson36_third_conditional_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; stages int; exact_items int; duplicated int; reused int;
BEGIN
 IF NEW.slug!='third-conditional' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQTHIRDCORE' THEN RAISE EXCEPTION 'Lesson36 requires private source-reviewed Third Conditional bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQTHIRDCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=3 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson36 requires three complete teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<18 THEN RAISE EXCEPTION 'Lesson36 needs 18 approved independent Third Conditional originals, only %',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT e.id) INTO assigned,uniq
 FROM jsonb_array_elements(bank->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') e(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson36 question IDs repeated or unassigned' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=3
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF stages!=3 THEN RAISE EXCEPTION 'Lesson36 needs >=3 scored originals and 4 examples per skill' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQCON3'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct')) AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson36 requires source-exact original MCQ with audited answer explanations' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO duplicated FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp
 FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF duplicated>0 THEN RAISE EXCEPTION 'Lesson36 duplicates original text within course' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO reused FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQTHIRDCORE' AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=
 lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF reused>0 THEN RAISE EXCEPTION 'Lesson36 original question graded in another course' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson36_third_conditional_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson36_third_conditional_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson36_third_conditional_publish();
