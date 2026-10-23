-- Lesson40 source-audited Question Tags private publishing protection; no original scored stem/options/key public.
CREATE OR REPLACE FUNCTION public.step_guard_lesson40_question_tags_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; complete_stages int; exact_count int; repeated int; cross_overlap int;
BEGIN
 IF NEW.slug!='question-tags' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQQTAGCORE' THEN RAISE EXCEPTION 'Lesson40 must use vetted private Question Tags bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQQTAGCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson40 requires four complete teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<10 THEN RAISE EXCEPTION 'Lesson40 remains draft: only % independently approved originals; requires ten',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT q.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') q(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson40 source originals must each be assigned once' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO complete_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF complete_stages!=4 THEN RAISE EXCEPTION 'Lesson40 needs two independent original MCQs and four worked examples in every stage' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_count FROM jsonb_each(bank->'questions') q(id,item) JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQQTAG'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_count!=total THEN RAISE EXCEPTION 'Lesson40 requires source-exact approved original MCQs and all wrong-choice rationales' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO repeated FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF repeated>0 THEN RAISE EXCEPTION 'Lesson40 duplicate source originals' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO cross_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQQTAGCORE' AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF cross_overlap>0 THEN RAISE EXCEPTION 'Lesson40 source original scored in another lesson' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson40_question_tags_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson40_question_tags_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson40_question_tags_publish();
