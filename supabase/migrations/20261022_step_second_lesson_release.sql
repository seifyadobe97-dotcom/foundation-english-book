-- STEP with Seify: safely enable a SECOND published, independent scored grammar indicator.
-- Existing Present Simple rows and progress remain intact.
-- Only these two reviewed course codes are publishable at this pilot stage.
alter table public.step_curriculum_indicators drop constraint if exists step_indicator_release_check;
alter table public.step_curriculum_indicators add constraint step_indicator_release_check check (
  status <> 'published' or
  (slug = 'present-simple' and legacy_course_code = 'ASGQPRSIM') or
  (slug = 'subject-verb-agreement' and legacy_course_code = 'ASGQAGREE')
);
alter table public.step_question_edits drop constraint if exists step_question_edits_course_code_check;
alter table public.step_question_edits add constraint step_question_edits_course_code_check
 check (course_code in ('ASGQPRSIM','ASGQAGREE'));
alter table public.step_lesson_content_edits drop constraint if exists step_lesson_content_edits_course_code_check;
alter table public.step_lesson_content_edits add constraint step_lesson_content_edits_course_code_check
 check (course_code in ('ASGQPRSIM','ASGQAGREE'));
-- Instructor-only source ledger remains private; adding a course does not grant student reads.
