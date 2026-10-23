-- Lesson43 original-source protected publication trigger. No source stems, correct answer keys or student data in public repository.
CREATE OR REPLACE FUNCTION public.step_guard_lesson43_question_formation_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; stages_ok int; exact_count int; internal_dupes int; overlap_count int;
BEGIN
 IF NEW.slug!='question-formation' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQQFORMCORE' THEN RAISE EXCEPTION 'Lesson43 needs private source-audited Question Formation originals' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQQFORMCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'questions')!='object' OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4
 THEN RAISE EXCEPTION 'Lesson43 requires four full teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<16 THEN RAISE EXCEPTION 'Lesson43 source shortage: % independent approved originals; sixteen required',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT ids.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') ids(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson43 original questions repeated or unassigned' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO stages_ok FROM jsonb_array_elements(bank->'sections') s(section) WHERE jsonb_typeof(s.section->'questionIds')='array'
 AND jsonb_array_length(s.section->'questionIds')>=4 AND jsonb_typeof(s.section->'visual'->'examples')='array'
 AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF stages_ok!=4 THEN RAISE EXCEPTION 'Lesson43 requires four independently scored originals and four worked examples per stage' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_count FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.document_key='STEP_AUDITED_BANK_2026' AND r.review_status='approved' AND r.original_category_code='ASGQQFORM'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT (q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_count!=total THEN RAISE EXCEPTION 'Lesson43 source text/key/distractor rationale must match independently reviewed originals' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO internal_dupes FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF internal_dupes>0 THEN RAISE EXCEPTION 'Lesson43 original stems repeated inside scored bank' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlap_count FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') otherq(id,item)
 WHERE other.course_code!='ASGQQFORMCORE' AND lower(regexp_replace(otherq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson43 original already scored in other course bank' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson43_question_formation_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson43_question_formation_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson43_question_formation_publish();
