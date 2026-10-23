-- Lesson30: production source-exact Causatives release protection.
-- No private original stems, options, answer keys, or scores appear in this public file.
CREATE OR REPLACE FUNCTION public.step_guard_lesson30_causatives_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; count_questions integer; n_assigned integer; n_unique integer; n_complete integer; n_exact integer; n_duplicate integer; n_overlap integer;
BEGIN
 IF NEW.slug!='causatives' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQCAUSCORE' THEN RAISE EXCEPTION 'Lesson30 requires private audited Causatives source bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQCAUSCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson30 incomplete four-stage instructional bank' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO count_questions FROM jsonb_each(bank->'questions');
 IF count_questions<12 THEN RAISE EXCEPTION 'Lesson30 remains draft: only % independent originals; require 12 for full coverage',count_questions USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT q.id) INTO n_assigned,n_unique
 FROM jsonb_array_elements(bank->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') q(id);
 IF n_assigned!=count_questions OR n_unique!=count_questions THEN RAISE EXCEPTION 'Lesson30 original questions assigned multiple times' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_complete FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF n_complete!=4 THEN RAISE EXCEPTION 'Lesson30 each stage requires two verified originals and four worked examples' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_exact FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQCAUS'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT (q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF n_exact!=count_questions THEN RAISE EXCEPTION 'Lesson30 needs only source-exact approved originals with three wrong-option explanations' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n_duplicate FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF n_duplicate>0 THEN RAISE EXCEPTION 'Lesson30 repeated source stems' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQCAUSCORE'
 AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF n_overlap>0 THEN RAISE EXCEPTION 'Lesson30 duplicates other lessons graded originals' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS step_lesson30_causatives_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson30_causatives_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson30_causatives_publish();
