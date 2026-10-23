# Lesson 28 — To-Infinitive | Source review and implementation

**2026-10-23** · canonical indicator `infinitives` position **128** · private code `ASGQINFINCORE`.

## Original documents
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf` PDF pages **79–86**, category `ASGQINF`.
- `STEP course book.pdf` PDF pages **82–84**, compare Gerunds vs To-Infinitive vs Bare Infinitive.

## Full reconciled source ledger
**45 printed original question occurrences**, each recorded privately in `step_source_item_reviews`.

| Status | Count |
|---|---:|
| Source-approved original questions attached to Lesson28 | **20** |
| Duplicate or too-similar source question patterns held | **17** |
| Ambiguous valid alternatives held | **2** |
| Editorial/further review held | **5** |
| Rejected as belonging to another grammar topic | **1** |

**Approved source IDs:** INF-001, INF-002, INF-003, INF-004, INF-005, INF-007, INF-010, INF-015, INF-017, INF-019, INF-022, INF-024, INF-025, INF-026, INF-028, INF-029, INF-033, INF-034, INF-037, INF-039.

Critical ambiguity holds:
- **INF-018**: both `So as to remain healthy` and `In order to remain healthy` are grammatical; printed source key is not exclusive.
- **INF-042**: in negative `didn't dare`, both bare `dare tell` and `dare to tell` can be acceptable in standard English.
- **INF-032**: printed `Children` is capitalized mid-sentence following the blank; the item is held pending repair and separate approval.
- **INF-043**: perfect infinitive subject area held as separate advanced case rather than silently grading without an adequate stage.

## Built curriculum
- **4 stages**, **20 instructor-written worked examples**, **20 reviewed original scored MCQs**.
- Verb + to V1 (including stop to do, remember to do); tell/ask person + (not) to V1; purpose to/in order to; adjective + to V1.
- Each scored question stores exact original stem, A-D options and reviewed answer privately with a rationale for each of three distractors.
- No original exam content or answer key committed in public GitHub; RLS enforced.
- Release guard `step_lesson28_infinitives_gate` requires >=20 verified independent originals, >=2 scored questions and >=4 examples in each stage, source-exact options/answers, unique assignment, and no reused stems from other lessons.

Studio direct editor: `step-grammar-admin/studio.html?course=ASGQINFINCORE`. Student publication requires passed CI and verified Supabase status, not merely successful draft creation.
