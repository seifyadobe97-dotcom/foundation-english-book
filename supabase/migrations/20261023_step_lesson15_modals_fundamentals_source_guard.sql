-- Applied to production Supabase on 2026-10-23; contains no private exam items or keys.
CREATE OR REPLACE FUNCTION public.step_guard_lesson15_modals_fundamentals_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb;total integer;matching integer;assigned integer;distinct_assigned integer;covered integer;
obligation integer;requests integer;ability integer;advice integer;othermodals integer;duplicates integer;
BEGIN
 IF NEW.slug<>'modals-fundamentals' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQMODCORE'
 THEN RAISE EXCEPTION 'Lesson15 requires mapped private original-source bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code=NEW.legacy_course_code;
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>7
 OR jsonb_typeof(b->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson15 requires seven illustrated sections' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<18 THEN RAISE EXCEPTION 'Lesson15 requires eighteen independent source-approved originals, currently %',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT x.id) INTO assigned,distinct_assigned
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') x(id);
 SELECT count(*) INTO covered FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>0
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_array_length(s.section->'visual'->'examples')=4;
 IF assigned<>total OR distinct_assigned<>total OR covered<>7
 THEN RAISE EXCEPTION 'Lesson15 requires all unique questions across all seven taught stages' USING ERRCODE='23514';END IF;
 SELECT count(*),
 count(*) FILTER(WHERE r.original_category_code='ASGQMODOBL'),
 count(*) FILTER(WHERE r.original_category_code='ASGQMODREQ'),
 count(*) FILTER(WHERE r.original_category_code='ASGQMODABIL'),
 count(*) FILTER(WHERE r.original_category_code='ASGQMODADV'),
 count(*) FILTER(WHERE r.original_category_code='ASGQMODGEN')
 INTO matching,obligation,requests,ability,advice,othermodals
 FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQMODOBL','ASGQMODREQ','ASGQMODABIL','ASGQMODADV','ASGQMODGEN')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matching<>total OR obligation<8 OR requests<3 OR ability<1 OR advice<5 OR othermodals<1
 THEN RAISE EXCEPTION 'Lesson15 needs exact-source items and verified coverage for obligation, requests, advice and ability' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO duplicates FROM (
  SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) cleaned,
    count(*) n FROM jsonb_each(b->'questions') q(id,item)
  GROUP BY 1 HAVING count(*)>1
 ) z;
 IF duplicates>0 THEN RAISE EXCEPTION 'Lesson15 original stems duplicated within course' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.step_guard_lesson15_modals_fundamentals_publish() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS step_lesson15_modals_fundamentals_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson15_modals_fundamentals_gate BEFORE INSERT OR UPDATE OF status,legacy_course_code
ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson15_modals_fundamentals_publish();
