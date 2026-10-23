-- Lesson23 gate uses private source review IDs only; no MCQ stems/keys on GitHub.
-- Applied to Supabase as step_lesson23_comparatives_superlatives_source_gate.
CREATE OR REPLACE FUNCTION public.step_guard_lesson23_comparatives_superlatives_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb; total int; assigned int; uniq int; full_stages int; matching int; comp int; sup int; dedup int; overlap_count int;
BEGIN
 IF NEW.slug<>'comparatives-superlatives' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQCOMPSUP'
 THEN RAISE EXCEPTION 'Lesson23 requires the private audited Comparatives/Superlatives bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQCOMPSUP';
 IF b IS NULL OR jsonb_typeof(b->'questions')<>'object' OR jsonb_typeof(b->'sections')<>'array'
 OR jsonb_array_length(b->'sections')<>5
 THEN RAISE EXCEPTION 'Lesson23 needs all five complete teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<18 THEN RAISE EXCEPTION 'Lesson23 lacks independently source-approved originals: % of 18',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT v.id) INTO assigned,uniq
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') v(id);
 IF assigned<>total OR uniq<>total
 THEN RAISE EXCEPTION 'Lesson23 original questions must be uniquely assigned to one section' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO full_stages FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF full_stages<>5 THEN RAISE EXCEPTION 'Lesson23 needs four worked examples and two original questions per stage' USING ERRCODE='23514';END IF;
 SELECT count(*),
 count(*) FILTER(WHERE r.original_category_code='ASGQCOMP'),
 count(*) FILTER(WHERE r.original_category_code='ASGQSUP')
 INTO matching,comp,sup
 FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQCOMP','ASGQSUP')
 AND r.original_stem=q.item->>'text'
 AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT (q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matching<>total OR comp<12 OR sup<6
 THEN RAISE EXCEPTION 'Lesson23 needs source exact options/stems/keys with at least 12 comparison and 6 superlative items; got % matched (% comp, % sup)',matching,comp,sup USING ERRCODE='23514';END IF;
 SELECT count(*) INTO dedup FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) stem FROM jsonb_each(b->'questions') q(id,item)
 GROUP BY 1 HAVING count(*)>1) repeated;
 IF dedup>0 THEN RAISE EXCEPTION 'Lesson23 repeated source stems inside bank' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(b->'questions') q(id,item)
 WHERE EXISTS(SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') otherq(id,item)
 WHERE other.course_code<>'ASGQCOMPSUP'
 AND lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(otherq.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson23 duplicates graded stems from other lessons: %',overlap_count USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS step_lesson23_comp_sup_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson23_comp_sup_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson23_comparatives_superlatives_publish();
