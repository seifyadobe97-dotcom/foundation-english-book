# STEP with Seify — Lesson 03 Present Continuous — editorial draft
Date: 2026-10-22

## Source boundary
- `STEP course book.pdf`, PDF pages **44–47**: explanation, affirmative/negative/questions, keywords and ten original source questions (p. 47).
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, PDF pages **2–4**: category `ASGQPRCONT` with fourteen original source questions.
- Do not treat source answer text as categorically decisive where a viable alternative reading exists. Original question statements and keys reside only in **private Supabase**, not the public repo.

## Reviewed candidate occurrences (not distinct questions)
24 registered occurrences:
- **14 approved and assigned** to the lesson (source-stem, four answer choices and key all checked).
- **9 duplicates / near-repeats excluded** (one earlier-bank repeated meeting and one similar future-moving question, plus seven source-book duplicates).
- **1 ambiguous hold** — Nouf/finding-a-tutor question because `tries` is a possible grammatical alternative to the intended `is trying` in a habitual reading; exclude until rewritten and re-audited.
- The original book example involving `fixen` is retained **as the printed incorrect alternative**; it is not an invented replacement.

## Teaching and assessment
- 5 Arabic-first, visually interactive learning stages:
  1. Auxiliary and subject agreement (am / is / are + V-ing).
  2. Actions happening now.
  3. Temporary situations and changes.
  4. Negative/question forms and -ing spelling.
  5. Arranged future events.
- 20 **instructor-authored explanatory examples** in the public teaching bundle. They are not graded source MCQs.
- 14 source-verified graded four-choice questions are stored in private Supabase `step_private_course_banks` under `ASGQPRCONT`, across 5 stages (3 / 3 / 3 / 3 / 2).
- After submitting, students receive right/wrong grading and an explanation of each distractor, computed by authenticated `step-course`.
- CI browser grading uses only the clearly synthetic mock fixture `tests/fixtures/private-banks/continuous-data.json`, never source originals.

## Security / publication
- `step_curriculum_indicators.slug='present-continuous'` is **draft**, mapped to legacy course code `ASGQPRCONT` and logically numbered Lesson 3.
- The student API `/continuous/*` refuses requests until `status='published'`. Student sign-in and active profile are required before that check.
- Admin-only `/continuous/audit` exposes original citations and candidate statuses after JWT + role verification. A separate authenticated admin teaching preview renders only public instructor-authored explanation.
- **Do not mark as published without a future production end-to-end test** of real authorized enrollment, correct server grading, attempt write/readback, role security and learner access.
- Present Simple (lesson 2) and Subject–Verb Agreement (lesson 1) are unchanged: preserve all existing scores, mappings, keys and attempts.
