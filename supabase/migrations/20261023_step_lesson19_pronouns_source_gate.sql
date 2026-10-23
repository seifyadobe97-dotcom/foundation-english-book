-- Lesson 19 Pronouns: source-only grading, conservative quality gate, unscored reciprocal item.
-- Original question content and correct options are private in Supabase; none tracked publicly.
-- Applied to production via Supabase migration: step_lesson19_pronouns_source_quality_gate.

CREATE OR REPLACE FUNCTION public.step_guard_lesson19_pronouns_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb; total int; assigned int; unique_ids int; complete int; exact int;
 rec_count int; duplicate_count int; overlap_count int;
BEGIN
 IF NEW.slug <> 'pronouns' OR NEW.status <> 'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQPRONCORE'
 THEN RAISE EXCEPTION 'Lesson19 requires the canonical private Pronouns bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQPRONCORE';
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>8
 OR jsonb_typeof(b->'questions')<>'object' OR b->'sections'->7->>'id'<>'reciprocal'
 THEN RAISE EXCEPTION 'Lesson19 needs all 8 ordered stages and the unscored reciprocal stage' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<20 THEN RAISE EXCEPTION 'Lesson19 requires >=20 independently approved source-exact questions, only %',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT a.id) INTO assigned,unique_ids
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') a(id);
 IF assigned<>total OR unique_ids<>total
 THEN RAISE EXCEPTION 'Lesson19 every original question must be uniquely assigned once' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO complete FROM jsonb_array_elements(b->'sections') WITH ORDINALITY s(section,n)
 WHERE jsonb_typeof(s.section->'visual')='object'
 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4
 AND jsonb_typeof(s.section->'questionIds')='array'
 AND (n=8 OR jsonb_array_length(s.section->'questionIds')>=2);
 IF complete<>8 THEN RAISE EXCEPTION 'Lesson19 requires four examples in each stage, and 2 graded items per scored stage' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(b->'sections'->7->'questionIds')<>0
 THEN RAISE EXCEPTION 'Lesson19 ambiguous each other / one another source item cannot be graded' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO rec_count FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.original_category_code='ASGQPRNREC';
 IF rec_count>0 THEN RAISE EXCEPTION 'Lesson19 reciprocal section contains mutually correct options: not source-verified for grading' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO exact FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved'
 AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQPRNSUB','ASGQPRNOBJ','ASGQPRNPOSS','ASGQPRNREF','ASGQPRNINDEF','ASGQDETDEM')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>18;
 IF exact<>total THEN RAISE EXCEPTION 'Lesson19 needs source-exact original stems/options/key plus full explanation for each distractor' USING ERRCODE='23514'; END IF;
 IF (SELECT count(DISTINCT r.original_category_code) FROM jsonb_each(b->'questions') q(id,item)
     JOIN public.step_source_item_reviews r ON r.candidate_id=q.id)<>6
 THEN RAISE EXCEPTION 'Lesson19 must cover 6 independently assessed pronoun categories' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO duplicate_count FROM (
  SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) k
  FROM jsonb_each(b->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) dup;
 IF duplicate_count>0 THEN RAISE EXCEPTION 'Lesson19 contains repeated source stems' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(b->'questions') q(id,item)
 WHERE EXISTS (SELECT 1 FROM public.step_private_course_banks other
 CROSS JOIN LATERAL jsonb_each(other.payload->'questions') otherq(id,item)
 WHERE other.course_code<>'ASGQPRONCORE'
 AND lower(regexp_replace(otherq.item->>'text','[^a-z0-9]','','gi'))=
     lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson19 overlaps other scored lessons: %',overlap_count USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS step_lesson19_pronouns_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson19_pronouns_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson19_pronouns_publish();
