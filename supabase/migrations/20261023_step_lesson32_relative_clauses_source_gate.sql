-- Lesson32 Relative Clauses published status protected by source-only audited private bank.
-- No source original text, answer keys, or student attempt data exposed in this migration.
CREATE OR REPLACE FUNCTION public.step_guard_lesson32_relatives_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; n_items integer; n_assigned integer; n_unique integer; n_stages integer; n_exact integer; n_dup integer; n_overlap integer;
BEGIN
 IF NEW.slug!='relative-clauses' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQRELCORE' THEN RAISE EXCEPTION 'Lesson32 requires private source-reviewed Relative Clauses bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQRELCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=5 OR jsonb_typeof(bank->'questions')!='object' THEN
 RAISE EXCEPTION 'Lesson32 needs five relative-pronoun teaching stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n_items FROM jsonb_each(bank->'questions');
 IF n_items<18 THEN RAISE EXCEPTION 'Lesson32 remains draft: % approved source originals, need 18 and where/when coverage',n_items USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT q.id) INTO n_assigned,n_unique
 FROM jsonb_array_elements(bank->'sections') stage(section) CROSS JOIN LATERAL jsonb_array_elements_text(stage.section->'questionIds') q(id);
 IF n_assigned!=n_items OR n_unique!=n_items THEN RAISE EXCEPTION 'Lesson32 original questions not assigned uniquely' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n_stages FROM jsonb_array_elements(bank->'sections') stage(section)
 WHERE jsonb_typeof(stage.section->'questionIds')='array' AND jsonb_array_length(stage.section->'questionIds')>=2
 AND jsonb_typeof(stage.section->'visual'->'examples')='array' AND jsonb_array_length(stage.section->'visual'->'examples')>=4;
 IF n_stages!=5 OR bank->'sections'->4->>'id'!='where-when' THEN
 RAISE EXCEPTION 'Lesson32 needs source-scored where/when, and 4 worked examples in all five stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n_exact FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQREL'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT (q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF n_exact!=n_items THEN RAISE EXCEPTION 'Lesson32 only source-exact approved choices with individual reasons can publish' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n_dup FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) stem FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF n_dup>0 THEN RAISE EXCEPTION 'Lesson32 repeats original relative clause source stem' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') original(id,item)
 WHERE other.course_code!='ASGQRELCORE'
 AND lower(regexp_replace(original.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF n_overlap>0 THEN RAISE EXCEPTION 'Lesson32 duplicates source items graded in another lesson' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson32_relatives_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson32_relatives_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson32_relatives_publish();
