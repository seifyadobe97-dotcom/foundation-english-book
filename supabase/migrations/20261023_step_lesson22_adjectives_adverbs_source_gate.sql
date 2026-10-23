-- Lesson22 only original bank-backed source metadata and release trigger are public.
-- No private questions, options, stems, keys, or student data.
-- Supabase migration: step_lesson22_adjectives_adverbs_quality_release_gate.
CREATE OR REPLACE FUNCTION public.step_guard_lesson22_adjectives_adverbs_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb; total int; assigned int; uq int; exact int; complete int; dedup int; overlap_count int;
BEGIN
 IF NEW.slug<>'adjectives-and-adverbs' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQADJADVCORE'
 THEN RAISE EXCEPTION 'Lesson22 must use private source-reviewed Adjectives and Adverbs bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQADJADVCORE';
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>6 OR jsonb_typeof(b->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson22 six-stage curriculum incomplete' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<22 THEN RAISE EXCEPTION 'Lesson22 only % verified originals; at least 22 and adjective-specific graded coverage required',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT a.id) INTO assigned,uq
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') a(id);
 IF assigned<>total OR uq<>total THEN RAISE EXCEPTION 'Lesson22 repeated or unassigned source questions' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO complete FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF complete<>6 THEN RAISE EXCEPTION 'Lesson22 needs scored adjective coverage and at least 2 items plus 4 instructor examples for every stage' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code='ASGQADJADV'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact<>total THEN RAISE EXCEPTION 'Lesson22 must be source-exact with approved keys and distractor analysis' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO dedup FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) k
 FROM jsonb_each(b->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF dedup>0 THEN RAISE EXCEPTION 'Lesson22 repeated original stems' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(b->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other
 CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code<>'ASGQADJADVCORE'
 AND lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson22 already scored in other lessons' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS step_lesson22_adjectives_adverbs_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson22_adjectives_adverbs_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson22_adjectives_adverbs_publish();
