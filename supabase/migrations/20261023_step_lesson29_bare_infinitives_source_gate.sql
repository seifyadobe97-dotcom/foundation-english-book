-- Lesson29 Bare Infinitive source-only publication gate; no private MCQ stems/choices/answer keys in GitHub.
-- Active via Supabase migration step_lesson29_bare_infinitive_source_gate.
CREATE OR REPLACE FUNCTION public.step_guard_lesson29_bare_infinitives_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; unique_ids int; complete_stages int; exact_items int; repeated int; reused int;
BEGIN
 IF NEW.slug!='bare-infinitives' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQBARECORE' THEN
   RAISE EXCEPTION 'Lesson29 must use private source-audited Bare Infinitives bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQBARECORE';
 IF bank IS NULL OR jsonb_typeof(bank->'questions')!='object' OR jsonb_typeof(bank->'sections')!='array'
 OR jsonb_array_length(bank->'sections')!=4 THEN
   RAISE EXCEPTION 'Lesson29 needs four complete instructional areas' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<12 THEN RAISE EXCEPTION 'Lesson29 remains draft: only % independently approved originals (12 minimum)',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT q.value) INTO assigned,unique_ids
 FROM jsonb_array_elements(bank->'sections') s(section),LATERAL jsonb_array_elements_text(s.section->'questionIds') q;
 IF assigned!=total OR unique_ids!=total THEN RAISE EXCEPTION 'Lesson29 original question IDs must not repeat' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO complete_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF complete_stages!=4 THEN RAISE EXCEPTION 'Lesson29 needs at least two independent questions and four teaching examples in each stage' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code='ASGQINFBARE'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'));
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson29 needs source-exact MCQ text/choices/answer with three distractor explanations' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO repeated FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) k
 FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF repeated>0 THEN RAISE EXCEPTION 'Lesson29 contains duplicated original stems' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO reused FROM jsonb_each(bank->'questions') q(id,item)
 WHERE EXISTS(SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') e(id,item)
 WHERE other.course_code!='ASGQBARECORE'
 AND lower(regexp_replace(e.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF reused>0 THEN RAISE EXCEPTION 'Lesson29 source question already scored elsewhere' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson29_bare_infinitives_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson29_bare_infinitives_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson29_bare_infinitives_publish();
