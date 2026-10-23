-- Applied to live Supabase 2026-10-23. No original source questions, printed answer keys, or private files included.
ALTER TABLE public.step_source_item_reviews ADD COLUMN IF NOT EXISTS lesson14_construction_code text;
DO $constraint$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='step_lesson14_construction_code_check'
 AND conrelid='public.step_source_item_reviews'::regclass) THEN
 ALTER TABLE public.step_source_item_reviews ADD CONSTRAINT step_lesson14_construction_code_check
 CHECK (lesson14_construction_code IS NULL OR lesson14_construction_code IN ('used_to_past','be_used_to','get_used_to'));
 END IF;END $constraint$;
UPDATE public.step_source_item_reviews SET lesson14_construction_code='used_to_past'
 WHERE candidate_id LIKE 'UST-%' AND review_status='approved';
CREATE OR REPLACE FUNCTION public.step_guard_lesson14_used_to_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb;total integer;valid integer;assigned integer;unique_ids integer;covered integer;
past_n integer;be_n integer;get_n integer;be_assigned integer;get_assigned integer;
BEGIN
 IF NEW.slug<>'used-to-be-used-to-get-used-to' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQUSED'
 THEN RAISE EXCEPTION 'Lesson14 requires private source-reviewed Used To bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code=NEW.legacy_course_code;
 IF b IS NULL OR jsonb_typeof(b->'questions')<>'object'
 OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>7
 THEN RAISE EXCEPTION 'Lesson14 requires seven teaching sections' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<9 THEN RAISE EXCEPTION 'Lesson14 requires at least 9 audited independent original questions' USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT i.id) INTO assigned,unique_ids
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') i(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>0
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_array_length(s.section->'visual'->'examples')=4;
 IF assigned<>total OR unique_ids<>total OR covered<>7
 THEN RAISE EXCEPTION 'Lesson14 requires independent questions assigned once across 7 full stages' USING ERRCODE='23514'; END IF;
 SELECT count(*),
 count(*) FILTER(WHERE r.lesson14_construction_code='used_to_past'),
 count(*) FILTER(WHERE r.lesson14_construction_code='be_used_to'),
 count(*) FILTER(WHERE r.lesson14_construction_code='get_used_to')
 INTO valid,past_n,be_n,get_n
 FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key IN ('STEP_AUDITED_BANK_2026','TAJMEAAT_2026')
 AND r.original_category_code IN ('ASGQUSED','SGTUSED')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 SELECT count(*) INTO be_assigned
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') i(id)
 JOIN public.step_source_item_reviews r ON r.candidate_id=i.id
 WHERE s.section->>'id'='be-used-to' AND r.review_status='approved'
 AND r.lesson14_construction_code='be_used_to';
 SELECT count(*) INTO get_assigned
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') i(id)
 JOIN public.step_source_item_reviews r ON r.candidate_id=i.id
 WHERE s.section->>'id'='get-used-to' AND r.review_status='approved'
 AND r.lesson14_construction_code='get_used_to';
 IF valid<>total OR past_n<3 OR be_n<3 OR get_n<3 OR be_assigned<3 OR get_assigned<3
 THEN RAISE EXCEPTION 'Lesson14 source release requires >=3 exact-source approved MCQs on each construction, including assigned Be Used To and Get Used To' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson14_used_to_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson14_used_to_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson14_used_to_gate BEFORE INSERT OR UPDATE OF status,legacy_course_code
ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson14_used_to_publish();
