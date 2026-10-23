-- Lesson27 Gerunds source-exact private-bank release gate.
-- Questions, option text, answer keys and explanations are deliberately excluded from public GitHub.
-- Applied to Supabase through migration step_lesson27_gerunds_source_publication_gate.
CREATE OR REPLACE FUNCTION public.step_guard_lesson27_gerunds_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total integer; assigned integer; unique_ids integer; stages integer; exact_items integer; repeated integer; overlapping integer;
BEGIN
 IF NEW.slug!='gerunds' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQGERUNDCORE' THEN
   RAISE EXCEPTION 'Lesson27 only accepts the private audited Gerunds bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQGERUNDCORE';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson27 needs four distinct teaching stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<20 THEN RAISE EXCEPTION 'Lesson27 needs 20 independently reviewed source-exact questions, found %',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT a.value) INTO assigned,unique_ids
 FROM jsonb_array_elements(bank->'sections') s(section),LATERAL jsonb_array_elements_text(s.section->'questionIds') a;
 IF assigned!=total OR unique_ids!=total THEN RAISE EXCEPTION 'Lesson27 questions must be assigned to one stage each' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF stages!=4 THEN RAISE EXCEPTION 'Lesson27 each stage needs at least 2 graded originals and 4 teacher examples' USING ERRCODE='23514';END IF;
 IF bank->'sections'->2->>'id'!='reduced-ing' OR bank->'sections'->3->>'id'!='special-gerund'
 THEN RAISE EXCEPTION 'Lesson27 must explicitly distinguish reduced participle clauses from true gerunds' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_items FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQGER' AND r.review_status='approved'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object'
 AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_items!=total THEN RAISE EXCEPTION 'Lesson27 all source questions need exact stems, four choices, reviewed key and full reasons' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO repeated FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp
  FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF repeated>0 THEN RAISE EXCEPTION 'Lesson27 repeats source stems internally' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO overlapping FROM jsonb_each(bank->'questions') q(id,item)
 WHERE EXISTS(SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQGERUNDCORE'
 AND lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi')));
 IF overlapping>0 THEN RAISE EXCEPTION 'Lesson27 overlaps original questions graded in another lesson' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS step_lesson27_gerunds_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson27_gerunds_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson27_gerunds_publish();
