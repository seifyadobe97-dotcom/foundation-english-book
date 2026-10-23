-- Lesson34 First Conditional source-exact original-only publication gate.
-- No copyrighted question text, answer keys, or student result data in GitHub.
CREATE OR REPLACE FUNCTION public.step_guard_lesson34_first_conditional_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total integer; assigned integer; uniq integer; stages integer; exact_items integer; repeats integer; overlap_count integer;
BEGIN
 IF NEW.slug!='first-conditional' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQFIRSTCORE' THEN RAISE EXCEPTION 'Lesson34 requires private reviewed First Conditional bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQFIRSTCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'questions')!='object' OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=3 THEN
 RAISE EXCEPTION 'Lesson34 requires all three First Conditional skills' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<16 THEN RAISE EXCEPTION 'Lesson34 needs >=16 independently reviewed originals: % present',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT q.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') q(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson34 source IDs reused or unassigned' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF stages!=3 THEN RAISE EXCEPTION 'Lesson34 requires two source-original questions and four examples per skill' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQCON1'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson34 requires source-exact answer choices and full distractor reasoning' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO repeats FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item)
 GROUP BY 1 HAVING count(*)>1) d;
 IF repeats>0 THEN RAISE EXCEPTION 'Lesson34 duplicates original stems' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQFIRSTCORE'
 AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson34 source question graded elsewhere' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson34_first_conditional_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson34_first_conditional_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson34_first_conditional_publish();
