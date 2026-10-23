-- 2026-10-24 · STEP WITH SEIFY blended assessment provenance migration.
-- Original copyrighted MCQs/keys are not shipped to GitHub. Student API never displays provenance.
-- This changes the release policy: source-exact originals OR separately reviewed instructor-authored simulations.
CREATE TABLE IF NOT EXISTS public.step_simulated_item_reviews(
 question_id text PRIMARY KEY,
 course_code text NOT NULL REFERENCES public.step_private_course_banks(course_code) ON DELETE RESTRICT,
 stage_id text NOT NULL,
 question_text text NOT NULL,
 options jsonb NOT NULL,
 correct text NOT NULL CHECK(correct IN('A','B','C','D')),
 approval_status text NOT NULL CHECK(approval_status IN('draft','approved','held')),
 construction_method text NOT NULL DEFAULT 'independently_authored_grammar_pattern',
 review_note text NOT NULL DEFAULT '',
 quality_version integer NOT NULL DEFAULT 1,
 reviewed_at timestamptz NOT NULL DEFAULT now(),
 CHECK(jsonb_typeof(options)='object' AND options ?& ARRAY['A','B','C','D'])
);
CREATE INDEX IF NOT EXISTS step_simulated_reviews_course_status_idx
ON public.step_simulated_item_reviews(course_code,approval_status);
ALTER TABLE public.step_simulated_item_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.step_simulated_item_reviews FROM anon,authenticated;
COMMENT ON TABLE public.step_simulated_item_reviews IS
'Private instructor-only simulated MCQ text/options/answer provenance. Never expose through student API.';
-- Generic trigger step_guard_grammar_publish is already installed on grammar curriculum.
CREATE OR REPLACE FUNCTION public.step_guard_grammar_lesson_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 bank jsonb; n_total int; n_assigned int; n_unique int;
 n_source int; n_source_verified int; n_sim int; n_sim_verified int;
 n_complete int; n_incomplete int; n_repeated int; n_cross int;
