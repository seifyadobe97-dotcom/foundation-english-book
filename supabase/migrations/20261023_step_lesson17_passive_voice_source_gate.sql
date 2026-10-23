-- Lesson17 Passive Voice original-source publication gate. Applied to live Supabase 2026-10-23.
-- No source stems, A-D printed choices, answer keys or privileged credentials are versioned.
CREATE OR REPLACE FUNCTION public.step_guard_lesson17_passive_by_tense_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb;total integer;matching integer;assigned integer;unique_ids integer;covered integer;categories integer;
simple_present integer;present_cont integer;simple_past integer;past_cont integer;present_perf integer;past_perf integer;future_n integer;future_perf integer;supposed integer;normalized_duplicates integer;
BEGIN
 IF NEW.slug<>'passive-voice-by-tense' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQPSVCORE'
 THEN RAISE EXCEPTION 'Lesson17 requires the mapped audited private Passive Voice bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQPSVCORE';
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>9
 OR jsonb_typeof(b->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson17 requires nine illustrated tense stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<20 THEN RAISE EXCEPTION 'Lesson17 requires at least 20 independently audited original MCQs; found %',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT i.id) INTO assigned,unique_ids
 FROM jsonb_array_elements(b->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') i(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>0
 AND jsonb_typeof(s.section->'visual')='object' AND jsonb_array_length(s.section->'visual'->'examples')=4;
 IF assigned<>total OR unique_ids<>total OR covered<>9
 THEN RAISE EXCEPTION 'Lesson17 requires unique source assignments across all nine complete tense stages' USING ERRCODE='23514'; END IF;
 SELECT count(*),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVPRSIM'),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVPRCONT'),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVPASIM'),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVPACONT'),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVPRPER'),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVPAPER'),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVFUSIM'),
 count(*) FILTER(WHERE r.original_category_code='ASGQPSVFUPER'),
 count(*) FILTER(WHERE r.original_category_code='ASGQSUPPOSED')
 INTO matching,simple_present,present_cont,simple_past,past_cont,present_perf,past_perf,future_n,future_perf,supposed
 FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQPSVPRSIM','ASGQPSVPRCONT','ASGQPSVPASIM','ASGQPSVPACONT','ASGQPSVPRPER','ASGQPSVPAPER','ASGQPSVFUSIM','ASGQPSVFUPER','ASGQSUPPOSED')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matching<>total OR simple_present<3 OR present_cont<2 OR simple_past<5 OR past_cont<1
 OR present_perf<3 OR past_perf<2 OR future_n<2 OR future_perf<1 OR supposed<1
 THEN RAISE EXCEPTION 'Lesson17 needs source-exact answers and coverage of every Passive Voice tense classification' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO normalized_duplicates FROM(
 SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) normalized, count(*) n
 FROM jsonb_each(b->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1
 ) d;
 IF normalized_duplicates>0 THEN RAISE EXCEPTION 'Lesson17 has repeated source stems' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson17_passive_by_tense_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson17_passive_by_tense_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson17_passive_by_tense_gate
BEFORE INSERT OR UPDATE OF status,legacy_course_code ON public.step_curriculum_indicators
FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson17_passive_by_tense_publish();
