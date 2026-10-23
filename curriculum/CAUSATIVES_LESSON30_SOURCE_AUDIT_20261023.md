# Lesson 30 — Causatives | Original Source Audit

**Date:** 2026-10-23 | **Indicator:** `causatives` at position 130 | **Private bank:** `ASGQCAUSCORE` | **Status:** DRAFT (not released).

## Original sources examined
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, final PDF page **234**, original category `ASGQCAUS`: contains exactly **two** distinct printed MCQs.
- `STEP course book.pdf`, PDF pages **97–99**: separate patterns `have/get + thing + V3`, `make/let + person + V1`, `get + person + to + V1`, and `help + person + (to) V1`.
- These documents are internally used; no public URLs or citations identifying training materials are shown in the student experience.

## Source question ledger
1. `CAUS-001` — **approved**; source printed option B, has/had + object + repaired/fixed form.
2. `CAUS-002` — **approved**; source printed option A, get + object + past participle in a negative-inversion construction.

Both source stems, four original options, reviewed correct option and three distractor explanations are stored **exclusively** in Supabase private bank and its RLS-protected source ledger. Exact source matching is required.

## Instructional scope
**4 editable stages, 16 instructor-created examples, 2 original scored questions.**
1. `Have/Get + Thing + V3` — 2 source-original questions.
2. `Make/Let + Person + V1` — 0 independent graded questions; conceptual overlap with Lesson29 not double-counted.
3. `Get + Person + To + V1` — 0 independent graded questions.
4. `Help + Person + (To) + V1` — 0 independently scored questions; both with and without **to** acceptable.

## Publication decision
**HOLD / OWNER DRAFT.** Two originals cannot support scored evaluation of all four patterns. The DB gate `step_lesson30_causatives_gate` blocks publication unless >=12 independently reviewed originals, >=2 per stage, >=4 teaching examples per stage, exact original stems/options/keys, full wrong-option reasons, no within-lesson duplicates and no cross-lesson reused stems. Negative publication test passed; status remains draft.

Owner Studio route: `step-grammar-admin/studio.html?course=ASGQCAUSCORE`. No student attempts or results modified.
