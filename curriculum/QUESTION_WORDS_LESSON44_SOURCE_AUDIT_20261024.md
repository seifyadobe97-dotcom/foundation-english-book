# Lesson 44 — Question Words | Selected-item source audit

**2026-10-24** · `question-words`, position **144** · private bank `ASGQQWHCORE` · **DRAFT awaiting release QA**.

## Source and scope
`STEP_Grammar_Question_Bank_Classifications_Audited.pdf` pages **207–211**, classification `ASGQQWH`. The category contains **27 printed original occurrences**, and **12 original MCQs have been selected and individually verified** from the printed source. The remaining **15** are not approved by this audit and are excluded from the graded bank; the report does **not** characterize every unselected item as incorrect.

Approved source IDs grouped by skill:
- Human **Who** as subject: QWH-004, 006, 012 (**3**).
- **Which** when choosing among known options: QWH-001, 003, 013, 025 (**4**).
- **Whose** possession / formal-object **Whom**: QWH-016, 019, 027 (**3**).
- **What** event and **How long** duration: QWH-008, 024 (**2**).

The source bank's official `QWH-016` and `QWH-027` print **whom** as the formal object answer. Informal object **who** is also accepted in standard everyday English, but not supplied as an alternative in these two four-choice source items. Do not claim that object `who` is always grammatically wrong.

## Lesson implementation
**4 editable teaching sections, 16 instructor-created examples, 12 source-exact original scored MCQs**, each with one source-keyed answer and original-specific explanations for three distractors. Source stems, choice text and correct keys are stored only in the RLS-protected private Supabase bank, not public GitHub.

Both independent source-category mapping and strict internal/cross-bank duplicate checks were completed. **12/12 source-exact originals, zero cross-course reuse.**

## Publication gate
DB trigger `step_lesson44_question_words_gate` requires >=12 independently source-approved originals, >=2 per each of four skills, 4 worked examples per section, exact printed stems/options/keys, individual choice explanations and no internal or cross-lesson repeated original. Student release is conditional on a green CI run for the **actual commit** and reread of live Supabase `published` status; an owner draft never constitutes student publication.

Owner editor: `step-grammar-admin/studio.html?course=ASGQQWHCORE`. Previous student progress remains untouched.
