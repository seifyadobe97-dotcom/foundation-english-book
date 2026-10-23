-- Lesson39 published release protection; private source questions, choice text and answers intentionally excluded.
CREATE OR REPLACE FUNCTION public.step_guard_lesson39_indirect_questions_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; full_stages int; exact_count int; dup_count int; overlap_count int;
BEGIN
 IF NEW.slug!='indirect-questions' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQINDQCORE' THEN RAISE EXCEPTION 'Lesson39 needs private reviewed original Indirect Questions bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQINDQCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=5 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson39 needs five complete teaching areas' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<12 THEN RAISE EXCEPTION 'Lesson39 remains draft: % approved originals; requires twelve plus if/whether coverage',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT v.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') v(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson39 scored originals must be assigned exactly once' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO full_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF full_stages!=5 THEN RAISE EXCEPTION 'Lesson39 needs at least two scored originals and four examples in each of five stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_count FROM jsonb_each(bank->'questions') q(id,item) JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQINDQ'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_count!=total THEN RAISE EXCEPTION 'Lesson39 only exact audited private source MCQs with individual wrong-option rationales can publish' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO dup_count FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp
 FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF dup_count>0 THEN RAISE EXCEPTION 'Lesson39 source repeats detected' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQINDQCORE' AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson39 repeats original question scored in another course' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson39_indirect_questions_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson39_indirect_questions_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson39_indirect_questions_publish();
