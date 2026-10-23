-- Lesson25 publication gate already applied in production; source exam stems/options stay private in Supabase.
-- This file tracks the active gate SQL, not private bank fixtures.
CREATE OR REPLACE FUNCTION public.step_guard_lesson25_preposition_collocations_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total integer; assigned integer; unique_ids integer; stages integer; exact_items integer; overlaps_count integer;
BEGIN
 IF NEW.slug!='preposition-collocations' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQCOLLOCPREP' THEN
 RAISE EXCEPTION 'Lesson25 requires its reviewed source-only private collocations bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQCOLLOCPREP';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson25 needs four instructional collocation stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<12 THEN RAISE EXCEPTION 'Lesson25 remains draft: % original collocation questions, need 12',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT q.value) INTO assigned,unique_ids
 FROM jsonb_array_elements(bank->'sections') s(section), LATERAL jsonb_array_elements_text(s.section->'questionIds') q;
 IF assigned!=total OR unique_ids!=total THEN RAISE EXCEPTION 'Lesson25 original items must be assigned once each' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF stages!=4 THEN RAISE EXCEPTION 'Lesson25 must have graded source items in every collocation family' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQPREP'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'));
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson25 only source-exact independently approved MCQs can publish' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlaps_count FROM jsonb_each(bank->'questions') q(id,item)
 WHERE EXISTS(SELECT 1 FROM public.step_private_course_banks other
 CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQCOLLOCPREP'
 AND lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi')));
 IF overlaps_count>0 THEN RAISE EXCEPTION 'Lesson25 duplicates original source questions from another lesson' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson25_collocations_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson25_collocations_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson25_preposition_collocations_publish();
