-- Lesson24 source-exact quality gate; original questions and answer keys stay exclusively in Supabase private bank.
-- Applied through migration step_lesson24_time_place_source_release_gate_fixed.
CREATE OR REPLACE FUNCTION public.step_guard_lesson24_prepositions_time_place_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bank jsonb; item_total integer; n_assigned integer; n_unique integer; n_stages integer; n_exact integer; n_prep integer; n_since integer; duplicate_count integer; overlap_count integer;
BEGIN
  IF NEW.slug != 'prepositions-of-time-and-place' OR NEW.status != 'published' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.status='published' AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW; END IF;
  IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQPREPTIME' THEN
    RAISE EXCEPTION 'Lesson24 requires its audited private source bank' USING ERRCODE='23514';
  END IF;
  SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code='ASGQPREPTIME';
  IF bank IS NULL OR jsonb_typeof(bank->'sections')!='array' OR jsonb_array_length(bank->'sections')!=6 OR jsonb_typeof(bank->'questions')!='object' THEN
    RAISE EXCEPTION 'Lesson24 six-stage bank not complete' USING ERRCODE='23514';
  END IF;
  SELECT count(*) INTO item_total FROM jsonb_each(bank->'questions');
  IF item_total<22 THEN RAISE EXCEPTION 'Lesson24 only % source originals, 22 needed',item_total USING ERRCODE='23514'; END IF;
  SELECT count(*),count(DISTINCT qid.value) INTO n_assigned,n_unique
  FROM jsonb_array_elements(bank->'sections') section,
  LATERAL jsonb_array_elements_text(section->'questionIds') qid;
  IF n_assigned!=item_total OR n_unique!=item_total THEN RAISE EXCEPTION 'Lesson24 source questions not uniquely assigned' USING ERRCODE='23514'; END IF;
  SELECT count(*) INTO n_stages FROM jsonb_array_elements(bank->'sections') section
  WHERE jsonb_array_length(section->'questionIds')>=2
  AND jsonb_typeof(section->'visual'->'examples')='array'
  AND jsonb_array_length(section->'visual'->'examples')>=4;
  IF n_stages!=6 THEN RAISE EXCEPTION 'Lesson24 requires two questions and four examples per section' USING ERRCODE='23514'; END IF;
  SELECT count(*),
         count(*) FILTER (WHERE r.original_category_code='ASGQPREP'),
         count(*) FILTER (WHERE r.original_category_code='ASGQFORSINCE')
  INTO n_exact,n_prep,n_since FROM jsonb_each(bank->'questions') q(id,item)
  JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
  WHERE r.review_status='approved' AND r.document_key='STEP_AUDITED_BANK_2026'
  AND r.original_category_code IN ('ASGQPREP','ASGQFORSINCE')
  AND r.original_stem=q.item->>'text' AND r.original_options=q.item->'options'
  AND r.printed_key=q.item->>'correct'
  AND jsonb_typeof(q.item->'options')='object'
  AND q.item->'options' ?& ARRAY['A','B','C','D']
  AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
  AND jsonb_typeof(q.item->'wrongReasons')='object'
  AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
  AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
  AND length(coalesce(q.item->>'explanation',''))>=12;
  IF n_exact!=item_total OR n_prep<12 OR n_since<10 THEN
    RAISE EXCEPTION 'Lesson24 exact source requirements fail: % match (% time/place, % for/since)',n_exact,n_prep,n_since USING ERRCODE='23514';
  END IF;
  SELECT count(*) INTO duplicate_count FROM (SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) stem FROM jsonb_each(bank->'questions') q(id,item)
  GROUP BY 1 HAVING count(*)>1) x;
  IF duplicate_count>0 THEN RAISE EXCEPTION 'Lesson24 repeats originals internally' USING ERRCODE='23514'; END IF;
  SELECT count(*) INTO overlap_count FROM jsonb_each(bank->'questions') q(id,item)
  WHERE EXISTS(SELECT 1 FROM public.step_private_course_banks other
  CROSS JOIN LATERAL jsonb_each(other.payload->'questions') otherq(id,item)
  WHERE other.course_code!='ASGQPREPTIME'
  AND lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))=lower(regexp_replace(otherq.item->>'text','[^a-z0-9]','','gi')));
  IF overlap_count>0 THEN RAISE EXCEPTION 'Lesson24 reuses a scored stem elsewhere' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS step_lesson24_prepositions_time_place_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson24_prepositions_time_place_gate BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators FOR EACH ROW EXECUTE FUNCTION step_guard_lesson24_prepositions_time_place_publish();
