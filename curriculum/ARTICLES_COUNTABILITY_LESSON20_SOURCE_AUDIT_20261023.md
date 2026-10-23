# Lesson 20 — Articles & Countability | Verified bank coverage
**Audit date:** 2026-10-23 | Indicator `articles-countability`, position **120**, private code `ASGQARTCOUNT`.

## Source scope
- `STEP course book.pdf`, PDF **pages 13–16**: a/an, the and zero articles; some/any; a few/a little; much/many and countability.
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, PDF pages **112–122**, printed categories `ASGQQUANT` and `ASGQART`.
- Degree constructs `Too / Enough / So ... That` deliberately belong in following Lesson 21, even if neighboring bank material mixes them with quantifiers.
- `TAJMEAAT 2026.pdf` is internal corroborating material; repeated prompts are not counted as original independent scored items.

## Individual editorial decisions
**27 individually reviewed bank occurrences**, stored in the protected review ledger.

**23 source-approved independent originals**, all in the `ASGQARTCOUNT` private scored bank:
- **5** `ASGQART` articles: AC-ART01, AC-ART02, AC-ART04, AC-ART08, AC-ART09.
- **18** `ASGQQUANT` countability: AC-QU02, AC-QU03, AC-QU05, AC-QU07, AC-QU12, AC-QU13, AC-QU25, AC-QU30, AC-QU32, AC-QU33, AC-QU38, AC-QU42, AC-QU46, AC-QU49, AC-QU50, AC-QU52, AC-QU53, AC-QU55.

**4 source holds**, not included in scored practice:
- `AC-QU04`: *few* and *some* can both form valid sentences; missing meaning qualifier.
- `AC-QU06`: *a few* and *several* can both fit the time estimate, despite the intended key.
- `AC-ART03`: the mass reading *noise* and a countable *a noise* both fit the stem without stronger framing.
- `AC-ART05`: *a cake that ...* and *the cake that ...* may both be possible depending on discourse context.

## Lesson structure and quality
- **6 scored stages, 24 instructor-created teaching examples, 23 independently source-exact original graded questions**.
- Stages: A/An; The vs Zero; Much/Many; Some/Any; A Few/Little; Lots Of/Plenty Of.
- Each question preserves its original source text, options and audited key inside Supabase only, accompanied by correct-choice explanation and three specific distractor reasons.
- All instructional and scored content are editable through owner Studio: `step-grammar-admin/studio.html?course=ASGQARTCOUNT`.
- RLS stays enabled on private source banks and source review ledger; original questions are not in public GitHub.
- Release gate is the DB function `step_guard_lesson20_articles_countability_publish`, trigger `step_lesson20_articles_countability_gate`.
- It requires minimum 20 source-exact independent originals, at least 5 articles and 15 countability originals, six stages with >=2 scored questions and >=4 examples, exact keys and A-D options, wrong-option reasoning, and zero same-lesson/cross-lesson stem overlaps.
- Student attempts and exam results are not altered in this work.

**Current release:** owner draft pending CI quality confirmation and student route check. Do not interpret source count alone as successful publication.
