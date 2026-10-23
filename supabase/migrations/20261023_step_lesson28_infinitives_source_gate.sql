-- Lesson28 source-exact To-Infinitive release gate; no original stems, choice text or keys in this public migration.
-- Active on Supabase through migration step_lesson28_to_infinitives_source_gate.
CREATE OR REPLACE FUNCTION public.step_guard_lesson28_infinitives_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total integer; assigned integer; unique_ids integer; full_stages integer; exact_items integer; repeated integer; overlap_count integer;
BEGIN
 IF NEW.slug!='infinitives' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQINFINCORE'
 THEN RAISE EXCEPTION 'Lesson28 requires source-exact private To-Infinitive bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQINFINCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'questions')!='object' OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4
 THEN RAISE EXCEPTION 'Lesson28 requires four complete teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<20 THEN RAISE EXCEPTION 'Lesson28 requires 20 independently approved To-Infinitive originals, got %',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT a.value) INTO assigned,unique_ids
 FROM jsonb_array_elements(bank->'sections') sec(section),LATERAL jsonb_array_elements_text(sec.section->'questionIds') a;
 IF assigned!=total OR unique_ids!=total THEN RAISE EXCEPTION 'Lesson28 source originals must each be assigned once' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO full_stages FROM jsonb_array_elements(bank->'sections') sec(section)
 WHERE jsonb_typeof(sec.section->'questionIds')='array' AND jsonb_array_length(sec.section->'questionIds')>=2
 AND jsonb_typeof(sec.section->'visual'->'examples')='array'
 AND jsonb_array_length(sec.section->'visual'->'examples')>=4;
 IF full_stages!=4 THEN RAISE EXCEPTION 'Lesson28 requires at least two reviewed MCQs and four teaching examples for each skill stage' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQINF'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson28 source-exact approved stems, options, keys and distractor explanations required' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO repeated FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) k
 FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF repeated>0 THEN RAISE EXCEPTION 'Lesson28 repeats source stems' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') otherq(id,item)
 WHERE other.course_code!='ASGQINFINCORE'
 AND lower(regexp_replace(otherq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson28 scored original source reused in other course bank' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS step_lesson28_infinitives_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson28_infinitives_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson28_infinitives_publish();
