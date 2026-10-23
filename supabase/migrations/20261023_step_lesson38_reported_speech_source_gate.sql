-- Lesson38 Reported Speech private-source publish protection. No source MCQs or answer keys are public.
CREATE OR REPLACE FUNCTION public.step_guard_lesson38_reported_speech_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; full_stages int; matched int; duplicates int; cross_overlap int;
BEGIN
 IF NEW.slug!='reported-speech' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQREPORTCORE' THEN RAISE EXCEPTION 'Lesson38 requires private audited Reported Speech source bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQREPORTCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson38 requires all four teaching areas' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<12 THEN RAISE EXCEPTION 'Lesson38 remains draft: % independent audited originals, 12 required',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT e.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') e(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson38 scored original assigned more than once' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO full_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF full_stages!=4 THEN RAISE EXCEPTION 'Lesson38 requires two reviewed originals and four teaching examples per stage' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO matched FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQREPSPEECH'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT (q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF matched!=total THEN RAISE EXCEPTION 'Lesson38 must keep exact approved original text/key and full wrong-choice explanations' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO duplicates FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item)
 GROUP BY 1 HAVING count(*)>1) x;
 IF duplicates>0 THEN RAISE EXCEPTION 'Lesson38 duplicated source stem internally' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO cross_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') orig(id,item)
 WHERE other.course_code!='ASGQREPORTCORE'
 AND lower(regexp_replace(orig.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF cross_overlap>0 THEN RAISE EXCEPTION 'Lesson38 repeats already-scored original in another course' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson38_reported_speech_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson38_reported_speech_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson38_reported_speech_publish();
