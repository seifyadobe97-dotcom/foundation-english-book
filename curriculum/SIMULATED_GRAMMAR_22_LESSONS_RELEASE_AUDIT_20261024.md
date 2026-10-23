# STEP WITH SEIFY — 22 Draft Lessons, Instructor-Simulated Assessment

**Owner-only editorial / publication audit · 2026-10-24**

## Why this rollout exists

The previous original-source-only release model kept 22 full teaching lessons as drafts because the independently approved source MCQs did not cover every skill. At the owner's explicit request, the model now permits **newly authored simulated questions**, patterned on the grammar skill, multiple-choice format and distractor types of the attached source bank and coursebook, **without copying or claiming to be the original printed exams**.

The instructor examples already present in the 22 course teaching stages were used as grammatical pattern inputs; language and selective contexts were rewritten when producing practice stems and alternatives. Simulated choices are shorter/simpler in some cases and must not be represented as officially sourced, guaranteed identical in difficulty, or independently externally validated.

## Private grading inventory (released in production)

| Lesson | Topic | Original source-exact | New instructor-simulated | Scored total | Teaching stages |
|---:|---|---:|---:|---:|---:|
| 7 | Future Arrangements | 0 | 15 | 15 | 5 |
| 12 | Past Perfect Continuous | 2 | 13 | 15 | 5 |
| 13 | Future Continuous / Future Perfect | 2 | 16 | 18 | 6 |
| 14 | Used To / Be Used To / Get Used To | 10 | 12 | 22 | 7 |
| 16 | Modals of Deduction | 3 | 15 | 18 | 6 |
| 17 | Passive Voice by Tense | 19 | 6 | 25 | 9 |
| 18 | Modal Passive | 6 | 10 | 16 | 6 |
| 21 | Quantity & Degree | 5 | 7 | 12 | 4 |
| 22 | Adjectives and Adverbs | 18 | 7 | 25 | 6 |
| 25 | Preposition Collocations | 5 | 7 | 12 | 4 |
| 26 | Word Formation | 0 | 15 | 15 | 5 |
| 29 | Bare Infinitives | 10 | 5 | 15 | 4 |
| 30 | Causatives | 2 | 10 | 12 | 4 |
| 32 | Relative Clauses | 16 | 3 | 19 | 5 |
| 33 | Zero Conditional | 3 | 6 | 9 | 3 |
| 35 | Second Conditional | 10 | 1 | 11 | 3 |
| 37 | Wishes and Unreal Structures | 5 | 7 | 12 | 4 |
| 38 | Reported Speech | 8 | 4 | 12 | 4 |
| 39 | Indirect Questions | 8 | 7 | 15 | 5 |
| 40 | Question Tags | 4 | 8 | 12 | 4 |
| 41 | So / Neither / Agreement | 5 | 10 | 15 | 5 |
| 42 | Advanced Conditionals: Mixed & Inversion | 2 | 7 | 9 | 3 |
| **Total** | **22 formerly draft lessons** | **143** | **191** | **334** | **107** |

Two sections (the Active/Passive introductory section and Modal Passive introduction) intentionally remain **unscored**. All **105 assessed sections** have at least three scored questions and four worked examples. Foundation unit at position 999 remains closed.

## Two separate private provenance channels

**Source originals** retain their exact printed stems, all A–D options and answer keys in `step_source_item_reviews` under `review_status='approved'`. The approved originals in the 22 banks were left unchanged.

**Simulated originals authored for this platform** have `origin:'simulated'` on private course question records and a separate `step_simulated_item_reviews` ledger. This ledger retains the same exact question text, four alternatives, correct key, stage identifier and internal approval status. It is protected with RLS, and `anon` / `authenticated` table grants are revoked. Do not place source exam stems, keys or the private simulated grading bank in the public repository.

Every simulated item has a selected answer, distinct A–D alternatives, per-distractor Arabic feedback and a teaching-rule explanation. There was a targeted editorial correction pass on ambiguous conditional/future alternatives, deduction-vs-prohibition, verb forms and imperfect instructor examples; rules and source pedagogy were kept intact.

**Owner Studio** labels canonical originals as `سؤال أصلي مُراجع` and simulated items as `سؤال محاكي · تم إنشاؤه داخليًا`, while allowing owner editing. **Student API** includes only generic questions and answer options, never provenance. The interface does not falsely label simulations as real STEP past papers.

## Fail-closed release gate

The new `step_guard_grammar_lesson_publish` trigger checks:
1. Every question is assigned to exactly one stage, and all assessed stages have >=3 questions and >=4 teaching examples.
2. Each original graded item is source-exact, has an approved original ledger status, and retains its printed A–D and key.
3. Each simulated graded item is approved in the **separate** simulated ledger and its text, full A–D, correct key and stage match exactly.
4. Four distinct answers, three explanation records for wrong choices, an explanation for the right answer and no duplicate complete question/option sets, internally or across course banks.
5. The intentional teaching-only introductions carry no scored questions.

A transactionally rolled-back **full 22-draft publication simulation** passed. Another rolled-back negative test changed one simulation to `held`; its course publication was refused with the expected error. User progress, existing course scores and RLS were not changed.

The prior 21 lesson-specific **source-only** triggers are superseded by the stronger, centrally enforced original+simulated provenance trigger. Historical original source audits and prior migration files remain in the repository for traceability.

## Verified production release

**Publication decision: APPROVED AND RELEASED.** GitHub Actions run [40040223630](https://github.com/seifyadobe97-dotcom/foundation-english-book/actions/runs/40040223630) passed all three jobs (STEP Pilot quality gate, Release quality gate, and Deploy verified static book) on code commit `3cb376d0196c`. After that success, an atomic Supabase update promoted the 22 previously draft Grammar lessons to `published`.

A separate SQL verification read **45 of 45 Grammar lessons published**, **0 Grammar drafts**, and **foundation position 999 still draft/closed**. Protected historical student rows were unchanged (70 part attempts, 10 exam attempts and 259 question answer details). A subsequent GitHub change synchronized the 22 published labels on Studio and the owner dashboard; CI for that UI-only sync must also complete cleanly.

The internal review table remains private with RLS enabled and no anon/authenticated grants. This release does **not** represent the instructor-authored simulated questions as authentic historical STEP questions.

This report contains metadata only, not any proprietary original exam item or student response.
