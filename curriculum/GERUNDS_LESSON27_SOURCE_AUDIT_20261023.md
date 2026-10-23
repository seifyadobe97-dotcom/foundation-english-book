# Lesson 27 — Gerunds (-ing) and Related Forms | Source-audit decision

**Date:** 2026-10-23. `gerunds` · position **127** · Supabase private course `ASGQGERUNDCORE`.

## Original book and category
- `STEP course book.pdf` PDF pages **82–84**: contrast between gerund, to-infinitive and bare infinitive.
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf`, PDF pages **72–79**, category `ASGQGER`.
- Book simplification corrected pedagogically: **when/while + V-ing** is generally a reduced participle/adverbial clause, not a noun-like Gerund. Similarly, present continuous is not itself a gerund, even though it contains `-ing`.

## Complete review reconciliation
**41 printed question occurrences individually registered in private source ledger.**

| Editorial decision | Count |
|---|---:|
| Approved independently reviewed originals, included in private graded bank | **20** |
| Excluded as repeated/near-clone templates | **10** |
| Rejected: tests a different grammatical skill | **4** |
| Editorial hold: printed stem or distractor contains issues; further checking needed | **5** |
| Ambiguous key/subject-reference hold | **2** |

**20 source-exact scored IDs:** GER-002, GER-003, GER-004, GER-005, GER-006, GER-007, GER-009, GER-012, GER-013, GER-014, GER-015, GER-017, GER-024, GER-025, GER-026, GER-027, GER-032, GER-034, GER-036, GER-037.

**Excluded IDs:** GER-001, GER-008, GER-010, GER-011, GER-016, GER-018, GER-019, GER-020, GER-021, GER-022, GER-023, GER-028, GER-029, GER-030, GER-031, GER-033, GER-035, GER-038, GER-039, GER-040, GER-041.

Avoid inflating independent count with repeated `enjoy`, `keep`, `stop smoking`, `when + V-ing` or source items whose actual target is an imperative, a tense auxiliary or a lexical preposition.

## Implementation and publication
- **4 editable stages, 20 instructor-created worked examples, 20 private original MCQs** preserving reviewed source text/options/printed key and complete wrong-choice explanations.
- Stages: gerunds after selected verbs; gerunds after prepositions; related *when/while* participial constructions (correctly distinguished); nominal gerunds and special `stop`/`need` patterns.
- All source exam questions and answers stay in RLS-protected Supabase, never in public migrations/JS.
- Owner direct editor: `step-grammar-admin/studio.html?course=ASGQGERUNDCORE`.
- DB trigger `step_lesson27_gerunds_gate` requires all 20 original source-exact approved items, unique assignment, >=2 items in each of four stages, >=4 examples, full wrong-option reasoning and no cross-lesson stem reuse.
- Publishing for students is conditional on CI passing and explicit database status verification; merely inserting a bank does not publish the lesson.
