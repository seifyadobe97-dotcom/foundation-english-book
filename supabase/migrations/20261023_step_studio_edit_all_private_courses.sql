-- STEP with Seify: allow the unified Studio to edit any registered private course,
-- rather than silently rejecting lessons 03-05 in two legacy tables.
-- Applied in Supabase production as migration step_studio_edit_all_private_courses.
-- No student attempts, source questions, answer keys, or published content are modified.
ALTER TABLE public.step_lesson_content_edits
  DROP CONSTRAINT step_lesson_content_edits_course_code_check;
ALTER TABLE public.step_lesson_content_edits
  ADD CONSTRAINT step_lesson_content_edits_course_code_fkey
  FOREIGN KEY (course_code) REFERENCES public.step_private_course_banks(course_code);
ALTER TABLE public.step_lesson_content_edits
  DROP CONSTRAINT step_lesson_content_edits_part_index_check;
ALTER TABLE public.step_lesson_content_edits
  ADD CONSTRAINT step_lesson_content_edits_part_index_check
  CHECK (part_index BETWEEN 0 AND 49);
ALTER TABLE public.step_question_edits
  DROP CONSTRAINT step_question_edits_course_code_check;
ALTER TABLE public.step_question_edits
  ADD CONSTRAINT step_question_edits_course_code_fkey
  FOREIGN KEY (course_code) REFERENCES public.step_private_course_banks(course_code);
ALTER TABLE public.step_question_edits
  DROP CONSTRAINT step_question_edits_part_index_check;
ALTER TABLE public.step_question_edits
  ADD CONSTRAINT step_question_edits_part_index_check
  CHECK (part_index BETWEEN 0 AND 49);
