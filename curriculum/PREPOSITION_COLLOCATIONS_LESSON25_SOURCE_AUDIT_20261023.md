# Lesson 25 — Preposition Collocations | Source evidence and publication decision

**2026-10-23 · Owner-only draft.** Indicator `preposition-collocations` (position 125), private Supabase bank `ASGQCOLLOCPREP`.

## Audited source
`STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, original `ASGQPREP` questions on PDF pages 133–135. Five source-exact MCQs individually reviewed and approved:
- `COL-011`: `concentrate on`;
- `COL-014`: `depend on`;
- `COL-015`: `married to`;
- `COL-016`: `blame ... on`;
- `COL-022`: `apply for`.

These IDs refer to protected ledger entries; the original question stems, options, answers and explanations are deliberately absent from GitHub. Relevant teaching reference is `STEP course book.pdf` pages 37–38; teaching examples are instructor-created and not counted as scored source coverage.

## Existing implementation inspected
- Four editable teaching stages, 16 instructor-authored worked examples, **five original source-approved scored questions**.
- All five source stems, options and keys exactly match the review ledger.
- The final comparison stage (fixed pairs versus time/place) has no scored question yet.
- Course is linked to Studio under `ASGQCOLLOCPREP` and canonical curriculum status is **draft**.
- The DB trigger `step_lesson25_collocations_gate` refuses publication below **12** independent original MCQs and requires at least **two per stage**, a source-exact key/options check, four examples per stage, and zero reuse across other course banks.

**Publication decision: HOLD.** Five verified questions cannot assess all collocation families sufficiently. Do not fill gaps with invented source questions or duplicate Lesson24 items. Student data and results are untouched.
