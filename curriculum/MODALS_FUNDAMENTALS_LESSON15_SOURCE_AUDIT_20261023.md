# Lesson 15 — Modals Fundamentals — Source-Audited Implementation

Date: 2026-10-23. Logical indicator `modals-fundamentals`, position **115**, private Supabase bank `ASGQMODCORE`.

## Source grounding and scope
- `STEP_Grammar_Question_Bank_Classifications_Audited.pdf` inspected at **PDF pp.58–64, 68–69 and 72**, with the source taxonomy:
  - `ASGQMODOBL` **Obligation: Must / Have To**, starts PDF p58;
  - `ASGQMODREQ` **Polite Requests**, starts p61;
  - `ASGQMODABIL` **Modal Ability / Deduction**, starts p68; only the ability item is in Lesson15;
  - `ASGQMODADV` **Advice: Should / Ought To**, starts p68;
  - `ASGQMODGEN` **Other Modal Verbs**, starts p72; only the past-ability item is in Lesson15.
- The full classified headings contain **53 original printed occurrences** across those five categories. **26 source candidate records individually reviewed and logged** in the private ledger: **18 approved independent source questions**, **8 held for ambiguity/misclassification/source-quality concerns**. The remaining **27** should not be represented as reviewed or graded.
- `STEP course book.pdf` **PDF pp.65–68** teaches the basic modal structure, obligation, past obligation, possibility, advice, polite request, and a step-by-step solving approach. It does **not** by itself authorize treating the book's examples as independent bank questions.
- Other classified categories **`ASGQMODPROB`**, **`ASGQMODPER`**, **`ASGQMODPASS`**, **`ASGQMODPERPASS`**, and **`ASGQMODCONT`** remain reserved for *Modals of Deduction*, *Modal Passive*, or further classification review. Do not silently merge their keys or original items into this lesson.
- `TAJMEAAT 2026.pdf` remains a secondary duplicate/reference source. The graded originals for this release are the independently audited bank questions; no compilation items were admitted.

## Source review
Approved private identifiers:
- obligation: `MDL-OBL01`, `06`, `07`, `08`, `10`, `13`, `15`, `20` (8)
- polite request: `MDL-REQ02`, `12`, `18` (3)
- hypothetical ability: `MDL-ABIL01` (1)
- advice and warning: `MDL-ADV01`, `02`, `06`, `07`, `08` (5)
- past ability: `MDL-GEN02` (1)

Eight held audit candidates: `MDL-OBL17`, `MDL-OBL18` (must/might/could multiple plausible modal readings); `MDL-REQ14` (article/preposition question, not modal request), `MDL-REQ16` (fresh air uncountability, not request modal), `MDL-ABIL02` (can't/couldn't negative deduction, belongs next lesson), `MDL-ADV03`, `MDL-ADV04` (nonunique modal choices), `MDL-ADV05` (printed punctuation/editorial issue, alternative readings). Other parallel must/would templates were deliberately not promoted.

All 18 scored questions in private `step_private_course_banks` retain exact original stems, four choices and printed keys from `step_source_item_reviews`. One independent authored correct-answer rationale and three individual wrong-option explanations accompany each, all **private**; no original graded content is committed to the public repository.

## Teaching & release
Seven Arabic-first owner-editable stages, **28 instructor-written examples**:
1. Modal + base verb,
2. Must vs Have To, plus the stop + gerund trap,
3. Had To for past obligation,
4. Don't Have To versus Mustn't,
5. Would You and Would You Like polite requests,
6. Can/Could and past/hypothetical ability,
7. Should/Ought To/Had Better advice.

Each of 18 source-approved originals is uniquely assigned to the most relevant stage; at least one per stage. Student explanations distinguish meaning from formal grammar (e.g., advice *shouldn't* vs absence of obligation *don't have to*).

Dedicated publication trigger `step_guard_lesson15_modals_fundamentals_publish` requires 7 illustrated stages, at least **18 source-approved originals** exact matching stem/A–D/key and explanations, unique assignment, and coverage of source categories **>=8 obligation, >=3 polite requests, >=5 advice, >=1 ability and >=1 other past-ability item**. It also rejects duplicate normalized source stems. Generic `step_guard_grammar_lesson_publish` continues to enforce source verification.

Security negative test: altered source key blocked and reverted; valid release path accepted in rollback. Source records accessible only via owner-audited API `/modals-fundamentals/audit`.
Student lesson: `step-grammar-student/lesson.html?slug=modals-fundamentals`.
Owner Studio: `step-grammar-admin/studio.html?course=ASGQMODCORE`.
Owner review: `step-grammar-admin/modals-fundamentals-audit.html`.

Lessons 07, 12, 13, 14 and foundation stay draft, preserving existing student accounts, original answers and all historical exam results.
