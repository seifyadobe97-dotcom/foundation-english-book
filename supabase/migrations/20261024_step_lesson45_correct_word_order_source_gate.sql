-- Lesson45 Word Order original question-and-options fingerprint publication gate. Source answers and student data remain private in Supabase.
CREATE OR REPLACE FUNCTION public.step_guard_lesson45_word_order_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; total int; assigned int; uniq int; full_stages int; exact_count int; repeated int; cross_overlap int;
BEGIN
 IF NEW.slug!='correct-word-order' OR NEW.status!='published' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQWORDORDER' THEN RAISE EXCEPTION 'Lesson45 must use source-audited Word Order originals in private bank' USING ERRCODE='23514';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQWORDORDER';
 IF bank IS NULL OR jsonb_typeof(bank->'questions')!='object' OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=4
 THEN RAISE EXCEPTION 'Lesson45 requires four complete Word Order instruction stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO total FROM jsonb_each(bank->'questions');
 IF total<12 THEN RAISE EXCEPTION 'Lesson45 needs >=12 independent source-audited originals; found %',total USING ERRCODE='23514';END IF;
 SELECT count(*),count(DISTINCT a.id) INTO assigned,uniq FROM jsonb_array_elements(bank->'sections') s(section)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.section->'questionIds') a(id);
 IF assigned!=total OR uniq!=total THEN RAISE EXCEPTION 'Lesson45 original question assignments must be unique and complete' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO full_stages FROM jsonb_array_elements(bank->'sections') s(section)
 WHERE jsonb_typeof(s.section->'questionIds')='array' AND jsonb_array_length(s.section->'questionIds')>=2
 AND jsonb_typeof(s.section->'visual'->'examples')='array' AND jsonb_array_length(s.section->'visual'->'examples')>=4;
 IF full_stages!=4 THEN RAISE EXCEPTION 'Lesson45 needs >=2 original graded MCQs and >=4 examples in each of four stages' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO exact_count FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026' AND r.original_category_code='ASGQWOR'
 AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct'
 AND jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND jsonb_typeof(q.item->'wrongReasons')='object' AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND length(coalesce(q.item->>'explanation',''))>=12;
 IF exact_count!=total THEN RAISE EXCEPTION 'Lesson45 source exact original A-D statements, key and distractor rationale mismatch' USING ERRCODE='23514';END IF;
 -- In this source category the introductory stem (e.g. Which sentence has CORRECT WORD ORDER?)
 -- is intentionally shared by many distinct items; uniqueness MUST compare all original choices as well.
 SELECT count(*) INTO repeated FROM
 (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) stem_fingerprint,q.item->'options' option_set
 FROM jsonb_each(bank->'questions') q(id,item) GROUP BY 1,2 HAVING count(*)>1) d;
 IF repeated>0 THEN RAISE EXCEPTION 'Lesson45 complete original question+option set repeated' USING ERRCODE='23514';END IF;
 SELECT count(*) INTO cross_overlap FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS
 (SELECT 1 FROM public.step_private_course_banks other CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code!='ASGQWORDORDER' AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))
 AND oq.item->'options'=q.item->'options');
 IF cross_overlap>0 THEN RAISE EXCEPTION 'Lesson45 complete original question already scored in another bank' USING ERRCODE='23514';END IF;
 RETURN NEW;
END;$function$;
DROP TRIGGER IF EXISTS step_lesson45_word_order_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson45_word_order_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson45_word_order_publish();
