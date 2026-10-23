-- Source-audited Lesson31 publish guard. No source question texts or answer keys in public GitHub.
CREATE OR REPLACE FUNCTION public.step_guard_lesson31_connectors_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; n_items integer; n_assigned integer; n_unique integer; n_stages integer; n_exact integer; n_categories integer; n_duplicates integer; n_overlap integer;
BEGIN
 IF NEW.slug!='conjunctions-and-connectors' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQCONNLINK'
 THEN RAISE EXCEPTION 'Lesson31 requires private source-audited Conjunctions/Connectors bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQCONNLINK';
 IF bank IS NULL OR jsonb_typeof(bank->'questions')!='object' OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=5
 THEN RAISE EXCEPTION 'Lesson31 needs all five complete link function areas' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n_items FROM jsonb_each(bank->'questions');
 IF n_items<20 THEN RAISE EXCEPTION 'Lesson31 requires at least 20 independent source questions, only % available',n_items USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT ids.id) INTO n_assigned,n_unique
 FROM jsonb_array_elements(bank->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') ids(id);
 IF n_assigned!=n_items OR n_unique!=n_items THEN RAISE EXCEPTION 'Lesson31 source question IDs repeated or left unassigned' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=4
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF n_stages!=5 THEN RAISE EXCEPTION 'Lesson31 each of five areas requires >=4 scored originals and >=4 examples' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_exact FROM jsonb_each(bank->'questions') q(id,item) JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
 AND r.original_category_code IN ('ASGQLINKCAUSE','ASGQLINKRES','ASGQLINKCONTRAST','ASGQLINKTIME','ASGQLINK')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct')) AND length(coalesce(q.item->>'explanation',''))>=16;
 IF n_exact!=n_items THEN RAISE EXCEPTION 'Lesson31 original questions require source-exact text/options/keys and complete rationale' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_categories FROM
 (SELECT r.original_category_code FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id GROUP BY r.original_category_code HAVING count(*)>=4) full_cover;
 IF n_categories!=5 THEN RAISE EXCEPTION 'Lesson31 needs independently reviewed originals in all 5 connector groups' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_duplicates FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp
 FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF n_duplicates>0 THEN RAISE EXCEPTION 'Lesson31 duplicates source stems internally' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO n_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') orig(id,item)
 WHERE other.course_code!='ASGQCONNLINK'
 AND lower(regexp_replace(orig.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF n_overlap>0 THEN RAISE EXCEPTION 'Lesson31 cannot reuse graded originals from Logical Connectors or other lessons' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson31_connectors_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson31_connectors_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson31_connectors_publish();