BEGIN
 IF NEW.axis_code <> 'grammar' OR NEW.status <> 'published' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='published'
 AND OLD.legacy_course_code IS NOT DISTINCT FROM NEW.legacy_course_code THEN RETURN NEW;END IF;
 IF NEW.legacy_course_code IS NULL THEN RAISE EXCEPTION 'Publication blocked: grammar lesson has no private bank';END IF;
 SELECT payload INTO bank FROM public.step_private_course_banks WHERE course_code=NEW.legacy_course_code;
 IF bank IS NULL OR jsonb_typeof(bank->'questions')<>'object'
 OR jsonb_typeof(bank->'sections')<>'array'
 OR jsonb_array_length(bank->'sections')<1 THEN
 RAISE EXCEPTION 'Publication blocked: missing complete private bank';END IF;
 SELECT count(*) INTO n_total FROM jsonb_each(bank->'questions');
 SELECT count(*),count(DISTINCT id.value) INTO n_assigned,n_unique
 FROM jsonb_array_elements(bank->'sections') s(stage)
 CROSS JOIN LATERAL jsonb_array_elements_text(s.stage->'questionIds') id(value);
 IF n_total<3 OR n_assigned<>n_total OR n_unique<>n_total
 THEN RAISE EXCEPTION 'Publication blocked: scored questions missing, repeated, or unassigned';END IF;
 SELECT count(*) INTO n_incomplete FROM jsonb_array_elements(bank->'sections') s(stage)
 WHERE jsonb_typeof(s.stage->'visual'->'examples')<>'array'
 OR jsonb_array_length(s.stage->'visual'->'examples')<4
 OR (s.stage->>'id' NOT IN('intro','active-vs-passive')
 AND (jsonb_typeof(s.stage->'questionIds')<>'array' OR jsonb_array_length(s.stage->'questionIds')<3))
 OR (s.stage->>'id' IN('intro','active-vs-passive') AND jsonb_array_length(s.stage->'questionIds')<>0);
 IF n_incomplete>0 THEN RAISE EXCEPTION 'Publication blocked: % instructional stages are not fully illustrated or independently assessed',n_incomplete;END IF;
 SELECT count(*) INTO n_complete FROM jsonb_each(bank->'questions') q(id,item)
 WHERE jsonb_typeof(q.item->'options')='object' AND q.item->'options' ?& ARRAY['A','B','C','D']
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'options'))=4
 AND (SELECT count(DISTINCT lower(btrim(t.value))) FROM jsonb_each_text(q.item->'options') t)=4
 AND q.item->>'correct' IN ('A','B','C','D')
 AND length(coalesce(q.item->>'text',''))>=15 AND length(coalesce(q.item->>'explanation',''))>=18
 AND jsonb_typeof(q.item->'wrongReasons')='object'
 AND (SELECT count(*) FROM jsonb_object_keys(q.item->'wrongReasons'))=3
 AND NOT(q.item->'wrongReasons' ? (q.item->>'correct'))
 AND (SELECT count(*) FROM jsonb_each_text(q.item->'wrongReasons') x WHERE length(btrim(x.value))>=12)=3;
 IF n_complete<>n_total THEN RAISE EXCEPTION 'Publication blocked: item has nonunique alternatives, missing explanations, or incomplete distractor review';END IF;
 SELECT count(*) INTO n_source FROM jsonb_each(bank->'questions') q(id,item)
 WHERE coalesce(q.item->>'origin','source')<>'simulated';
 SELECT count(*) INTO n_source_verified FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_source_item_reviews r ON r.candidate_id=q.id
 WHERE coalesce(q.item->>'origin','source')<>'simulated'
 AND r.review_status='approved' AND r.original_stem=q.item->>'text'
 AND r.original_options=q.item->'options' AND r.printed_key=q.item->>'correct';
 IF n_source_verified<>n_source THEN RAISE EXCEPTION 'Publication blocked: altered, held, or unapproved source-original item';END IF;
 SELECT count(*) INTO n_sim FROM jsonb_each(bank->'questions') q(id,item) WHERE q.item->>'origin'='simulated';
 SELECT count(*) INTO n_sim_verified FROM jsonb_each(bank->'questions') q(id,item)
 JOIN public.step_simulated_item_reviews r ON r.question_id=q.id AND r.course_code=NEW.legacy_course_code
 JOIN LATERAL (
   SELECT s.stage->>'id' stage_id
   FROM jsonb_array_elements(bank->'sections') s(stage)
   WHERE (s.stage->'questionIds') ? q.id
 ) assigned ON TRUE
 WHERE q.item->>'origin'='simulated' AND r.approval_status='approved'
 AND r.stage_id=assigned.stage_id AND r.question_text=q.item->>'text'
 AND r.options=q.item->'options' AND r.correct=q.item->>'correct'
 AND coalesce(q.item->>'simulationVersion','')='1';
 IF n_sim_verified<>n_sim THEN
 RAISE EXCEPTION 'Publication blocked: % simulated items not approved as exact stage-bound private training items',n_sim-n_sim_verified;END IF;
 SELECT count(*) INTO n_repeated FROM(
 SELECT lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi')) stem_sig,q.item->'options' answers
 FROM jsonb_each(bank->'questions') q(id,item)
 GROUP BY 1,2 HAVING count(*)>1) duplicate_entries;
 IF n_repeated>0 THEN RAISE EXCEPTION 'Publication blocked: duplicate complete question inside course';END IF;
 SELECT count(*) INTO n_cross FROM jsonb_each(bank->'questions') q(id,item) WHERE EXISTS(
 SELECT 1 FROM public.step_private_course_banks other
 CROSS JOIN LATERAL jsonb_each(other.payload->'questions') oq(id,item)
 WHERE other.course_code<>NEW.legacy_course_code
 AND lower(regexp_replace(oq.item->>'text','[^a-z0-9]','','gi'))=
 lower(regexp_replace(q.item->>'text','[^a-z0-9]','','gi'))
 AND oq.item->'options'=q.item->'options');
 IF n_cross>0 THEN RAISE EXCEPTION 'Publication blocked: exact item already graded in another course';END IF;
 RETURN NEW;
END;$function$;
-- Supersede old source-only individual publication gates for the twenty-one affected draft lessons.
-- The replacement gate remains fail-closed on any unapproved/edited source OR simulated question.
DROP TRIGGER IF EXISTS step_lesson12_past_perfect_continuous_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson13_future_forms_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson14_used_to_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson16_deduction_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson17_passive_by_tense_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson18_modal_passive_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson21_degree_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson22_adjectives_adverbs_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson25_collocations_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson26_word_formation_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson29_bare_infinitives_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson30_causatives_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson32_relatives_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson33_zero_conditional_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson35_second_conditional_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson37_wishes_unreal_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson38_reported_speech_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson39_indirect_questions_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson40_question_tags_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson41_so_neither_gate ON public.step_curriculum_indicators;
DROP TRIGGER IF EXISTS step_lesson42_advanced_conditionals_gate ON public.step_curriculum_indicators;
