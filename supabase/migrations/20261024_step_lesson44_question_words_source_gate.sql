-- Lesson44 original question-word source gate; original stems, answer options and keys live privately in Supabase only.
CREATE OR REPLACE FUNCTION public.step_guard_lesson44_question_words_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; stages_ok int; exact_count int; internal_dupes int; cross_overlap int;
BEGIN
 IF NEW.slug!='question-words' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQQWHCORE' THEN RAISE EXCEPTION 'Lesson44 requires private verified Question Words bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQQWHCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4 OR jsonb_typeof(bank->'questions')!='object' THEN
 RAISE EXCEPTION 'Lesson44 needs all four complete question-word skills' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<12 THEN RAISE EXCEPTION 'Lesson44 original source shortage: % available, at least 12 needed',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT v.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') v(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson44 source IDs must be assigned exactly once' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO stages_ok FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF stages_ok!=4 THEN RAISE EXCEPTION 'Lesson44 needs two original scored MCQs and four examples per stage' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_count FROM jsonb_each(bank->'questions') q(id,item) JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQQWH'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_count!=total THEN RAISE EXCEPTION 'Lesson44 must grade only source-exact approved originals with complete choice rationales' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO internal_dupes FROM(SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF internal_dupes>0 THEN RAISE EXCEPTION 'Lesson44 repeats scored original internally' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO cross_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQQWHCORE' AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF cross_overlap>0 THEN RAISE EXCEPTION 'Lesson44 original already scored in another lesson' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson44_question_words_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson44_question_words_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson44_question_words_publish();
