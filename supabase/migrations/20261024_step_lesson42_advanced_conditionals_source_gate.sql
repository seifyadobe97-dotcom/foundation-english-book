-- Lesson42 guarded private source publication; exact original exam questions, options, keys remain in Supabase only.
CREATE OR REPLACE FUNCTION public.step_guard_lesson42_advanced_conditionals_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; fully_scored int; exact_count int; duplicates int; cross_overlap int; categories int;
BEGIN
 IF NEW.slug!='advanced-conditionals' OR NEW.status!='published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQADVCOND' THEN RAISE EXCEPTION 'Lesson42 needs private audited Advanced Conditionals bank' USING ERRCODE='23514'; END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQADVCOND';
 IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=3 OR jsonb_typeof(bank->'questions')!='object'
 THEN RAISE EXCEPTION 'Lesson42 requires all three advanced conditional stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<9 THEN RAISE EXCEPTION 'Lesson42 remains draft: % source-exact independent originals, at least nine needed',total USING ERRCODE='23514'; END IF;
 SELECT count(*),count(DISTINCT ids.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section) CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') ids(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson42 each scored original must be assigned exactly once' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO fully_scored FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF fully_scored!=3 THEN RAISE EXCEPTION 'Lesson42 needs independent original scoring in mixed, had-inversion and should-inversion stages' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO exact_count FROM jsonb_each(bank->'questions') q(id,item) JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code IN('ASGQCONMIX','ASGQINVCON')
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct')) AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_count!=total THEN RAISE EXCEPTION 'Lesson42 original text/options/key or distractors differ from approved source' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO categories FROM (SELECT r.original_category_code FROM jsonb_each(bank->'questions') q(id,item) JOIN public.step_source_item_reviews r ON r.candidate_id=q.id GROUP BY 1) c;
 IF categories!=2 THEN RAISE EXCEPTION 'Lesson42 must cover both independent source categories' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO duplicates FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) fp FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1 HAVING count(*)>1) d;
 IF duplicates>0 THEN RAISE EXCEPTION 'Lesson42 internal source stem duplicate' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO cross_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item) WHERE other.course_code!='ASGQADVCOND'
 AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')));
 IF cross_overlap>0 THEN RAISE EXCEPTION 'Lesson42 repeats source item scored elsewhere' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson42_advanced_conditionals_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson42_advanced_conditionals_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson42_advanced_conditionals_publish();
