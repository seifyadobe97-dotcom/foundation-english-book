-- Lesson 18 / Modal Passive + Modal Perfect Passive.
-- Only source references, quality thresholds and release logic; never public MCQ content or keys.
-- Applied in production with Supabase migration step_lesson18_modal_passive_source_gate.

CREATE OR REPLACE FUNCTION public.step_guard_lesson18_modal_passive_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 b jsonb; total integer; assigned integer; uniq integer; matching integer;
 exemplified integer; perfect integer; overlap integer; duplicates integer;
BEGIN
 IF NEW.slug <> 'modal-passive' OR NEW.status <> 'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQMODPASSCORE'
 THEN RAISE EXCEPTION 'Lesson18 must use the reviewed private modal-passive bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQMODPASSCORE';
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array'
 OR jsonb_typeof(b->'questions')<>'object'
 OR jsonb_array_length(b->'sections')<>6
 OR b->'sections'->0->>'id'<>'intro'
 THEN RAISE EXCEPTION 'Lesson18 requires six complete stages including the introduction' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<12 THEN
 RAISE EXCEPTION 'Lesson18 source coverage incomplete: only % of 12 independent items',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT j.id) INTO assigned,uniq
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') j(id);
 IF assigned<>total OR uniq<>total
 THEN RAISE EXCEPTION 'Lesson18 questions must be assigned once only' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO exemplified FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'visual')='object'
 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF exemplified<>6 THEN RAISE EXCEPTION 'Lesson18 each stage requires four worked examples' USING ERRCODE='23514'; END IF;
 IF coalesce(jsonb_array_length(b->'sections'->0->'questionIds'),0)<>0
 THEN RAISE EXCEPTION 'Lesson18 introduction must be unscored' USING ERRCODE='23514'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(b->'sections') s(section)
     WHERE s.section->>'id' IN ('necessity','possibility','past-conditional','past-deduction')
     AND jsonb_typeof(s.section->'questionIds')='array'
     AND jsonb_array_length(s.section->'questionIds')>=2)<>4
 THEN RAISE EXCEPTION 'Lesson18 requires at least two items in each assessed modal-passive skill' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO matching
 FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQMODPASS','ASGQMODPERPASS')
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
 IF matching<>total THEN RAISE EXCEPTION 'Lesson18 requires source-exact approved questions, keys and 3 complete distractor explanations' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO perfect FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.original_category_code='ASGQMODPERPASS';
 IF perfect<3 THEN RAISE EXCEPTION 'Lesson18 needs three distinct Modal Perfect Passive items, got %',perfect USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO duplicates FROM (
 SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) k
 FROM jsonb_each(b->'questions') q(id,item)
 GROUP BY 1 HAVING count(*)>1) d;
 IF duplicates>0 THEN RAISE EXCEPTION 'Lesson18 repeated source stems' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO overlap FROM jsonb_each(b->'questions') q(id,item)
 WHERE EXISTS (
   SELECT 1 FROM public.step_private_course_banks other
   CROSS JOIN LATERAL jsonb_each(other.payload->'questions') q2(id,item)
   WHERE other.course_code<>'ASGQMODPASSCORE'
   AND lower(regexp_replace(q2.item->>'text','[^a-z0-9]','','gi'))=
       lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap>0 THEN RAISE EXCEPTION 'Lesson18 overlaps another lesson bank: % stems',overlap USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS step_lesson18_modal_passive_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson18_modal_passive_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson18_modal_passive_publish();
