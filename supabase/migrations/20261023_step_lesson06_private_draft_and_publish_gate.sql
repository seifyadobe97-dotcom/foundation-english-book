-- Applied to Supabase production on 2026-10-23.
-- Make future private course IDs extensible without exposing exam keys or source PDFs.
ALTER TABLE public.step_private_course_banks
  DROP CONSTRAINT IF EXISTS step_private_course_banks_course_code_check;
ALTER TABLE public.step_private_course_banks
  ADD CONSTRAINT step_private_course_banks_course_code_check
  CHECK (course_code ~ '^ASGQ[A-Z0-9]{3,18}$');

-- This is an additional Lesson-06 release-quality gate layered on the existing
-- source-verification gate step_guard_grammar_lesson_publish.
CREATE OR REPLACE FUNCTION public.step_guard_lesson06_publication()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $body$
DECLARE
  bank jsonb;
  section_data jsonb;
  items_count integer;
  approved_count integer;
  assigned_count integer;
  distinct_assigned integer;
BEGIN
  IF NEW.slug <> 'will-be-going-to' OR NEW.status <> 'published'
     OR (TG_OP = 'UPDATE' AND OLD.status = 'published') THEN
    RETURN NEW;
  END IF;
  IF NEW.legacy_course_code IS DISTINCT FROM 'ASGQWILLGO' THEN
    RAISE EXCEPTION 'Lesson 06 publication blocked: missing private course binding'
      USING ERRCODE = '23514';
  END IF;
  SELECT payload INTO bank FROM public.step_private_course_banks
    WHERE course_code = NEW.legacy_course_code;
  IF bank IS NULL OR jsonb_typeof(bank->'sections') <> 'array'
     OR jsonb_typeof(bank->'questions') <> 'object'
     OR jsonb_array_length(bank->'sections') < 5 THEN
    RAISE EXCEPTION 'Lesson 06 publication blocked: incomplete private lesson'
      USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO items_count FROM jsonb_each(bank->'questions');
  IF items_count < 10 THEN
    RAISE EXCEPTION 'Lesson 06 publication blocked: fewer than ten source-approved questions'
      USING ERRCODE = '23514';
  END IF;
  FOR section_data IN SELECT value FROM jsonb_array_elements(bank->'sections') LOOP
    IF jsonb_typeof(section_data->'questionIds') <> 'array'
       OR jsonb_array_length(section_data->'questionIds') = 0 THEN
      RAISE EXCEPTION 'Lesson 06 publication blocked: a section lacks verified practice'
        USING ERRCODE = '23514';
    END IF;
  END LOOP;
  SELECT count(*), count(DISTINCT item.id)
  INTO assigned_count, distinct_assigned
  FROM jsonb_array_elements(bank->'sections') AS s(section_data),
       jsonb_array_elements_text(s.section_data->'questionIds') AS item(id);
  IF assigned_count <> items_count OR distinct_assigned <> items_count THEN
    RAISE EXCEPTION 'Lesson 06 publication blocked: duplicate or unmatched question assignments'
      USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO approved_count
  FROM jsonb_each(bank->'questions') AS q(id,question)
  JOIN public.step_source_item_reviews AS r ON r.candidate_id=q.id
  WHERE r.review_status='approved'
    AND r.original_category_code IN ('ASGQFUSIM','ASGQFUGO','ASGQFUTABOUT')
    AND r.original_stem=q.question->>'text'
    AND r.original_options=q.question->'options'
    AND r.printed_key=q.question->>'correct'
    AND jsonb_typeof(q.question->'options')='object'
    AND q.question->'options' ?& ARRAY['A','B','C','D']
    AND jsonb_typeof(q.question->'wrongReasons')='object'
    AND (SELECT count(*) FROM jsonb_object_keys(q.question->'wrongReasons') AS wrong(key))=3
    AND char_length(coalesce(q.question->>'explanation',''))>=4;
  IF approved_count <> items_count THEN
    RAISE EXCEPTION 'Lesson 06 publication blocked: private bank/source audit mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION public.step_guard_lesson06_publication() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS step_lesson06_publish_gate ON public.step_curriculum_indicators;
CREATE TRIGGER step_lesson06_publish_gate
BEFORE INSERT OR UPDATE OF status, legacy_course_code ON public.step_curriculum_indicators
FOR EACH ROW EXECUTE FUNCTION public.step_guard_lesson06_publication();
