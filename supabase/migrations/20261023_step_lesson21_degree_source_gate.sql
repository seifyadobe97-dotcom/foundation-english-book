-- Lesson 21 source-only publication guard. No private exam text or answer keys.
-- Already applied as Supabase migration step_lesson21_degree_source_publication_gate.
CREATE OR REPLACE FUNCTION public.step_guard_lesson21_degree_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb; total int; assigned int; uniq int; matched int; stages int; overlap_count int; duplicates int;
BEGIN
 IF NEW.slug<>'quantity-degree' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQDEGREE'
 THEN RAISE EXCEPTION 'Lesson21 must use the reviewed private degree bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQDEGREE';
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>4
 OR jsonb_typeof(b->'questions')<>'object' THEN
 RAISE EXCEPTION 'Lesson21 four distinct degree teaching stages required' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<12 THEN
 RAISE EXCEPTION 'Lesson21 draft only: % reviewed originals, need 12 and So...That source examples',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT v.id) INTO assigned,uniq
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') v(id);
 IF assigned<>total OR uniq<>total THEN RAISE EXCEPTION 'Lesson21 duplicate/unassigned original items' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO stages FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual')='object'
 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF stages<>4 THEN RAISE EXCEPTION 'Lesson21 needs 2 graded original questions plus 4 examples per stage' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO matched FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code='ASGQTOO'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
 AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matched<>total THEN RAISE EXCEPTION 'Lesson21 only source-exact verified items with all three reasons may publish' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO duplicates FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))
 FROM jsonb_each(b->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) dup;
 IF duplicates>0 THEN RAISE EXCEPTION 'Lesson21 duplicates original texts' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(b->'questions') q(id,item)
 WHERE EXISTS (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code<>'ASGQDEGREE'
 AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=
 lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson21 repeats original stems from another lesson' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson21_degree_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson21_degree_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson21_degree_publish();
