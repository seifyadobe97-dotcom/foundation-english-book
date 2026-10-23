# Lesson 05 — Past Continuous: release verification

## Published course identity
- Indicator slug: `past-continuous`; position 105; private course bank `ASGQPACONT`.
- 5 independently taught sections with two original four-choice questions each.
- Private bank holds **10 approved source-matched questions**. The private review ledger records **28 candidate occurrences**: 10 approved, 7 duplicate, 11 ambiguity holds. Withheld questions are NOT included in learner grading.
- All five sections have instructor-authored Arabic teaching cards, rule tables, and examples, embedded in the private bank; original graded questions and keys do not appear in the public site source.

## Routing and access
- Student entry: `step-grammar-student/lesson.html?slug=past-continuous`.
- Student backend: `step-course/lesson/past-continuous`; only active student accounts can access a `published` indicator.
- Instructor editing: `step-grammar-admin/studio.html?course=ASGQPACONT`.
- All source/answer audit entries are viewable only through authenticated admin functionality.

## Release checks
- Database indicator and course identity match; original stems/options/keys match all ten approved source ledger entries.
- Five groups of 2 questions, complete teaching visuals, previous courses and student progress preserved.
- GitHub STEP quality and general release quality jobs both passed on 2026-10-22.
- The prior GitHub Pages artifact-collision failure (run 39865460333) was resolved; the subsequent clean workflow run **39866099159** succeeded for release quality, STEP Pilot quality, and GitHub Pages deployment at commit `a428dd3`.
- On 2026-10-23 the private bank was directly reconciled to the audit ledger in Supabase: **10/10** stems, option objects, and printed keys match approved candidates; every live question has an answer explanation and wrong-choice rationale.
- The second teaching section was enhanced through separate **draft then published** Supabase overrides to explain `as` and simultaneous past events, with two additional teacher-created teaching examples and table rows. No original question or answer key changed. Four revision-history entries were recorded for the two override records.
- Supabase migration `step_studio_edit_all_private_courses` replaced outdated two-course Editor constraints with private-course foreign keys in section and question edits (part indices 0–49). The server retains owner-only publishing and the original-question approval checks.
- **Limit of evidence:** browser tests use synthetic fixtures. A new real-student authenticated grading/persistence test was **not** performed in this maintenance pass; existing attempt records were preserved. Direct anonymous SELECT privileges on private source/key tables remain revoked.

