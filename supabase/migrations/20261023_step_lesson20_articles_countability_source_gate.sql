-- Lesson 20 countability/articles source-exact release protection.
-- Private question stems and answers are deliberately NOT part of this public migration.
-- Production migration applied: step_lesson20_articles_countability_quality_gate.

CREATE OR REPLACE FUNCTION public.step_guard_lesson20_articles_countability_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b jsonb; total int; assigned int; uniq int; good_stage int; exact int;
 articles int; quantifiers int; dedup int; overlap_count int;
BEGIN
 IF NEW.slug<>'articles-countability' OR NEW.status<>'published'
 OR (TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code)
 THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQARTCOUNT'
 THEN RAISE EXCEPTION 'Lesson20 requires the audited private Articles & Countability bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO b FROM public.step_private_course_banks WHERE course_code='ASGQARTCOUNT';
 IF b IS NULL OR jsonb_typeof(b->'sections')<>'array' OR jsonb_array_length(b->'sections')<>6
 OR jsonb_typeof(b->'questions')<>'object'
 THEN RAISE EXCEPTION 'Lesson20 requires six scored teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(b->'questions');
 IF total<20 THEN RAISE EXCEPTION 'Lesson20 needs at least 20 independent approved source questions: % found',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT j.id) INTO assigned,uniq
 FROM jsonb_array_elements(b->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') j(id);
 IF assigned<>total OR uniq<>total THEN RAISE EXCEPTION 'Lesson20 repeated or unassigned original question IDs' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO good_stage FROM jsonb_array_elements(b->'sections') s(section)
 WHERE jsonb_typeof(s.section->'visual')='object'
 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4
 AND jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>=2;
 IF good_stage<>6 THEN RAISE EXCEPTION 'Lesson20 needs at least two graded questions and four examples in all six skills' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQQUANT','ASGQART')
 AND r.original_stem=q.item->>'text'
 AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=14;
 IF exact<>total THEN RAISE EXCEPTION 'Lesson20 requires source-exact reviewed original stems/options/keys and full distractor reasons' USING ERRCODE='23514';END IF;
 SELECT count(*) FILTER(WHERE r.original_category_code='ASGQART'),
 count(*) FILTER(WHERE r.original_category_code='ASGQQUANT')
 INTO articles,quantifiers
 FROM jsonb_each(b->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id;
 IF articles<5 OR quantifiers<15
 THEN RAISE EXCEPTION 'Lesson20 Articles % and Countability % do not meet the 5/15 split',articles,quantifiers USING ERRCODE='23514';END IF;
 SELECT count(*) INTO dedup FROM (
 SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp
 FROM jsonb_each(b->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF dedup>0 THEN RAISE EXCEPTION 'Lesson20 duplicates original source stems' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(b->'questions') q(id,item)
 WHERE EXISTS (
 SELECT 1 FROM public.step_private_course_banks other
 CROSS JOIN LATERAL jsonb_each(other.payload->'questions') otherq(id,item)
 WHERE other.course_code<>'ASGQARTCOUNT'
 AND lower(regexp_replace(otherq.item->>'text','[^a-z0-9]','','gi'))=
 lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson20 overlaps original questions already attached to other lessons' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS step_lesson20_articles_countability_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson20_articles_countability_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson20_articles_countability_publish();
